#!/usr/bin/env python3
"""Backfill referral rewards for eligible referrals (reward_applied_at IS NULL, referee paid)."""

from __future__ import annotations

import argparse
import asyncio

from sqlalchemy import select

from app.core.database import async_session_factory
from app.models import Payment, Referral
from app.services.referral_service import grant_referral_reward


async def main() -> int:
    parser = argparse.ArgumentParser(
        description="Grant referral rewards to eligible unrewarded referrals."
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Log what would be granted; do not commit.",
    )
    parser.add_argument(
        "--confirm",
        action="store_true",
        help="Required to run with commits. Pass: --confirm backfill referral rewards",
    )
    args = parser.parse_args()

    if not args.dry_run and not args.confirm:
        print("Use --dry-run to preview, or --confirm to execute with commits.")
        return 1

    async with async_session_factory() as session:
        # Eligible: reward_applied_at IS NULL and referee has completed payment
        stmt = (
            select(Referral)
            .where(
                Referral.reward_applied_at.is_(None),
                Referral.referee_user_id.in_(
                    select(Payment.user_id).where(Payment.status == "completed").distinct()
                ),
            )
            .order_by(Referral.created_at.asc())
        )
        result = await session.execute(stmt)
        rows = result.scalars().all()
        count = len(rows)

        print(f"Eligible referrals: {count}")

        if count == 0:
            print("Nothing to backfill.")
            return 0

        granted = 0
        for ref in rows:
            print(
                f"  referral_id={ref.id} referrer={ref.referrer_user_id} referee={ref.referee_user_id}"
            )
            if args.dry_run:
                granted += 1
                continue
            processed, _ = await grant_referral_reward(session, ref.id)
            if processed:
                granted += 1
                await session.commit()

        if args.dry_run:
            print(f"Dry-run: would grant {granted} referral rewards.")
        else:
            print(f"Granted {granted} referral rewards.")
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
