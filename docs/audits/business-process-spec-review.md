# Business Process Spec Review (vpn-suite-specs)

**Date:** 2026-03-07  
**Specs:** [vpn-suite-specs/docs/product/VPN-SUITE-BUSINESS-LOGIC-USERFLOWS-SPEC-V2.md](../vpn-suite-specs/docs/product/VPN-SUITE-BUSINESS-LOGIC-USERFLOWS-SPEC-V2.md), [GROWTH-MONETIZATION-SPEC.md](../vpn-suite-specs/docs/product/GROWTH-MONETIZATION-SPEC.md), [MINIAPP-ROUTING-SPEC.md](../vpn-suite-specs/docs/frontend/MINIAPP-ROUTING-SPEC.md)

---

## Verdict: **Aligned with minor gaps**

Implementation matches the spec’s §16 acceptance criteria and the main business rules. Remaining items are telemetry refinements and one optional route.

---

## 1. Spec alignment (what’s done)

| Spec area | Implementation | Notes |
|-----------|----------------|-------|
| **§4.2 State separation** | `subscription_status`, `access_status`, `billing_status`, `renewal_status` in model and `/me` | Split state used in routing and admin. |
| **§6.1 Grace** | `grace_on_expiry_task`: sets expired+grace on `valid_until` pass; blocks when `grace_until` passes. `GRACE_WINDOW_HOURS` in config. | Emits `grace_started`, `access_blocked`. Legacy `status` set to `expired` when applying grace. |
| **§6.2 Referral** | `pending_reward_days`; apply on next activation in `payment_webhook_service`. | Accrues when referrer has no active sub. |
| **§6.4 Cancellation** | `GET /subscription/offers?reason_group=`; `offer_pause`, `offer_discount`, `offer_downgrade`; cancel supports `reason_group`, `pause_instead`, `cancel_at_period_end`. | Reason→offer mapping matches spec table. |
| **§7.2–7.3 Routing** | `_resolve_route()` in webapp; `recommended_route` in `/webapp/me`; BootstrapController redirects. | Routes: `/plan`, `/devices/issue`, `/connect-status`, `/`, `/restore-access`, `/account/subscription` (for cancel_at_period_end). |
| **§8.2 Onboarding** | 3 outcome steps (choose device, get config, confirm connected); `POST /webapp/devices/:id/confirm-connected`. | Step IDs and confirm flow align. |
| **§8.3 Checkout** | Pre-invoice confirmation: plan, price, duration, devices, renewal, promo. | Two-step flow before opening invoice. |
| **§10 Payment/Entitlement ledgers** | `PaymentEvent` and `EntitlementEvent` written in webhook and entitlement_service. | Immutable audit trail. |
| **§13 Admin** | Billing: subscription_status, access_status, grace_until; Set/Clear grace; Entitlement events; Cancellation reasons. | Split state and grace actions exposed. |
| **§14.1 Backfill** | `backend/scripts/backfill_subscription_state.py` maps legacy `status` → subscription_status/access_status. | Run once after deploy. |
| **First device after payment (§8.3)** | Implemented via routing: after payment, `recommended_route` = `/devices/issue`. | No backend auto-issue; UX is one-step to issue. |
| **Referral source_channel (§9)** | Optional `source_channel` on `Referral` model. | For analytics; add DB column via migration if not present. |
| **Route `/account/subscription`** | Backend returns this route for cancel_at_period_end; frontend redirects to `/plan`. | Intentional simplification: Plan page covers subscription state. See [providers.tsx](../../frontend/miniapp/src/app/providers.tsx). |
| **Referral API** | Spec §9.1 lists `GET /webapp/referral/status`; impl uses `/referral/my-link` + `/referral/stats`. | Surface differs; acceptable. Both provide status/stats for referral page. |

---

## 2. Fix applied during review

- **Grace task legacy status:** When moving a subscription to expired+grace, the code now sets `sub.status = "expired"` (was `"active"`) so legacy `status` matches `subscription_status` and downstream logic is consistent.

---

## 3. Minor gaps (non-blocking)

| Gap | Spec reference | Status |
|-----|----------------|----------------|
| **Telemetry events** | §11.2: `device_issue_started`, `qr_opened`, `grace_converted` | Implemented: device_issue_started on issue CTA; grace_converted in payment webhook when restoring from grace. Miniapp uses copy/download (no QR display); qr_opened N/A for current config flow. |
| **Route `/account/subscription`** | §7.3: “cancelled but still active until period end” → `/account/subscription` | Resolved: Redirect to /plan intentional; Plan covers subscription state. |
| **Referral API** | §9.1 GET /webapp/referral/status | Resolved: Impl uses /referral/my-link + /referral/stats; acceptable. |
| **Referral `source_channel` DB column** | §4.3 Referral entity | Model has the field; ensure migration adds `referrals.source_channel` if not already applied. |

---

## 4. Checklist (§16) — all satisfied

- [x] Subscription state split (commercial, access, billing, renewal)
- [x] Grace with explicit `grace_until`; auto-set on expiry via worker
- [x] State-driven first-run routing
- [x] Onboarding outcome-based; ends with connection confirmation
- [x] Checkout confirmation layer before invoice
- [x] Device slot replacement and connection-centric actions (APIs + Devices UX)
- [x] Cancellation reason-aware and offer-driven
- [x] Referral rewards accrue without active referrer sub
- [x] Payment and entitlement event ledgers
- [x] Telemetry for onboarding, billing, connection, retention (core events; optional refinement above)

---

## 5. References

- In-repo summary: [BUSINESS_LOGIC_AND_USER_JOURNEYS.md](BUSINESS_LOGIC_AND_USER_JOURNEYS.md) §6 Spec alignment
- Grace task: [backend/app/core/grace_on_expiry_task.py](../../backend/app/core/grace_on_expiry_task.py)
- Backfill script: [backend/scripts/backfill_subscription_state.py](../../backend/scripts/backfill_subscription_state.py)
- Webapp routing: [backend/app/api/v1/webapp.py](../../backend/app/api/v1/webapp.py) `_resolve_route`
