"""Control-plane API contract smoke tests."""

from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient
from httpx import ASGITransport, AsyncClient
from starlette.websockets import WebSocketDisconnect

from app.api.v1.auth import get_current_admin
from app.core.database import get_db
from app.main import app


@pytest.fixture
def client():
    return AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        timeout=5.0,
    )


class _FakeResult:
    def __init__(self, value):
        self._value = value

    def scalar_one_or_none(self):
        return self._value

    def scalars(self):
        return self

    def all(self):
        return self._value if isinstance(self._value, list) else []


class _FakeDB:
    def __init__(self, role_permissions: list[str], execute_returns: list):
        self._role = SimpleNamespace(id="role-1", permissions=role_permissions)
        self._execute_returns = list(execute_returns)

    async def execute(self, stmt):
        if not self._execute_returns:
            return _FakeResult(None)
        return self._execute_returns.pop(0)

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        pass


async def _fake_current_admin():
    return SimpleNamespace(id="admin-1", role_id="role-1")


def _fake_get_db(execute_returns: list):
    async def _get_db():
        db = _FakeDB(["cluster:read"], execute_returns)
        yield db

    return _get_db


@pytest.mark.asyncio
async def test_control_plane_topology_requires_auth(client: AsyncClient):
    r = await client.get("/api/v1/control-plane/topology/summary")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_control_plane_topology_graph_requires_auth(client: AsyncClient):
    r = await client.get("/api/v1/control-plane/topology/graph")
    assert r.status_code == 401
    assert r.status_code != 404


@pytest.mark.asyncio
async def test_control_plane_business_metrics_requires_auth(client: AsyncClient):
    r = await client.get("/api/v1/control-plane/metrics/business")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_control_plane_anomaly_metrics_requires_auth(client: AsyncClient):
    r = await client.get("/api/v1/control-plane/metrics/anomaly")
    assert r.status_code == 401
    assert r.status_code != 404


@pytest.mark.asyncio
async def test_control_plane_placement_route_exists(client: AsyncClient):
    r = await client.post(
        "/api/v1/control-plane/placement/simulate",
        json={"preferred_region": "us-east", "top_k": 3},
    )
    assert r.status_code == 401
    assert r.status_code != 404


@pytest.mark.asyncio
async def test_control_plane_automation_status_requires_auth(client: AsyncClient):
    r = await client.get("/api/v1/control-plane/automation/status")
    assert r.status_code == 401
    assert r.status_code != 404


@pytest.mark.asyncio
async def test_control_plane_automation_run_requires_auth(client: AsyncClient):
    r = await client.post("/api/v1/control-plane/automation/run", json={})
    assert r.status_code == 401
    assert r.status_code != 404


@pytest.mark.asyncio
async def test_control_plane_throttling_policies_requires_auth(client: AsyncClient):
    r = await client.get("/api/v1/control-plane/throttling/policies")
    assert r.status_code == 401
    assert r.status_code != 404


@pytest.mark.asyncio
async def test_control_plane_throttling_apply_requires_auth(client: AsyncClient):
    r = await client.post("/api/v1/control-plane/throttling/apply", json={"dry_run": True})
    assert r.status_code == 401
    assert r.status_code != 404


@pytest.mark.asyncio
async def test_control_plane_latency_probe_ingest_requires_auth(client: AsyncClient):
    r = await client.post(
        "/api/v1/control-plane/latency-probes",
        json={
            "items": [
                {
                    "agent_id": "a1",
                    "source_region": "us-east",
                    "server_id": "s1",
                    "latency_ms": 21.5,
                }
            ]
        },
    )
    assert r.status_code == 401
    assert r.status_code != 404


@pytest.mark.asyncio
async def test_control_plane_latency_probe_list_requires_auth(client: AsyncClient):
    r = await client.get("/api/v1/control-plane/latency-probes")
    assert r.status_code == 401
    assert r.status_code != 404


def test_control_plane_events_ws_requires_auth_token():
    with TestClient(app) as sync_client:
        with pytest.raises(WebSocketDisconnect) as exc:
            with sync_client.websocket_connect("/api/v1/control-plane/events/ws"):
                pass
        assert exc.value.code == 4401


@pytest.mark.asyncio
async def test_control_plane_automation_status_returns_200_with_auth(client: AsyncClient):
    role = SimpleNamespace(id="role-1", permissions=["cluster:read"])
    app.dependency_overrides[get_current_admin] = _fake_current_admin
    app.dependency_overrides[get_db] = _fake_get_db([_FakeResult(role), _FakeResult(None)])
    try:
        r = await client.get("/api/v1/control-plane/automation/status")
        assert r.status_code == 200
        data = r.json()
        assert "enabled" in data
        assert "interval_seconds" in data
    finally:
        app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_control_plane_events_returns_200_with_auth(client: AsyncClient):
    role = SimpleNamespace(id="role-1", permissions=["cluster:read"])
    app.dependency_overrides[get_current_admin] = _fake_current_admin
    app.dependency_overrides[get_db] = _fake_get_db([_FakeResult(role), _FakeResult([])])
    try:
        r = await client.get("/api/v1/control-plane/events?limit=5")
        assert r.status_code == 200
        data = r.json()
        assert "items" in data
        assert "total" in data
        assert data["total"] == 0
    finally:
        app.dependency_overrides.clear()
