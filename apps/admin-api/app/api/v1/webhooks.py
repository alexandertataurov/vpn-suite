"""Webhooks: payment provider callbacks. Idempotent by external_id."""

import logging
import secrets

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.error_responses import error_body
from app.core.logging_config import extra_for_event, request_id_ctx
from app.core.metrics import payment_webhook_total
from app.models import Payment
from app.services.payment_webhook_service import process_payment_webhook

router = APIRouter(prefix="/webhooks", tags=["webhooks"])
_log = logging.getLogger(__name__)

ALLOWED_WEBHOOK_PROVIDERS = frozenset({"telegram_stars", "platega", "mock"})


def _external_id_from_payload(payload: dict) -> str | None:
    """Extract external_id for idempotent replay handling (same as service)."""
    raw = payload.get("external_id") or payload.get("id") or payload.get("payment_id")
    return str(raw) if raw is not None else None


def _verify_telegram_stars_secret(provider: str, secret_header: str | None) -> None:
    if provider != "telegram_stars" or not settings.telegram_stars_webhook_secret:
        return
    if not secret_header or not secrets.compare_digest(
        secret_header, settings.telegram_stars_webhook_secret
    ):
        payment_webhook_total.labels(status="failed").inc()
        _log.info(
            "payment webhook failed",
            extra=extra_for_event(
                event="payment.webhook.failed",
                error_code="E_AUTH_INVALID",
                error_kind="auth",
                error_severity="warn",
                error_retryable=False,
            ),
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or missing webhook secret"
        )


def _verify_platega_secret(
    provider: str,
    merchant_id_header: str | None,
    secret_header: str | None,
) -> None:
    if provider != "platega":
        return
    configured_merchant_id = (settings.platega_merchant_id or "").strip()
    configured_secret = (settings.platega_secret or "").strip()
    if not configured_merchant_id or not configured_secret:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Platega webhook is not configured",
        )
    if not merchant_id_header or not secrets.compare_digest(
        merchant_id_header, configured_merchant_id
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or missing webhook merchant id"
        )
    if not secret_header or not secrets.compare_digest(secret_header, configured_secret):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or missing webhook secret"
        )


WEBHOOK_MAX_BODY_BYTES = 1_000_000  # 1 MB


@router.post("/payments/{provider}")
async def payment_webhook(
    provider: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
    x_telegram_bot_api_secret_token: str | None = Header(
        None, alias="X-Telegram-Bot-Api-Secret-Token"
    ),
    x_merchant_id: str | None = Header(None, alias="X-MerchantId"),
    x_secret: str | None = Header(None, alias="X-Secret"),
):
    """Idempotent: same external_id → 200, no duplicate charge. Telegram Stars: verify secret if set."""
    if provider not in ALLOWED_WEBHOOK_PROVIDERS:
        payment_webhook_total.labels(status="failed").inc()
        _log.info(
            "payment webhook rejected: unknown provider",
            extra=extra_for_event(
                event="payment.webhook.failed",
                error_code="E_BAD_REQUEST",
                error_kind="validation",
                error_severity="warn",
                entity_id=provider,
            ),
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "UNKNOWN_PROVIDER", "message": f"Unknown webhook provider: {provider}"},
        )
    raw = await request.body()
    if len(raw) > WEBHOOK_MAX_BODY_BYTES:
        raise HTTPException(
            status_code=413,
            detail="Webhook body too large",
        )
    import json as _json

    try:
        body = _json.loads(raw)
    except _json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON")
    ext_id = _external_id_from_payload(body)
    payment_webhook_total.labels(status="received").inc()
    _log.info(
        "payment webhook received",
        extra=extra_for_event(
            event="payment.webhook.received",
            entity_id=ext_id,
        ),
    )
    try:
        _verify_telegram_stars_secret(provider, x_telegram_bot_api_secret_token)
        _verify_platega_secret(provider, x_merchant_id, x_secret)
        result = await process_payment_webhook(db, provider=provider, payload=body)
        await db.commit()
        # DoD: audit all mutating operations; webhook has no admin, use actor "webhook"
        request.state.audit_admin_id = "webhook"
        request.state.audit_action = f"POST /webhooks/payments/{provider}"
        request.state.audit_resource_type = "payment"
        request.state.audit_resource_id = result.payment_id
        request.state.audit_old_new = {"created": result.created, "provider": provider}
        payment_webhook_total.labels(status="processed").inc()
        _log.info(
            "payment webhook processed",
            extra=extra_for_event(
                event="payment.webhook.processed",
                entity_id=result.payment_id,
            ),
        )
        return {"status": "ok", "payment_id": result.payment_id, "created": result.created}
    except IntegrityError:
        # Concurrent duplicate external_id: other request committed first; treat as idempotent (P1).
        await db.rollback()
        ext_id = _external_id_from_payload(body)
        if ext_id:
            row = await db.execute(select(Payment).where(Payment.external_id == ext_id))
            existing = row.scalar_one_or_none()
            if existing:
                _log.info(
                    "Webhook replay/concurrent duplicate external_id=%s → 200 idempotent", ext_id
                )
                request.state.audit_admin_id = "webhook"
                request.state.audit_action = f"POST /webhooks/payments/{provider}"
                request.state.audit_resource_type = "payment"
                request.state.audit_resource_id = str(existing.id)
                request.state.audit_old_new = {"replay": True, "provider": provider}
                _log.info(
                    "payment webhook processed (replay)",
                    extra=extra_for_event(
                        event="payment.webhook.processed",
                        entity_id=str(existing.id),
                    ),
                )
                return {"status": "ok", "payment_id": str(existing.id), "created": False}
        payment_webhook_total.labels(status="failed").inc()
        _log.warning(
            "payment webhook failed",
            extra=extra_for_event(
                event="payment.webhook.failed",
                error_code="E_CONFLICT",
                error_kind="conflict",
                error_severity="error",
                error_retryable=True,
                entity_id=ext_id,
            ),
        )
        rid = getattr(request.state, "request_id", None) or request_id_ctx.get()
        body = error_body(
            code="CONFLICT",
            message="Duplicate payment; retry or contact support.",
            status_code=409,
            request_id=rid,
        )
        body["status"] = "rejected"
        return JSONResponse(status_code=409, content=body)
    except ValueError as e:
        payment_webhook_total.labels(status="failed").inc()
        _log.warning(
            "payment webhook failed",
            extra=extra_for_event(
                event="payment.webhook.failed",
                error_code="E_VALIDATION",
                error_kind="validation",
                error_severity="warn",
                error_retryable=False,
                entity_id=ext_id,
            ),
        )
        rid = getattr(request.state, "request_id", None) or request_id_ctx.get()
        body = error_body(
            code="BAD_REQUEST",
            message=str(e) or "Invalid webhook payload",
            status_code=400,
            request_id=rid,
        )
        body["status"] = "rejected"
        return JSONResponse(status_code=400, content=body)
