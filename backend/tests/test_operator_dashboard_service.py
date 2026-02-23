from types import SimpleNamespace

import pytest

import app.services.prometheus_query_service as pqs
from app.services import operator_dashboard_service as svc


class _FakeResult:
    def __init__(self, *, rows=None, scalar=None):
        self._rows = rows or []
        self._scalar = scalar

    def all(self):
        return self._rows

    def scalar_one_or_none(self):
        return self._scalar


class _FakeSession:
    def __init__(self, results):
        self._results = list(results)

    async def execute(self, stmt):
        return self._results.pop(0)

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return None


class _FakeSessionFactory:
    def __init__(self, sessions):
        self._sessions = list(sessions)

    def __call__(self):
        return self._sessions.pop(0)


@pytest.mark.asyncio
async def test_fetch_operator_dashboard_handles_row_objects(monkeypatch):
    servers_rows = [
        SimpleNamespace(
            id="srv-1",
            name="Server 1",
            region="us",
            status="healthy",
            api_endpoint="https://1.2.3.4:443",
        )
    ]
    factory = _FakeSessionFactory(
        [
            _FakeSession([_FakeResult(rows=servers_rows)]),
            _FakeSession([_FakeResult(scalar=7)]),
        ]
    )
    monkeypatch.setattr(svc, "async_session_factory", factory)

    async def fake_timeseries(window=3600):
        return [{"ts": 1000, "peers": 7, "rx": 10, "tx": 20}]

    monkeypatch.setattr(svc, "get_dashboard_timeseries", fake_timeseries)

    class FakeProm:
        enabled = True

        async def query(self, expr):
            if expr == 'up{job="admin-api"}':
                return [{"value": [1000, "1"]}]
            if expr.startswith("sum(vpn_nodes_total"):
                return [{"value": [1000, "1"]}]
            if expr == "vpn_cluster_load":
                return [{"value": [1000, "7"]}]
            if expr.startswith("sum(rate(http_requests_total"):
                return [{"value": [1000, "0.1"]}]
            if expr.startswith("histogram_quantile"):
                return [{"value": [1000, "12"]}]
            if "vpn_node_health" in expr:
                return [{"value": [1000, "95"]}]
            if "vpn_node_peers" in expr:
                return [{"value": [1000, "7"]}]
            if "vpn_node_traffic_rx_bytes" in expr:
                return [{"value": [1000, "10"]}]
            if "vpn_node_traffic_tx_bytes" in expr:
                return [{"value": [1000, "20"]}]
            if "vpn_node_cpu_utilization" in expr:
                return [{"value": [1000, "15.5"]}]
            if "vpn_node_memory_utilization" in expr:
                return [{"value": [1000, "42.2"]}]
            return []

    monkeypatch.setattr(pqs, "PrometheusQueryService", FakeProm)

    out = await svc.fetch_operator_dashboard("1h")

    assert out["data_status"] == "ok"
    assert out["servers"][0]["id"] == "srv-1"
    assert out["servers"][0]["users"] == 7
    assert out["timeseries"][0]["peers"] == 7
    assert out["servers"][0]["cpu_pct"] == 15.5
    assert out["servers"][0]["ram_pct"] == 42.2


@pytest.mark.asyncio
async def test_fetch_operator_dashboard_prometheus_failure_returns_degraded(monkeypatch):
    servers_rows = [
        SimpleNamespace(
            id="srv-1",
            name="Server 1",
            region="us",
            status="healthy",
            api_endpoint="https://1.2.3.4:443",
        )
    ]
    factory = _FakeSessionFactory(
        [
            _FakeSession([_FakeResult(rows=servers_rows)]),
            _FakeSession([_FakeResult(scalar=1)]),
        ]
    )
    monkeypatch.setattr(svc, "async_session_factory", factory)

    async def fake_timeseries(window=3600):
        return [{"ts": 1000, "peers": 1, "rx": 1, "tx": 2}]

    monkeypatch.setattr(svc, "get_dashboard_timeseries", fake_timeseries)

    class BrokenProm:
        enabled = True

        async def query(self, expr):
            raise RuntimeError("prom down")

    monkeypatch.setattr(pqs, "PrometheusQueryService", BrokenProm)

    out = await svc.fetch_operator_dashboard("1h")

    assert out["data_status"] == "degraded"
    assert out["health_strip"]["prometheus_status"] == "down"
    assert out["timeseries"]


@pytest.mark.asyncio
async def test_fetch_operator_dashboard_empty_timeseries_does_not_force_degraded(monkeypatch):
    servers_rows = [
        SimpleNamespace(
            id="srv-1",
            name="Server 1",
            region="us",
            status="healthy",
            api_endpoint="https://1.2.3.4:443",
        )
    ]
    factory = _FakeSessionFactory(
        [
            _FakeSession([_FakeResult(rows=servers_rows)]),
            _FakeSession([_FakeResult(scalar=1)]),
        ]
    )
    monkeypatch.setattr(svc, "async_session_factory", factory)

    async def fake_timeseries(window=3600):
        return []

    monkeypatch.setattr(svc, "get_dashboard_timeseries", fake_timeseries)

    class HealthyProm:
        enabled = True

        async def query(self, expr):
            if expr == 'up{job="admin-api"}':
                return [{"value": [1000, "1"]}]
            if expr.startswith("sum(vpn_nodes_total"):
                return [{"value": [1000, "1"]}]
            if expr == "vpn_cluster_load":
                return [{"value": [1000, "1"]}]
            if expr.startswith("sum(rate(http_requests_total"):
                return [{"value": [1000, "0.1"]}]
            if expr.startswith("histogram_quantile"):
                return [{"value": [1000, "12"]}]
            if "vpn_node_health" in expr:
                return [{"value": [1000, "95"]}]
            if "vpn_node_peers" in expr:
                return [{"value": [1000, "1"]}]
            return []

    monkeypatch.setattr(pqs, "PrometheusQueryService", HealthyProm)

    out = await svc.fetch_operator_dashboard("1h")

    assert out["data_status"] == "ok"
    assert out["timeseries"] == []
    assert out["health_strip"]["freshness"] == "unknown"
    assert out["last_successful_sample_ts"] is None
