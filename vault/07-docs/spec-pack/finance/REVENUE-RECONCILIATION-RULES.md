# Revenue Reconciliation Rules v1

**Status:** Proposed  
**Audience:** Finance, Backend, Product, Admin

---

## 1. Purpose

This document defines how payments, entitlements, promo liabilities, referral rewards, and access changes reconcile.

Money systems become cursed surprisingly fast when commercial actions are not tied back to immutable records. This doc exists to keep the gremlins in a cage.

---

## 2. Core entities for reconciliation

| Entity | Purpose |
|---|---|
| payment transaction | raw commercial event from provider |
| invoice | user-facing payable object |
| entitlement event | access or duration change |
| subscription snapshot | current commercial state |
| promo record | discount / bonus attribution |
| referral reward record | accrued or applied reward liability |
| manual adjustment record | approved admin override |

---

## 3. Reconciliation principles

1. Every paid entitlement must trace to a payment or approved manual action.
2. Every discount or extra-day action must trace to promo/referral/admin records.
3. Access status may change only through valid state transitions.
4. Revenue reporting and liability reporting must be separable.
5. Daily reconciliation is required even if settlement is delayed.

---

## 4. Daily reconciliation checks

### 4.1 Payment-to-entitlement parity
- count successful payments,
- count entitlements created/extended,
- identify mismatches,
- verify idempotent duplicates are not treated as revenue.

### 4.2 Subscription-state consistency
- active subscription with blocked access without valid reason,
- expired subscription with active access outside grace,
- grace without source event,
- cancelled subscription with future entitlement beyond policy.

### 4.3 Promo and referral liability
- pending bonus days,
- applied bonus days,
- expired unused promos,
- total liability outstanding by cohort.

### 4.4 Manual adjustments
- who made the change,
- why,
- approved by whom,
- commercial effect amount.

---

## 5. Revenue recognition support model

This system should support at minimum:
- cash collection reporting,
- deferred entitlement liability reporting where relevant,
- discount impact reporting,
- referral reward cost reporting,
- write-off / refund reporting.

Accounting policy may differ by legal structure, but the event model must not make finance blind.

---

## 6. Exception classes

| Exception | Description | Required action |
|---|---|---|
| payment without entitlement | user paid but got no access | urgent fix + compensation review |
| entitlement without payment | access granted without commercial basis | investigate, classify, reverse or approve |
| duplicate payment processing | same invoice applied twice | refund/reverse flow |
| stale grace | user remains in grace beyond rules | correct access state |
| orphan reward | referral/promo exists but cannot apply | re-map or expire by policy |

---

## 7. Monthly reporting pack

Finance should receive:
- gross collections,
- net collections after discounts,
- ARPU / ARPPU,
- annual vs monthly mix,
- promo spend,
- referral cost,
- save offer cost,
- churned MRR-equivalent,
- recovered revenue via grace/win-back,
- unresolved reconciliation exceptions.

---

## 8. Audit log requirements

Manual financial-impact actions require:
- actor id,
- timestamp,
- reason code,
- free-text note,
- before/after commercial state,
- approval metadata if above threshold.

---

## 9. Thresholds for mandatory investigation

- payment-entitlement mismatch > 0 for current day,
- duplicate charge cluster > defined threshold,
- unexplained access outside entitlement > 0,
- manual adjustments above daily cap,
- referral abuse anomalies above baseline.
