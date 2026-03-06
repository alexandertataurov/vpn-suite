"""Tests for Telegram user requisites normalization."""

import pytest

from app.core.telegram_user import build_tg_requisites


def test_build_tg_requisites_empty():
    assert build_tg_requisites({}) == {}
    assert build_tg_requisites(None) == {}  # type: ignore[arg-type]


def test_build_tg_requisites_full_snake_case():
    user = {
        "id": 123456789,
        "first_name": "John",
        "last_name": "Doe",
        "username": "johndoe",
        "language_code": "en",
        "is_premium": True,
        "photo_url": "https://t.me/i/userpic/123.jpg",
        "allows_write_to_pm": True,
    }
    out = build_tg_requisites(user)
    assert out["id"] == 123456789
    assert out["first_name"] == "John"
    assert out["last_name"] == "Doe"
    assert out["username"] == "johndoe"
    assert out["language_code"] == "en"
    assert out["is_premium"] is True
    assert out["photo_url"] == "https://t.me/i/userpic/123.jpg"
    assert out["allows_write_to_pm"] is True


def test_build_tg_requisites_camel_case():
    user = {
        "id": 111,
        "firstName": "Jane",
        "lastName": "",
        "languageCode": "ru",
        "isPremium": True,
    }
    out = build_tg_requisites(user)
    assert out["id"] == 111
    assert out["first_name"] == "Jane"
    assert out["last_name"] == ""
    assert out["language_code"] == "ru"
    assert out["is_premium"] is True


def test_build_tg_requisites_skips_none_and_extra():
    user = {"id": 1, "first_name": "A", "unknown_key": "ignored", "last_name": None}
    out = build_tg_requisites(user)
    assert "id" in out
    assert "first_name" in out
    assert "unknown_key" not in out
    assert "last_name" not in out
