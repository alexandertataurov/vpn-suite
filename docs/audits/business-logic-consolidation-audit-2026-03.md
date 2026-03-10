# Business Logic Consolidation Audit

**Date:** 2026-03-09  
**Status:** Active audit baseline  
**Supersedes:** [business-process-spec-review.md](./business-process-spec-review.md) for current implementation truth

## Summary

This audit reviews business logic across backend, bot, miniapp, and admin/reporting layers with a focus on:

- duplicated logic,
- contradictory logic,
- failing or non-persisted logic,
- non-logical lifecycle transitions,
- stale compatibility logic,
- reporting or automation paths that diverge from runtime enforcement.

The highest-risk domain is subscription lifecycle. The canonical business truth is the split subscription model:

- `subscription_status` = commercial state,
- `access_status` = access gate,
- `billing_status` = money resolution,
- `renewal_status` = renewal intent.

Legacy `status` remains for compatibility only. It must not be authoritative when split-state fields exist.

## Canonical Invariants

| Invariant | Canonical rule | Canonical owner |
|---|---|---|
| Entitled active subscription | `subscription_status=active` + `access_status=enabled` + `valid_until > now` | `backend/app/services/subscription_state.py` |
| Canonical SQL entitlement filter | Shared query predicates for commercially active and entitled active subscription rows | `backend/app/services/subscription_state.py` |
| Primary subscription | Deterministic priority sort: active enabled, grace, paused active, cancel-at-period-end active, pending, expired, other | `backend/app/services/subscription_state.py` and `frontend/miniapp/src/page-models/helpers.ts` |
| Restorable subscription | `subscription_status=expired` or `access_status=grace` with remaining grace | `backend/app/services/subscription_state.py` |
| Pause semantics | Commercially active but access suspended; must not be treated as active entitlement | `retention_service.py` + consumers |
| Payment success | Idempotent activation/renewal with event emission, referral/promo side effects, and cleanup of stale lifecycle flags | `payment_webhook_service.py` |
| First connection event | User/device state update and funnel event must commit in the same transaction boundary | `webapp.py` |

## Findings Matrix

| Severity | Domain | Finding | Failure mechanics | Canonical owner | Status |
|---|---|---|---|---|---|
| High | Subscription lifecycle | Split-state fields existed, but many readers still trusted legacy `status` alone | Paused/grace/pending records could be treated as active in issue, restore, reporting, or routing | `subscription_state.py` | Partially fixed |
| High | Miniapp routing | Frontend previously used `subscriptions[0]` and `status==="active"` as primary truth | UI behavior depended on array order or legacy status instead of lifecycle state | frontend page-model helpers | Fixed in runtime code |
| High | Event persistence | Some funnel writes happened after commit | Activation metrics could be silently dropped | endpoint-specific transaction flow | Fixed for `connect_confirmed`; broader audit remains |
| High | Reporting vs runtime | Analytics/admin queries diverged from entitlement checks | Dashboard and automation counts could disagree with access enforcement | shared entitlement predicate | Fixed for audited active-subscription queries |
| Medium | Referral rewards | Immediate reward application ignored paused access state | Paused referrer could receive immediate extension instead of deferred reward | `referral_service.py` | Fixed |
| Medium | Restore/cancel/offers | Different endpoints selected different subscriptions as “current” | Restore or offers could target the wrong record in multi-subscription accounts | `subscription_state.py` + webapp selectors | Fixed for audited paths |
| Medium | Payment side effects | Activation cleanup was inconsistent across free activation, webhook completion, and competing active subs | Records could remain in impossible mixed states | `payment_webhook_service.py` | Partially fixed |
| Medium | Approximate revenue logic | Some KPIs intentionally use rough payment-based approximations rather than canonical entitlement truth | Reported MRR/ARPU can be directionally useful but not exact | admin/revenue analytics services | Not yet redesigned |
| Low | Legacy/stale docs | Prior review declared “aligned with minor gaps” despite later implementation drift | Readers could trust outdated conclusions | docs/audits | Fixed by this audit |

## Duplicate / Redundant Logic Inventory

### 1. Subscription selection and routing

Before consolidation, primary-subscription logic was duplicated in:

- `backend/app/api/v1/webapp.py`
- multiple miniapp page models
- settings/restore flows

Current direction:

- backend canonical selector in `subscription_state.py`
- frontend canonical selector in `page-models/helpers.ts`

Remaining risk:

- not every backend caller is yet routed through the shared helper,
- compatibility `status` checks still appear as guard rails in several queries.

### 2. Entitled-active predicates

Before consolidation, entitled-active checks were duplicated across:

- issue/reissue,
- control-plane peer selection,
- reminders,
- admin revenue,
- abuse/churn analytics,
- bot billing flows.

Current direction:

- canonical rule documented and partially centralized,
- object-level and SQL-level helpers now live in `subscription_state.py`,
- many call sites now enforce split-state semantics through those helpers.

Remaining risk:

- unaudited files can still bypass the shared helper,
- drift can return if new code reintroduces ad hoc filters instead of the helper.

### 3. Payment activation logic

Duplicate or overlapping activation logic exists in:

- free activation path in webapp checkout,
- webhook completion path,
- bot payment confirmation path,
- referral/promo side-effect handlers.

Current direction:

- side effects are more consistent,
- stale flags are cleared during activation.

Remaining risk:

- activation logic is still spread across more than one entrypoint,
- future features can easily fork lifecycle writes again.

## Logic Smells

### Stale compatibility logic

- Legacy `status` is still stored and checked in many places for compatibility.
- This is acceptable only when paired with split-state checks and clearly documented as compatibility, not business truth.

### Approximate metrics

- Revenue analytics still contain intentionally rough calculations such as 90-day paid average approximations.
- These are operationally useful, but they are not canonical business truth and should be labeled as estimates.

### Silent fallbacks

- Several telemetry, node-key, and operator paths use fallbacks that keep the system responsive.
- These are valid for resilience, but must stay observable; otherwise they hide primary-path failure.

### Repeated query fragments

- Even after fixes, query-level entitlement filters are still repeated across multiple services.
- This is now the largest remaining source of possible regression.

## Remediation Backlog

### Bucket 1: correctness

1. Finish migrating all entitlement-sensitive readers to shared query helpers.
2. Audit all funnel/entitlement/payment event writes for commit ordering.
3. Consolidate activation writes so free activation and webhook activation share one path.

### Bucket 2: duplicated predicates/selectors

1. Continue replacing ad hoc lifecycle queries with the shared SQL helpers.
2. Extract any remaining repeated subscription ordering into the canonical selector.
3. Keep regression tests on helper semantics as new audited paths are migrated.

### Bucket 3: reporting/analytics/admin

1. Distinguish exact KPI sources from approximations in admin/revenue surfaces.
2. Reconcile reporting queries with runtime entitlement semantics.
3. Document estimated metrics explicitly in code comments and API docs.

### Bucket 4: legacy/dead/unused logic

1. Identify compatibility aliases that no longer have live callers.
2. Remove stale doc references and superseded implementation assumptions.
3. Review placeholder or fallback-only business paths and either harden or delete them.

## Verification Baseline

Recommended regression coverage for this consolidation:

- canonical selector tests,
- paused vs enabled lifecycle tests,
- restore selection tests,
- referral deferred reward tests,
- payment replay/idempotency tests,
- event persistence tests,
- frontend selector tests for primary/active subscription behavior.

Current repo changes added coverage in these areas, but the broader repo still needs a final full CI pass with backend dependencies available.
