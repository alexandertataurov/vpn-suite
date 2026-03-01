"""Integration tests for frontend telemetry batch ingest endpoint."""

import pytest
from httpx import ASGITransport, AsyncClient

from app.core.config import settings
from app.core.metrics import frontend_telemetry_events_total
from app.main import app


@pytest.fixture
def client():
    return AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
        timeout=5.0,
    )


def _metric_value(event: str, result: str) -> float:
    counter = frontend_telemetry_events_total.labels(event=event, result=result)
    return counter._value.get()


@pytest.mark.asyncio
async def test_frontend_telemetry_ingest_accepts_valid_batch(client: AsyncClient, monkeypatch):
    monkeypatch.setattr(settings, "admin_telemetry_events_enabled", True)
    monkeypatch.setattr(settings, "admin_telemetry_sample_rate", 1.0)
    before = _metric_value("page_view", "accepted")
    response = await client.post(
        "/api/v1/log/events",
        json={
            "schemaVersion": "1.0",
            "events": [
                {
                    "event": "page_view",
                    "payload": {"route": "/servers"},
                    "context": {"route": "/servers"},
                    "ts": "2026-02-28T00:00:00Z",
                }
            ],
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["accepted"] == 1
    assert body["dropped"] == 0
    assert _metric_value("page_view", "accepted") >= before + 1


@pytest.mark.asyncio
async def test_frontend_telemetry_ingest_drops_unknown_schema_version(
    client: AsyncClient, monkeypatch
):
    monkeypatch.setattr(settings, "admin_telemetry_events_enabled", True)
    monkeypatch.setattr(settings, "admin_telemetry_sample_rate", 1.0)
    before = _metric_value("page_view", "dropped")
    response = await client.post(
        "/api/v1/log/events",
        json={
            "schemaVersion": "9.9",
            "events": [
                {
                    "event": "page_view",
                    "payload": {"route": "/servers"},
                    "context": {"route": "/servers"},
                    "ts": "2026-02-28T00:00:00Z",
                }
            ],
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["accepted"] == 0
    assert body["dropped"] == 1
    assert _metric_value("page_view", "dropped") >= before + 1


@pytest.mark.asyncio
async def test_frontend_telemetry_sampling_keeps_frontend_error(client: AsyncClient, monkeypatch):
    monkeypatch.setattr(settings, "admin_telemetry_events_enabled", True)
    monkeypatch.setattr(settings, "admin_telemetry_sample_rate", 0.0)
    response = await client.post(
        "/api/v1/log/events",
        json={
            "schemaVersion": "1.0",
            "events": [
                {
                    "event": "page_view",
                    "payload": {"route": "/servers"},
                    "context": {"route": "/servers"},
                    "ts": "2026-02-28T00:00:00Z",
                },
                {
                    "event": "frontend_error",
                    "payload": {"message": "boom", "token": "secret"},
                    "context": {"route": "/servers"},
                    "ts": "2026-02-28T00:00:01Z",
                },
            ],
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["accepted"] == 1
    assert body["dropped"] == 1


@pytest.mark.asyncio
async def test_frontend_telemetry_ingest_is_available_without_auth(
    client: AsyncClient, monkeypatch
):
    monkeypatch.setattr(settings, "admin_telemetry_events_enabled", True)
    monkeypatch.setattr(settings, "admin_telemetry_sample_rate", 1.0)
    response = await client.post(
        "/api/v1/log/events",
        json={
            "schemaVersion": "1.0",
            "events": [
                {
                    "event": "login_failure",
                    "payload": {"route": "/login", "reason": "invalid credentials"},
                    "context": {"route": "/login"},
                    "ts": "2026-02-28T00:00:00Z",
                }
            ],
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["accepted"] == 1
