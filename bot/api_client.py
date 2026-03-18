"""HTTP client for Admin API. Single AsyncClient, retry, Result, structured logging."""

import asyncio
import time
from dataclasses import dataclass
from typing import Any

import httpx

from config import PANEL_URL, BOT_API_KEY
from metrics import record_event_sent, record_request, record_retry
from utils.cache import cached
from utils.context import correlation_id_ctx
from utils.logging import get_logger

_log = get_logger(__name__)

DEFAULT_TIMEOUT = 15.0
MAX_RETRIES = 3
BACKOFF_BASE = 1  # 1s, 2s, 4s


def _headers():
    return {"X-API-Key": BOT_API_KEY} if BOT_API_KEY else {}


def _safe_parse_json(r: httpx.Response | None) -> dict | None:
    """Parse response JSON once; return None on empty/failure."""
    if not r or not r.content:
        return None
    try:
        return r.json()
    except Exception:
        return None


def _extract_error_code_from_data(data: dict | None) -> str | None:
    """Best-effort extract backend error code from parsed response."""
    if not isinstance(data, dict):
        return None
    err = data.get("error")
    if isinstance(err, dict):
        code = err.get("code")
        if isinstance(code, str) and code.strip():
            return code.strip().upper()
    detail = data.get("detail")
    if isinstance(detail, dict):
        code = detail.get("code")
        if isinstance(code, str) and code.strip():
            return code.strip().upper()
    return None


def _error_key_from_status(status_code: int) -> str:
    """Map HTTP status to i18n error key."""
    if status_code == 402:
        return "error_subscription_expired"
    if status_code == 409:
        return "error_config_exists"
    if status_code == 429:
        return "error_rate_limit"
    if status_code in (404, 400):
        return "error_device_not_found"
    if status_code >= 500:
        return "error_server"
    return "error_api"


def _error_key_from_response(r: httpx.Response) -> str:
    data = _safe_parse_json(r)
    code = _extract_error_code_from_data(data)
    if code:
        by_code = {
            "RATE_LIMIT_EXCEEDED": "error_rate_limit",
            "TOO_MANY_REQUESTS": "error_rate_limit",
            "DEVICE_LIMIT_EXCEEDED": "error_device_limit",
            "SUBSCRIPTION_INVALID": "error_subscription_expired",
            "SUBSCRIPTION_EXPIRED": "error_subscription_expired",
            "USER_BANNED": "error_api",
            "DEVICE_NOT_FOUND": "error_device_not_found",
            "NOT_FOUND": "error_device_not_found",
            "TRIAL_ALREADY_USED": "error_subscription_expired",
        }
        mapped = by_code.get(code)
        if mapped:
            return mapped
    return _error_key_from_status(r.status_code)


@dataclass
class Result:
    success: bool
    data: Any = None
    error: str | None = None

    @classmethod
    def ok(cls, data: Any):
        return cls(success=True, data=data)

    @classmethod
    def fail(cls, error: str):
        return cls(success=False, error=error)


# ---------------------------------------------------------------------------
# ApiClient: single AsyncClient, retry, logging
# ---------------------------------------------------------------------------

_api: "ApiClient | None" = None


def get_api() -> "ApiClient":
    if _api is None:
        raise RuntimeError("API client not initialized. Call init_api() at startup.")
    return _api


async def init_api() -> "ApiClient":
    global _api
    _api = ApiClient()
    await _api.__aenter__()
    return _api


async def close_api() -> None:
    global _api
    if _api:
        await _api.__aexit__(None, None, None)
        _api = None


class ApiClient:
    def __init__(self):
        self._client = httpx.AsyncClient(
            base_url=PANEL_URL,
            timeout=DEFAULT_TIMEOUT,
            limits=httpx.Limits(max_keepalive_connections=5),
            headers=_headers(),
        )

    async def __aenter__(self) -> "ApiClient":
        return self

    async def __aexit__(self, *args) -> None:
        await self._client.aclose()

    async def _request_with_retry(
        self,
        method: str,
        path: str,
        *,
        json: dict | None = None,
        params: dict | None = None,
        user_id: int | None = None,
        telegram_id: int | None = None,
        **kwargs,
    ) -> tuple[httpx.Response | None, str | None]:
        """Returns (response, None) on success, (None, error_key) on failure after retries."""
        req_headers = {**_headers(), **kwargs.pop("headers", {})}
        cid = correlation_id_ctx.get()
        if cid:
            req_headers["X-Request-ID"] = cid
        last_response: httpx.Response | None = None
        for attempt in range(MAX_RETRIES):
            start = time.monotonic()
            try:
                r = await self._client.request(method, path, json=json, params=params, headers=req_headers, **kwargs)
                latency_ms = int((time.monotonic() - start) * 1000)
                _log.debug(
                    "external.call.end",
                    endpoint=f"{method} {path}",
                    method=method,
                    status_code=r.status_code,
                    latency_ms=latency_ms,
                    attempt=attempt + 1,
                    user_id=user_id,
                    telegram_id=telegram_id,
                )
                last_response = r
                record_request(r.status_code, latency_ms / 1000.0)
                if r.status_code < 500:
                    # 2xx, 4xx: no retry
                    if r.status_code >= 400:
                        return (r, _error_key_from_response(r))
                    return (r, None)
                # 5xx: retry with backoff
                if attempt < MAX_RETRIES - 1:
                    record_retry()
                    delay = BACKOFF_BASE * (2**attempt)
                    _log.warning(
                        "external.call.retry",
                        path=path,
                        attempt=attempt + 1,
                        delay_s=delay,
                        status_code=r.status_code,
                    )
                    await asyncio.sleep(delay)
                    continue
                return (r, _error_key_from_response(r))
            except (httpx.TimeoutException, httpx.ConnectError) as e:
                latency_ms = int((time.monotonic() - start) * 1000)
                _log.warning(
                    "external.call.failed",
                    endpoint=f"{method} {path}",
                    method=method,
                    error=str(e),
                    latency_ms=latency_ms,
                    attempt=attempt + 1,
                    user_id=user_id,
                    telegram_id=telegram_id,
                )
                if attempt < MAX_RETRIES - 1:
                    record_retry()
                    delay = BACKOFF_BASE * (2**attempt)
                    await asyncio.sleep(delay)
                    continue
                record_request(None, latency_ms / 1000.0)
                return (None, "error_timeout")
        return (
            last_response,
            last_response and _error_key_from_response(last_response) or "error_api",
        )

    def _parse_json(self, r: httpx.Response) -> Any:
        if not r.content:
            return {}
        return r.json()

    def _parse_items(self, data: Any) -> list:
        if isinstance(data, dict) and "items" in data:
            return data["items"]
        if isinstance(data, dict) and "data" in data and "items" in data.get("data", {}):
            return data["data"]["items"]
        return data if isinstance(data, list) else []

    def _parse_data(self, data: Any) -> Any:
        if isinstance(data, dict) and "data" in data:
            return data["data"]
        return data

    # -----------------------------------------------------------------------
    # API methods (all return Result)
    # -----------------------------------------------------------------------

    async def get_plans(self) -> Result:
        r, err = await self._request_with_retry("GET", "/api/v1/plans")
        if err:
            return Result.fail(err)
        data = self._parse_json(r)
        items = self._parse_items(data) if isinstance(data, dict) else (data if isinstance(data, list) else [])
        return Result.ok(items)

    async def get_user_by_tg(self, tg_id: int) -> Result:
        r, err = await self._request_with_retry("GET", f"/api/v1/users/by-tg/{tg_id}", telegram_id=tg_id)
        if r and r.status_code == 404:
            return Result.ok(None)
        if err:
            return Result.fail(err)
        data = self._parse_json(r)
        return Result.ok(self._parse_data(data))

    async def get_user_devices(self, user_id: int) -> Result:
        r, err = await self._request_with_retry("GET", f"/api/v1/users/{user_id}/devices", user_id=user_id)
        if err:
            return Result.fail(err)
        data = self._parse_json(r)
        return Result.ok(self._parse_items(data) if isinstance(data, dict) else (data if isinstance(data, list) else []))

    async def create_or_get_subscription(self, tg_id: int, plan_id: str) -> Result:
        r, err = await self._request_with_retry(
            "POST", "/api/v1/bot/subscriptions/create-or-get",
            json={"tg_id": tg_id, "plan_id": plan_id},
            telegram_id=tg_id,
        )
        if err:
            return Result.fail(err)
        return Result.ok(self._parse_json(r))

    async def create_invoice(
        self,
        tg_id: int,
        plan_id: str,
        subscription_id: str | None = None,
        idempotency_key: str | None = None,
        promo_code: str | None = None,
    ) -> Result:
        body = {"tg_id": tg_id, "plan_id": plan_id, "subscription_id": subscription_id}
        if promo_code:
            body["promo_code"] = promo_code
        headers = {"Idempotency-Key": idempotency_key} if idempotency_key else None
        r, err = await self._request_with_retry(
            "POST", "/api/v1/bot/payments/telegram_stars/create-invoice",
            json=body,
            telegram_id=tg_id,
            headers=headers or {},
        )
        if err:
            return Result.fail(err)
        return Result.ok(self._parse_json(r))

    async def get_payment_invoice(self, payment_id: str, tg_id: int) -> Result:
        r, err = await self._request_with_retry(
            "GET", f"/api/v1/bot/payments/{payment_id}/invoice",
            params={"tg_id": tg_id},
            telegram_id=tg_id,
        )
        if r and r.status_code == 404:
            return Result.ok(None)
        if err:
            return Result.fail(err)
        return Result.ok(self._parse_json(r))

    async def confirm_telegram_stars_payment(
        self,
        tg_id: int,
        invoice_payload: str,
        telegram_payment_charge_id: str | None = None,
        total_amount: int | None = None,
    ) -> Result:
        r, err = await self._request_with_retry(
            "POST", "/api/v1/bot/payments/telegram-stars-confirm",
            json={
                "tg_id": tg_id,
                "invoice_payload": invoice_payload,
                "telegram_payment_charge_id": telegram_payment_charge_id,
                "total_amount": total_amount,
            },
            telegram_id=tg_id,
        )
        if err:
            return Result.fail(err)
        return Result.ok(self._parse_json(r) if r and r.content else {})

    async def issue_device(
        self,
        user_id: int,
        subscription_id: str,
        server_id: str,
        device_name: str | None = None,
        idempotency_key: str | None = None,
    ) -> Result:
        body = {
            "subscription_id": subscription_id,
            "server_id": server_id,
            "device_name": device_name,
        }
        headers = {"Idempotency-Key": idempotency_key} if idempotency_key else {}
        r, err = await self._request_with_retry(
            "POST", f"/api/v1/users/{user_id}/devices/issue",
            json=body,
            user_id=user_id,
            headers=headers,
        )
        if err:
            return Result.fail(err)
        return Result.ok(self._parse_json(r))

    async def get_servers(self, limit: int = 1, is_active: bool = True) -> Result:
        r, err = await self._request_with_retry(
            "GET", "/api/v1/servers",
            params={"limit": limit, "is_active": is_active},
        )
        if err:
            return Result.fail(err)
        data = self._parse_json(r)
        items = self._parse_items(data) if isinstance(data, dict) else (data if isinstance(data, list) else [])
        return Result.ok(items)

    async def post_event(self, event_type: str, tg_id: int, payload: dict | None = None) -> Result:
        r, err = await self._request_with_retry(
            "POST", "/api/v1/bot/events",
            json={"event_type": event_type, "tg_id": tg_id, "payload": payload or {}},
            telegram_id=tg_id,
        )
        if err:
            return Result.fail(err)
        try:
            record_event_sent(event_type)
        except Exception:
            pass
        return Result.ok(None)

    async def get_referral_my_link(self, tg_id: int) -> Result:
        r, err = await self._request_with_retry(
            "GET", "/api/v1/bot/referral/my-link", params={"tg_id": tg_id}, telegram_id=tg_id
        )
        if err:
            return Result.fail(err)
        return Result.ok(self._parse_json(r))

    async def referral_attach(self, tg_id: int, referral_code: str) -> Result:
        r, err = await self._request_with_retry(
            "POST", "/api/v1/bot/referral/attach",
            json={"tg_id": tg_id, "referral_code": referral_code},
            telegram_id=tg_id,
        )
        if err:
            return Result.fail(err)
        return Result.ok(self._parse_json(r))

    async def get_referral_stats(self, tg_id: int) -> Result:
        r, err = await self._request_with_retry(
            "GET", "/api/v1/bot/referral/stats", params={"tg_id": tg_id}, telegram_id=tg_id
        )
        if err:
            return Result.fail(err)
        return Result.ok(self._parse_json(r))

    async def promo_validate(self, code: str, plan_id: str, tg_id: int) -> Result:
        r, err = await self._request_with_retry(
            "POST", "/api/v1/bot/promo/validate",
            json={"code": code, "plan_id": plan_id, "tg_id": tg_id},
            telegram_id=tg_id,
        )
        if err:
            return Result.fail(err)
        return Result.ok(self._parse_json(r))

    async def reset_device(self, device_id: str) -> Result:
        r, err = await self._request_with_retry("POST", f"/api/v1/devices/{device_id}/reset")
        if err:
            return Result.fail(err)
        return Result.ok(self._parse_json(r) if r and r.content else {})

    async def start_trial(self, tg_id: int) -> Result:
        r, err = await self._request_with_retry(
            "POST", "/api/v1/bot/trial/start",
            json={"tg_id": tg_id},
            telegram_id=tg_id,
        )
        if err:
            return Result.fail(err)
        return Result.ok(self._parse_json(r))

    async def churn_survey(
        self,
        tg_id: int,
        reason: str,
        subscription_id: str | None = None,
    ) -> Result:
        body = {"tg_id": tg_id, "reason": reason}
        if subscription_id:
            body["subscription_id"] = subscription_id
        r, err = await self._request_with_retry(
            "POST", "/api/v1/bot/churn-survey",
            json=body,
            telegram_id=tg_id,
        )
        if err:
            return Result.fail(err)
        return Result.ok(self._parse_json(r))


# ---------------------------------------------------------------------------
# Module-level wrappers (delegate to get_api())
# ---------------------------------------------------------------------------

async def get_plans() -> Result:
    return await cached(300, ("plans",), get_api().get_plans)

async def get_user_by_tg(tg_id: int) -> Result:
    return await get_api().get_user_by_tg(tg_id)

async def get_user_devices(user_id: int) -> Result:
    return await get_api().get_user_devices(user_id)

async def create_or_get_subscription(tg_id: int, plan_id: str) -> Result:
    return await get_api().create_or_get_subscription(tg_id, plan_id)

async def create_invoice(
    tg_id: int,
    plan_id: str,
    subscription_id: str | None = None,
    idempotency_key: str | None = None,
    promo_code: str | None = None,
) -> Result:
    return await get_api().create_invoice(tg_id, plan_id, subscription_id, idempotency_key, promo_code)

async def get_payment_invoice(payment_id: str, tg_id: int) -> Result:
    return await get_api().get_payment_invoice(payment_id, tg_id)


async def confirm_telegram_stars_payment(
    tg_id: int,
    invoice_payload: str,
    telegram_payment_charge_id: str | None = None,
    total_amount: int | None = None,
) -> Result:
    return await get_api().confirm_telegram_stars_payment(
        tg_id, invoice_payload, telegram_payment_charge_id, total_amount
    )


async def issue_device(
    user_id: int,
    subscription_id: str,
    server_id: str,
    device_name: str | None = None,
    idempotency_key: str | None = None,
) -> Result:
    return await get_api().issue_device(user_id, subscription_id, server_id, device_name, idempotency_key)

async def get_servers(limit: int = 1, is_active: bool = True) -> Result:
    return await cached(60, ("servers", limit, is_active), get_api().get_servers, limit, is_active)

async def post_event(event_type: str, tg_id: int, payload: dict | None = None) -> Result:
    return await get_api().post_event(event_type, tg_id, payload)

async def get_referral_my_link(tg_id: int) -> Result:
    return await get_api().get_referral_my_link(tg_id)

async def referral_attach(tg_id: int, referral_code: str) -> Result:
    return await get_api().referral_attach(tg_id, referral_code)

async def get_referral_stats(tg_id: int) -> Result:
    return await get_api().get_referral_stats(tg_id)

async def promo_validate(code: str, plan_id: str, tg_id: int) -> Result:
    return await get_api().promo_validate(code, plan_id, tg_id)

async def reset_device(device_id: str) -> Result:
    return await get_api().reset_device(device_id)


async def start_trial(tg_id: int) -> Result:
    return await get_api().start_trial(tg_id)


async def churn_survey(tg_id: int, reason: str, subscription_id: str | None = None) -> Result:
    return await get_api().churn_survey(tg_id, reason, subscription_id)
