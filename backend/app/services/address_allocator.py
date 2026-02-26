"""Allocate unique client tunnel addresses per subnet (across all servers).

IPs are unique per subnet so that one physical node (e.g. one awg0) never gets
two peers with the same address, even when devices are spread over multiple
server_id records (e.g. amnezia-awg and node-01) that map to the same node.
"""

import re

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config_builder import allocate_next_address
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
    """Allocate next free address for a new device.

    Uniqueness is per subnet across ALL servers (not per server_id), so the same
    physical node (one WireGuard interface) never gets duplicate client IPs.

    Returns (address_for_config, allowed_ips_for_peer).
    - address_for_config: e.g. '10.8.0.6/24' (Address in client config)
    - allowed_ips_for_peer: e.g. '10.8.0.6/32' (server peer AllowedIPs, device.allowed_ips)
    """
    parsed = _subnet_base_and_cidr(request_params)
    if not parsed:
        subnet_base, cidr = "10.8.1", 24
    else:
        subnet_base, cidr = parsed

    prefix = f"{subnet_base}."
    rows = await session.execute(
        select(Device.allowed_ips).where(
            Device.revoked_at.is_(None),
            Device.allowed_ips.isnot(None),
            Device.allowed_ips.startswith(prefix),
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
