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
    """DB has A,B with valid /32; WG has B,C -> to_add A, to_remove C."""
    db_peers = [("pkA", "10.8.1.2/32", None), ("pkB", "10.8.1.3/32", None)]
    wg_peers = [
        {"public_key": "pkB", "allowed_ips": "10.8.1.3/32"},
        {"public_key": "pkC", "allowed_ips": "10.8.1.4/32"},
    ]
    diff = await compute_diff("node1", db_peers, wg_peers)
    assert len(diff.peers_to_add) == 1
    assert diff.peers_to_add[0].public_key == "pkA"
    assert diff.peers_to_add[0].allowed_ips == "10.8.1.2/32"
    assert len(diff.peers_to_remove) == 1
    assert diff.peers_to_remove[0] == "pkC"


@pytest.mark.asyncio
async def test_compute_diff_skips_invalid_allowed_ips():
    """Peers with no or 0.0.0.0/0 allowed_ips are skipped for add/update."""
    db_peers = [("pkA", "", None), ("pkB", "0.0.0.0/0, ::/0", None), ("pkC", "10.8.1.5/32", None)]
    wg_peers = []
    diff = await compute_diff("node1", db_peers, wg_peers)
    assert len(diff.peers_to_add) == 1
    assert diff.peers_to_add[0].public_key == "pkC"
    assert diff.peers_to_add[0].allowed_ips == "10.8.1.5/32"


@pytest.mark.asyncio
async def test_apply_diff_calls_adapter(mocker):
    """apply_diff calls add_peer and remove_peer on adapter when read_only is False."""
    from app.services.node_runtime import PeerConfigLike
    from app.core.config import settings

    mocker.patch.object(settings, "reconciliation_read_only", False)
    adapter = AsyncMock()
    diff = ReconciliationDiff(
        peers_to_add=[PeerConfigLike(public_key="pk1", allowed_ips="10.8.1.2/32")],
        peers_to_remove=["pk2"],
        peers_to_update=[],
    )
    result = await apply_diff(adapter, "node1", diff)
    assert result.peers_added == 1
    assert result.peers_removed == 1
    assert result.peers_added_pubkeys == ["pk1"]
    adapter.add_peer.assert_called_once()
    adapter.remove_peer.assert_called_once()


@pytest.mark.asyncio
async def test_apply_diff_read_only(mocker):
    """apply_diff does not modify peers when read_only is True."""
    from app.services.node_runtime import PeerConfigLike
    from app.core.config import settings

    mocker.patch.object(settings, "reconciliation_read_only", True)
    adapter = AsyncMock()
    diff = ReconciliationDiff(
        peers_to_add=[PeerConfigLike(public_key="pk1", allowed_ips="10.8.1.2/32")],
        peers_to_remove=["pk2"],
        peers_to_update=[],
    )
    result = await apply_diff(adapter, "node1", diff)
    assert result.peers_added == 0
    assert result.peers_removed == 0
    adapter.add_peer.assert_not_called()
    adapter.remove_peer.assert_not_called()
