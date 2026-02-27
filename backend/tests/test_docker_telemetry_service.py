"""Docker telemetry helper tests (pure functions)."""

import pytest

from app.schemas.docker_telemetry import ContainerSummary
from app.services import docker_engine_client
from app.services.docker_engine_client import parse_docker_hosts_config, parse_docker_timestamp
from app.services.docker_logs_service import classify_log_severity
from app.services.docker_telemetry_service import (
    DockerTelemetryService,
    _duration_to_seconds,
    _env_hash,
)


def test_parse_docker_hosts_config_default_on_empty_in_development(monkeypatch):
    # Tests must be isolated from ENVIRONMENT injected by ops smoke harness.
    monkeypatch.setattr(docker_engine_client.settings, "environment", "development", raising=False)
    hosts = parse_docker_hosts_config("")
    assert len(hosts) == 1
    assert hosts[0].host_id == "local"


def test_parse_docker_hosts_config_empty_in_production_is_not_configured(monkeypatch):
    monkeypatch.setattr(docker_engine_client.settings, "environment", "production", raising=False)
    # In production, empty/missing config must NOT implicitly trust the local docker socket.
    # Operator must configure DOCKER_TELEMETRY_HOSTS_JSON explicitly or set it to [] to disable.
    hosts = parse_docker_hosts_config("")
    assert hosts == []

    # Explicit opt-out.
    hosts = parse_docker_hosts_config("[]")
    assert hosts == []


def test_parse_docker_hosts_config_valid_json():
    raw = (
        '[{"host_id":"h1","name":"Host 1","base_url":"tcp://10.0.0.1:2375"},'
        '{"host_id":"h2","base_url":"ssh://root@example.com"}]'
    )
    hosts = parse_docker_hosts_config(raw)
    assert len(hosts) == 2
    assert hosts[0].endpoint_kind == "tcp"
    assert hosts[1].endpoint_kind == "ssh"


def test_parse_docker_timestamp_iso():
    dt = parse_docker_timestamp("2026-02-14T19:13:01Z")
    assert dt is not None
    assert dt.year == 2026


def test_duration_to_seconds_parses_units():
    assert _duration_to_seconds("15s", default_seconds=1) == 15
    assert _duration_to_seconds("2m", default_seconds=1) == 120
    assert _duration_to_seconds("1h", default_seconds=1) == 3600
    assert _duration_to_seconds("1d", default_seconds=1) == 86400
    assert _duration_to_seconds("bad", default_seconds=9) == 9


def test_env_hash_stable_order_independent():
    a = _env_hash(["B=2", "A=1"])
    b = _env_hash(["A=1", "B=2"])
    assert a == b


def test_classify_log_severity():
    assert classify_log_severity("fatal error occurred") == "error"
    assert classify_log_severity("request timeout retry") == "warn"
    assert classify_log_severity("startup complete") == "info"


@pytest.mark.asyncio
async def test_build_container_summary_keeps_stopped_container_when_stats_fail():
    service = DockerTelemetryService()

    class FakeDocker:
        async def inspect_container(self, host_id: str, container_id: str):
            return {
                "Name": "/stopped-service",
                "Created": "2026-02-14T19:12:33Z",
                "Config": {"Image": "example/stopped:1.0.0", "Labels": {}},
                "State": {"Status": "exited", "RestartCount": 1},
            }

        async def container_stats(self, host_id: str, container_id: str):
            raise RuntimeError("stats unavailable for stopped container")

    service._docker = FakeDocker()  # type: ignore[assignment]
    row = {
        "Id": "3f9c4d0d7b2f1234567890abcdef1234567890abcdef1234567890abcdef1234",
        "Names": ["/stopped-service"],
        "Image": "example/stopped:1.0.0",
        "State": "exited",
        "Ports": [],
    }
    summary = await service._build_container_summary("local", row, {})
    assert summary.container_id == "3f9c4d0d7b2f"
    assert summary.name == "stopped-service"
    assert summary.state == "exited"
    assert summary.cpu_pct is None
    assert summary.mem_bytes is None


@pytest.mark.asyncio
async def test_build_container_summary_falls_back_to_row_when_inspect_fails():
    service = DockerTelemetryService()

    class FakeDocker:
        async def inspect_container(self, host_id: str, container_id: str):
            raise RuntimeError("inspect failed")

        async def container_stats(self, host_id: str, container_id: str):
            raise RuntimeError("stats failed")

    service._docker = FakeDocker()  # type: ignore[assignment]
    row = {
        "Id": "aaaaaaaaaaaa1111111111111111111111111111111111111111111111111111",
        "Names": ["/row-only-container"],
        "Image": "example/row-only:0.0.0",
        "State": "running",
        "Created": 1700000000,
        "Ports": [],
    }
    summary = await service._build_container_summary("local", row, {})
    assert summary.container_id == "aaaaaaaaaaaa"
    assert summary.name == "row-only-container"
    assert summary.image == "example/row-only:0.0.0"
    assert summary.state == "running"
    assert summary.created_at is not None


@pytest.mark.asyncio
async def test_list_containers_uses_minimal_row_when_summary_build_fails():
    service = DockerTelemetryService()

    class FakeDocker:
        async def ping(self, host_id: str):
            return True

        async def list_containers(self, host_id: str, *, all_containers: bool = True):
            return [
                {
                    "Id": "bbbbbbbbbbbb2222222222222222222222222222222222222222222222222222",
                    "Names": ["/fallback-row"],
                    "Image": "example/fallback:2.0.0",
                    "State": "exited",
                    "Created": 1700000000,
                    "Ports": [],
                }
            ]

    service._docker = FakeDocker()  # type: ignore[assignment]

    async def fake_cache_get(key: str):
        return None

    async def fake_cache_set(key: str, payload):
        return None

    async def fake_prom_snapshot():
        return {}

    async def always_fail(host_id: str, row, prom_snapshot):
        raise RuntimeError("boom")

    service._cache_get_containers = fake_cache_get  # type: ignore[assignment]
    service._cache_set = fake_cache_set  # type: ignore[assignment]
    service._get_prometheus_snapshot = fake_prom_snapshot  # type: ignore[assignment]
    service._build_container_summary = always_fail  # type: ignore[assignment]

    items = await service.list_containers("local", force_refresh=True)
    assert len(items) == 1
    assert items[0].container_id == "bbbbbbbbbbbb"
    assert items[0].name == "fallback-row"
    assert items[0].state == "exited"


@pytest.mark.asyncio
async def test_list_containers_returns_cached_payload_without_docker_calls():
    service = DockerTelemetryService()
    cached_item = ContainerSummary(
        host_id="local",
        container_id="cccccccccccc",
        name="cached-service",
        image="example/cached:1.0",
        state="running",
        health_status="healthy",
        restart_count=0,
        is_restart_loop=False,
        ports=[],
        env_hash="sha256:test",
    )

    async def fake_cache_get(key: str):
        return [cached_item]

    class FakeDocker:
        async def ping(self, host_id: str):
            raise AssertionError("ping should not be called on cache hit")

        async def list_containers(self, host_id: str, *, all_containers: bool = True):
            raise AssertionError("list_containers should not be called on cache hit")

    service._cache_get_containers = fake_cache_get  # type: ignore[assignment]
    service._docker = FakeDocker()  # type: ignore[assignment]
    items = await service.list_containers("local")
    assert len(items) == 1
    assert items[0].name == "cached-service"


@pytest.mark.asyncio
async def test_list_containers_fails_fast_when_circuit_is_open():
    service = DockerTelemetryService()
    service._circuit["local"] = {"failures": 0.0, "open_until": 99999999999.0}

    with pytest.raises(RuntimeError, match="temporarily unavailable"):
        await service.list_containers("local", force_refresh=True)
