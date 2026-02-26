#!/usr/bin/env python3
"""Delete all end-users and their devices (and cascaded subscriptions, payments, etc.)."""

from __future__ import annotations

import argparse
import asyncio

from sqlalchemy import delete, func, select

from app.core.database import async_session_factory
from app.models import Device, Payment, PaymentEvent, PromoRedemption, Referral, Subscription, User


async def main() -> int:
    parser = argparse.ArgumentParser(description="Clean up users and devices from DB.")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Only print counts; do not delete.",
    )
    args = parser.parse_args()

    async with async_session_factory() as session:
        # Counts
        for name, model in [("devices", Device), ("users", User)]:
            r = await session.execute(select(func.count()).select_from(model))
            print(f"{name}: {r.scalar() or 0} rows")

        if args.dry_run:
            print("Dry-run: no changes written.")
            return 0

        # Delete in FK-safe order: devices first (reference users and subscriptions),
        # then user-dependent rows, then users (cascades to subscriptions, payments, etc.).
        deleted_devices = await session.execute(delete(Device))
        print(f"Deleted {deleted_devices.rowcount} devices.")

        # Payments reference user and subscription; delete before users so we control order.
        deleted_events = await session.execute(delete(PaymentEvent))
        deleted_payments = await session.execute(delete(Payment))
        print(f"Deleted {deleted_events.rowcount} payment_events, {deleted_payments.rowcount} payments.")

        deleted_redemptions = await session.execute(delete(PromoRedemption))
        deleted_referrals = await session.execute(delete(Referral))
        print(f"Deleted {deleted_redemptions.rowcount} promo_redemptions, {deleted_referrals.rowcount} referrals.")

        deleted_subs = await session.execute(delete(Subscription))
        print(f"Deleted {deleted_subs.rowcount} subscriptions.")

        deleted_users = await session.execute(delete(User))
        print(f"Deleted {deleted_users.rowcount} users.")

        await session.commit()
        print("Done.")
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
