"""Outline Shadowbox API client — create/delete access keys (Shadowsocks)."""

from __future__ import annotations

import logging
import time
from typing import Any

import httpx

from app.core.logging_config import extra_for_event, request_id_ctx
from app.core.redaction import redact_for_log

_log = logging.getLogger(__name__)
_EXTERNAL_SLOW_MS = 3000

OUTLINE_PREFIX = "outline:"

# Keys that must never be logged (contain secrets)
_SENSITIVE_KEYS = frozenset({"accessUrl", "password", "access_url", "password"})


def _mask_base_url(url: str) -> str:
    """Return URL safe for logging: path replaced with *** (secret path)."""
    if not url:
        return ""
    try:
        from urllib.parse import urlparse

        p = urlparse(url)
        return f"{p.scheme or ''}://{p.netloc or ''}/***"
    except Exception:
        return "***"


def _safe_key_summary(key: dict[str, Any]) -> dict[str, Any]:
    """Return a copy of key dict with accessUrl/password stripped for logging."""
    return {k: v for k, v in key.items() if k not in _SENSITIVE_KEYS}


def is_outline_server(api_endpoint: str | None) -> bool:
    """Return True if api_endpoint indicates an Outline Shadowbox server."""
    return bool(api_endpoint and api_endpoint.startswith(OUTLINE_PREFIX))


def parse_outline_url(api_endpoint: str) -> str:
    """Extract base URL from outline:https://host:8081/SecretPath."""
    if not is_outline_server(api_endpoint):
        raise ValueError("Not an Outline server endpoint")
    return api_endpoint[len(OUTLINE_PREFIX) :].rstrip("/")


class OutlineError(Exception):
    """Raised when Outline API returns an error (4xx/5xx or network)."""

    def __init__(self, message: str, status_code: int | None = None):
        self.status_code = status_code
        super().__init__(message)


class OutlineShadowboxClient:
    """Client for Outline Shadowbox REST API (getoutline.org)."""

    def __init__(
        self,
        base_url: str,
        *,
        verify_ssl: bool = True,
        timeout: float = 15.0,
        retry_count: int = 2,
    ):
        self._base = base_url.rstrip("/")
        self._verify = verify_ssl
        self._timeout = timeout
        self._retry_count = max(0, retry_count)

    def _request(self, method: str, path: str, **kwargs: Any) -> httpx.Request:
        return httpx.Request(method, f"{self._base}{path}", **kwargs)

    async def _do(
        self,
        method: str,
        path: str,
        *,
        json: dict[str, Any] | None = None,
        params: dict[str, str] | None = None,
    ) -> httpx.Response:
        _log.info(
            "external call start",
            extra=extra_for_event(
                event="external.call.start",
                entity_id=f"{method} {path}",
            ),
        )
        start = time.perf_counter()
        last_exc: Exception | None = None
        headers: dict[str, str] = {}
        rid = request_id_ctx.get()
        if rid:
            headers["X-Request-ID"] = rid
        for attempt in range(self._retry_count + 1):
            try:
                async with httpx.AsyncClient(
                    verify=self._verify,
                    timeout=self._timeout,
                    headers=headers,
                ) as client:
                    if method == "GET":
                        r = await client.get(f"{self._base}{path}", params=params)
                    elif method == "POST":
                        r = await client.post(f"{self._base}{path}", json=json or {})
                    elif method == "PUT":
                        r = await client.put(f"{self._base}{path}", json=json or {})
                    elif method == "DELETE":
                        r = await client.delete(f"{self._base}{path}")
                    else:
                        raise OutlineError(f"Unsupported method {method}")
                    duration_ms = (time.perf_counter() - start) * 1000
                    _log.debug(
                        "external call end",
                        extra=extra_for_event(
                            event="external.call.end",
                            entity_id=f"{method} {path}",
                            duration_ms=duration_ms,
                            status_code=r.status_code,
                        ),
                    )
                    if duration_ms > _EXTERNAL_SLOW_MS:
                        _log.warning(
                            "external call slow",
                            extra=extra_for_event(
                                event="external.call.slow",
                                entity_id=f"{method} {path}",
                                duration_ms=duration_ms,
                            ),
                        )
                    return r
            except httpx.HTTPError as e:
                last_exc = e
                status_code = getattr(getattr(e, "response", None), "status_code", None)
                _log.debug(
                    "Outline request attempt %s failed base=%s path=%s error=%s",
                    attempt + 1,
                    _mask_base_url(self._base),
                    path,
                    redact_for_log(str(e)),
                )
                if status_code is not None and 400 <= status_code < 500:
                    raise OutlineError(
                        f"Outline request failed: {redact_for_log(str(e))}",
                        status_code=status_code,
                    )
                if attempt < self._retry_count:
                    time.sleep(0.5 * (attempt + 1))
        duration_ms = (time.perf_counter() - start) * 1000
        status_code = getattr(getattr(last_exc, "response", None), "status_code", None)
        _log.warning(
            "external call failed",
            extra=extra_for_event(
                event="external.call.failed",
                entity_id=f"{method} {path}",
                duration_ms=duration_ms,
                error_code="E_UPSTREAM_5XX"
                if (status_code and status_code >= 500)
                else "E_UPSTREAM_TIMEOUT",
                error_kind="external",
                error_severity="error",
                error_retryable=True,
            ),
        )
        raise OutlineError(
            f"Outline request failed: {redact_for_log(str(last_exc))}",
            status_code=status_code,
        )

    async def get_server(self) -> dict[str, Any]:
        """GET /server — returns server info."""
        r = await self._do("GET", "/server")
        if r.status_code != 200:
            raise OutlineError(
                f"Outline server info failed: {r.status_code}", status_code=r.status_code
            )
        return r.json()

    async def list_access_keys(self) -> list[dict[str, Any]]:
        """GET /access-keys — list access keys. Do not log accessUrl/password."""
        r = await self._do("GET", "/access-keys")
        if r.status_code != 200:
            raise OutlineError(
                f"Outline list keys failed: {r.status_code}", status_code=r.status_code
            )
        data = r.json()
        return list(data.get("accessKeys") or [])

    async def get_access_key(self, access_key_id: str) -> dict[str, Any]:
        """GET /access-keys/{id} — get one key. Caller must not log returned dict (contains accessUrl)."""
        r = await self._do("GET", f"/access-keys/{access_key_id}")
        if r.status_code == 404:
            raise OutlineError("Access key not found", status_code=404)
        if r.status_code != 200:
            raise OutlineError(
                f"Outline get key failed: {r.status_code}", status_code=r.status_code
            )
        return r.json()

    async def create_access_key(
        self,
        *,
        name: str | None = None,
        method: str = "chacha20-ietf-poly1305",
        limit_bytes: int | None = None,
    ) -> dict[str, Any]:
        """POST /access-keys — create access key. Returns {id, accessUrl, ...}."""
        payload: dict[str, Any] = {"method": method}
        if name:
            payload["name"] = name
        if limit_bytes is not None and limit_bytes > 0:
            payload["limit"] = {"bytes": limit_bytes}
        r = await self._do("POST", "/access-keys", json=payload)
        if r.status_code not in (200, 201):
            raise OutlineError(
                f"Outline create key failed: {r.status_code}", status_code=r.status_code
            )
        return r.json()

    async def rename_access_key(self, access_key_id: str, name: str) -> None:
        """PUT /access-keys/{id}/name — rename key."""
        r = await self._do("PUT", f"/access-keys/{access_key_id}/name", json={"name": name})
        if r.status_code == 404:
            raise OutlineError("Access key not found", status_code=404)
        if r.status_code != 204:
            raise OutlineError(
                f"Outline rename key failed: {r.status_code}", status_code=r.status_code
            )

    async def delete_access_key(self, access_key_id: str) -> None:
        """DELETE /access-keys/{id} — remove access key."""
        r = await self._do("DELETE", f"/access-keys/{access_key_id}")
        if r.status_code == 404:
            raise OutlineError("Access key not found", status_code=404)
        if r.status_code != 204:
            raise OutlineError(
                f"Outline delete key failed: {r.status_code}", status_code=r.status_code
            )

    # --- Telemetry (Outline Shadowbox API) ---

    async def get_metrics_enabled(self) -> bool:
        """GET /metrics/enabled — whether metrics are shared."""
        r = await self._do("GET", "/metrics/enabled")
        r.raise_for_status()
        return bool(r.json().get("metricsEnabled", False))

    async def get_transfer_metrics(self) -> dict[str, int]:
        """GET /metrics/transfer — bytes transferred per access key (userId = access key id)."""
        r = await self._do("GET", "/metrics/transfer")
        r.raise_for_status()
        data = r.json()
        return dict(data.get("bytesTransferredByUserId") or {})

    async def get_server_metrics(self, since: str | None = None) -> dict[str, Any]:
        """GET /experimental/server/metrics — server and per–access-key telemetry (tunnel time, data transferred, bandwidth). Optional query: since (time range)."""
        params = {"since": since} if since else None
        r = await self._do("GET", "/experimental/server/metrics", params=params)
        if r.status_code != 200:
            raise OutlineError(
                f"Outline server metrics failed: {r.status_code}", status_code=r.status_code
            )
        return r.json()

    # --- Server settings (controls) ---

    async def set_server_access_key_data_limit(self, limit_bytes: int) -> None:
        """PUT /server/access-key-data-limit — set global data limit for all keys."""
        r = await self._do(
            "PUT", "/server/access-key-data-limit", json={"limit": {"bytes": limit_bytes}}
        )
        if r.status_code != 204:
            raise OutlineError(
                f"Outline set server limit failed: {r.status_code}", status_code=r.status_code
            )

    async def delete_server_access_key_data_limit(self) -> None:
        """DELETE /server/access-key-data-limit — remove global data limit."""
        r = await self._do("DELETE", "/server/access-key-data-limit")
        if r.status_code != 204:
            raise OutlineError(
                f"Outline delete server limit failed: {r.status_code}", status_code=r.status_code
            )

    async def set_hostname_for_access_keys(self, hostname: str) -> None:
        """PUT /server/hostname-for-access-keys — hostname/domain for access URLs."""
        r = await self._do("PUT", "/server/hostname-for-access-keys", json={"hostname": hostname})
        if r.status_code == 400:
            raise OutlineError("Invalid hostname", status_code=400)
        if r.status_code != 204:
            raise OutlineError(
                f"Outline set hostname failed: {r.status_code}", status_code=r.status_code
            )

    async def set_port_for_new_access_keys(self, port: int) -> None:
        """PUT /server/port-for-new-access-keys — default port for new keys (1–65535)."""
        r = await self._do("PUT", "/server/port-for-new-access-keys", json={"port": port})
        if r.status_code == 409:
            raise OutlineError("Port already in use", status_code=409)
        if r.status_code != 204:
            raise OutlineError(
                f"Outline set port failed: {r.status_code}", status_code=r.status_code
            )

    async def set_access_key_data_limit(self, access_key_id: str, limit_bytes: int) -> None:
        """PUT /access-keys/{id}/data-limit — set per-key data limit."""
        r = await self._do(
            "PUT",
            f"/access-keys/{access_key_id}/data-limit",
            json={"limit": {"bytes": limit_bytes}},
        )
        if r.status_code == 404:
            raise OutlineError("Access key not found", status_code=404)
        if r.status_code != 204:
            raise OutlineError(
                f"Outline set key limit failed: {r.status_code}", status_code=r.status_code
            )

    async def delete_access_key_data_limit(self, access_key_id: str) -> None:
        """DELETE /access-keys/{id}/data-limit — remove per-key data limit."""
        r = await self._do("DELETE", f"/access-keys/{access_key_id}/data-limit")
        if r.status_code == 404:
            raise OutlineError("Access key not found", status_code=404)
        if r.status_code != 204:
            raise OutlineError(
                f"Outline delete key limit failed: {r.status_code}", status_code=r.status_code
            )
