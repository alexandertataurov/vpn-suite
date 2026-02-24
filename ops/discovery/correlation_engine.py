"""Correlation placeholder. correlate() returns empty mapping."""

from __future__ import annotations

from typing import Any


def correlate(
    discovered_nodes: list[dict[str, Any]],
    host_nic_ips: list[str] | None = None,
) -> list[dict[str, Any]]:
    """Returns empty mapping."""
    return []
