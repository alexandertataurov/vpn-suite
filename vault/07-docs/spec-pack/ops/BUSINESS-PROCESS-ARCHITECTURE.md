# Business Process Architecture v1

**Status:** Proposed  
**Audience:** Founder, Product, Growth, Ops, Support, Backend, Frontend, Finance, Analytics  
**Scope:** End-to-end operating model for VPN Suite from acquisition to retention, support, and finance reconciliation

---

## 1. Purpose

This document defines the full business process layer for VPN Suite.

The product spec explains what the system should do. This document explains how the business should run it without relying on heroic improvisation, Slack archaeology, or sacred tribal knowledge.

Primary goals:
- convert traffic into paid active users,
- activate users into real connected sessions fast,
- expand revenue through contextual monetization,
- keep churn under control with structured recovery,
- make support, finance, and analytics operate from the same truth.

---

## 2. Operating principles

1. **Single source of truth:** subscription, access, payment, device, and offer states must be machine-readable and inspectable.
2. **Connection is the core value event:** the first successful connection is the product activation milestone.
3. **Revenue is a system, not a banner:** upsell, save, and win-back flows must be embedded into lifecycle states.
4. **Support is part of growth:** support outcomes must feed product fixes, save offers, and churn analytics.
5. **Finance closes the loop:** every entitlement change must reconcile back to a payment or approved commercial action.
6. **Operators need sharp tools:** admin flows must optimize for clarity, not bureaucracy cosplay.

---

## 3. Top-level process map

| Process family | Objective | Primary owner | Key systems |
|---|---|---|---|
| Acquisition & attribution | bring qualified users | Growth | Bot, Mini App, CRM, telemetry |
| Conversion & checkout | turn intent into payment | Growth + Product | Plan pages, checkout, payment provider |
| Activation & onboarding | get user connected fast | Product | Mini App, device issuance, config delivery |
| Subscription lifecycle | maintain paid access | Product + Backend | Billing engine, access engine, CRM |
| Expansion & upsell | grow ARPU and device count | Growth | Offer engine, admin, telemetry |
| Support & save | resolve issues and prevent churn | Support | Admin, CRM, telemetry, device/server data |
| Retention & win-back | recover at-risk and churned users | Growth + CRM | Campaign engine, bot, offer engine |
| Finance & reconciliation | verify money and liability | Finance + Backend | Payment ledger, reports, admin |
| Analytics & experimentation | learn what works | Analytics + Product + Growth | Telemetry, warehouse, dashboards |

---

## 4. Lifecycle stages

| Stage | Entry condition | Exit condition | North-star metric |
|---|---|---|---|
| Visitor | user opens bot or app | auth or drop-off | auth rate |
| Evaluating | user sees plans or trial CTA | payment start / trial start / exit | plan-to-checkout CTR |
| Purchasing | invoice created | payment success / payment abandoned | checkout completion |
| Activating | entitlement exists | first successful connection | time-to-connect |
| Active | at least one successful connection in recent window | churn risk / expiry | active connected users |
| Expanding | user hits contextual expansion trigger | upsell accepted / dismissed | upsell take rate |
| At-risk | payment fail, inactivity, cancel intent, repeated issue | restored / churned | save rate |
| Churned | access ended beyond grace | win-back / dormant | win-back rate |

---

## 5. Core end-to-end business flows

### 5.1 Acquire -> Convert -> Activate

**Goal:** move new users from entry to first successful connection with minimal dead time.

**Flow:**
1. User enters via bot link, referral link, ad campaign, direct launch, or restore deep link.
2. Attribution is captured and persisted.
3. User authenticates and lands on intent-aware screen.
4. If no entitlement, user sees plan/trial decision surface.
5. User starts checkout or trial.
6. Payment/trial success creates entitlement event.
7. User is routed directly into first-device issuance.
8. Config is delivered via QR/download/copy.
9. User confirms first successful connection.
10. Home state switches from setup mode to connected mode.

**Key controls:**
- no dead-end home screen before entitlement decision,
- no generic devices list before first device is issued,
- mandatory tracking of first connection success,
- rapid fallback path to support if setup fails.

### 5.2 Active -> Expand

**Goal:** grow ARPU without sabotaging trust.

**Triggers:**
- device slot full,
- repeated server switching,
- account page visit,
- nearing renewal,
- referral engagement,
- premium region attempt.

**Flow:**
1. Trigger occurs in relevant context.
2. Offer engine checks eligibility, cooldown, suppression, and experiment bucket.
3. User sees single relevant offer.
4. User accepts, dismisses, or uses alternative path.
5. Outcome is saved to telemetry and CRM.
6. Accepted upgrade modifies subscription entitlements and billing state.

### 5.3 Issue -> Support -> Save

**Goal:** resolve connection problems before they become churn.

**Flow:**
1. User reports issue or system detects activation failure / repeated reconnects.
2. Support/admin sees device, server, last handshake, payment, and offer context.
3. Agent or self-serve flow attempts structured resolution.
4. If issue is commercial or price-linked, save flow is eligible.
5. If issue is technical, server switch / reissue / config refresh happens first.
6. Outcome is tagged: fixed, escalated, churn risk, recovered, cancelled.

### 5.4 Expiry -> Grace -> Recover / Churn

**Goal:** avoid unnecessary revenue loss after failed payment or end of term.

**Flow:**
1. Payment fails or period ends.
2. Access engine moves user to grace if eligible.
3. App and bot show restore CTA and remaining grace time.
4. CRM sequence starts with reminder and offer ladder.
5. User restores access, pauses, downgrades, or churns.
6. If grace ends without recovery, access is revoked and win-back sequence begins after cooldown.

### 5.5 Churn -> Win-back

**Goal:** recover previously paid users efficiently.

**Flow:**
1. User becomes expired/cancelled and exits grace.
2. Last server, device metadata, and commercial history are preserved.
3. User receives timed restore sequence.
4. App routes churned user to restore-access surface instead of generic plan flow.
5. Eligible users receive tailored win-back offer.
6. Recovered users re-enter activation or active state depending on preserved device validity.

---

## 6. RACI by process family

| Process | Product | Growth | Backend | Frontend | Support | Finance | Analytics |
|---|---|---|---|---|---|---|---|
| acquisition attribution | A | R | C | C | I | I | R |
| plan and checkout | A | R | C | R | I | C | C |
| entitlement creation | C | I | A/R | I | I | C | I |
| first-device activation | A | I | R | R | C | I | C |
| upsell engine | A | R | R | R | I | C | C |
| save / cancel flows | A | R | C | R | R | I | C |
| support tooling | C | I | R | R | A/R | I | C |
| reconciliation | I | I | C | I | I | A/R | C |
| experiment analysis | C | C | I | I | I | I | A/R |

**Legend:** R = Responsible, A = Accountable, C = Consulted, I = Informed

---

## 7. Required process artifacts

Every production release touching lifecycle logic must maintain these artifacts:
- state machine spec,
- routing spec,
- offer catalog and eligibility rules,
- CRM journey matrix,
- support playbooks,
- finance reconciliation rules,
- telemetry dictionary,
- admin permissions and action log rules.

If one of these is missing, the system may still ship, but it will behave like a raccoon driving a forklift.

---

## 8. Cross-functional SLAs

| Area | SLA target | Notes |
|---|---|---|
| payment success webhook to entitlement | < 60 sec | ideally near-real-time |
| payment success to first-device prompt | immediate | same session |
| first support response for activation blockers | < 10 min in support hours | bot or human |
| server incident acknowledgement | < 5 min | operator-side |
| finance reconciliation freshness | daily | transaction and entitlement parity |
| churn-risk campaign trigger | < 15 min from event | for expiry/failure classes |

---

## 9. Control points and auditability

The following events must be immutable and queryable:
- invoice_created
- payment_completed
- entitlement_created
- entitlement_extended
- access_status_changed
- device_issued
- device_revoked
- server_changed
- offer_shown
- offer_accepted
- cancellation_requested
- grace_started
- grace_ended
- support_case_opened
- support_case_resolved

---

## 10. KPI stack

### Acquisition
- bot open -> auth rate
- referral click -> signup rate
- paid campaign CAC by source

### Conversion
- plan view -> checkout start
- checkout start -> payment success
- promo usage rate
- trial -> paid conversion

### Activation
- time to first device issue
- time to first successful connection
- activation failure rate

### Retention
- day 1 / day 7 / day 30 connected retention
- grace recovery rate
- cancel deflection rate
- win-back recovery rate

### Revenue
- ARPU
- ARPPU
- annual mix
- upgrade rate
- device-expansion revenue share

### Ops / Support
- first-response time
- issue resolution time
- issue recurrence rate
- save-after-support rate

---

## 11. Release gating for lifecycle changes

Any release affecting billing, access, routing, devices, offers, or CRM journeys must pass:
1. state transition review,
2. telemetry coverage review,
3. support/admin impact review,
4. reconciliation impact review,
5. rollback plan review.

---

## 12. Next linked docs

- `docs/ops/PROCESS-MAPS-L2.md`
- `docs/growth/CRM-LIFECYCLE-AUTOMATIONS.md`
- `docs/support/SUPPORT-SAVE-PLAYBOOK.md`
- `docs/finance/REVENUE-RECONCILIATION-RULES.md`
- `docs/analytics/KPI-OPERATING-SYSTEM.md`
