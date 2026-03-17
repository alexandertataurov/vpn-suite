# Miniapp Design System — Full Undisclosed Audit

**Date:** 2025-03-17  
**Scope:** `frontend/miniapp` design system, tokens, patterns, components, layouts  
**Status:** Internal — do not disclose externally

---

## Executive Summary

The miniapp design system follows a layered architecture (tokens → theme → primitives → components → patterns → recipes → app) with solid documentation and enforcement tooling. Several issues exist: token source fragmentation, legacy/consumer theme overlap, broken Storybook references, and scattered hardcoded values in sanctioned token files.

---

## 1. Architecture & Compliance

### Strengths

- **Layered model** is well-defined in `docs/design-system/architecture.md` and enforced.
- **Design-check script** (`scripts/design-check.sh`) validates: `:root` sources, inline styles (excluded in stories), lucide imports, page imports, page-local CSS, hex/rgba in non-token CSS, token drift, typography parity, Storybook taxonomy.
- **App layer** respects boundaries: pages import from `@/design-system`; no page-local CSS in `src/pages`.
- **Token usage rules** in README: spacing, typography, color via `var(--*)` tokens. No hardcoded hex in app TSX.
- **Import rules** allow chunk-safe paths for `FallbackScreen`, `PageStateScreen`, `PageFrame`; all others via barrel.

### Weaknesses

| Issue | Severity | Location |
|-------|----------|----------|
| Multiple theme layers | WARNING | `base.css` (dark/light/dim), `consumer.css` (consumer-light/consumer-dark), `frame.css` (SpaceX theme). Load order and precedence unclear. |
| Token source fragmentation | WARNING | Semantic tokens defined in `base.css`, `consumer.css`, and `frame.css`. `--radius-sm` etc. differ across base/consumer. |
| Storybook broken imports | CRITICAL | `Theming.stories`, `Typography.stories`, `Breakpoints.stories`, `home-patterns.test.tsx` import `HomeDynamicBlock`, `HomeHeroPanel`, `HomePrimaryActionZone`, `HomeQuickActionGrid` — deleted from `patterns/`; `home.story-helpers.tsx` deleted. |
| `design:check` excludes stories | DRIFT | Inline styles in `design-system/stories/**` are excluded; stories use `style={{}}` extensively. |

---

## 2. Token System

### Token Sources (Sanctioned)

- `styles/tokens/base.css` — primitives (oklch), semantic (dark/light/dim), motion, spacing, typography, radius, shadows, operator console, techspec, starlink, breakpoints.
- `styles/theme/consumer.css` — consumer-light, consumer-dark (hex, rgba).
- `styles/shell/frame.css` — SpaceX theme, operator console overrides, `[data-console="operator"]` aliases.

### Token Conflicts

| Token | base.css | consumer.css | frame.css |
|-------|----------|--------------|-----------|
| `--radius-sm` | 2px | 8px | 2px (starlink) |
| `--radius-md` | 4px | 12px | 2px (starlink) |
| `--radius-lg` | 4px | 14px | 2px (starlink) |
| `--duration-fast` | 150ms (effects) | — | — |
| `--duration-fast` | 80ms (motion) | — | — |
| `--duration-normal` | 250ms (effects) | — | — |
| `--duration-normal` | 250ms (motion) | — | — |

**base.css** uses `html` and `html[data-theme="dark"]` as default; **consumer.css** uses `html[data-theme="consumer-light"]` and `html[data-theme="consumer-dark"]`. The app runtime theme must be `consumer-*`; base.css `light`/`dim` may be dead or legacy.

### Hardcoded Values in Token Files

- **consumer.css**: Hex colors throughout (e.g. `#F7F8FB`, `#2563EB`, `#0F1419`). Intentional — canonical spec. `rgba()` used for soft states.
- **frame.css**: Hex in SpaceX theme (`#020408`, `#00f2ff`), operator console (`#f7f8fa`, `#0f1115`), `rgb(255 255 255 / 0.06)` etc.
- **base.css**: `--color-text-primary` / `--color-text-secondary` in `prefers-contrast` — not in `COLOR_TOKENS`; semantic tokens use `--color-text` / `--color-text-muted`.

### Typography Parity

- `token-parity.test.ts` validates `TYPOGRAPHY_THEME_VALUES` and `BREAKPOINT_VALUES` against CSS. `getTokenCoverage` / `loadDesignSystemCss` used for runtime checks.

---

## 3. Layouts & Shell

### Layout Structure

- **PageScaffold** — Page shell.
- **HeaderZone** — Header area.
- **ScrollZone**, **ActionZone** — Content zones.
- **StickyBottomBar** — Bottom actions.
- **ShellContextBlock** — Shell context block.
- **PageSection**, **SectionDivider** — Section structure.

### Shell & Content Library

- **frame.css** (~6k lines): `.miniapp-shell`, `.miniapp-scroll-content`, `.page-hd`, `.page-title`, `.page-hd-badge`, `.btn`, `.btn-primary`, `.btn-secondary`, `.modal-footer`, etc.
- **library.css**: `.stagger-*`, `.card`, `.module-card`, `.data-grid`, `.form-row`, `.state-alert`, `.inline-alert`.
- **Legacy**: `.btn`, `.btn-primary` etc. are canonical; Button component maps to these classes. Migration direction: prefer `Button` / `getButtonClassName()`.

### Route Styling

- `src/styles/app/app.css` — Global styles, `.modern-footer-help`, `.modern-header`, `.modern-content-pad`, `.modern-action-grid`.
- `src/styles/app/routes.css` — Route-specific styles.
- No page-local CSS under `src/pages`; route styling via `src/styles/app` or design-system.

---

## 4. Components & Patterns

### Component API

- **Button**: `variant`, `size`, `tone`, `loading`, `fullWidth`, `status` — uses `btn-primary`, `btn-secondary` etc. from frame.css.
- **Mission***: MissionCard, MissionChip, MissionAlert, MissionPrimaryButton, etc. — tone types documented.
- **Field vs FormField**: Field (components/forms) preferred; FormField (content-library) for legacy layouts.

### Patterns Index

- Exports: Mission*, FallbackScreen, PageStateScreen, OverflowActionMenu, OfflineBanner, DataGrid, ListCard, FormField, SettingsCard, ToggleRow, SegmentedControl, ButtonRow, ButtonRowAuto, CardFooterLink, StatusChip, StarsAmount, ActionCard, ServerCard, SelectionCard, EmptyStateBlock, SupportActionList.
- **No**: HomeDynamicBlock, HomeHeroPanel, HomePrimaryActionZone, HomeQuickActionGrid — deleted; `patterns/home/` is empty.

### Recipes

- ModernHeader, ModernHeroCard, PageHeaderBadge, SettingsActionRow, FaqDisclosureItem, CompactStepper, CompactSummaryCard, HelperNote.

---

## 5. Home Page

- **Home.tsx** uses `ModernHeader`, `ModernHeroCard`, `ActionCard`, `PageScaffold`, `FallbackScreen` — no Home* patterns.
- **useAccessHomePageModel** — page model; no HomeDynamicBlock usage.
- **useHeaderAlerts** — comment references "HomeDynamicBlock logic" — documentation only.

---

## 6. Direct Import Violations

- **Pages**: FallbackScreen, PageStateScreen, PageFrame — allowed per README.
- **ViewportLayout**: `HeaderZone` from `@/design-system/layouts/HeaderZone` — direct.
- **Tests**: `home-patterns.test.tsx` imports HomeDynamicBlock, HomeHeroPanel, HomePrimaryActionZone — **broken**.
- **Overlay/modal tests**: `Popover`, `Select` from `@/design-system/components/feedback/Popover` — direct.

---

## 7. Recommendations

### Critical

1. **Fix Storybook**: Remove or replace references to deleted Home* patterns in Theming.stories, Typography.stories, Breakpoints.stories. Restore `home.story-helpers.tsx` or replace with equivalent.
2. **Fix home-patterns.test.tsx**: Update or remove tests that import deleted Home* patterns.

### High

3. **Consolidate theme sources**: Document which theme (`consumer-light`, `consumer-dark`) is used at runtime. Consider deprecating or clearly documenting `base.css` dark/light/dim vs consumer.
4. **Resolve radius conflicts**: Single source for `--radius-sm`, `--radius-md`, `--radius-lg`; consumer.css overrides base.css — document load order.

### Medium

5. **Stories inline styles**: Either migrate stories to CSS classes or document why exceptions are allowed for token demos.
6. **Operator console**: `[data-console="operator"]` overrides many tokens; ensure isolation from consumer app.

### Low

7. **COMPONENT_TOKENS**: InlineAlert references `--blue-d`, `--amber-d` — verify these exist in token files.
8. **Typography.stories**: `color: "rgba(0, 0, 0, 0.6)"` in demo — use token.

---

## 8. Checklist Summary

| Check | Status |
|-------|--------|
| Layer boundaries | PASS |
| Token-only styling (app/component TSX) | PASS |
| No inline styles in app TSX | PASS |
| No page-local CSS | PASS |
| No page ancestor selectors in DS CSS | PASS |
| Design-check script | PASS |
| Token drift check | PASS |
| Typography parity test | PASS |
| Storybook taxonomy | PASS |
| Storybook stories (imports) | FAIL — broken Home* |
| home-patterns.test.tsx | FAIL — broken imports |

---

## Appendix: File Reference

- `frontend/miniapp/docs/design-system/architecture.md`
- `frontend/miniapp/docs/design-system/README.md`
- `frontend/miniapp/docs/design-system/enforcement-checklist.md`
- `frontend/miniapp/scripts/design-check.sh`
- `frontend/miniapp/scripts/check-token-drift.mjs`
- `frontend/miniapp/src/design-system/**`
- `frontend/miniapp/src/test/token-parity.test.ts`
