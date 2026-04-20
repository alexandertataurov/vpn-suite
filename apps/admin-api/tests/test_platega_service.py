from __future__ import annotations

from decimal import Decimal

import pytest

from app.core import config
from app.services.platega_service import get_platega_transaction, normalize_platega_status


@pytest.mark.parametrize(
    ("raw_status", "expected"),
    [
        ("CONFIRMED", "completed"),
        ("CANCELED", "failed"),
        ("CANCELLED", "failed"),
        ("CHARGEBACK", "failed"),
        ("CHARGEBACKED", "failed"),
        ("PENDING", "pending"),
        ("UNKNOWN", "pending"),
    ],
)
def test_normalize_platega_status_variants(raw_status: str, expected: str) -> None:
    assert normalize_platega_status(raw_status) == expected


@pytest.mark.asyncio
async def test_get_platega_transaction_uses_nested_payment_details(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(config.settings, "platega_merchant_id", "merchant-1")
    monkeypatch.setattr(config.settings, "platega_secret", "secret-1")
    monkeypatch.setattr(config.settings, "platega_timeout_seconds", 5.0)

    class _FakeResponse:
        status_code = 200

        @staticmethod
        def json() -> dict:
            return {
                "id": "plg-tx-1",
                "status": "PENDING",
                "paymentDetails": {
                    "amount": 2500,
                    "currency": "RUB",
                },
            }

    class _FakeClient:
        async def __aenter__(self) -> _FakeClient:
            return self

        async def __aexit__(self, exc_type, exc, tb) -> None:
            return None

        async def get(self, url: str, headers: dict[str, str]) -> _FakeResponse:  # noqa: ARG002
            return _FakeResponse()

    monkeypatch.setattr("app.services.platega_service.httpx.AsyncClient", lambda timeout: _FakeClient())

    tx = await get_platega_transaction("plg-tx-1")
    assert tx.transaction_id == "plg-tx-1"
    assert tx.status == "pending"
    assert tx.amount == Decimal("2500")
    assert tx.currency == "RUB"
