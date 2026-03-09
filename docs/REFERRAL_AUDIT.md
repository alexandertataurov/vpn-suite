# REFERRAL FIX REPORT

## Phase 0: Root Cause Confirmed; Trigger Point Identified

### Referral DB Schema (table `referrals`)

| Column | Type | Notes |
|--------|------|-------|
| id | String(32), PK | uuid4_hex |
| referrer_user_id | BigInteger, FK users | referrer |
| referee_user_id | BigInteger, FK users | referred user |
| referral_code | String(64) | numeric (user id) |
| status | String(32), default "pending" | pending, rewarded, pending_reward |
| reward_days | Integer, default 7 | configurable |
| pending_reward_days | Integer, default 0 | stored when referrer has no active sub |
| reward_applied_at | DateTime(timezone), nullable | idempotency guard |
| source_channel | String(64), nullable | |
| created_at | DateTime | |

### Recording Trigger

- **File:** `backend/app/api/v1/webapp.py`
- **Function:** `webapp_referral_attach` (lines ~1359–1438)
- **Endpoint:** `POST /api/v1/webapp/referral/attach`
- **Also:** `backend/app/api/v1/bot.py` `referral_attach` (lines 462–515)

### Extension Function

No dedicated extension function. Subscription extension is inline in `_apply_payment_success_effects` via `sub.valid_until = base + timedelta(days=N)`.

### Reward Call Site

- **Exists:** `backend/app/services/payment_webhook_service.py` `_apply_payment_success_effects` (lines 114–170)
- **Logic:** Query `Referral` where `referee_user_id == payment.user_id` and `reward_applied_at IS NULL`. If referrer has active sub: extend; else: store in `pending_reward_days`.

### Idempotency Guard

- **Exists:** `reward_applied_at IS NULL` check; set on grant.
- **Missing:** `SELECT ... FOR UPDATE` lock.

### Proposed Trigger Point

- **File:** `backend/app/services/payment_webhook_service.py`
- **Function:** `_apply_payment_success_effects`
- **Event:** Referee first payment completion (via `complete_pending_payment_by_bot` or `process_payment_webhook`).
- **Gap:** (1) Referrer without active sub never receives unless they pay. (2) Config uses 7 days; task expects 14. (3) No FOR UPDATE. (4) No referrer notification.

### Dependency Graph

```
Referral record (referee_user_id) → referee pays → _apply_payment_success_effects
    → grant_referral_reward (referral_service) → extend or pending_reward_days
```

---

## REFERRAL FIX REPORT (Post-Implementation)

| Phase | Outcome |
|-------|---------|
| Phase 0 | Root cause confirmed; trigger point identified |
| Phase 1 | Idempotency column `reward_applied_at` already exists; no migration |
| Phase 2 | REFERRAL_REWARD_DAYS=14; grant_referral_reward in referral_service.py; wired in _apply_payment_success_effects |
| Phase 3 | notify_referrer_reward_granted in referral_notification.py; called on immediate grant |
| Phase 4 | test_referral_reward.py: 5 cases |
| Phase 5 | backfill_referral_rewards.py (--dry-run, --confirm) |
| Phase 6 | mypy/pytest/grep manual verification |
