# Miniapp Design Audit

**Scope:** `frontend/miniapp`
**Date:** 2026-03-13
**Audit type:** static design-system and UX-structure review

**Resolved (2026-03-17):** Button inline style removed (utility classes for `--btn-min-ch`); token drift aligned to motion.ts model; BottomSheet story moved to `Components/BottomSheet`; bottom-nav semantics fixed (`aria-current="page"`); legacy CSS migration note added to architecture.md.

## Executive Summary

The miniapp is in a generally strong place structurally: page shells are consistent, route styling is centralized, story coverage is broad, and obvious token-discipline regressions such as raw colors, direct `lucide-react` imports, and page-local CSS are currently absent.

The main concerns are not visual chaos but **design-system contract drift**:

1. Two production components still rely on inline styles.
2. Motion token semantics have drifted from the repo’s design-check expectations.
3. One Storybook title breaks the agreed taxonomy.
4. Bottom navigation semantics are mixing tab behavior with navigation-link behavior.
5. The design system is still partly backed by legacy class-based shell CSS, which raises long-term maintenance cost.

## Method

Reviewed:

- `frontend/miniapp/docs/design-system/*`
- `frontend/miniapp/src/app/*`
- `frontend/miniapp/src/design-system/*`
- representative pages under `frontend/miniapp/src/pages/*`
- audit scripts in `frontend/miniapp/scripts/*`

Executed:

```bash
cd frontend/miniapp
pnpm run design:check
node scripts/check-storybook-taxonomy.mjs 2>&1
node scripts/check-token-drift.mjs 2>&1
```

Attempted but blocked by sandbox process-spawn limits:

```bash
pnpm test -- --run src/test/token-parity.test.ts
```

## What Is Working Well

### 1. Page-shell consistency is strong

The route layer broadly uses the same shell primitives:

- `PageFrame`
- `PageSection`
- `FallbackScreen`
- `SessionMissing`
- `PageStateScreen` where appropriate

This is a good sign that the miniapp has a real page contract instead of one-off route composition.

### 2. Page styling ownership is disciplined

Route-owned styles are centralized under:

- `frontend/miniapp/src/styles/app/index.css`
- `frontend/miniapp/src/styles/app/routes.css`
- `frontend/miniapp/src/styles/app/home.css`
- `frontend/miniapp/src/styles/app/onboarding.css`

No page-local CSS files were found under `src/pages`, which matches the documented contract.

### 3. Token and icon hygiene is mostly healthy

The quick static checks found:

- no direct `lucide-react` imports in app code
- no page-local stylesheet violations
- no obvious hardcoded colors in miniapp CSS outside allowed token/theme layers

This suggests the team has largely internalized the design-system guardrails.

### 4. Story coverage is substantial

The miniapp currently contains `52` story files, including route-level coverage for:

- Home
- Devices
- Plan
- Checkout
- Onboarding
- Settings
- Support
- Referral
- Restore Access
- Server Selection
- Connect Status

That gives the UI platform a solid base for regression review and visual QA.

## Findings

### High Priority

#### 1. Production design-check fails on inline styles

`pnpm run design:check` reports inline-style violations in production components:

- `frontend/miniapp/src/design-system/components/Button/`
- `frontend/miniapp/src/design-system/components/feedback/Toast.tsx`

Current uses:

- `Button.tsx` sets `--btn-min-ch` through inline `style={{ ... }}`
- `Toast.tsx` sets `zIndex` and `--toast-stack-index` through inline `style={{ ... }}`

Why this matters:

- it breaks the repo’s explicit “no inline styles” contract
- it makes styling harder to audit and theme consistently
- it weakens confidence in `design:check` as a release gate when known exceptions remain in core primitives

Recommendation:

- move these values to `data-*` attributes or CSS custom-property classes generated from component state
- if inline custom properties are intentionally allowed in rare cases, narrow the lint rule to codify the exception instead of silently living with violations

#### 2. Motion token semantics have drifted from the checker contract

`node scripts/check-token-drift.mjs` reports:

```text
[token-drift] duration.fast not in tokens/motion.ts
[token-drift] duration.normal not in tokens/motion.ts
[token-drift] duration.slow not in tokens/motion.ts
```

Observed state:

- `frontend/miniapp/src/design-system/tokens/motion.ts` exposes semantic keys like `tap`, `micro`, `enter`, `exit`, `panel`, `sheet`
- the audit script still expects `fast`, `normal`, `slow`

Why this matters:

- the source of truth and the enforcement rule disagree
- contributors cannot tell whether the design language is interaction-based (`tap`, `enter`) or abstract-speed based (`fast`, `slow`)
- CI failure here is currently structural, not incidental

Recommendation:

- choose one semantic model and update both `motion.ts` and `check-token-drift.mjs`
- prefer the richer interaction-based model if that is now the design-system direction

### Medium Priority

#### 3. Storybook taxonomy has drifted

`node scripts/check-storybook-taxonomy.mjs` reports:

```text
storybook:taxonomy — src/components/BottomSheet/BottomSheet.stories.tsx: page story title "Pages/BottomSheet" must use Pages/Contracts/* or Pages/Sandbox/*
```

Why this matters:

- taxonomy drift makes Storybook harder to scan and govern
- it weakens the “Pages/Contracts vs Pages/Sandbox” distinction the repo explicitly documents

Recommendation:

- rename the story title to either `Pages/Contracts/BottomSheet` or `Pages/Sandbox/BottomSheet`
- if `BottomSheet` is meant to be reusable platform UI rather than page coverage, move it under `Components` or `Patterns`

#### 4. Bottom navigation has an accessibility semantics mismatch

In `frontend/miniapp/src/app/ViewportLayout.tsx`, the bottom nav renders:

- `<nav role="navigation">`
- child `NavLink`s with `role="tab"`
- `aria-selected={active}`

But no `role="tablist"` is present, and these elements behave like route navigation rather than tabs in a tabpanel system.

Why this matters:

- screen-reader semantics are inconsistent
- `role="tab"` implies a tab interface contract that is not fully implemented
- route navigation is usually better represented as links with `aria-current="page"`

Recommendation:

- either convert this to a real tablist pattern, or
- more likely, remove `role="tab"` / `aria-selected` and rely on navigation semantics with `NavLink` active state

#### 5. Design-system APIs still sit on top of legacy class-driven shell CSS

The miniapp has a usable design-system API surface, but many abstractions still resolve into legacy shell/content classes such as:

- `.btn-primary`
- `.btn-secondary`
- `.btn-row`
- `.btn-row-auto`

defined across:

- `frontend/miniapp/src/design-system/styles/content/library.css`
- `frontend/miniapp/src/design-system/styles/shell/frame.css`

This is not immediately broken, but it indicates a hybrid architecture:

- React components provide API consistency
- CSS still carries a large amount of old class-level presentation logic

Why this matters:

- future refactors become harder because behavior is split across TSX wrappers and deep legacy selectors
- new contributors may not know whether the source of truth is the component API or the shell CSS contract

Recommendation:

- continue migrating from raw class semantics toward component-owned variants and recipe-owned structure
- document which legacy classes are still canonical versus transitional

### Low Priority

#### 6. Some route files are still large for a design-led app layer

Largest page files:

- `frontend/miniapp/src/pages/Home.tsx` — 442 lines
- `frontend/miniapp/src/pages/Devices.tsx` — 425 lines
- `frontend/miniapp/src/pages/Settings.tsx` — 407 lines
- `frontend/miniapp/src/pages/Plan.tsx` — 314 lines

This is not automatically a bug, but it increases the chance of:

- duplicated section choreography
- competing visual ownership within a single page
- regressions when page-level status logic changes

Recommendation:

- keep moving section-level presentation into `recipes/`, `patterns/`, and page-family subcomponents
- keep page files focused on orchestration and model wiring

## Scorecard

| Area | Status | Notes |
|------|--------|-------|
| Page shell consistency | Good | `PageFrame` and state wrappers are widely adopted |
| Token discipline | Good | motion token contract aligned with check-token-drift |
| Styling ownership | Good | route styles centralized in `src/styles/app` |
| Component governance | Good | Button inline style removed |
| Storybook governance | Good | BottomSheet moved to Components/BottomSheet |
| Accessibility semantics | Good | bottom-nav uses `aria-current="page"` |
| Maintainability | Fair | large route files and hybrid legacy CSS remain |

## Recommended Next Steps

1. ~~Fix `design:check` blockers~~ — Done (Button, token drift, BottomSheet taxonomy).
2. ~~Clean up bottom-nav semantics~~ — Done.
3. ~~Define migration plan for legacy CSS~~ — Done (see architecture.md § Legacy CSS Migration).
4. Decompose the highest-churn page files (`Home`, `Devices`, `Settings`) into more recipe-driven sections (lower priority).

## Bottom Line

The miniapp does **not** look like an uncontrolled design system. It already has a credible UI platform with good route-shell consistency and solid guardrails. The main work now is **contract tightening**: make the enforcement scripts match the current token model, remove the last production inline-style exceptions, and resolve the remaining accessibility and taxonomy drift before they become normal.
