"""
Test stand: validate VPN connection configuration and emit debug logs.
Run from repo root: cd backend && python scripts/test_stand_vpn_config.py
Or: pytest tests/test_stand_vpn_connection.py -v -s --log-cli-level=DEBUG
With --issue: also checks that server can issue a valid client config (DB required).
"""
import argparse
import asyncio
import logging
import os
import sys
import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from pathlib import Path

# Allow importing app when run as script from backend/
_SCRIPT_DIR = Path(__file__).resolve().parent
_BACKEND = _SCRIPT_DIR.parent
if str(_BACKEND) not in sys.path:
    sys.path.insert(0, str(_BACKEND))

# Load .env from repo root (parent of backend)
_ROOT = _BACKEND.parent
_ENV_FILE = _ROOT / ".env"


def _load_dotenv() -> None:
    if _ENV_FILE.exists():
        try:
            from dotenv import load_dotenv
            load_dotenv(_ENV_FILE)
        except ImportError:
            pass

from app.core.config_builder import (
    ConfigProfile,
    InterfaceFields,
    PeerFields,
    build_config,
    generate_wg_keypair,
)
from app.core.config import Settings

LOG = logging.getLogger("vpn_test_stand")


def setup_logging(log_file: str | None = None, level: int = logging.DEBUG) -> None:
    fmt = "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
    handlers: list[logging.Handler] = [logging.StreamHandler(sys.stdout)]
    if log_file:
        Path(log_file).parent.mkdir(parents=True, exist_ok=True)
        handlers.append(logging.FileHandler(log_file, encoding="utf-8"))
    logging.basicConfig(level=level, format=fmt, handlers=handlers, force=True)
    LOG.setLevel(level)


def redact(s: str, visible: int = 4) -> str:
    if not s or len(s) <= visible:
        return "***"
    return s[:visible] + "…" + ("*" * min(8, len(s) - visible - 1))


def run_checks(settings: Settings) -> tuple[bool, list[str]]:
    errors: list[str] = []
    # 1) App settings (VPN-related)
    LOG.debug("NODE_MODE=%s NODE_DISCOVERY=%s", settings.node_mode, settings.node_discovery)
    LOG.debug("VPN_DEFAULT_HOST=%s", settings.vpn_default_host or "(empty)")
    LOG.debug("AGENT_HEARTBEAT_TTL_SECONDS=%s", settings.agent_heartbeat_ttl_seconds)
    if settings.node_mode == "agent" and not (settings.agent_shared_token or "").strip():
        errors.append("NODE_MODE=agent requires AGENT_SHARED_TOKEN")
    if not settings.vpn_default_host and settings.node_mode != "mock":
        LOG.warning("VPN_DEFAULT_HOST empty; Issue Config endpoint may be wrong")

    # 2) Config builder: keypair + build_config
    try:
        priv, pub = generate_wg_keypair()
        LOG.debug("Generated keypair: pub_prefix=%s", redact(pub))
    except Exception as e:
        errors.append(f"generate_wg_keypair: {e}")
        return False, errors

    try:
        cfg = build_config(
            interface=InterfaceFields(private_key=priv, address="10.8.1.2/32", dns="1.1.1.1"),
            peer=PeerFields(
                public_key=pub,
                endpoint=(settings.vpn_default_host or "vpn.example.com") + ":47604",
            ),
            profile=ConfigProfile.universal_safe,
        )
        LOG.debug("build_config (universal_safe) produced %s bytes", len(cfg))
        if "[Interface]" not in cfg or "[Peer]" not in cfg:
            errors.append("build_config missing [Interface] or [Peer]")
        if "Endpoint =" not in cfg:
            errors.append("build_config missing Endpoint")
    except Exception as e:
        errors.append(f"build_config: {e}")

    return len(errors) == 0, errors


def _validate_issued_config(cfg: str, name: str, endpoint: str) -> list[str]:
    """Check config has required sections. Returns list of errors."""
    errs: list[str] = []
    if "[Interface]" not in cfg or "[Peer]" not in cfg:
        errs.append(f"{name} missing [Interface] or [Peer]")
    if "Endpoint =" not in cfg:
        errs.append(f"{name} missing Endpoint")
    if "AllowedIPs =" not in cfg:
        errs.append(f"{name} missing AllowedIPs")
    if "PrivateKey =" not in cfg or "PublicKey =" not in cfg:
        errs.append(f"{name} missing PrivateKey or PublicKey")
    if endpoint not in cfg and "Endpoint =" in cfg:
        LOG.warning("%s Endpoint may differ from vpn_endpoint (derived)", name)
    return errs


async def _run_issue_check(settings: Settings) -> tuple[bool, list[str], dict[str, str] | None, str | None]:
    """Issue a device via issue_service; validate all 3 config types. Uses a generated server keypair so connectivity test can run a local WG server. Returns (ok, errors, {awg, wg_obf, wg} or None, server_private_key_b64 or None)."""
    errors: list[str] = []
    try:
        from app.core.database import async_session_factory, check_db
        from app.models import Plan, Server, Subscription, User
        from app.services.issue_service import issue_device
    except ImportError as e:
        errors.append(f"issue check imports: {e}")
        return False, errors, None, None
    if not await check_db():
        errors.append("DB unreachable (skip --issue or start postgres)")
        return False, errors, None, None
    from unittest.mock import patch
    now = datetime.now(timezone.utc)
    endpoint = (settings.vpn_default_host or "vpn.example.com") + ":47604"
    server_priv, server_pub = generate_wg_keypair()
    async with async_session_factory() as session:
        user = User(tg_id=int(uuid.uuid4().int % 10_000_000_000), is_banned=False)
        session.add(user)
        await session.flush()
        plan = Plan(
            name=f"test-stand-{uuid.uuid4().hex[:8]}",
            duration_days=30,
            price_currency="XTR",
            price_amount=Decimal("0"),
        )
        session.add(plan)
        await session.flush()
        sub = Subscription(
            user_id=user.id,
            plan_id=plan.id,
            valid_from=now,
            valid_until=now + timedelta(days=30),
            device_limit=5,
            status="active",
        )
        session.add(sub)
        await session.flush()
        server = Server(
            name="test-stand-node",
            region="test",
            api_endpoint="docker://amnezia-awg",
            public_key=server_pub,
            is_active=True,
            vpn_endpoint=endpoint,
        )
        session.add(server)
        await session.flush()
        with patch("app.services.issue_service.settings.node_mode", "mock"):
            result = await issue_device(
                session,
                user_id=user.id,
                subscription_id=sub.id,
                server_id=server.id,
                runtime_adapter=None,
            )
        await session.rollback()
    configs = {
        "awg": result.config_awg,
        "wg_obf": result.config_wg_obf,
        "wg": result.config_wg,
    }
    for key, cfg in configs.items():
        LOG.debug("issue_device returned config_%s %s bytes", key, len(cfg))
        errors.extend(_validate_issued_config(cfg, f"config_{key}", endpoint))
    return len(errors) == 0, errors, configs if not errors else None, server_priv if not errors else None


def main() -> int:
    ap = argparse.ArgumentParser(description="VPN config test stand (debug logs)")
    ap.add_argument("--log-file", default=None, help="Also write logs to this file")
    ap.add_argument("--no-env", action="store_true", help="Skip loading .env (use current env)")
    ap.add_argument("--issue", action="store_true", help="Also check server issues valid config (DB required)")
    ap.add_argument("--output-dir", metavar="DIR", default=None, help="With --issue: write all 3 configs (issued_awg.conf, issued_wg_obf.conf, issued_wg.conf) to this dir")
    args = ap.parse_args()
    if not args.no_env:
        _load_dotenv()
    setup_logging(log_file=args.log_file)

    LOG.info("VPN test stand started (cwd=%s)", os.getcwd())
    try:
        settings = Settings()
        LOG.info("Settings loaded: environment=%s node_mode=%s", settings.environment, settings.node_mode)
    except Exception as e:
        LOG.exception("Failed to load Settings")
        return 1

    ok, errs = run_checks(settings)
    if errs:
        for e in errs:
            LOG.error("Check failed: %s", e)
        LOG.info("Result: FAIL (%d errors)", len(errs))
        return 1

    if args.issue:
        LOG.info("Running issue check (server issues all 3 config types: AmneziaWG, WG+obfuscation, Plain WG)...")
        issue_ok, issue_errs, configs, server_priv = asyncio.run(_run_issue_check(settings))
        if not issue_ok:
            for e in issue_errs:
                LOG.error("Issue check failed: %s", e)
            LOG.info("Result: FAIL (issue check)")
            return 1
        LOG.info("Issue check OK (AmneziaWG, WG+obf, Plain WG all valid)")
        if args.output_dir and configs and server_priv:
            out_dir = Path(args.output_dir)
            out_dir.mkdir(parents=True, exist_ok=True)
            for name, path in (("awg", "issued_awg.conf"), ("wg_obf", "issued_wg_obf.conf"), ("wg", "issued_wg.conf")):
                p = out_dir / path
                p.write_text(configs[name], encoding="utf-8")
                LOG.info("Wrote %s to %s", name, p)
            (out_dir / "server_private.key").write_text(server_priv.strip(), encoding="utf-8")
            LOG.info("Wrote server_private.key (for local connectivity test)")
            LOG.info("Run scripts/run_vpn_connectivity_local.sh to confirm handshake and traffic")

    LOG.info("Result: OK (all VPN config checks passed)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
