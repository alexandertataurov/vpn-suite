"""Send a one-off Russian donation offer + Telegram Stars invoice to a specific user.

Usage (from repo root):
  python -m bot.scripts.send_test_stars_offer --tg-id 504047 --stars 10
  python -m bot.scripts.send_test_stars_offer --tg-id 504047 --plan-id <PLAN_ID>   # legacy: plan-priced

Required env:
  BOT_TOKEN   - Telegram bot token
  PANEL_URL   - Admin API base URL (default: http://admin-api:8000)
  BOT_API_KEY - X-API-Key for /api/v1/bot/* endpoints
"""

from __future__ import annotations

import argparse
import asyncio
import os
from pathlib import Path
import uuid

import httpx
from aiogram import Bot
from aiogram.types import LabeledPrice


RU_OFFER_TEXT = (
    "Если вам нравится сервис — поддержите проект донатом.\n\n"
    "Это помогает оплачивать серверы и развивать продукт.\n\n"
    "Выберите сумму доната ниже."
)


def _require_env(key: str) -> str:
    value = (os.environ.get(key, "") or "").strip()
    if not value:
        raise SystemExit(f"Missing required env: {key}")
    return value


def _maybe_load_dotenv(dotenv_path: Path) -> None:
    """Best-effort load KEY=VALUE lines from .env without executing it as a shell script."""
    if os.environ.get("BOT_TOKEN") and os.environ.get("BOT_API_KEY"):
        return
    if not dotenv_path.exists():
        return
    try:
        for raw in dotenv_path.read_text(encoding="utf-8").splitlines():
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip("'").strip('"')
            if not key:
                continue
            os.environ.setdefault(key, value)
    except Exception:
        return


async def _create_invoice(*, panel_url: str, api_key: str, tg_id: int, plan_id: str) -> dict:
    url = panel_url.rstrip("/") + "/api/v1/bot/payments/telegram_stars/create-invoice"
    headers = {"X-API-Key": api_key, "Idempotency-Key": str(uuid.uuid4())}
    body = {"tg_id": tg_id, "plan_id": plan_id}
    async with httpx.AsyncClient(timeout=20.0) as client:
        r = await client.post(url, json=body, headers=headers)
        if r.status_code != 200:
            raise SystemExit(f"Create-invoice failed: {r.status_code} {r.text}")
        data = r.json()
        if not isinstance(data, dict):
            raise SystemExit("Create-invoice returned non-object JSON")
        return data


async def _create_donation_invoice(*, panel_url: str, api_key: str, tg_id: int, star_count: int) -> dict:
    url = panel_url.rstrip("/") + "/api/v1/bot/payments/telegram_stars/create-donation-invoice"
    headers = {"X-API-Key": api_key, "Idempotency-Key": str(uuid.uuid4())}
    body = {"tg_id": tg_id, "star_count": int(star_count)}
    async with httpx.AsyncClient(timeout=20.0) as client:
        r = await client.post(url, json=body, headers=headers)
        if r.status_code != 200:
            raise SystemExit(f"Create-donation-invoice failed: {r.status_code} {r.text}")
        data = r.json()
        if not isinstance(data, dict):
            raise SystemExit("Create-donation-invoice returned non-object JSON")
        return data


async def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--tg-id", type=int, required=True)
    parser.add_argument("--stars", type=int, default=0, help="Donation amount in Stars (XTR).")
    parser.add_argument("--menu", action="store_true", help="Send donation menu (100/200/300/custom) instead of invoice.")
    parser.add_argument("--plan-id", type=str, default="", help="Legacy: invoice from plan price.")
    parser.add_argument(
        "--text",
        type=str,
        default=RU_OFFER_TEXT,
        help="Message text (Russian by default).",
    )
    args = parser.parse_args()

    _maybe_load_dotenv(Path.cwd() / ".env")
    bot_token = _require_env("BOT_TOKEN")
    panel_url = (os.environ.get("PANEL_URL", "http://admin-api:8000") or "").strip()
    api_key = _require_env("BOT_API_KEY")

    if args.menu:
        from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup

        bot = Bot(token=bot_token)
        try:
            kb = InlineKeyboardMarkup(
                inline_keyboard=[
                    [
                        InlineKeyboardButton(text="150 ⭐", callback_data="donate:150"),
                        InlineKeyboardButton(text="250 ⭐", callback_data="donate:250"),
                        InlineKeyboardButton(text="350 ⭐", callback_data="donate:350"),
                    ],
                    [InlineKeyboardButton(text="Другая сумма", callback_data="donate:custom")],
                ]
            )
            await bot.send_message(chat_id=args.tg_id, text=args.text, reply_markup=kb)
        finally:
            await bot.session.close()
        return

    if int(args.stars or 0) > 0:
        invoice = await _create_donation_invoice(
            panel_url=panel_url,
            api_key=api_key,
            tg_id=args.tg_id,
            star_count=int(args.stars),
        )
    else:
        plan_id = (args.plan_id or "").strip()
        if not plan_id:
            raise SystemExit("Either --stars > 0 or --plan-id must be provided")
        invoice = await _create_invoice(panel_url=panel_url, api_key=api_key, tg_id=args.tg_id, plan_id=plan_id)
    star_count = int(invoice.get("star_count") or 0)
    payload = str(invoice.get("payload") or "")
    title = str(invoice.get("title") or "VPN")
    description = str(invoice.get("description") or "Donation")

    if not payload:
        raise SystemExit("Invalid invoice: missing payload")
    if star_count <= 0:
        raise SystemExit("Invalid invoice: star_count must be > 0 (pick a paid plan)")

    bot = Bot(token=bot_token)
    try:
        await bot.send_message(chat_id=args.tg_id, text=args.text)
        await bot.send_invoice(
            chat_id=args.tg_id,
            title=title[:32],
            description=description[:255],
            payload=payload[:128],
            provider_token="",
            currency="XTR",
            prices=[LabeledPrice(label=title[:32] or "VPN", amount=max(1, star_count))],
        )
    finally:
        await bot.session.close()


if __name__ == "__main__":
    asyncio.run(main())
