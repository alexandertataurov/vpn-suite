# Admin Panel State Model

**Status:** Proposed  
**Audience:** Admin Panel, Support, Ops, Product, QA  
**Scope:** subscription inspection, access overrides, billing/event ledgers, devices, referrals, churn, funnel visibility

---

## 1. Purpose

This document defines the admin/operator surface required to support the new business logic model.

Operators should be able to answer basic questions without spelunking three services and a database dump like caffeinated cave explorers.

---

## 2. Core Principles

1. Show split state dimensions directly.
2. Make recovery and support actions explicit.
3. Preserve immutable ledgers for audit.
4. Show connection/device state in user-friendly terms.
5. Expose retention and referral context, not just payment rows.

---

## 3. Subscription Inspection

Admin must show these fields separately:

| Group | Fields |
|---|---|
| Commercial | `subscription_status`, `valid_from`, `valid_until`, `plan_id` |
| Access | `access_status`, `grace_until`, `paused_at`, `paused_reason` |
| Billing | `billing_status`, latest payment, provider state |
| Renewal | `renewal_status`, `cancel_at_period_end` |
| Retention | latest churn reason, offer shown, offer accepted |
| Rewards | `accrued_bonus_days`, pending referral rewards |

### Required quick actions
- enter grace,
- clear grace,
- pause access,
- resume access,
- block access,
- restore subscription,
- inspect payment ledger,
- inspect entitlement ledger.

---

## 4. Payment and Entitlement Ledgers

### Payment ledger view must show
- payment id,
- provider,
- status,
- amount,
- invoice opened timestamp,
- completed timestamp,
- failure reason,
- webhook processing history.

### Entitlement ledger view must show
- event type,
- effective timestamp,
- actor/source,
- affected subscription,
- change summary.

### Event types to display
- `subscription_activated`
- `subscription_renewed`
- `subscription_extended`
- `grace_started`
- `grace_converted`
- `access_paused`
- `access_resumed`
- `access_blocked`
- `referral_reward_accrued`
- `referral_reward_applied`
- `promo_applied`

---

## 5. Device Inspection

Admin must show for each device:
- name,
- platform,
- current server,
- last handshake,
- last connection confirmation,
- display status,
- revoked timestamp if applicable,
- replacement history.

### Required actions
- revoke device,
- reissue config,
- inspect slot usage,
- inspect server switch history.

---

## 6. Referral Visibility

Admin must distinguish between:
- reward accrued,
- reward pending,
- reward applied.

### Required fields
- referral code,
- referrer,
- referee,
- source channel,
- reward days,
- pending reward days,
- reward applied timestamp.

This matters because “it’s somewhere in the system probably” is not a support answer. It is a ritual for summoning follow-up tickets.

---

## 7. Churn and Retention

Admin must show:
- churn reason group,
- churn reason code,
- free text,
- offer shown,
- offer accepted,
- final action: paused / cancelled / retained.

### Support use cases
- identify pricing-sensitive users,
- identify product-quality complaints,
- check whether save offers were actually surfaced,
- measure pause vs cancel outcomes.

---

## 8. Funnel Visibility

Minimum operator dashboard should include:
- plan view to invoice create conversion,
- invoice open to payment complete conversion,
- payment complete to first device issue conversion,
- device issue to connect confirmed conversion,
- trial to paid conversion,
- grace recovery conversion,
- cancel started to retained conversion.

---

## 9. Permissions

### Recommended admin roles
| Role | Capabilities |
|---|---|
| support_readonly | inspect user, payments, devices, churn |
| support_operator | apply grace, pause/resume, revoke device |
| billing_operator | inspect and reconcile payments |
| super_admin | full override access |

All admin write actions should be audited with actor, timestamp, and justification.

---

## 10. Acceptance Criteria

This spec is implemented when:
- operators can inspect split state without database access,
- payment and entitlement ledgers are visible,
- device history and slot usage are visible,
- referral pending vs applied rewards are distinguishable,
- churn reason and retention outcome are visible,
- admin actions are permissioned and audited.


## Growth console addendum

Admin panel must expose monetization and retention control surfaces.

### Required views
- offer campaigns and status
- upsell acceptance by trigger
- save-offer performance by cancel reason
- grace recovery funnel
- trial conversion funnel
- referral funnel and abuse review
- promo ROI dashboard
- win-back cohorts

### Required inspection data per user
- offers shown
- offers suppressed and why
- promo validation results
- referral reward accrual and application state
- current eligibility for upgrade / save / win-back campaigns
