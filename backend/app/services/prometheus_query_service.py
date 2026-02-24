"""Prometheus HTTP API helper for telemetry queries."""

from __future__ import annotations

import logging
import time
from datetime import datetime, timezone
from typing import Any

import httpx

from app.core.config import settings
from app.core.logging_config import extra_for_event, request_id_ctx

_log = logging.getLogger(__name__)
_EXTERNAL_SLOW_MS = 3000


class PrometheusQueryService:
    def __init__(self) -> None:
        self._url = settings.telemetry_prometheus_url.strip().rstrip("/")
        self._timeout = float(settings.docker_telemetry_request_timeout_seconds)

    @property
    def enabled(self) -> bool:
        return bool(self._url)

    async def _get(self, path: str, params: dict[str, Any]) -> dict[str, Any] | None:
        if not self.enabled:
            return None
        start = time.perf_counter()
        _log.info(
            "external call start",
            extra=extra_for_event(event="external.call.start", entity_id=path),
        )
        headers: dict[str, str] = {}
        rid = request_id_ctx.get()
        if rid:
            headers["X-Request-ID"] = rid
        try:
            async with httpx.AsyncClient(timeout=self._timeout, headers=headers) as client:
                res = await client.get(f"{self._url}{path}", params=params)
                res.raise_for_status()
                payload = res.json()
            duration_ms = (time.perf_counter() - start) * 1000
            _log.debug(
                "external call end",
                extra=extra_for_event(
                    event="external.call.end",
                    entity_id=path,
                    duration_ms=duration_ms,
                    status_code=res.status_code,
                ),
            )
            if duration_ms > _EXTERNAL_SLOW_MS:
                _log.warning(
                    "external call slow",
                    extra=extra_for_event(
                        event="external.call.slow",
                        entity_id=path,
                        duration_ms=duration_ms,
                    ),
                )
            if not isinstance(payload, dict) or payload.get("status") != "success":
                return None
            data = payload.get("data")
            return data if isinstance(data, dict) else None
        except Exception:
            duration_ms = (time.perf_counter() - start) * 1000
            _log.warning(
                "external call failed",
                extra=extra_for_event(
                    event="external.call.failed",
                    entity_id=path,
                    duration_ms=duration_ms,
                    error_code="E_UPSTREAM_5XX",
                    error_kind="external",
                    error_severity="error",
                    error_retryable=True,
                ),
            )
            return None

    async def query(self, expr: str, ts: datetime | None = None) -> list[dict[str, Any]]:
        params: dict[str, Any] = {"query": expr}
        if ts is not None:
            params["time"] = ts.astimezone(timezone.utc).timestamp()
        data = await self._get("/api/v1/query", params)
        result = data.get("result") if data else None
        return result if isinstance(result, list) else []

    async def query_range(
        self,
        expr: str,
        *,
        start: datetime,
        end: datetime,
        step_seconds: int,
    ) -> list[dict[str, Any]]:
        params = {
            "query": expr,
            "start": start.astimezone(timezone.utc).timestamp(),
            "end": end.astimezone(timezone.utc).timestamp(),
            "step": step_seconds,
        }
        data = await self._get("/api/v1/query_range", params)
        result = data.get("result") if data else None
        return result if isinstance(result, list) else []

    async def alerts(self) -> list[dict[str, Any]]:
        data = await self._get("/api/v1/alerts", {})
        alerts = data.get("alerts") if data else None
        return alerts if isinstance(alerts, list) else []

    async def targets(self) -> dict[str, Any]:
        data = await self._get("/api/v1/targets", {})
        return data if isinstance(data, dict) else {}
