# Upsell Engine Specification

**Project:** VPN Suite Mini App  
**Document status:** Repo-ready spec  
**Version:** v1.0  
**Scope:** Frontend mini app, backend plan metadata, telemetry, UX decisioning  

---

## 1. Purpose

This document defines the target upsell architecture for the VPN Suite mini app.

The goal is to replace simple trigger-based upsell rendering with an intent-aware monetization engine that:

- shows the right offer at the right moment
- routes the user to a relevant upgrade path
- avoids misleading upgrade CTAs
- suppresses repetitive or low-value prompts
- separates renewal from upgrade behavior
- supports future monetization mechanics such as annual, family, add-ons, win-back, and premium routing

This spec covers:

- upsell trigger model
- frontend decision engine
- backend plan metadata
- target routing behavior
- UI placement and suppression rules
- telemetry and experimentation hooks

---

## 2. Problem Statement

The current upsell logic works, but it is too narrow and too static.

### Current state

The mini app currently relies on:

- `shouldShowUpsell(upsellMethods, trigger)` for trigger gating
- `getUpgradeCheckoutPath(plans, currentPlanId)` for generic next-plan routing
- `getUpgradeCheckoutPathForDeviceLimit(plans, currentPlanId)` for device-limit routing
- `getRenewalCheckoutPath(currentPlanId)` for same-plan renewal

### Main issues

#### 2.1 Trigger gating is too shallow

The current gate answers only one question:

- is this trigger allowed for this plan?

It does not answer:

- is this offer relevant right now?
- is the user eligible?
- was the offer recently dismissed?
- is there a better offer for this page and state?
- is the user already at the highest meaningful tier?

#### 2.2 Device-limit fallback is misleading

When no plan has a higher `device_limit`, `getUpgradeCheckoutPathForDeviceLimit()` falls back to generic next-plan routing.

This can send the user to a plan that does **not** increase device capacity.

That creates a broken UX:

- user hits device cap
- user clicks “Upgrade”
- target plan does not solve the actual problem

#### 2.3 Renewal and upgrade are mixed

Renewal and upgrade are different commercial actions and should not be treated as interchangeable.

- renewal = preserve access
- upgrade = get more value / more capacity / better fit

#### 2.4 No prioritization between concurrent upsells

Multiple upsells may be valid simultaneously:

- device limit reached
- trial ending
- subscription expiring
- referral available

Without a priority system, the UI risks becoming noisy, inconsistent, and commercially weak.

#### 2.5 No suppression/cooldown layer

Repeated low-context prompts reduce trust and train the user to ignore monetization surfaces.

---

## 3. Goals

### Product goals

- increase paid conversion from trial
- improve renewal conversion before and after expiry
- improve upgrade conversion from real usage signals
- reduce churn caused by hard blockers such as device limit
- create extensible support for future monetization surfaces

### UX goals

- one primary monetization ask per screen
- route users to a plan or add-on that solves their actual problem
- avoid generic “Upgrade” copy where a more specific value proposition exists
- avoid repeated prompts within the same session and across short time windows

### Technical goals

- centralize upsell evaluation logic
- make routing intent-aware instead of purely sort-order-aware
- support telemetry and A/B testing hooks
- preserve backward compatibility where practical

---

## 4. Non-Goals

This spec does not define:

- final design system visuals
- final copy deck for all locales
- pricing strategy
- CRM email/push automation content
- add-on billing implementation details

Those may be covered by adjacent specs.

---

## 5. Terminology

### Trigger
A product event or account condition that may justify showing an upsell.

### Offer
A concrete monetization proposition shown to the user.
Examples:
- renew current plan
- upgrade to higher device limit
- switch to annual and save 25%
- add extra device pack

### Intent
The commercial problem the system is trying to solve.
Examples:
- device_limit
- expiry
- annual_savings
- family

### Suppression
A rule preventing an offer from being shown because it was recently shown, dismissed, converted, or superseded.

### Resolver
A plan or add-on that directly solves the trigger condition.

---

## 6. Target Architecture

The upsell system must move from simple trigger rendering to a decision engine.

### 6.1 Existing model

- plan declares allowed `upsell_methods`
- frontend checks `shouldShowUpsell`
- helper builds a plan checkout path
- screen decides whether to render the CTA

### 6.2 Target model

- backend exposes monetization metadata on plans
- frontend builds `UpsellContext`
- decision engine evaluates all eligible offers
- engine picks the single highest-priority offer for the current placement
- UI renders a specific value proposition and an intent-aware CTA

---

## 7. Data Model

### 7.1 Trigger enum

```ts
export type UpgradeIntent =
  | "device_limit"
  | "expiry"
  | "trial_end"
  | "referral"
  | "annual_savings"
  | "family"
  | "premium_regions"
  | "speed"
  | "winback"
  | "addon";
```

### 7.2 Offer type enum

```ts
export type UpsellOfferType =
  | "upgrade"
  | "renewal"
  | "addon"
  | "bundle"
  | "annual"
  | "trial_convert"
  | "winback";
```

### 7.3 UI placement enum

```ts
export type UpsellUiVariant = "banner" | "card" | "modal" | "inline";
```

### 7.4 Decision object

```ts
export interface UpsellDecision {
  show: boolean;
  trigger: UpgradeIntent;
  priority: number;
  targetTo: string | null;
  reason: string;
  offerType: UpsellOfferType;
  uiVariant: UpsellUiVariant;
  title: string;
  body: string;
  ctaLabel: string;
  targetPlanId?: string;
  targetAddonId?: string;
  suppressOtherTriggers?: UpgradeIntent[];
}
```

### 7.5 Context object

```ts
export interface UpsellContext {
  page:
    | "home"
    | "plan"
    | "devices"
    | "referral"
    | "settings"
    | "checkout"
    | "header";
  currentPlanId?: string | null;
  currentPlan?: Plan | null;
  plans: Plan[];
  subscriptionStatus:
    | "none"
    | "trial"
    | "active"
    | "grace"
    | "expired"
    | "cancelled";
  daysToExpiry?: number | null;
  trialDaysLeft?: number | null;
  devicesUsed?: number | null;
  deviceLimit?: number | null;
  isDeviceLimitError?: boolean;
  isMonthly?: boolean;
  hasAnnualPlanAvailable?: boolean;
  hasDismissedTriggers?: Partial<Record<UpgradeIntent, boolean>>;
  recentUpsellHistory?: UpsellHistoryEntry[];
  sessionShownTriggers?: UpgradeIntent[];
  isAtHighestTier?: boolean;
  serverUsageSignals?: {
    manualRegionSwitches7d?: number;
    premiumRegionRequests7d?: number;
    reconnects7d?: number;
    slowSpeedReports7d?: number;
  };
}
```

### 7.6 Upsell history

```ts
export interface UpsellHistoryEntry {
  trigger: UpgradeIntent;
  page: string;
  shownAt: string;
  clickedAt?: string;
  dismissedAt?: string;
  convertedAt?: string;
}
```

---

## 8. Backend Requirements

### 8.1 Supported upsell methods

Backend must support the following values:

```python
UPSELL_METHOD_VALUES = frozenset({
    "device_limit",
    "expiry",
    "trial_end",
    "referral",
    "annual_savings",
    "family",
    "premium_regions",
    "speed",
    "winback",
    "addon",
})
```

### 8.2 Plan monetization metadata

Each plan should expose enough information for intent-aware routing.

#### Required additions

```ts
export interface PlanMonetizationMeta {
  upsell_methods?: UpgradeIntent[];
  upsell_tags?: Array<
    | "more_devices"
    | "annual_savings"
    | "premium_regions"
    | "family"
    | "priority_support"
    | "best_value"
  >;
  upgrade_rank?: number;
  solves_triggers?: UpgradeIntent[];
  recommended_upgrade_plan_id?: string | null;
  recommended_addon_id?: string | null;
}
```

### 8.3 Plan API response requirements

Plan payload should expose at minimum:

- `id`
- `display_order`
- `price`
- `duration_days`
- `device_limit`
- `upsell_methods`
- `upgrade_rank`
- `solves_triggers`
- `upsell_tags`
- `recommended_upgrade_plan_id` (optional)
- `recommended_addon_id` (optional)

### 8.4 Backward compatibility

If backend cannot ship the full metadata set immediately:

Phase 1 minimum:
- keep `upsell_methods`
- add `upgrade_rank`
- add `solves_triggers`

Phase 2:
- add `upsell_tags`
- add explicit recommended targets

---

## 9. Frontend Engine Requirements

### 9.1 Replace shallow gating

Current helper:

```ts
shouldShowUpsell(upsellMethods, trigger)
```

This helper may remain as a low-level eligibility check, but it must no longer be the primary decision layer.

### 9.2 New engine entry point

```ts
export function evaluateUpsell(context: UpsellContext): UpsellDecision | null
```

### 9.3 Engine responsibilities

The engine must:

1. identify all candidate offers for the current context
2. filter ineligible or suppressed offers
3. resolve each candidate to a plan, add-on, or fallback route
4. prioritize candidates
5. return the single best decision for the requested placement

### 9.4 Eligibility checks

A candidate offer may be considered only if:

- trigger is allowed by plan or global logic
- user is in a matching account/product state
- there is a valid route or resolver
- the offer is not suppressed
- the offer is not superseded by a higher-priority blocker

---

## 10. Priority Model

The engine must use deterministic prioritization.

### 10.1 Priority ladder

#### Level 1 — Hard-block resolver

These solve an immediate usage or access problem.

- `device_limit`
- `expiry` when access is already expired
- failed-payment recovery if introduced later

#### Level 2 — Impending risk

These prevent imminent churn.

- `expiry` when within renewal window
- `trial_end`

#### Level 3 — Value expansion

These increase ARPU without immediate pain.

- `annual_savings`
- `family`
- `premium_regions`
- `speed`
- `addon`

#### Level 4 — Acquisition loop

- `referral`

#### Level 5 — Recovery monetization

- `winback`

> Note: `winback` may be elevated above Level 4 or Level 3 depending on commercial strategy. For initial rollout, treat it as high-value post-expiry monetization on Home and Plan pages.

### 10.2 Priority examples

- If `device_limit` and `referral` are both eligible, show `device_limit`
- If `trial_end` and `annual_savings` are both eligible, `trial_end` wins unless annual is the explicit conversion target for that trial state
- If user is expired and eligible for win-back, `winback` or `renewal` wins over referral and passive offers

---

## 11. Routing and Resolver Rules

### 11.1 Generic principle

An upsell CTA must route to something that solves the current commercial intent.

### 11.2 Device-limit resolver logic

#### Current problem

The current device-limit helper may return a plan that does not increase `device_limit`.

#### Required target behavior

```ts
export function getUpgradeCheckoutPathForDeviceLimit(
  plans: Plan[],
  currentPlanId?: string | null,
): string {
  const current = plans.find((p) => p.id === currentPlanId);
  if (!current) return "/plan?intent=device_limit";

  const candidates = plans
    .filter((p) => (p.device_limit ?? 0) > (current.device_limit ?? 0))
    .sort(sortByUpgradeRelevanceForDeviceLimit);

  if (candidates.length > 0) {
    return `/plan/checkout/${candidates[0].id}?intent=device_limit`;
  }

  return "/plan?intent=device_limit";
}
```

#### Required rule

If no plan increases device capacity:
- do **not** fall back to unrelated next tier
- send user to `/plan?intent=device_limit`
- optionally prefer a device-slot add-on if available

### 11.3 Resolver ladder by intent

#### `device_limit`
1. plan with higher device limit
2. add-on increasing device slots
3. `/plan?intent=device_limit`

#### `expiry`
1. same-plan renewal checkout
2. annual conversion if commercially preferred and allowed
3. `/plan?intent=expiry`

#### `trial_end`
1. best-value paid conversion target
2. annual plan if trial-to-annual is preferred
3. generic plan page with trial conversion context

#### `referral`
1. recommended plan that improves referral economics
2. annual plan if that is the LTV-maximizing target
3. `/plan?intent=referral`

#### `annual_savings`
1. annual version of current or recommended plan
2. `/plan?intent=annual_savings`

#### `family`
1. family/multi-device plan
2. add-on bundle if supported
3. `/plan?intent=family`

#### `premium_regions`
1. premium-region plan
2. premium route add-on
3. `/plan?intent=premium_regions`

#### `speed`
1. higher-tier performance plan
2. priority-route add-on
3. `/plan?intent=speed`

#### `winback`
1. restore last paid plan
2. personalized return offer
3. `/plan?intent=winback`

---

## 12. Renewal vs Upgrade Rules

Renewal and upgrade must be represented as separate decision branches.

### 12.1 Renewal conditions

Renewal is primary when:

- user is expired
- user is in grace
- user is within configured renewal window
- no stronger upgrade pain signal exists

### 12.2 Upgrade conditions

Upgrade is primary when:

- user hit device limit
- user repeatedly demonstrates family/multi-device need
- user repeatedly requests premium regions or higher performance
- trial conversion is best represented as moving into a better paid tier

### 12.3 Screen behavior

#### Rule

If both renewal and upgrade are eligible:

- show one primary CTA based on strongest intent
- show secondary CTA only when the layout supports it cleanly
- do not label renewal as upgrade
- do not label upgrade as renewal

### 12.4 Example behavior

- expiring soon, no pain signal → primary = renewal
- device cap reached, also expiring soon → primary = upgrade, secondary = renewal
- trial ending with annual savings opportunity → primary = trial conversion or annual, not generic renewal

---

## 13. Suppression and Cooldown Rules

The system must prevent repetitive monetization prompts.

### 13.1 Required suppression signals

Per user, per trigger, per placement:

- last shown timestamp
- last clicked timestamp
- last dismissed timestamp
- last converted timestamp
- dismiss count

### 13.2 Minimum suppression rules

#### Device-limit
- if dismissed, suppress for 24 hours
- exception: show again immediately when a new hard block occurs

#### Annual savings
- if dismissed, suppress for 7 days

#### Referral
- if dismissed, suppress for 7 days

#### Trial end
- may reappear once per day in final 3 days

#### Expiry
- may reappear daily in renewal window
- may reappear immediately after expiry on restore surfaces

### 13.3 Session deduplication

The same trigger must not be shown simultaneously in:

- header
- page body
- modal

unless explicitly defined as a hard-block escalation.

### 13.4 Supersession

If a higher-priority trigger is active on a screen, lower-priority triggers must be suppressed for that placement.

Example:
- on Devices page, `device_limit` suppresses `referral`

---

## 14. Screen-by-Screen UX Rules

### 14.1 Home

Home should become the main monetization orchestration layer.

#### Eligible surfaces
- restore access card
- renew plan card
- annual savings card
- add more devices card
- family plan card
- referral card

#### Rules
- show at most one primary monetization card above the fold
- prioritize restore/renew/device pain over passive value offers
- passive offers may appear lower in layout if not suppressed

### 14.2 Plan page

#### Rules
- separate renewal block from upgrade block
- when expiring, renewal should be the default path unless upgrade intent is stronger
- when trial is ending, conversion should be framed as continuation of protection or best value

### 14.3 Devices page

#### Rules
- when at device limit, show specific capacity-based upsell
- CTA must describe the solved outcome
- if no plan solves the capacity problem, route to filtered plan page or add-on page

#### Copy examples
- “Get 2 more device slots”
- “Protect all your devices”
- avoid generic “Upgrade” when device delta is known

### 14.4 Referral page

#### Rules
- do not show generic catalog leakage
- prefer offers tied to referral economics
- examples:
  - unlock referral rewards after purchase
  - get bigger rewards with annual plan

### 14.5 Header alerts

#### Rules
- use only for critical or urgent states
- may include deep link for hard blockers and expiry
- must not become a dumping ground for passive upsells

### 14.6 Checkout

#### Rules
- no competing upsells unless explicitly defined as order bump or annual switch variant
- once the user enters checkout, reduce distractions

---

## 15. Copy Strategy Rules

CTA and message content must be outcome-based rather than tier-based.

### 15.1 Do not default to generic “Upgrade”

Use intent-specific language.

### 15.2 Recommended CTA mapping

| Trigger | Preferred CTA pattern |
|---|---|
| `device_limit` | Add more device slots |
| `expiry` | Keep protection active |
| `trial_end` | Continue without interruption |
| `annual_savings` | Save X% with annual |
| `family` | Protect all your devices |
| `premium_regions` | Unlock premium locations |
| `speed` | Get faster access |
| `referral` | Unlock referral rewards |
| `winback` | Restore access |

### 15.3 Value framing rules

Messages should answer one of these:

- what problem is solved?
- what value is gained?
- what loss is avoided?
- what savings are unlocked?

---

## 16. Decision Tables

### 16.1 Device-limit decision table

| Condition | Output |
|---|---|
| User at device limit, solving plan exists | Show device-limit upgrade to resolving plan |
| User at device limit, add-on exists, no resolving plan | Show add-on offer |
| User at device limit, no resolver exists | Route to `/plan?intent=device_limit` |
| Device-limit API error only | Show same resolver logic; treat as hard-block |

### 16.2 Expiry decision table

| Condition | Output |
|---|---|
| Expired or grace state | Show renewal/restore primary |
| Expiring soon, no stronger pain | Show renewal primary |
| Expiring soon + device-limit problem | Show upgrade primary, renewal secondary |

### 16.3 Trial-end decision table

| Condition | Output |
|---|---|
| Trial ending soon, annual target available | Show trial conversion or annual offer |
| Trial ending soon, only paid monthly available | Show paid conversion offer |
| Trial active, >30 days left | Suppress trial-end upsell |

### 16.4 Annual savings decision table

| Condition | Output |
|---|---|
| Monthly active user, annual exists, no suppression | Show annual offer |
| Already annual | Suppress |
| Trial ending and annual is preferred conversion | Annual may be primary |

---

## 17. Telemetry Requirements

The upsell engine must emit monetization telemetry for evaluation, suppression, clicks, and conversion.

### 17.1 Required events

- `upsell_evaluated`
- `upsell_shown`
- `upsell_clicked`
- `upsell_dismissed`
- `upsell_converted`
- `upsell_suppressed`

### 17.2 Required event properties

| Property | Required | Notes |
|---|---|---|
| `trigger` | yes | `device_limit`, `expiry`, etc. |
| `page` | yes | `home`, `devices`, `plan`, etc. |
| `plan_id` | no | current plan |
| `target_plan_id` | no | target plan if applicable |
| `target_addon_id` | no | target add-on if applicable |
| `offer_type` | yes | `renewal`, `upgrade`, etc. |
| `ui_variant` | yes | `card`, `banner`, etc. |
| `reason` | yes | human-readable reason code |
| `device_usage_ratio` | no | `devicesUsed / deviceLimit` |
| `days_to_expiry` | no | integer |
| `trial_days_left` | no | integer |
| `suppression_reason` | no | for suppressed events |
| `session_id` | recommended | for deduping |
| `experiment_variant` | recommended | for A/B testing |

### 17.3 Example reason codes

- `hard_block_device_limit`
- `renewal_window_entered`
- `trial_ending_soon`
- `monthly_user_annual_offer`
- `family_need_detected`
- `premium_region_interest_detected`
- `offer_dismissed_recently`
- `higher_priority_offer_active`

---

## 18. Experimentation Hooks

The engine must support A/B testing without rewriting business logic.

### 18.1 Testable dimensions

- priority ordering
- renewal vs annual hero offer
- CTA copy variant
- placement variant
- suppression duration
- add-on vs full plan preference

### 18.2 Requirement

Experiment assignment should be accessible in `UpsellContext` or globally through telemetry/session config.

---

## 19. Implementation Plan

### Phase 1 — Critical fixes

- fix `getUpgradeCheckoutPathForDeviceLimit()` fallback
- add intent-aware routing with `/plan?intent=...`
- separate renewal and upgrade rendering logic
- implement telemetry for shown/clicked/dismissed/converted

### Phase 2 — Decision engine

- implement `evaluateUpsell(context)`
- add priority ladder
- add suppression rules
- migrate Devices, Plan, Home, Header surfaces to engine output

### Phase 3 — Extended monetization

- add `annual_savings`, `family`, `premium_regions`, `speed`, `winback`, `addon`
- support add-on resolvers
- add experiment hooks

### Phase 4 — Backend enrichment

- add `upgrade_rank`
- add `solves_triggers`
- add `upsell_tags`
- add explicit recommended targets

---

## 20. Acceptance Criteria

### Functional

- device-limit upsell never routes to a plan that cannot solve the capacity problem unless intentionally routed to a generic plan chooser
- renewal and upgrade are represented separately in the UI and logic
- only one primary upsell is shown per placement
- lower-priority upsells are suppressed when a higher-priority trigger is active
- repeated offers respect cooldown rules

### Product/UX

- Home can display a primary monetization card based on active context
- Devices page shows capacity-specific value messaging
- Plan page distinguishes renewal from upgrade
- Referral page uses referral-aware monetization messaging

### Telemetry

- all required events are emitted with required properties
- suppression events are measurable
- target plan resolution is measurable

---

## 21. Suggested File Structure

```text
frontend/miniapp/src/
  page-models/
    upsell/
      evaluateUpsell.ts
      getUpgradeOfferForIntent.ts
      shouldSuppressUpsell.ts
      getUpsellCopy.ts
      upsell.types.ts
      upsell.constants.ts
      upsell.telemetry.ts

backend/app/
  schemas/
    plan.py
  services/
    offers.py

docs/
  product/
    UPSELL-ENGINE-SPEC.md
```

---

## 22. Recommended TypeScript API Surface

```ts
export function evaluateUpsell(context: UpsellContext): UpsellDecision | null;
export function getUpgradeOfferForIntent(
  plans: Plan[],
  currentPlan: Plan | null | undefined,
  intent: UpgradeIntent,
): UpsellDecision | null;
export function shouldSuppressUpsell(
  trigger: UpgradeIntent,
  history: UpsellHistoryEntry[] | undefined,
  now: Date,
): boolean;
export function getUpsellCopy(decision: UpsellDecision): {
  title: string;
  body: string;
  ctaLabel: string;
};
```

---

## 23. Migration Notes

### Existing helper compatibility

The following helpers may remain temporarily during migration:

- `shouldShowUpsell()`
- `getUpgradeCheckoutPath()`
- `getRenewalCheckoutPath()`

But they should be treated as compatibility shims, not the final orchestration layer.

### Migration sequence

1. patch device-limit fallback immediately
2. add telemetry to existing screens
3. introduce engine behind feature flag
4. migrate page by page
5. remove direct per-screen trigger logic once parity is reached

---

## 24. Final Product Rule

Every upsell must answer this question honestly:

**Does this CTA solve the user’s current problem or create a clearly understandable gain?**

If the answer is no, the offer should not be shown.

That is the difference between a monetization engine and a random button farm.
