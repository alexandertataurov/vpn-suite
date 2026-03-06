"""Shared IssuedConfig persistence for all device issue flows."""

from __future__ import annotations

import hashlib
import secrets
from datetime import datetime

from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import encrypt_config
from app.models import IssuedConfig

_ISSUE_CONFIG_TOKEN_BYTES = 32


def _iter_profile_configs(
    *,
    config_awg: str | None,
    config_wg_obf: str | None,
    config_wg: str | None,
):
    for profile_type, config_text in (
        ("awg", config_awg),
        ("wg_obf", config_wg_obf),
        ("wg", config_wg),
    ):
        if isinstance(config_text, str) and config_text.strip():
            yield profile_type, config_text


async def persist_issued_configs(
    session: AsyncSession,
    *,
    device_id: str,
    server_id: str,
    config_awg: str | None,
    config_wg_obf: str | None,
    config_wg: str | None,
    issued_by_admin_id: str | None = None,
    expires_at: datetime | None = None,
    replace_existing: bool = False,
) -> int:
    """Persist encrypted issued configs (awg, wg_obf, wg) for a device.

    Returns the number of IssuedConfig rows added to the session.
    """
    if replace_existing:
        await session.execute(delete(IssuedConfig).where(IssuedConfig.device_id == device_id))

    created = 0
    for profile_type, config_text in _iter_profile_configs(
        config_awg=config_awg,
        config_wg_obf=config_wg_obf,
        config_wg=config_wg,
    ):
        token = secrets.token_hex(_ISSUE_CONFIG_TOKEN_BYTES)
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        session.add(
            IssuedConfig(
                device_id=device_id,
                server_id=server_id,
                profile_type=profile_type,
                expires_at=expires_at,
                download_token_hash=token_hash,
                config_encrypted=encrypt_config(config_text),
                issued_by_admin_id=issued_by_admin_id,
            )
        )
        created += 1
    return created


async def persist_issued_configs_with_tokens(
    session: AsyncSession,
    *,
    device_id: str,
    server_id: str,
    config_awg: str | None,
    config_wg_obf: str | None,
    config_wg: str | None,
    issued_by_admin_id: str | None = None,
    expires_at: datetime | None = None,
    replace_existing: bool = False,
) -> dict[str, str]:
    """Persist encrypted issued configs and return plaintext download tokens by profile."""
    if replace_existing:
        await session.execute(delete(IssuedConfig).where(IssuedConfig.device_id == device_id))

    tokens: dict[str, str] = {}
    for profile_type, config_text in _iter_profile_configs(
        config_awg=config_awg,
        config_wg_obf=config_wg_obf,
        config_wg=config_wg,
    ):
        token = secrets.token_hex(_ISSUE_CONFIG_TOKEN_BYTES)
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        session.add(
            IssuedConfig(
                device_id=device_id,
                server_id=server_id,
                profile_type=profile_type,
                expires_at=expires_at,
                download_token_hash=token_hash,
                config_encrypted=encrypt_config(config_text),
                issued_by_admin_id=issued_by_admin_id,
            )
        )
        tokens[profile_type] = token
    return tokens
