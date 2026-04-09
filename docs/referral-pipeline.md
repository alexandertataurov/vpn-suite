# Referral pipeline (production)

Referral attribution and attach flow for the Mini App. Backend is the source of truth; the frontend only sends a hint (`ref`). This document describes the production-grade behaviour and API contract.

## Capture (frontend)

Referral code is resolved in a **priority chain** so it survives router replace, reload, and Telegram URL quirks:

1. **launch_params** — Telegram `start_param` when the app is opened via a link (e.g. `startapp=ref_XXX` or `?start=ref_XXX` passed to Web App)
2. **query** — `?ref=` in the current URL (or `ref_XXX` normalized to `XXX`)
3. **early_capture** — value captured at module load from `window.location.search` and/or `start_param`
4. **storage** — `sessionStorage` keys `pending_referral_code`, `pending_referral_source`, `pending_referral_captured_at` as backup

On every successful read from (1)–(3), the value is written to sessionStorage. After a **terminal** attach outcome (`attached`, `already_attached`, `invalid_ref`, `self_referral_blocked`), the client clears pending ref so the same ref is not retried.

- Implementation: [apps/miniapp/src/lib/referralCapture.ts](../apps/miniapp/src/lib/referralCapture.ts), [apps/miniapp/src/hooks/useReferralAttach.ts](../apps/miniapp/src/hooks/useReferralAttach.ts)
- Attach is called **once per session** (after auth token is available); idempotency is guaranteed by the backend.

## API contract: POST /webapp/referral/attach

**Request:** Bearer token required. Body: `{ "ref": "<code>" }` (preferred) or `{ "referral_code": "<code>" }` (legacy). Code is numeric (user id) or `ref_<code>`; backend normalizes and resolves to `referrer_user_id`.

**Responses:**

| HTTP | Body | Meaning |
|------|------|--------|
| 200 | `{ "status": "attached", "referrer_user_id": <int> }` | New referral record created; referee linked to referrer. |
| 200 | `{ "status": "already_attached", "referrer_user_id": <int> }` | Referee already has a referrer; no change (idempotent). |
| 400 | `{ "status": "self_referral_blocked", ... }` | Referral code is the current user; rejected. |
| 400 | `{ "status": "invalid_ref", ... }` | Invalid or missing ref, or referrer user not found. |
| 401 | — | Invalid or missing session. |

Backend resolves ref to `referrer_user_id` and stores the link by **user id**; ref code in URLs can be rotated or reformatted later without breaking analytics.

## Backend rules (source of truth)

- **One attach per referee** — A user can be attached to at most one referrer. Existing attachment is never overwritten.
- **No self-referral** — `referrer_user_id` must not equal the current user’s id.
- **Referrer must exist** — Referral code must resolve to an existing user.
- **Idempotent** — Repeated calls with the same ref for an already-attached referee return `already_attached` and do not create duplicates.

Optional future: attach window (e.g. only within N hours of first entry) or only before first paid purchase; would add status `referral_window_expired`.

## Observability

- **Backend:** Structured logs `referral_attach_attempt` (on request) and `referral_attach_result` with `telegram_user_id`, `ref_code`, `resolved_referrer_user_id`, `attach_status`, `reason`. Metric `vpn_revenue_referral_signup_total` incremented only when `status == "attached"`.
- **Frontend (dev):** Console debug `ref_capture_source` and `attach_result` (no PII).

## Flow summary

1. Referee opens link: `t.me/<bot>?start=ref_XXX` (chat) or `t.me/<bot>?startapp=ref_XXX` (direct Mini App). Bot shows “Open App” with `MINIAPP_URL?ref=XXX` when opened from chat.
2. Mini App loads → ref captured (start_param, URL query, early capture, or sessionStorage).
3. User authenticates → `POST /webapp/auth` → session token.
4. Client calls `POST /webapp/referral/attach` with `ref: "XXX"` once.
5. Backend validates, creates or skips Referral row, returns status.
6. On terminal outcome, client clears pending ref from sessionStorage.

## Test checklist

- Ref from start_param or URL → attach → 200 `attached`; repeat → 200 `already_attached` with `referrer_user_id`.
- Ref only in sessionStorage (e.g. after clearing URL) → attach succeeds.
- Self-referral (ref = current user id) → 400 `self_referral_blocked`.
- Invalid ref (non-numeric or referrer not found) → 400 `invalid_ref`.
- After terminal outcome (attached, already_attached, invalid_ref, self_referral_blocked), pending ref is cleared from sessionStorage.

See also: [Business logic and user journeys](BUSINESS_LOGIC_AND_USER_JOURNEYS.md) §3.5 (referral reward on referee payment), §5 (data flow diagram).
