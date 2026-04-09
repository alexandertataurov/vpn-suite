# CRM Lifecycle Automations v1

**Status:** Proposed  
**Audience:** Growth, CRM, Product, Analytics, Backend

---

## 1. Purpose

This document defines automated lifecycle communications and offer sequencing for VPN Suite.

These journeys exist to increase activation, conversion, retention, and win-back. They are not permission to send noisy nonsense at random intervals like a hyperactive toaster.

---

## 2. Communication channels

Primary channels:
- Telegram bot message
- Mini App in-app banners/cards
- Optional email if enabled later

Every automation must support:
- locale,
- suppression windows,
- frequency caps,
- experiment buckets,
- attribution tags,
- deep links into the exact intended screen.

---

## 3. Journey matrix

| Journey | Trigger | Goal | Primary CTA |
|---|---|---|---|
| new user education | auth without entitlement | move to plan/trial | choose plan / start trial |
| checkout recovery | invoice created but unpaid | complete purchase | continue payment |
| trial nurture | trial started | reach activation and paid conversion | connect now / upgrade |
| activation rescue | entitlement exists but no successful connection | first successful connection | finish setup |
| renewal reminder | renewal approaching | reduce surprise churn | manage subscription |
| payment failure recovery | failed renewal payment | restore access | retry payment |
| grace countdown | grace active | recover before revocation | restore access |
| cancel save | cancellation intent | deflect churn | accept offer / pause |
| win-back | churned user | recover revenue | restore connection |
| referral growth | active satisfied user | acquire new users | invite friends |
| expansion upsell | contextual trigger | increase ARPU | upgrade plan |

---

## 4. Core journeys

### 4.1 Checkout recovery

**Trigger:** invoice_created and no payment_completed within threshold.

**Sequence:**
- T+15m: reminder with payment resume link
- T+12h: benefit-framed reminder
- T+24h: optional promo or friction-reduction message if eligible

**Stop conditions:**
- payment completed
- invoice expired and no resume allowed
- user suppressed from commercial messaging

### 4.2 Trial nurture

**Trigger:** trial_started

**Sequence:**
- D0: welcome + connect first device
- D1: value reinforcement + usage tips
- D{n-1}: expiry reminder + paid conversion CTA
- Dn: trial ended + preserve settings / upgrade now
- Dn+2: limited win-back style trial conversion if still inactive

### 4.3 Activation rescue

**Trigger:** entitlement active and no successful connection within 20 minutes or after 2 failed setup attempts.

**Sequence:**
- immediate in-app rescue card
- bot message with exact setup path
- support handoff prompt after repeated failure

### 4.4 Grace recovery

**Trigger:** grace_started

**Sequence:**
- immediate: access in grace with countdown
- midpoint: restore reminder
- 24h before grace end: urgent restore CTA
- grace end: access ended + restore deep link

### 4.5 Cancel save

**Trigger:** user begins cancellation flow

**Sequence:**
- offer chosen by cancel reason
- if declined, final confirmation and pause alternative
- post-cancel confirmation includes easy restore path

### 4.6 Win-back

**Trigger:** access revoked after grace or voluntary cancellation cooldown reached.

**Sequence:**
- D3: restore your setup in one tap
- D10: targeted price/value offer
- D21: final recovery attempt before long suppression

---

## 5. Offer decision logic

Every automated offer must pass these gates:
1. eligibility by plan and lifecycle stage,
2. no overlapping stronger offer in cooldown window,
3. no repeated dismissal above threshold,
4. experiment assignment,
5. margin floor approval.

---

## 6. CRM event contract

Minimum required events:
- auth_completed
- plan_viewed
- invoice_created
- invoice_abandoned
- payment_completed
- trial_started
- device_issue_started
- connect_confirmed
- payment_failed
- grace_started
- cancellation_started
- cancellation_completed
- subscription_expired
- referral_sent
- referral_reward_applied
- offer_shown
- offer_accepted
- offer_dismissed

---

## 7. KPI targets

- checkout recovery conversion
- trial -> paid conversion
- activation rescue recovery rate
- grace recovery rate
- cancel deflection rate
- win-back reactivation rate
- referral share rate
- commercial unsubscribe / suppression rate

---

## 8. Governance rules

- One primary CTA per message.
- No stacking multiple unrelated offers in one touchpoint.
- Technical issue journeys suppress aggressive upsell unless the issue is resolved.
- Premium pricing tests require finance signoff if margin risk exists.
- Each journey owner must review performance weekly.
