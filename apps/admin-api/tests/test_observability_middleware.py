"""Tests for observability: 5xx recorded in Prometheus and request logged on exception."""

import logging

import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from app.core.prometheus_middleware import REQUESTS_TOTAL, PrometheusMiddleware
from app.core.request_logging_middleware import RequestLoggingMiddleware

# Minimal app that raises on a route to test middleware behavior (no exception handler so exception propagates through middleware)
_observability_app = FastAPI()
_observability_app.add_middleware(RequestLoggingMiddleware)
_observability_app.add_middleware(PrometheusMiddleware)


@_observability_app.get("/ok")
def _ok():
    return {"status": "ok"}


@_observability_app.get("/fail")
def _fail():
    raise RuntimeError("test 500")


def _get_5xx_count(path_template: str = "/fail", method: str = "GET") -> float:
    """Current value of http_requests_total for the given path and method with status_class=5xx."""
    c = REQUESTS_TOTAL.labels(method=method, path_template=path_template, status_class="5xx")
    return c._value.get()


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.mark.asyncio
async def test_5xx_recorded_in_prometheus():
    """Unhandled exception results in http_requests_total with status_class=5xx."""
    async with AsyncClient(
        transport=ASGITransport(app=_observability_app),
        base_url="http://test",
    ) as client:
        before = _get_5xx_count()
        try:
            await client.get("/fail")
        except Exception:
            pass  # exception propagates when no app-level handler
        after = _get_5xx_count()
    assert after >= before + 1


@pytest.mark.asyncio
async def test_request_finished_logged_on_exception(caplog):
    """When a route raises, middleware logs 'request finished' with status=500 and duration_ms in extra."""
    with caplog.at_level(logging.INFO):
        async with AsyncClient(
            transport=ASGITransport(app=_observability_app),
            base_url="http://test",
        ) as client:
            try:
                await client.get("/fail")
            except Exception:
                pass
    recs = [r for r in caplog.records if "request finished" in r.message]
    assert (
        len(recs) >= 1
    ), f"Expected a request finished log; got: {[r.message for r in caplog.records]}"
    r = recs[-1]
    assert getattr(r, "status_code", None) == 500
    assert "duration_ms" in r.__dict__
