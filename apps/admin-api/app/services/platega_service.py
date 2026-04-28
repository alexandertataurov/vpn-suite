"""Platega API client helpers for WebApp checkout and status sync."""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timezone
from decimal import Decimal

import httpx

from app.core.config import settings


@dataclass(slots=True)
class PlategaCreateTransactionResult:
    transaction_id: str
    redirect_url: str
    status: str
    payment_method: str | int | None
    expires_in: str | None
    usdt_rate: float | None


@dataclass(slots=True)
class PlategaTransactionResult:
    transaction_id: str
    status: str
    amount: Decimal | None
    currency: str | None
    raw: dict


class PlategaError(RuntimeError):
    """Raised when Platega call fails or returns an invalid response."""


def normalize_platega_status(value: str | None) -> str:
    raw = (value or "").strip().upper()
    if raw == "CONFIRMED":
        return "succeeded"
    if raw in {"CHARGEBACK", "CHARGEBACKED"}:
        return "chargeback"
    if raw in {"REFUND", "REFUNDED"}:
        return "refunded"
    # Docs and provider payloads may use both US/UK spellings.
    if raw in {"CANCELED", "CANCELLED"}:
        return "failed"
    return "pending"


def _base_url() -> str:
    base = (settings.platega_base_url or "https://app.platega.io/").strip()
    return base[:-1] if base.endswith("/") else base


def _headers() -> dict[str, str]:
    merchant_id = (settings.platega_merchant_id or "").strip()
    secret = (settings.platega_secret or "").strip()
    if not merchant_id or not secret:
        raise PlategaError("Platega credentials are not configured")
    return {"X-MerchantId": merchant_id, "X-Secret": secret}


async def create_platega_transaction(
    *,
    amount: int,
    currency: str,
    description: str,
    return_url: str,
    failed_url: str,
    payload: str,
) -> PlategaCreateTransactionResult:
    body = {
        "paymentMethod": int(settings.platega_payment_method),
        "paymentDetails": {
            "amount": int(amount),
            "currency": (currency or "RUB").strip().upper(),
        },
        "description": description[:255],
        "return": return_url,
        "failedUrl": failed_url,
        "payload": payload,
    }
    url = f"{_base_url()}/transaction/process"
    timeout = max(1.0, float(settings.platega_timeout_seconds))
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(url, json=body, headers=_headers())
    except httpx.HTTPError as exc:
        raise PlategaError("Platega request failed") from exc
    if response.status_code != 200:
        raise PlategaError(f"Platega returned HTTP {response.status_code}")
    try:
        data = response.json()
    except json.JSONDecodeError as exc:
        raise PlategaError("Platega returned invalid JSON") from exc
    transaction_id = str(data.get("transactionId") or "").strip()
    redirect_url = str(data.get("redirect") or "").strip()
    if not transaction_id or not redirect_url:
        raise PlategaError("Platega response missing transactionId/redirect")
    return PlategaCreateTransactionResult(
        transaction_id=transaction_id,
        redirect_url=redirect_url,
        status=str(data.get("status") or "PENDING"),
        payment_method=data.get("paymentMethod"),
        expires_in=str(data.get("expiresIn") or "") or None,
        usdt_rate=float(data["usdtRate"]) if data.get("usdtRate") is not None else None,
    )


async def get_platega_transaction(transaction_id: str) -> PlategaTransactionResult:
    tx_id = (transaction_id or "").strip()
    if not tx_id:
        raise PlategaError("transaction id is required")
    url = f"{_base_url()}/transaction/{tx_id}"
    timeout = max(1.0, float(settings.platega_timeout_seconds))
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.get(url, headers=_headers())
    except httpx.HTTPError as exc:
        raise PlategaError("Platega request failed") from exc
    if response.status_code != 200:
        raise PlategaError(f"Platega returned HTTP {response.status_code}")
    try:
        data = response.json()
    except json.JSONDecodeError as exc:
        raise PlategaError("Platega returned invalid JSON") from exc
    payment_details = data.get("paymentDetails") if isinstance(data.get("paymentDetails"), dict) else {}
    amount_raw = data.get("amount")
    if amount_raw is None and isinstance(payment_details, dict):
        amount_raw = payment_details.get("amount")
    amount = Decimal(str(amount_raw)) if amount_raw is not None else None
    currency_raw = data.get("currency")
    if currency_raw is None and isinstance(payment_details, dict):
        currency_raw = payment_details.get("currency")
    normalized = normalize_platega_status(str(data.get("status") or "PENDING"))
    raw = dict(data)
    raw["fetched_at"] = datetime.now(timezone.utc).isoformat()
    return PlategaTransactionResult(
        transaction_id=tx_id,
        status=normalized,
        amount=amount,
        currency=str(currency_raw or "") or None,
        raw=raw,
    )
