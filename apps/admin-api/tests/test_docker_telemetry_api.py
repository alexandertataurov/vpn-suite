"""Docker telemetry API contract smoke tests."""

from datetime import datetime, timezone
from types import SimpleNamespace

import pytest
from httpx import ASGITransport, AsyncClient

from app.api.v1.auth import get_current_admin
from app.core.database import get_db
from app.main import app
from app.schemas.docker_telemetry import ContainerLogLine, HostSummary


@pytest.fixture
def client():
    return AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        timeout=5.0,
    )


class _FakeResult:
    def __init__(self, role):
        self._role = role

    def scalar_one_or_none(self):
        return self._role


class _FakeDB:
    def __init__(self, permissions: list[str]):
        self._permissions = permissions

    async def execute(self, _stmt):
        role = SimpleNamespace(id="role-1", permissions=self._permissions)
        return _FakeResult(role)


def _fake_deps(permissions: list[str]):
    async def _current_admin():
        return SimpleNamespace(id="admin-1", role_id="role-1")

    async def _db():
        yield _FakeDB(permissions)

    return _current_admin, _db


@pytest.mark.asyncio
async def test_docker_hosts_requires_auth(client: AsyncClient):
    r = await client.get("/api/v1/telemetry/docker/hosts")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_docker_containers_requires_auth(client: AsyncClient):
    r = await client.get("/api/v1/telemetry/docker/containers?host_id=local")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_docker_metrics_requires_auth(client: AsyncClient):
    r = await client.get("/api/v1/telemetry/docker/container/abc123/metrics")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_docker_logs_requires_auth(client: AsyncClient):
    r = await client.get("/api/v1/telemetry/docker/container/abc123/logs")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_docker_alerts_requires_auth(client: AsyncClient):
    r = await client.get("/api/v1/telemetry/docker/alerts")
    assert r.status_code == 401


@pytest.mark.asyncio
async def test_docker_hosts_returns_503_when_service_raises(client: AsyncClient):
    """When Docker telemetry service raises, endpoint returns 503 instead of silent empty payload."""

    async def _list_hosts_fail():
        raise RuntimeError("Docker unavailable")

    fake_service = SimpleNamespace(list_hosts=_list_hosts_fail)
    app.state.docker_telemetry_service = fake_service

    fake_admin, fake_db = _fake_deps(["telemetry:read"])
    app.dependency_overrides[get_current_admin] = fake_admin
    app.dependency_overrides[get_db] = fake_db
    try:
        r = await client.get("/api/v1/telemetry/docker/hosts")
    finally:
        app.dependency_overrides.clear()

    assert r.status_code == 503


@pytest.mark.asyncio
async def test_docker_metrics_returns_503_when_service_missing(client: AsyncClient):
    if hasattr(app.state, "docker_telemetry_service"):
        delattr(app.state, "docker_telemetry_service")

    fake_admin, fake_db = _fake_deps(["telemetry:read"])
    app.dependency_overrides[get_current_admin] = fake_admin
    app.dependency_overrides[get_db] = fake_db
    try:
        r = await client.get("/api/v1/telemetry/docker/container/abc123/metrics")
    finally:
        app.dependency_overrides.clear()

    assert r.status_code == 503


@pytest.mark.asyncio
async def test_docker_alias_route_exists(client: AsyncClient):
    r = await client.get("/api/telemetry/docker/hosts")
    assert r.status_code == 401
    assert r.status_code != 404


@pytest.mark.asyncio
async def test_docker_hosts_allows_telemetry_read_permission(client: AsyncClient):
    async def _list_hosts():
        return [
            HostSummary(
                host_id="local",
                name="Local",
                endpoint_kind="unix",
                is_reachable=True,
                containers_total=1,
                running=1,
                stopped=0,
                unhealthy=0,
                restart_loops=0,
                last_seen_at=datetime.now(timezone.utc),
            )
        ]

    fake_service = SimpleNamespace(list_hosts=_list_hosts)
    app.state.docker_telemetry_service = fake_service

    fake_admin, fake_db = _fake_deps(["telemetry:read"])
    app.dependency_overrides[get_current_admin] = fake_admin
    app.dependency_overrides[get_db] = fake_db
    try:
        r = await client.get("/api/v1/telemetry/docker/hosts")
    finally:
        app.dependency_overrides.clear()

    assert r.status_code == 200
    data = r.json()
    assert data["total"] == 1
    assert data["items"][0]["host_id"] == "local"


@pytest.mark.asyncio
async def test_docker_logs_forbidden_without_logs_permission(client: AsyncClient):
    async def _get_logs(host_id: str, container_id: str, *, tail: int, since):
        return []

    fake_service = SimpleNamespace(get_container_logs=_get_logs)
    app.state.docker_telemetry_service = fake_service

    fake_admin, fake_db = _fake_deps(["telemetry:read"])
    app.dependency_overrides[get_current_admin] = fake_admin
    app.dependency_overrides[get_db] = fake_db
    try:
        r = await client.get("/api/v1/telemetry/docker/container/abc123/logs")
    finally:
        app.dependency_overrides.clear()

    assert r.status_code == 403


@pytest.mark.asyncio
async def test_docker_logs_allowed_with_logs_permission(client: AsyncClient):
    async def _get_logs(host_id: str, container_id: str, *, tail: int, since):
        return [
            ContainerLogLine(
                ts=datetime.now(timezone.utc),
                stream="stdout",
                severity="info",
                message="ok",
            )
        ]

    fake_service = SimpleNamespace(get_container_logs=_get_logs)
    app.state.docker_telemetry_service = fake_service

    fake_admin, fake_db = _fake_deps(["telemetry:read", "telemetry:logs:read"])
    app.dependency_overrides[get_current_admin] = fake_admin
    app.dependency_overrides[get_db] = fake_db
    try:
        r = await client.get("/api/v1/telemetry/docker/container/abc123/logs")
    finally:
        app.dependency_overrides.clear()

    assert r.status_code == 200
    data = r.json()
    assert data["total"] == 1
    assert data["items"][0]["message"] == "ok"


@pytest.mark.asyncio
async def test_docker_logs_invalid_since_returns_400(client: AsyncClient):
    async def _get_logs(host_id: str, container_id: str, *, tail: int, since):
        return []

    fake_service = SimpleNamespace(get_container_logs=_get_logs)
    app.state.docker_telemetry_service = fake_service

    fake_admin, fake_db = _fake_deps(["telemetry:read", "telemetry:logs:read"])
    app.dependency_overrides[get_current_admin] = fake_admin
    app.dependency_overrides[get_db] = fake_db
    try:
        r = await client.get("/api/v1/telemetry/docker/container/abc123/logs?since=not-a-date")
    finally:
        app.dependency_overrides.clear()

    assert r.status_code == 400


@pytest.mark.asyncio
async def test_docker_actions_require_auth(client: AsyncClient):
    for path in (
        "/api/v1/telemetry/docker/container/abc123/start",
        "/api/v1/telemetry/docker/container/abc123/stop",
        "/api/v1/telemetry/docker/container/abc123/restart",
    ):
        r = await client.post(path)
        assert r.status_code == 401


@pytest.mark.asyncio
async def test_docker_start_allows_cluster_write_permission(client: AsyncClient):
    calls: list[tuple[str, str]] = []

    async def _start(host_id: str, container_id: str) -> None:
        calls.append((host_id, container_id))

    fake_service = SimpleNamespace(start_container=_start)
    app.state.docker_telemetry_service = fake_service

    fake_admin, fake_db = _fake_deps(["cluster:write"])
    app.dependency_overrides[get_current_admin] = fake_admin
    app.dependency_overrides[get_db] = fake_db
    try:
        r = await client.post("/api/v1/telemetry/docker/container/abc123/start")
    finally:
        app.dependency_overrides.clear()

    assert r.status_code == 204
    assert calls == [("local", "abc123")]


@pytest.mark.asyncio
async def test_docker_stop_and_restart_use_service(client: AsyncClient):
    calls: list[tuple[str, str, str]] = []

    async def _stop(host_id: str, container_id: str) -> None:
        calls.append(("stop", host_id, container_id))

    async def _restart(host_id: str, container_id: str) -> None:
        calls.append(("restart", host_id, container_id))

    fake_service = SimpleNamespace(
        stop_container=_stop,
        restart_container=_restart,
    )
    app.state.docker_telemetry_service = fake_service

    fake_admin, fake_db = _fake_deps(["cluster:write"])
    app.dependency_overrides[get_current_admin] = fake_admin
    app.dependency_overrides[get_db] = fake_db
    try:
        r1 = await client.post("/api/v1/telemetry/docker/container/abc123/stop")
        r2 = await client.post("/api/v1/telemetry/docker/container/abc123/restart")
    finally:
        app.dependency_overrides.clear()

    assert r1.status_code == 204
    assert r2.status_code == 204
    assert calls == [
        ("stop", "local", "abc123"),
        ("restart", "local", "abc123"),
    ]
