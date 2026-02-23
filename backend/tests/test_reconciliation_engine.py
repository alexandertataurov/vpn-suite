"""Integration-style tests for reconciliation engine."""

from unittest.mock import AsyncMock

import pytest

from app.services.reconciliation_engine import (
    ReconciliationDiff,
    apply_diff,
    compute_diff,
)


@pytest.mark.asyncio
async def test_compute_diff_add_and_remove():
    """DB has A,B; WG has B,C -> to_add A, to_remove C."""
    db_peers = [("pkA", "0.0.0.0/0"), ("pkB", "0.0.0.0/0")]
    wg_peers = [
        {"public_key": "pkB", "allowed_ips": "0.0.0.0/0"},
        {"public_key": "pkC", "allowed_ips": "10.0.0.0/8"},
    ]
    diff = await compute_diff("node1", db_peers, wg_peers)
    assert len(diff.peers_to_add) == 1
    assert diff.peers_to_add[0].public_key == "pkA"
    assert len(diff.peers_to_remove) == 1
    assert diff.peers_to_remove[0] == "pkC"


@pytest.mark.asyncio
async def test_apply_diff_calls_adapter():
    """apply_diff calls add_peer and remove_peer on adapter."""
    from app.services.node_runtime import PeerConfigLike

    adapter = AsyncMock()
    diff = ReconciliationDiff(
        peers_to_add=[PeerConfigLike(public_key="pk1", allowed_ips="0.0.0.0/0")],
        peers_to_remove=["pk2"],
        peers_to_update=[],
    )
    result = await apply_diff(adapter, "node1", diff)
    assert result.peers_added == 1
    assert result.peers_removed == 1
    adapter.add_peer.assert_called_once()
    adapter.remove_peer.assert_called_once()
