# Process Maps L2 v1

**Status:** Proposed  
**Audience:** Ops, Product, Growth, Support, Backend, Finance, Analytics

---

## 1. Purpose

This document breaks the top-level lifecycle into level-2 business processes with inputs, outputs, owners, system actions, failure modes, and controls.

---

## 2. New customer conversion process

| Step | Actor | Action | System output | Failure mode | Control |
|---|---|---|---|---|---|
| 1 | User | opens bot/app | session started | bounce | capture source + resume token |
| 2 | System | resolves attribution | campaign stored | source lost | persist on first touch |
| 3 | User | authenticates | user session active | auth fail | fallback auth path |
| 4 | System | checks entitlement | route decision | wrong route | deterministic routing rules |
| 5 | User | selects trial/plan | commercial intent event | indecision | annual anchor + comparison clarity |
| 6 | User | starts checkout | invoice created | drop-off | reminder / resume payment |
| 7 | Payment provider | confirms payment | payment_completed | delayed webhook | polling + idempotent webhook |
| 8 | Backend | creates entitlement | access enabled | duplicate entitlement | immutable ledger + idempotency |
| 9 | Frontend | routes to device issue | device issue UI | wrong page | post-payment forced route |
| 10 | User | imports config | device created | import fail | reissue + guide |
| 11 | User | connects | activation success | setup fail | support escalation trigger |

---

## 3. Device expansion process

| Step | Actor | Action | System output | Failure mode | Control |
|---|---|---|---|---|---|
| 1 | User | adds device | device slot check | confusing error | explicit slot state |
| 2 | Offer engine | checks next best offer | upgrade candidate | irrelevant offer | context + cooldown |
| 3 | Frontend | shows revoke vs upgrade | monetization decision UI | dark pattern feel | side-by-side options |
| 4 | User | upgrades or replaces | entitlement/device change | abandoned flow | preserve original action intent |
| 5 | Backend | applies change | ledger + telemetry | partial apply | transactional action |

---

## 4. Technical issue resolution process

| Step | Actor | Action | System output | Failure mode | Control |
|---|---|---|---|---|---|
| 1 | User/system | issue detected | support case / automated flag | silent failure | event thresholds |
| 2 | Admin/support | inspects device/server/payment state | root cause hypothesis | missing context | unified support console |
| 3 | Support/system | proposes fix | reissue/server switch/help guide | bad recommendation | playbook rules |
| 4 | User | retries connection | success/failure event | repeated loops | escalation threshold |
| 5 | CRM/growth | if unresolved + commercial risk | save offer sequence | mistimed offer | trigger only after root cause tagging |

---

## 5. Cancel deflection process

| Step | Actor | Action | System output | Failure mode | Control |
|---|---|---|---|---|---|
| 1 | User | opens cancel | cancel intent event | hidden cancel path | accessible account flow |
| 2 | System | asks reason | reason code | noisy taxonomy | limited reason groups |
| 3 | Offer engine | selects save offer | save UI | irrelevant offer | reason-based rule table |
| 4 | User | accepts / declines | retention outcome | maze feeling | max 2 offers |
| 5 | Backend | finalizes cancel or new state | subscription/access update | conflicting status | state machine validation |

---

## 6. Expiry recovery process

| Step | Actor | Action | System output | Failure mode | Control |
|---|---|---|---|---|---|
| 1 | Billing engine | period ends / payment fails | at-risk state | missed trigger | cron + webhook hybrid |
| 2 | Access engine | starts grace | grace timers | wrong grace eligibility | rules table |
| 3 | CRM | sends reminder sequence | recovery nudges | over-messaging | cooldown and frequency caps |
| 4 | User | restores access | payment success | blocked return path | restore deep link |
| 5 | Backend | re-enables full access | active state | stale device metadata | preserved device map |

---

## 7. Referral process

| Step | Actor | Action | System output | Failure mode | Control |
|---|---|---|---|---|---|
| 1 | Referrer | shares invite | referral link generated | broken attribution | signed tokens |
| 2 | Referee | signs up | referral attached | overwrite by last click | attribution rules |
| 3 | Referee | pays | reward eligibility check | abuse | fraud checks |
| 4 | Backend | accrues reward | pending reward created | lost reward | immutable referral ledger |
| 5 | System | applies reward | bonus days/credit applied | inactive referrer edge case | pending state support |

---

## 8. Monthly operating cadence

| Cadence | Meeting / review | Owner | Output |
|---|---|---|---|
| Daily | growth + ops standup | Product/Growth | blockers, incident impact, funnel anomalies |
| Weekly | lifecycle KPI review | Product/Analytics | funnel actions, experiment readouts |
| Weekly | support root cause review | Support/Product | top issue classes and fixes |
| Weekly | finance reconciliation review | Finance/Backend | payment vs entitlement parity |
| Monthly | pricing/offers review | Growth/Product/Finance | offer changes, promo governance |
| Monthly | retention review | Growth/CRM/Product | churn segments and save strategy |
