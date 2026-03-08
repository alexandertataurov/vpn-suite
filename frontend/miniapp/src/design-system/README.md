# Miniapp design system

Single entry for layout, page recipes, patterns, components, primitives, tokens, theme, icons, hooks, and utils. Import reusable UI from `@/design-system`.

## Architecture

The design system follows a **layered model**. Each layer has strict responsibilities; see **[docs/design-system-architecture.md](./docs/design-system-architecture.md)** for the full guide, **[docs/design-system-enforcement-checklist.md](./docs/design-system-enforcement-checklist.md)** for PR/CI checks, and **[docs/mobile-platform-guidelines.md](./docs/mobile-platform-guidelines.md)** for iOS/Android-compatible mobile UI rules.

| Layer | Responsibility |
|-------|----------------|
| **Tokens** | Single source of truth for colors, spacing, typography, radius, shadows, motion, breakpoints. Use via CSS `var(--*)` or tokens/*.ts. |
| **Foundations** | Theme config, CSS variables (tokens + theme consumer), global/reset. |
| **Primitives** | Low-level layout and typography (Box, Stack, Text, Heading, etc.). No business logic. |
| **Components** | Reusable UI (Button, Input, Modal, Toast, etc.). Consistent variant/size/tone APIs. |
| **Patterns** | Composed structures (FormField, PageHeader, Hero blocks). No data fetching. |
| **Page Recipes** | Canonical page-shaped wrappers built from layouts + patterns (header badges, card sections, hero-first page blocks). |
| **App** | Feature components and pages; business logic lives here, not in the design system. |

## Content Library (page content source of truth)

**Scrollable page content** (everything inside `.page`) is specified in **[vpn_content_lib.md](./vpn_content_lib.md)**. That document is the canonical reference for:

- Page composition (Page Header → Hero → Section Divider → Content Cards)
- Class names (e.g. `.page-hd`, `.shead`, `.shead-lbl`, `.shead-rule`, `.op`, `.data-grid`, `.btn-primary`). CSS keeps `.shead-label`/`.shead-line` as aliases for `.shead-lbl`/`.shead-rule`.
- Progress: Content Library §8 uses `.bar-track`/`.bar-fill` (`.ok`/`.warn`/`.crit`/`.info`) in content-library.css. Legacy: `.h-track`, `.h-fill`, `.h-fill.pct-*` (0–100) in miniapp.css. Prefer ProgressBar component or `.bar-track`/`.bar-fill` for new code.
- Error vs danger: Semantic token is `--color-error`; `--danger`, `.btn-danger`, and LEGACY_ALIASES use "danger" as the legacy name for the same semantic (see tokens/colors.ts).
- Buttons: Prefer the `Button` component and `getButtonClassName()` from `@/design-system` for consistency and theming. Raw `.btn`, `.btn-primary`, etc. in miniapp.css are legacy; migrate over time.
- Token usage (`--ui`, `--mono`, `--s1`–`--s4`, `--bd-def`, `--tx-pri`, etc.)
- Content-level constraints (Section 18)

CSS for content lives in `styles/content-library.css` and `styles/miniapp.css`; load order is `styles/index.css` → foundations (tokens + theme-consumer) → telegram DS → palette → primitives-aliases → miniapp.css → content-library.css.

## Conventions

- **Z-index:** Single source for shell: `theme/z-index.ts` (Z_HEADER, Z_NAV = 200) and `miniapp.css` `:root` (`--z-header`, `--z-nav`). Use `var(--z-*)` in CSS. `miniapp-tokens.css` / `miniapp-theme-consumer.css` set 180/210 in some theme blocks but are overridden by miniapp.css.
- **Inline vs Stack:** Prefer `Inline` for horizontal layouts (gap/align/wrap); `Stack direction="horizontal"` is equivalent — use one consistently.
- **Spacing tokens:** Primary scale is `--spacing-1`…`--spacing-16` (tokens/spacing.ts). Legacy aliases: `--sp-*` and `--ds-space-*` in miniapp-primitives-aliases.css.

## Structure

- **tokens/** — colors, spacing, radius, typography, shadows, zIndex, motion, breakpoints
- **foundations/** — theme (re-exports), css-variables.css, global.css
- **theme/** — ThemeProvider, tokens-map, z-index constants
- **primitives/** — Box, Stack, Container, Panel, Heading, Text, Divider, Inline
- **components/** — Typography, Button, forms, feedback, display
- **patterns/** — Mission*, Home*, DangerZone, ListCard, DataGrid, etc.
- **layouts/** — PageScaffold, PageHeader, PageSection
- **page-recipes/** — PageHeaderBadge, PageCardSection, other reusable page shells/recipes
- **hooks/** — useThemeMode, useBreakpoint
- **utils/** — cx (class merge), accessibility helpers
- **styles/** — CSS entry and token/component styles

## App layer contract

App-layer pages should do only three things:

- page container wiring
- route-specific orchestration
- composition of page-model hooks + `@/design-system`

Keep reusable structure in `design-system/page-recipes` or `design-system/patterns`, and keep page-level derivation in app-layer page-model hooks rather than inside TSX render branches.

Within a page, keep hierarchy singular:

- one owner for a given status signal in a page zone (`PageHeaderBadge` or hero status or section chip, not all three)
- no nested header chrome for the same block (`PageCardSection` title plus `MissionModuleHead` repeating it)

## Zero Page CSS

Miniapp pages do not own local CSS files under `src/pages`.

- Route styling must live in shared design-system styles.
- If a page needs a new structural wrapper or page-shaped layout, promote it into `design-system/page-recipes` or `design-system/patterns`.
- CI enforces this through `npm --prefix frontend run design:check -w miniapp`.

## Import Rules

- **Page-models:** Import from `@/design-system` barrel only. Allowed: `useToast`, types (`MissionChipTone`, `PageHeaderBadgeTone`, `MissionTone`). No components.
- **Pages and sub-pages:** Import from `@/design-system` barrel only. No deep paths like `@/design-system/patterns/FallbackScreen`.
- **Page-model hooks in pages:** Import from `@/page-models` barrel only. No `@/page-models/useXxxPageModel` or `@/page-models/helpers` deep paths.

## Tone Type Reference

| Component | Tone type | Allowed values |
|-----------|-----------|----------------|
| MissionChip, StandardSectionBadge | MissionChipTone | neutral, blue, green, amber, red |
| PageHeaderBadge, StandardPageBadge | PageHeaderBadgeTone | neutral, info, success, warning, danger |
| MissionCard, MissionOperationArticle | MissionTone | blue, green, amber, red (no neutral) |
| MissionProgressBar | MissionHealthTone | healthy, warning, danger |
| MissionAlert | MissionAlertTone | info, warning, error, success |

The split is intentional (chip vs header vs card semantics). Do not mix tone types.

## Token Usage Rules

- **Spacing:** Use `--spacing-1`…`--spacing-16`, `--spacing-xs`/`--spacing-sm`/`--spacing-md`/`--spacing-lg`/`--spacing-xl`, `--container-pad`, `--size-touch-target`. No hardcoded px/rem in component files.
- **Typography:** Use design-system typography tokens/classes. No inline font-size, font-weight, line-height, or letter-spacing overrides in pages or components.
- **Color:** All colors via `var(--*)` tokens. No raw hex, rgb(), hsl(), or named colors. `--tg-theme-*` scoped to token files only; consumers use design-system wrapper tokens.
- **8px grid:** All spacing values must be multiples of 8px. Document any non-8px values.

## Content Ownership

- **Model:** header, pageState, badges, hero, step content (e.g. Support TROUBLESHOOTER_STEPS), payment/plan display data.
- **Page:** section titles, structural labels, FallbackScreen fallback strings when model omits message.
- **Sub-components:** domain-specific UX copy (e.g. SetupCardContent, ConfigCardContent) when fixed per step/variant.

Deferred: move FallbackScreen fallbacks into model; move Plan `nextStepCard` config into model.
