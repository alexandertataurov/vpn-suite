"""Tests for node_endpoint_utils."""

from unittest.mock import AsyncMock

import pytest

from app.schemas.node import NodeMetadata
from app.services.node_endpoint_utils import get_endpoint_from_runtime


@pytest.mark.asyncio
async def test_get_endpoint_from_runtime_returns_public_ip():
    node = NodeMetadata(
        node_id="s1",
        container_name="awg",
        endpoint_ip="8.8.8.8",
        listen_port=45790,
    )
    adapter = AsyncMock()
    adapter.get_node_for_sync = AsyncMock(return_value=node)
    result = await get_endpoint_from_runtime(adapter, "s1")
    assert result == "8.8.8.8:45790"


@pytest.mark.asyncio
async def test_get_endpoint_from_runtime_excludes_private_ip():
    node = NodeMetadata(
        node_id="s1",
        container_name="awg",
        endpoint_ip="10.8.1.1",
        listen_port=45790,
    )
    adapter = AsyncMock()
    adapter.get_node_for_sync = AsyncMock(return_value=node)
    result = await get_endpoint_from_runtime(adapter, "s1")
    assert result is None


@pytest.mark.asyncio
async def test_get_endpoint_from_runtime_empty_node():
    adapter = AsyncMock()
    adapter.get_node_for_sync = AsyncMock(return_value=None)
    adapter.discover_nodes = AsyncMock(return_value=[])
    result = await get_endpoint_from_runtime(adapter, "s1")
    assert result is None


@pytest.mark.asyncio
async def test_get_endpoint_from_runtime_uses_default_host_when_private_ip():
    node = NodeMetadata(
        node_id="s1",
        container_name="awg",
        endpoint_ip="10.8.1.1",
        listen_port=45790,
    )
    adapter = AsyncMock()
    adapter.get_node_for_sync = AsyncMock(return_value=node)
    result = await get_endpoint_from_runtime(adapter, "s1", default_host="vpn.example.com")
    assert result == "vpn.example.com:45790"
