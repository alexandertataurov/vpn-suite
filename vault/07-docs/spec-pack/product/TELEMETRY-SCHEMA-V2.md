# Telemetry Schema v2

**Status:** Proposed  
**Audience:** Product, Analytics, Frontend, Backend, QA  
**Scope:** Mini App, Telegram Bot entrypoints, billing funnel, onboarding funnel, device lifecycle, retention, referrals

---

## 1. Purpose

This document defines the required telemetry model for VPN Suite v2.

The goal is to measure the whole consumer funnel end to end, not just broad page views and wishful thinking. The product needs to know exactly where users stall:
- before invoice open,
- after payment,
- during config delivery,
- before connection confirmation,
- inside churn and restore flows.

---

## 2. Principles

1. **Every step with business impact must emit an event.**
2. **Payloads must be stable and typed.**
3. **Events must be attributable to route, user state, and commercial context.**
4. **Names should describe user behavior, not implementation noise.**
5. **Telemetry must support funnel analysis, retention analysis, and support debugging.**

---

## 3. Event Families

### 3.1 App lifecycle
- `dashboard_open`
- `screen_open`
- `cta_click`
- `web_vital`

### 3.2 Onboarding
- `onboarding_started`
- `onboarding_step_viewed`
- `onboarding_step_completed`
- `onboarding_abandoned`
- `connect_confirmed`

### 3.3 Billing
- `pricing_view`
- `plan_selected`
- `checkout_viewed`
- `invoice_created`
- `invoice_opened`
- `invoice_abandoned`
- `payment_completed`
- `renewal_completed`
- `payment_failed`

### 3.4 Trial
- `trial_started`
- `trial_device_issued`
- `trial_expiring_soon`
- `trial_converted`

### 3.5 Devices
- `device_issue_started`
- `device_issue_success`
- `device_issue_failed`
- `config_downloaded`
- `qr_opened`
- `device_revoked`
- `server_switched`

### 3.6 Retention / churn
- `cancel_flow_started`
- `cancel_reason_selected`
- `retention_offer_shown`
- `retention_offer_accepted`
- `pause_selected`
- `grace_started`
- `grace_converted`
- `winback_clicked`

### 3.7 Referrals / promos
- `referral_link_viewed`
- `referral_signup_attributed`
- `referral_reward_accrued`
- `referral_reward_applied`
- `promo_validated`
- `promo_applied`
- `promo_rejected`

### 3.8 Monetization / growth
- `upsell_impression`
- `upsell_clicked`
- `upsell_dismissed`
- `upgrade_completed`
- `downgrade_selected`
- `annual_switch_viewed`
- `annual_switch_completed`
- `add_on_selected`
- `save_offer_shown`
- `save_offer_declined`
- `winback_offer_shown`
- `winback_offer_accepted`
- `crm_message_sent`
- `crm_message_clicked`

---

## 4. Global Payload Contract

Every event must include these fields unless explicitly impossible:

```json
{
  "event": "device_issue_success",
  "ts": "2026-03-07T12:00:00Z",
  "user_id": "usr_...",
  "session_id": "sess_...",
  "subscription_id": "sub_...",
  "payment_id": null,
  "device_id": "dev_...",
  "screen": "/devices/issue",
  "source": "miniapp",
  "app_version": "2.4.0",
  "platform": "ios",
  "meta": {}
}
```

### Required field meanings

| Field | Meaning |
|---|---|
| `event` | canonical event name |
| `ts` | UTC timestamp in ISO-8601 |
| `user_id` | internal user identifier |
| `session_id` | front-end session or analytics session identifier |
| `subscription_id` | current subscription if present |
| `payment_id` | current payment if relevant |
| `device_id` | current device if relevant |
| `screen` | route where event fired |
| `source` | `miniapp`, `bot`, `backend`, `admin` |
| `app_version` | frontend or service version |
| `platform` | `ios`, `android`, `desktop`, `web`, `unknown` |
| `meta` | event-specific typed payload |

---

## 5. Event Definitions

## 5.1 App lifecycle

### `screen_open`
Emitted on route entry once per visible screen load.

```json
{
  "event": "screen_open",
  "screen": "/plan",
  "meta": {
    "referrer_screen": "/",
    "route_reason": "no_subscription"
  }
}
```

### `cta_click`
Emitted for meaningful commercial or connection-related CTAs.

```json
{
  "event": "cta_click",
  "screen": "/restore-access",
  "meta": {
    "cta_id": "restore_now",
    "cta_group": "recovery"
  }
}
```

---

## 5.2 Onboarding

### `onboarding_started`
Fire when the state-driven onboarding begins.

```json
{
  "event": "onboarding_started",
  "screen": "/devices/issue",
  "meta": {
    "entry_state": "paid_no_device",
    "onboarding_version": "v2"
  }
}
```

### `onboarding_step_viewed`

```json
{
  "event": "onboarding_step_viewed",
  "meta": {
    "step": "choose_device",
    "step_order": 1
  }
}
```

### `onboarding_step_completed`

```json
{
  "event": "onboarding_step_completed",
  "meta": {
    "step": "get_config",
    "step_order": 2,
    "delivery_method": "qr"
  }
}
```

### `onboarding_abandoned`
Fire from backend job or inactivity rules, not just client unload.

```json
{
  "event": "onboarding_abandoned",
  "meta": {
    "last_completed_step": "choose_device",
    "idle_minutes": 45
  }
}
```

### `connect_confirmed`

```json
{
  "event": "connect_confirmed",
  "meta": {
    "method": "manual_confirm",
    "handshake_detected": true,
    "minutes_since_payment": 3
  }
}
```

---

## 5.3 Billing

### `pricing_view`

```json
{
  "event": "pricing_view",
  "screen": "/plan",
  "meta": {
    "had_trial_before": false,
    "current_access_status": "blocked"
  }
}
```

### `plan_selected`

```json
{
  "event": "plan_selected",
  "meta": {
    "plan_id": "pro_monthly",
    "duration_days": 30,
    "device_limit": 3,
    "price_amount": 399,
    "currency": "XTR"
  }
}
```

### `checkout_viewed`

```json
{
  "event": "checkout_viewed",
  "meta": {
    "plan_id": "pro_monthly",
    "promo_code": "SPRING7",
    "discount_amount": 50
  }
}
```

### `invoice_created`

```json
{
  "event": "invoice_created",
  "payment_id": "pay_...",
  "meta": {
    "provider": "telegram_stars",
    "plan_id": "pro_monthly"
  }
}
```

### `invoice_opened`

```json
{
  "event": "invoice_opened",
  "payment_id": "pay_...",
  "meta": {
    "provider": "telegram_stars"
  }
}
```

### `invoice_abandoned`

```json
{
  "event": "invoice_abandoned",
  "payment_id": "pay_...",
  "meta": {
    "idle_minutes": 20
  }
}
```

### `payment_completed`

```json
{
  "event": "payment_completed",
  "payment_id": "pay_...",
  "meta": {
    "plan_id": "pro_monthly",
    "amount": 399,
    "currency": "XTR"
  }
}
```

### `payment_failed`

```json
{
  "event": "payment_failed",
  "payment_id": "pay_...",
  "meta": {
    "provider": "telegram_stars",
    "failure_reason": "expired_invoice"
  }
}
```

---

## 5.4 Trial

### `trial_started`

```json
{
  "event": "trial_started",
  "meta": {
    "plan_id": "trial_3d",
    "duration_days": 3
  }
}
```

### `trial_device_issued`

```json
{
  "event": "trial_device_issued",
  "device_id": "dev_...",
  "meta": {
    "server_id": "srv_eu_01"
  }
}
```

### `trial_expiring_soon`

```json
{
  "event": "trial_expiring_soon",
  "meta": {
    "hours_left": 24
  }
}
```

### `trial_converted`

```json
{
  "event": "trial_converted",
  "payment_id": "pay_...",
  "meta": {
    "converted_plan_id": "pro_monthly"
  }
}
```

---

## 5.5 Devices

### `device_issue_started`

```json
{
  "event": "device_issue_started",
  "meta": {
    "platform": "ios",
    "selected_mode": "auto_server"
  }
}
```

### `device_issue_success`

```json
{
  "event": "device_issue_success",
  "device_id": "dev_...",
  "meta": {
    "server_id": "srv_eu_01",
    "config_variant": "amnezia_qr"
  }
}
```

### `device_issue_failed`

```json
{
  "event": "device_issue_failed",
  "meta": {
    "reason": "slot_limit_reached"
  }
}
```

### `config_downloaded`

```json
{
  "event": "config_downloaded",
  "device_id": "dev_...",
  "meta": {
    "delivery_method": "file"
  }
}
```

### `qr_opened`

```json
{
  "event": "qr_opened",
  "device_id": "dev_...",
  "meta": {
    "config_variant": "amnezia_qr"
  }
}
```

### `device_revoked`

```json
{
  "event": "device_revoked",
  "device_id": "dev_...",
  "meta": {
    "reason": "slot_replacement"
  }
}
```

### `server_switched`

```json
{
  "event": "server_switched",
  "device_id": "dev_...",
  "meta": {
    "from_server_id": "srv_eu_01",
    "to_server_id": "srv_tr_02"
  }
}
```

---

## 5.6 Retention / churn

### `cancel_flow_started`

```json
{
  "event": "cancel_flow_started",
  "meta": {
    "subscription_status": "active",
    "access_status": "enabled"
  }
}
```

### `cancel_reason_selected`

```json
{
  "event": "cancel_reason_selected",
  "meta": {
    "reason_group": "too_expensive",
    "reason_code": "price_high"
  }
}
```

### `retention_offer_shown`

```json
{
  "event": "retention_offer_shown",
  "meta": {
    "offer_type": "discount",
    "offer_code": "SAVE20"
  }
}
```

### `retention_offer_accepted`

```json
{
  "event": "retention_offer_accepted",
  "meta": {
    "offer_type": "pause"
  }
}
```

### `pause_selected`

```json
{
  "event": "pause_selected",
  "meta": {
    "pause_reason": "temporary_break"
  }
}
```

### `grace_started`

```json
{
  "event": "grace_started",
  "meta": {
    "grace_hours": 48,
    "reason": "renewal_failed"
  }
}
```

### `grace_converted`

```json
{
  "event": "grace_converted",
  "payment_id": "pay_...",
  "meta": {
    "hours_before_expiry": 5
  }
}
```

### `winback_clicked`

```json
{
  "event": "winback_clicked",
  "screen": "/restore-access",
  "meta": {
    "entry_point": "locked_dashboard"
  }
}
```

---

## 5.7 Referrals / promos

### `referral_signup_attributed`

```json
{
  "event": "referral_signup_attributed",
  "meta": {
    "referral_code": "REF123",
    "source_channel": "bot_start"
  }
}
```

### `referral_reward_accrued`

```json
{
  "event": "referral_reward_accrued",
  "meta": {
    "reward_days": 7,
    "pending_reward_days": 7
  }
}
```

### `referral_reward_applied`

```json
{
  "event": "referral_reward_applied",
  "meta": {
    "applied_days": 7,
    "subscription_id": "sub_..."
  }
}
```

### `promo_validated`

```json
{
  "event": "promo_validated",
  "meta": {
    "promo_code": "SPRING7",
    "valid": true
  }
}
```

### `promo_applied`

```json
{
  "event": "promo_applied",
  "payment_id": "pay_...",
  "meta": {
    "promo_code": "SPRING7",
    "discount_amount": 50
  }
}
```

---

## 6. Derived Funnels and KPIs

### Core funnels
1. `pricing_view -> plan_selected -> checkout_viewed -> invoice_created -> invoice_opened -> payment_completed`
2. `payment_completed -> device_issue_success -> connect_confirmed`
3. `trial_started -> trial_device_issued -> trial_converted`
4. `grace_started -> winback_clicked -> payment_completed -> grace_converted`
5. `cancel_flow_started -> retention_offer_shown -> retention_offer_accepted`

### Minimum KPI set
- plan view to invoice creation conversion,
- invoice creation to invoice open conversion,
- invoice open to payment completion conversion,
- payment completion to first device issued conversion,
- device issued to connected conversion,
- trial to paid conversion,
- grace recovery conversion,
- cancel-started to retained conversion,
- referral-attributed to reward-applied conversion.

---

## 7. QA Rules

Telemetry is only considered valid when:
- each primary route fires `screen_open`,
- checkout always fires `checkout_viewed` before invoice creation,
- `payment_completed` is emitted once per successful payment,
- `connect_confirmed` is emitted only after explicit confirmation or verified handshake signal,
- retention events include `reason_group` or `offer_type` when applicable,
- backend retries do not create duplicate canonical events.

---

## 8. Implementation Notes

### Client responsibilities
- route-aware event emission,
- CTA instrumentation,
- session identifiers,
- event buffering for flaky mobile conditions.

### Backend responsibilities
- authoritative payment and entitlement events,
- abandonment inference jobs,
- dedupe and idempotency control,
- warehouse-ready export.

### Analytics responsibilities
- maintain funnel dashboards,
- version events carefully,
- avoid silent schema drift. Silent schema drift is how dashboards become decorative fiction.
