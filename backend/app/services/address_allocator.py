"""Allocate unique client tunnel addresses per server."""

import re

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config_builder import allocate_next_address, derive_address_from_profile
from app.models import Device


def _subnet_base_and_cidr(request_params: dict | None) -> tuple[str, int] | None:
    """Return (subnet_base, cidr) e.g. ('10.8.0', 24) or None."""
    if not request_params:
        return None
    subnet = request_params.get("subnet_address") or request_params.get("amnezia_subnet")
    cidr = request_params.get("subnet_cidr") or request_params.get("amnezia_cidr") or 24
    if not subnet:
        return None
    parts = str(subnet).strip().split(".")
    if len(parts) != 4:
        return None
    base = ".".join(parts[:3])
    try:
        return (base, int(cidr))
    except (TypeError, ValueError):
        return None


def _last_octet_from_allowed_ips(allowed_ips: str | None) -> int | None:
    """Extract last octet from e.g. '10.8.0.2/32' or '10.8.0.2/24'."""
    if not allowed_ips:
        return None
    m = re.match(r"^\d+\.\d+\.\d+\.(\d+)", str(allowed_ips).strip())
    if not m:
        return None
    try:
        return int(m.group(1))
    except ValueError:
        return None


async def allocate_address_for_device(
    session: AsyncSession,
    server_id: str,
    request_params: dict | None,
) -> tuple[str, str]:
    """Allocate next free address for a new device on the server.

    Returns (address_for_config, allowed_ips_for_peer).
    - address_for_config: e.g. '10.8.0.6/24' (Address in client config)
    - allowed_ips_for_peer: e.g. '10.8.0.6/32' (server peer AllowedIPs, device.allowed_ips)
    Falls back to derive_address_from_profile when subnet is not configured.
    """
    parsed = _subnet_base_and_cidr(request_params)
    if not parsed:
        fallback = derive_address_from_profile(request_params)
        # Fallback may be /24 or /32; normalize allowed_ips to /32 for peer
        if "/32" in fallback:
            return fallback, fallback
        return fallback, re.sub(r"/\d+$", "/32", fallback)

    subnet_base, cidr = parsed
    rows = await session.execute(
        select(Device.allowed_ips).where(
            Device.server_id == server_id,
            Device.revoked_at.is_(None),
            Device.allowed_ips.isnot(None),
        )
    )
    used = set()
    for (allowed_ips,) in rows:
        lo = _last_octet_from_allowed_ips(allowed_ips)
        if lo is not None:
            used.add(lo)
    allocated_32 = allocate_next_address(subnet_base, used)
    ip_part = allocated_32.replace("/32", "")
    return f"{ip_part}/{cidr}", allocated_32
