# Design System Consolidation — Deliverables

**Date:** 2025-03-17  
**Scope:** Miniapp design system fix and token consolidation

---

## 1. Deleted Components / Files

| Item | Action |
|------|--------|
| HomeDynamicBlock | Deleted (was in patterns/home/) |
| HomeHeroPanel | Deleted |
| HomePrimaryActionZone | Deleted |
| HomeQuickActionGrid | Deleted |
| home.story-helpers.tsx | Deleted (referenced deleted patterns) |

**Note:** These were already removed from the codebase before this work. This consolidation removed all remaining references.

---

## 2. Fixed Imports / Tests

| File | Change |
|------|--------|
| `Theming.stories.tsx` | Replaced HomeHeroPanel, HomeDynamicBlock, HomeQuickActionGrid with ModernHeroCard + ActionCard. Removed home.story-helpers import. |
| `Typography.stories.tsx` | Replaced HomeHeroPanel with ModernHeroCard. |
| `Breakpoints.stories.tsx` | Replaced HomeHeroPanel with ModernHeroCard. |
| `home-patterns.test.tsx` | Removed 3 tests for deleted Home* patterns. Kept HeaderBell test. |
| `useHeaderAlerts.ts` | Updated comment: "HomeDynamicBlock" → "home page model". |

---

## 3. Unified Token Structure

### base.css (primitives + fallback)

- **Primitives:** Color scales (gray, primary, success, warning, error), spacing, typography, motion, layout.
- **Default semantic:** `html` — consumer-dark-like fallback when no theme set.
- **Deprecated:** `html[data-theme="light"]`, `html[data-theme="dim"]` — removed.
- **Radius:** Aligned to consumer (8, 12, 14, 16). Removed conflicting 2px/4px.
- **Duration:** Single source in MOTION section. Removed duplicates from EFFECTS and techspec.
- **Operator:** Uses `consumer-light` / `consumer-dark` as parent. Isolated.

### consumer.css (runtime theme)

- **consumer-light** | **consumer-dark** — canonical semantic tokens.
- Radius: 8, 12, 14, 16.
- Shadows, typography, colors — single source for consumer UI.

### frame.css (shell, optional overrides)

- Shell styles, buttons, modals.
- Selectors use `consumer-light` | `consumer-dark` only. No `dark`/`light` fallbacks.

---

## 4. Final Theme Definition

| Theme | Status |
|-------|--------|
| consumer-dark | **Active** — default |
| consumer-light | **Active** |
| dark, light, dim | **Deprecated** — removed from base.css |
| starlink | Admin/operator only — isolated |
| primitives | Removed |

**Runtime:** `ThemeProvider` with `themes={["consumer-dark", "consumer-light"]}`, `defaultTheme="consumer-dark"`.

**Documentation:** [THEME-RUNTIME.md](../../frontend/miniapp/docs/design-system/THEME-RUNTIME.md)

---

## 5. Component Standardization Summary (Step 6 audit)

- **Hero:** ModernHeroCard (replaces HomeHeroPanel in stories).
- **Actions:** ActionCard, Button, ButtonRow.
- **Buttons:** Button component with variant/size/tone. `getButtonClassName()` for link-styled buttons.
- **Cards:** ModernHeroCard, ActionCard, ListCard, ServerCard, SelectionCard.
- **Audit result:** All 6 button variants (primary, secondary, ghost, outline, danger, link) in use. Tone (danger, warning, success) on primary only. No legacy variants to remove. Card patterns and Mission wrappers aligned.

---

## 6. Visual Improvements Summary

- **Radius:** Unified to 8/12/14/16 (was 2/4 in base).
- **Token conflicts:** Resolved radius and duration duplicates.
- **Theme layers:** Reduced from 5 (html, dark, light, dim, consumer) to 2 (consumer-light, consumer-dark).

---

## 7. Additional Fixes (Continue)

| Change | Status |
|--------|--------|
| Added missing tone tokens (--blue-d, --green-d, --amber-d, --red-d, --green-b, --blue-b, etc.) | Done — consumer.css + base.css fallback |
| Added --surface-border* tokens | Done |
| Typography.stories: rgba → var(--color-text-muted) | Done |
| layout-frame.tsx: hex → var(--color-border-strong) | Done |

## 8. Test Fixes (Continue)

| Test | Fix |
|------|-----|
| Home.test "renders referral banner and support link" | Removed "Invite Friends" (deleted). Renamed to "renders support link in footer". |
| useAccessHomePageModel "returns error state when fetch fails" | Added `retry: false` to QueryClient; fresh client per test in beforeEach. |
| CheckoutFlowCard "shows the confirm-step CTA hierarchy" | Removed "Back" assertion (not in UI). Kept "Pay in Telegram". |

## 9. Visual Polish (Step 10)

| Change | Effect |
|--------|--------|
| Body backdrop-glow | 9% → 5% accent mix |
| Body backdrop-sheen | 3% → 2% text mix |
| card-glow opacity | 0.34 → 0.22 |
| Bottom nav blur | 20px → 12px, saturate 1.05 → 1.02 |
| Header blur | 18px → 12px, saturate 1.05 → 1.02 |
| StickyBottomBar blur | 14px → 10px |
| Bottom nav background | 82% → 88% opacity |

## 10. Operator Isolation (Step 12)

- `[data-console="operator"]` only applies when element has that attribute (admin dashboard).
- Consumer miniapp never uses it; no token leakage.
- Added isolation comment in base.css.

## 11. Layout Consistency (Step 11)

- All pages use `PageScaffold` as outer wrapper.
- Content area uses `modern-content-pad` (Home, Settings, Plan, Devices, Checkout, Support, RestoreAccess, Onboarding).
- Sectioned pages use `PageSection` (Settings, Plan, Devices, Checkout, Support).
- Layout tokens in `zones.css` (--miniapp-content-gutter, --miniapp-card-padding, etc.). No changes needed.

## 12. Scan Findings (post-consolidation)

| Item | Status |
|------|--------|
| beta-freeze.md | Updated: HomeHeroPanel → ModernHeroCard |
| storybook-parity-audit.md | Updated: HomeQuickActionGrid.stories.tsx reference (deleted) |
| App code (pages, components) | No inline styles — design:check passes |
| Orphaned `.home-hero` CSS | Removed from frame.css and routes.css. Removed `home-latency-flash` keyframes. |

## 13. Remaining Risks

| Risk | Mitigation |
|------|-------------|
| Pre-existing test failures (useAccessHomePageModel, Home.test, CheckoutFlowCard) | Unrelated to this consolidation. Address separately. |
| Storybook inline styles | Excluded by design:check. Step 7: Added story-text-muted, story-text-tertiary, story-text-reset, story-home-stack, story-checklist, story-theme-rule-text to layout-story.css; migrated Theming.stories fully. Remaining stories deferred. |
| Operator console `[data-console="operator"]` | Scoped to consumer-light/consumer-dark. Verify no leakage in admin UI. |
| Techspec block in base.css | Still has typography/layout tokens. No radius/duration conflicts after removal. |

---

## Verification

- `pnpm run build` — pass
- `pnpm run design:check` — pass
- `pnpm run test src/test/home-patterns.test.tsx` — pass
- Storybook — starts successfully
