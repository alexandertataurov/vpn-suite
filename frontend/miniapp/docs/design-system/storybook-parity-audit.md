# Miniapp Storybook Parity Audit

## A. Executive Summary

**Rating: STORYBOOK IS LYING TO YOU**

Storybook is not currently the miniapp UI source of truth. The largest break is structural: the real app renders pages inside a Telegram-aware runtime shell with bootstrap/auth gating, safe-area and viewport side effects, header/bottom-nav layout wrappers, and app-level error handling, while Storybook page stories mount route components in a much thinner sandbox. That means the same page component can render under materially different DOM, CSS variables, route context, theme defaults, and startup state.

The highest-risk drift sources are:

- app-only wrappers and bootstrap flow omitted from Storybook
- page stories mounted outside `ViewportLayout`
- page-scoped CSS selectors living inside shared design-system styles
- page-local primitives and menus replacing documented shared patterns
- missing or broken Storybook coverage for major routes and runtime states

Future design work is high risk. Changes approved in Storybook are not likely to propagate safely to production without manual route-by-route verification, and some live routes cannot even be observed through the production shell without Telegram bootstrap state.

Browser evidence used for this audit:

- `output/playwright/app-home.png`
- `output/playwright/app-settings.png`
- `output/playwright/story-home-page-longwait.png`
- `output/playwright/story-settings-page-longwait.png`
- `output/playwright/story-devices-page-longwait.png`
- `output/playwright/story-onboarding-page-longwait.png`
- `output/playwright/parity-scan.json`

## B. Findings Table

| Area | File / Path | Problem | Why it breaks Storybook parity | Severity | Recommended fix |
|------|-------------|---------|--------------------------------|----------|-----------------|
| Runtime shell | `frontend/miniapp/.storybook/preview.tsx:18-57` | Storybook preview only provides `ThemeProvider` plus a padded `<div>` wrapper with inline `minHeight: 100vh` and `padding: 16px`. | Production pages are never rendered inside this wrapper. The app uses router, query, bootstrap, Telegram, safe-area, overlay, and error-boundary layers before any route appears. Storybook is previewing a different host environment. | CRITICAL | Replace the preview wrapper with a shared app-shell decorator strategy. Add a `StorybookMiniappShell` that can opt into the same root layers as production and remove preview-only geometry/padding from the default decorator. |
| Runtime shell | `frontend/miniapp/src/main.tsx:73-86`, `frontend/miniapp/src/App.tsx:28-31`, `frontend/miniapp/src/app/AppShell.tsx:23-43` | Production renders inside `QueryClientProvider`, `BrowserRouter basename="/webapp"`, `AppErrorBoundary`, `TelegramProvider`, `TelegramThemeBridge`, `TelegramEventManager`, `SafeAreaLayer`, `MainButtonReserveProvider`, `OverlayLayer`, `WebappAuthRefresh`, and `BootstrapController`. | Storybook page stories do not mount this stack, so route layout, safe-area CSS vars, event side effects, auth refresh, error surfaces, and shell-owned UI are missing. | CRITICAL | Create a production-faithful Storybook page harness that composes the same root providers. Allow stories to selectively mock Telegram/bootstrap internals rather than dropping those layers entirely. |
| Bootstrap / auth | `frontend/miniapp/src/bootstrap/useBootstrapMachine.ts:82-92`, `frontend/miniapp/src/bootstrap/BootstrapController.tsx:123-161` | The real app can block every route behind startup error, onboarding redirects, or app-ready redirects depending on Telegram/init-data state. Browser capture shows `app-home.png` and `app-settings.png` rendering the startup error instead of the page. | Storybook bypasses the entire runtime gate and shows idealized routed pages even when production would never display them in the same environment. This is the strongest false-confidence trap in the repo. | CRITICAL | Add explicit Storybook stories for bootstrap-gated states using the real bootstrap controller, and separate “page component sandbox” stories from “production route contract” stories. Label them differently. |
| Route layout parity | `frontend/miniapp/src/app/routes.tsx:30-50`, `frontend/miniapp/src/app/ViewportLayout.tsx:52-110`, `frontend/miniapp/src/pages/Pages.stories.tsx:547-668` | Real routes are split between `TabbedShellLayout` and `StackFlowLayout`, but page stories render pages directly under `MemoryRouter` with `LayoutProvider stackFlow={false}` and no `HeaderZone`, `ScrollZone`, `ActionZone`, or bottom nav. | Page geometry, sticky bars, scroll behavior, shell padding, active nav, and `useLayoutContext()` behavior all differ from production. Stack-flow routes are especially wrong in Storybook. | CRITICAL | Wrap page stories in the real `ViewportLayout` variant for each route. Derive `stackFlow` from the route contract instead of hard-coding `false`. |
| Route contract mismatch | `frontend/miniapp/src/app/routes.tsx:45`, `frontend/miniapp/src/pages/Pages.stories.tsx:365-376`, `frontend/miniapp/src/pages/Pages.stories.tsx:416-420` | The real home route is `/`, but Storybook documents and mounts `HomePage` at `/home`. | This changes nav selection, route state, and any code that depends on actual pathnames. Storybook is documenting a route that the app does not serve. | HIGH | Change the page story to use `/` and update the route coverage table to match production paths exactly. |
| Coverage gap | `frontend/miniapp/src/app/routes.tsx:47`, `frontend/miniapp/src/pages/Pages.stories.tsx:383-410` | `PlanPage` is a first-class tabbed production route, but the page-story overview explicitly excludes it. | Storybook cannot act as the contract for one of the app’s main tabs, even though the route uses shared patterns like `SegmentedControl`, `ToggleRow`, `ListRow`, and `EmptyStateBlock`. | HIGH | Add real `PlanPage` route stories with production shell coverage. If bootstrap/runtime dependencies are the blocker, solve that in the harness instead of excluding the page. |
| Broken stories | `frontend/miniapp/src/pages/Pages.stories.tsx:424-452`, `frontend/miniapp/src/pages/Pages.stories.tsx:528-536` | `Devices` and `Onboarding` page stories remained stuck in Storybook’s preparing state in browser runs (`story-devices-page-longwait.png`, `story-onboarding-page-longwait.png`). | The route coverage surface is partially non-functional. A story that does not render cannot be trusted as design documentation or regression coverage. | HIGH | Fix these stories before adding more story documentation. Treat “story reaches stable rendered state in browser” as a required acceptance check. |
| Theme / environment mismatch | `frontend/miniapp/index.html:16-24`, `frontend/miniapp/.storybook/preview.tsx:33-35`, `frontend/miniapp/src/context/TelegramContext.tsx:14-26`, `frontend/miniapp/src/design-system/styles/layout/zones.css:53-71` | Production sets theme before React from Telegram or OS and writes `data-tg`, `data-tg-fullscreen`, `data-tg-platform`, and `data-tg-desktop`. Storybook defaults to `consumer-dark` and does not reproduce the pre-React bootstrap or Telegram root attributes. Browser evidence showed app HTML in `consumer-light` while Storybook settled in `consumer-dark`. | Any CSS keyed off root attributes or theme defaults can diverge before components even render. Safe-area and fullscreen layout branches are invisible in Storybook unless manually reproduced. | HIGH | Add a Storybook environment decorator that can set the same root data attributes and initial theme bootstrap as production. Add toolbar controls for Telegram desktop/fullscreen/platform state. |
| Font / head mismatch | `frontend/miniapp/index.html:7-10` | Production loads Google fonts and the Telegram WebApp script in `index.html`; Storybook has no `.storybook/preview-head.html` equivalent. | Typography and early runtime behavior can differ even when component code is identical. Storybook is missing the production document head contract. | HIGH | Add `preview-head.html` for fonts and any safe head-only setup that Storybook needs. Keep Telegram runtime mocked, not omitted. |
| Global CSS leakage | `frontend/miniapp/src/design-system/styles/shell/frame.css:5-25`, `frontend/miniapp/src/design-system/styles/shell/frame.css:32-63`, `frontend/miniapp/src/design-system/styles/layout/zones.css:96-108` | Shared design-system CSS contains shell-wide element selectors and global root/body rules: `.miniapp-shell *`, `.miniapp-shell button`, `.miniapp-shell a`, `body`, `html, body, #root`. | Components rendered in Storybook outside the production shell see different resets and document backgrounds than components rendered in-app. Conversely, production routes can receive broad style mutations unrelated to the owning component. | HIGH | Move document-level rules into a shell-specific entrypoint and keep component styles component-scoped. Add stylelint rules blocking broad element selectors in shared component layers. |
| Ancestor-driven component mutation | `frontend/miniapp/src/design-system/styles/content/library.css:2960-3014`, `frontend/miniapp/src/pages/Home.tsx:59-118`, `frontend/miniapp/src/design-system/stories/HomeQuickActionGrid.stories.tsx:31-75` | `HomePage` adds a `home-page` ancestor class, and shared CSS then mutates `HomeQuickActionGrid`, `module-card`, `list-card`, and `home-hero` under `.home-page`. The dedicated `HomeQuickActionGrid` story does not include that ancestor. | The component’s standalone story is not showing its production appearance. Designers can approve one visual contract while the route renders another. | HIGH | Pull route-specific `home-page` styling into the owning page recipe or into the component props/classes themselves. Add an in-context story for every component that receives page-ancestor mutations, then remove the ancestor dependency. |
| Ancestor-driven component mutation | `frontend/miniapp/src/design-system/styles/content/library.css:1734-1759`, `frontend/miniapp/src/design-system/styles/content/library.css:2020-2374`, `frontend/miniapp/src/pages/Settings.tsx:121-219` | Settings styles are encoded as `.settings-page …` descendant rules inside shared CSS, and `SettingsPage` passes `className="settings-page module-card …"` into `SettingsCard`. | `SettingsCard`, `DataCell`, and row layouts render differently inside the route than they do in their design-system story surface. The page class is effectively an undocumented variant system. | HIGH | Extract a real `SettingsListRow` or `SettingsAccountCard` pattern and move page-specific selectors behind those components instead of a page ancestor class. |
| Primitive drift | `frontend/miniapp/src/pages/Settings.tsx:36-73`, `frontend/miniapp/src/design-system/stories/ContentPatterns.stories.tsx:343-389` | `SettingsPage` defines a custom `SettingsRow` button-row primitive even though Storybook documents `FormField`, `SettingsCard`, `ToggleRow`, and `SegmentedControl` as the canonical dense settings building blocks. | The settings route has its own row layout, spacing, and affordance rules that are not represented as a reusable design-system component. | HIGH | Promote `SettingsRow` into the design system if it is legitimate, or replace it with a documented pattern. Do not keep it as page-local markup. |
| Composition drift | `frontend/miniapp/src/pages/DeviceRowActions.tsx:17-170`, `frontend/miniapp/src/design-system/stories/CardsUiPatterns.stories.tsx:89-112` | The page uses a bespoke device action menu even though `OverflowActionMenu` exists and is documented in Storybook as the canonical utility-actions pattern. | Menu spacing, item semantics, icon treatment, and danger states can now diverge separately in the device page and the shared pattern story. | HIGH | Refactor `DeviceRowActions` to compose `OverflowActionMenu` with device-specific items and labels. |
| Composition drift | `frontend/miniapp/src/pages/Support.tsx:24-60`, `frontend/miniapp/src/pages/Support.tsx:239-255` | `SupportPage` ships a page-local FAQ accordion (`SupportFaqItem`) instead of a documented shared disclosure/accordion primitive. | FAQ interaction, focus treatment, and typography are maintained outside the design system and are absent from Storybook’s reusable component contract. | MEDIUM | Extract a shared disclosure/accordion pattern or add a support-FAQ pattern to the design system and replace the page-local implementation. |
| Page-layer pattern drift | `frontend/miniapp/src/pages/Onboarding.tsx:246-516`, `frontend/miniapp/src/design-system/styles/shell/frame.css:4266-4673` | Onboarding is a large page-owned pattern with dozens of dedicated classes and shell-layer CSS selectors. It is not modeled as a reusable design-system pattern family. | The onboarding contract lives mostly in page TSX plus page-specific CSS embedded in shared shell styles. Storybook cannot safely serve as the source of truth while the pattern remains page-owned. | HIGH | Either formalize onboarding as a documented pattern/recipe family with dedicated stories, or isolate its CSS to an app-layer stylesheet owned by onboarding instead of shared shell CSS. |
| Missing state coverage | `frontend/miniapp/src/components/SessionMissing.tsx:14-63`, `frontend/miniapp/src/pages/*.tsx` | Many pages fall back to `SessionMissing`, but the Storybook route coverage focuses on ready-state and a single error-state example. The session-missing/auth-reconnect contract is not represented as a first-class route-story state. | Production can spend significant time in auth/session failure states that designers cannot review in Storybook. | MEDIUM | Add explicit session-missing stories for every major route family or a shared “auth missing” contract story using `SessionMissing`. |
| Story harness drift | `frontend/miniapp/src/pages/Pages.stories.tsx:528-535` | The onboarding story harness uses placeholder route elements for `/plan`, `/devices`, and `/restore-access` instead of real targets. | Navigation from the onboarding story cannot validate real next-screen composition, layout transitions, or cross-route parity. | MEDIUM | Replace placeholders with the real route components under the same shell harness, or mark the story as non-canonical prototype coverage. |
| Governance failure | `frontend/miniapp/scripts/design-check.sh`, `frontend/miniapp/src/pages/Pages.stories.tsx:407`, `frontend/miniapp/src/design-system/components/feedback/Popover.tsx:198-217` | `npm run design:check` currently fails. It flags inline styles in `Pages.stories.tsx` and `Popover.tsx`. | Existing enforcement is not healthy enough to prevent drift. One violation is in Storybook itself; another is in a shared production component. | MEDIUM | Fix the current violations and split the rule into “app code”, “stories”, and “design-system internals” so the guardrail reflects actual policy instead of noisy exceptions. |
| Story/documentation trust gap | `frontend/miniapp/src/pages/Pages.stories.tsx:23-30`, `frontend/miniapp/src/pages/Pages.stories.tsx:383-410` | The docs call page stories the “canonical visual contract”, but the same file excludes `PlanPage`, mounts fake paths, omits the production shell, and includes non-rendering stories. | This overstates Storybook trust and encourages teams to approve designs against an incomplete or broken contract. | MEDIUM | Downgrade the claim until parity work is complete. Split “sandbox stories” from “production contract stories” in naming and docs. |
| Dead / stale Storybook helpers | `frontend/miniapp/src/storybook/index.ts:1-4`, `frontend/miniapp/src/storybook/wrappers.tsx:1-43`, `frontend/miniapp/src/design-system/stories/Layouts.stories.tsx:1093-1101` | `src/storybook/wrappers.tsx` exports wrapper helpers that are not imported anywhere, while `Layouts.stories.tsx` defines local `StoryGrid` and `StoryStack` duplicates instead. | Duplicate dead helper layers make Storybook ownership unclear and encourage more drift. | LOW | Remove the unused wrapper exports or converge all stories on one helper source. |
| Dead / stale CSS | `frontend/miniapp/src/design-system/styles/shell/frame.css:4108-4200`, `frontend/miniapp/src/design-system/styles/shell/frame.css:4270-4281`, `frontend/miniapp/src/design-system/styles/shell/frame.css:4933-4969` | CSS selectors such as `.device-menu-list`, `.device-menu-item*`, `.onboarding-intro`, `.onboarding-hero-card`, `.settings-top-grid`, and `.settings-preferences-card` have no matching JSX usage in the current miniapp source tree. | Fossilized selectors inside shared layers increase cascade risk and make it harder to reason about whether Storybook and app are using the same contract. | LOW | Verify with one repo-wide search pass, then delete the unused selectors from shared CSS. |

## C. Drift Categories

### Runtime / environment mismatch

- Findings: 1, 2, 3, 4, 5, 8
- Main issue: Storybook does not recreate the same document, provider, route, safe-area, or startup environment as production.

### Story mismatch and coverage gaps

- Findings: 5, 6, 7, 14, 15
- Main issue: major routes and states are either missing, broken, or documented more confidently than the implementation warrants.

### Primitive misuse and local reimplementation

- Findings: 11, 12, 13
- Main issue: page code invents one-off rows, menus, and disclosures even where the design system already has or should own the pattern.

### CSS overwrite / layout interference

- Findings: 8, 9, 10, 16
- Main issue: shared CSS uses global and page-ancestor selectors that silently restyle components outside their own stories.

### Token and governance drift

- Findings: 1, 16
- Main issue: hardcoded story wrapper geometry and failing design checks show that enforcement is weaker than the documented standard.

### Legacy / dead pattern residue

- Findings: 17, 18
- Main issue: old helper layers and stale selectors remain inside the design-system surface and complicate ownership.

## D. Top Priority Fixes

1. **Rebuild page stories on top of the real route shell**
   - What to change: make page stories mount the same `ViewportLayout` variant and root providers used by `AppShell`.
   - Why it matters: this is the biggest source of false parity.
   - Expected impact: high; restores route geometry, nav, sticky bars, safe-area padding, and layout context.
   - Migration risk: medium.
   - Timing: immediately.

2. **Separate production-contract stories from sandbox stories**
   - What to change: rename current page stories or add a second story family that explicitly exercises production boot and shell behavior.
   - Why it matters: Storybook currently conflates “component sandbox” with “real route contract”.
   - Expected impact: high.
   - Migration risk: low.
   - Timing: immediately.

3. **Add bootstrap/auth state stories using the real bootstrap controller**
   - What to change: cover startup error, onboarding redirect, app-ready redirect, and session-missing states.
   - Why it matters: production can block routes before page content exists.
   - Expected impact: high.
   - Migration risk: medium.
   - Timing: immediately.

4. **Restore missing route coverage for `PlanPage`**
   - What to change: add `PlanPage` page stories under the same route harness as production.
   - Why it matters: a primary tab is currently outside the Storybook contract.
   - Expected impact: high.
   - Migration risk: medium.
   - Timing: immediately.

5. **Fix non-rendering page stories before adding new stories**
   - What to change: repair `Devices` and `Onboarding` page stories until they reach stable rendered state in a real browser.
   - Why it matters: broken stories destroy Storybook trust.
   - Expected impact: high.
   - Migration risk: low.
   - Timing: immediately.

6. **Eliminate page-ancestor styling of shared components**
   - What to change: move `.home-page …` and `.settings-page …` overrides into real page-owned recipes/components.
   - Why it matters: component stories cannot reflect production while ancestor selectors mutate them externally.
   - Expected impact: high.
   - Migration risk: medium.
   - Timing: staged, starting now.

7. **Promote or delete page-local primitives**
   - What to change: formalize `SettingsRow`, replace `DeviceRowActions` with `OverflowActionMenu`, and extract a shared accordion if support FAQ is durable.
   - Why it matters: this is where component drift becomes permanent.
   - Expected impact: high.
   - Migration risk: medium.
   - Timing: staged.

8. **Add Storybook environment controls for Telegram/platform state**
   - What to change: toolbar knobs for theme, fullscreen, platform, desktop/mobile, and safe-area values.
   - Why it matters: root attributes currently drive layout branches invisible in Storybook.
   - Expected impact: medium-high.
   - Migration risk: low.
   - Timing: staged.

9. **Fix the failing design-system guardrails**
   - What to change: make `design:check` green, then tighten it around shared CSS scope and story/page shell rules.
   - Why it matters: drift prevention cannot start from a failing baseline.
   - Expected impact: medium.
   - Migration risk: low.
   - Timing: immediately.

10. **Delete stale helpers and unused selectors**
    - What to change: remove dead Storybook wrapper exports and verify/delete unused shell/content selectors.
    - Why it matters: stale code keeps the cascade and ownership map noisy.
    - Expected impact: medium.
    - Migration risk: low.
    - Timing: staged.

## E. Deletion Candidates

### DEAD AND SAFE TO DELETE

- `frontend/miniapp/src/storybook/wrappers.tsx`
  - No imports found in `frontend/miniapp/src`.
  - The same helper concepts are redefined locally in `design-system/stories/Layouts.stories.tsx`.

- `frontend/miniapp/src/storybook/index.ts`
  - Barrel is not imported anywhere in `frontend/miniapp/src`.
  - Safe after verifying no external tooling imports it.

- `frontend/miniapp/src/design-system/styles/shell/frame.css`
  - Candidate selectors with no current JSX refs: `.device-menu-list`, `.device-menu-item*`, `.settings-top-grid`, `.onboarding-intro`, `.onboarding-hero-card`, `.settings-preferences-card`.
  - Verify once more with repo-wide search, then remove.

### DEAD BUT IMPORTED

- None confirmed in this pass.

### ACTIVE LEGACY

- Page-ancestor CSS branches inside shared layers:
  - `.home-page …` in `styles/content/library.css`
  - `.settings-page …` in `styles/content/library.css`
  - onboarding-specific selectors in `styles/shell/frame.css`
  - These are active today but behave like legacy forked theming.

- `SessionMissing` in `src/components/SessionMissing.tsx`
  - Actively used across many routes, but outside Storybook-governed design-system ownership.

### MIGRATION RISK

- Placeholder routes in `Pages.stories.tsx` onboarding harness
  - They should not stay, but deleting them before replacing the harness with real routes will reduce coverage.

- Page-local CSS hooks embedded in shared layers
  - Remove only after extracting stable replacement patterns or recipes.

## F. Refactor Plan

### Phase 1 — Critical parity blockers

- Build a shared Storybook page harness that mounts:
  - `QueryClientProvider`
  - `BrowserRouter`-equivalent route contract or a `MemoryRouter` shim with production path/basename semantics
  - `AppErrorBoundary`
  - `TelegramProvider`
  - `TelegramThemeBridge`
  - `TelegramEventManager`
  - `SafeAreaLayer`
  - `MainButtonReserveProvider`
  - `OverlayLayer`
  - `ViewportLayout`
- Add bootstrap-aware stories for startup error, onboarding, app-ready redirect, and session-missing.
- Fix `Devices` and `Onboarding` page stories until they render reliably in browser automation.
- Add `PlanPage` route coverage.

### Phase 2 — Design-system consolidation

- Promote `SettingsRow` into a shared pattern or replace it with documented settings primitives.
- Replace `DeviceRowActions` with `OverflowActionMenu`.
- Extract a shared accordion/disclosure primitive for support FAQ if the interaction is product-standard.
- Decide whether onboarding becomes a design-system pattern family or a clearly app-owned page module with isolated styling.

### Phase 3 — CSS containment and cleanup

- Split shell/document rules from reusable component rules.
- Remove page-ancestor selectors that mutate shared components.
- Move route-specific visual rules behind explicit page recipe classes or component props.
- Delete verified-unused selectors from `frame.css` and `library.css`.

### Phase 4 — Storybook hardening

- Align route paths with production.
- Add real route stories for all major tabs and stack-flow routes.
- Add environment controls for theme, Telegram platform, fullscreen, and safe-area values.
- Add in-context stories wherever a component currently depends on route ancestors.
- Add explicit “not production-shell” labels for sandbox-only stories.

### Phase 5 — Governance

- Make `design:check` pass and keep it green.
- Add stylelint rules for:
  - no broad element selectors in shared component layers
  - no page-ancestor selectors in design-system CSS
  - no raw px/rgba in non-token files except approved token/theme files
- Add CI browser checks for:
  - page stories reaching stable render state
  - screenshot diffs for Home, Settings, Devices, Plan, Onboarding
  - theme/platform permutations
- Add ownership boundaries:
  - `design-system/` owns reusable primitives, patterns, recipes, and shared CSS
  - `pages/` owns orchestration only
  - `components/` holds explicitly app-specific patterns and must be called out in Storybook or documented as intentionally app-only

## Appendix: Storybook Parity Checklist

- Does the story mount under the same shell/layout variant as production?
- Does it use the production route path and basename?
- Does it cover bootstrap/auth/session-missing states?
- Does it render with the same root theme bootstrap as production?
- Does it set the same Telegram root attributes and safe-area variables?
- Does it load the same fonts and document-head requirements?
- Does the route render to a stable visual state in browser automation?
- Are all production-only props/states represented in the story matrix?

## Appendix: Design-System Enforcement Checklist

- No page-local primitives when a shared pattern exists.
- No page ancestor classes used to restyle shared components.
- No shared CSS selector should depend on a route name unless that route owns a formal recipe component.
- No route marked canonical in Storybook without production-shell coverage.
- Every exported reusable pattern used in pages must have an in-context story and a standalone story where appropriate.

## Appendix: Candidate CI / Architecture Rules

- Fail when a production route exists without a matching page story.
- Fail when `Pages.stories.tsx` route path differs from `AppRoutes`.
- Fail when a page story remains in `sb-show-preparing-story` after a timeout.
- Fail when shared CSS introduces selectors matching `.<route-name> .<shared-class>`.
- Fail when `src/storybook/` barrels or helpers are exported but unused.

## Appendix: Suggested Visual Regression Targets

- `/` Home route under tabbed shell, dark and light themes
- `/settings` route with language popover closed/open
- `/devices` ready, empty, and no-plan states
- `/plan` default and selected-tier states
- `/onboarding` intro, install, get-config, and confirm-connected states
- `/restore-access` and `/connect-status` stack-flow routes
- bootstrap startup error and session-missing states

## Appendix: Ownership Boundaries

- `design-system/styles/layout` owns shell geometry tokens and layout primitives only.
- `design-system/styles/shell` should own shell chrome, not route-specific onboarding/settings/home overrides.
- `design-system/styles/content` should own reusable pattern styling, not page-name descendant selectors.
- `pages/` may compose patterns, but should not define new visual primitives without promoting them or documenting them as app-only.
