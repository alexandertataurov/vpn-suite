from __future__ import annotations

from utils.formatting import is_subscription_effectively_active


def test_is_subscription_effectively_active_accepts_scheduled_cancel_as_active():
    assert (
        is_subscription_effectively_active(
            {
                "effective_status": "cancel_at_period_end",
                "valid_until": "2099-01-01T00:00:00+00:00",
            }
        )
        is True
    )


def test_is_subscription_effectively_active_rejects_paused_and_grace():
    assert is_subscription_effectively_active({"effective_status": "paused"}) is False
    assert is_subscription_effectively_active({"effective_status": "grace"}) is False
