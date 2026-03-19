# Miniapp design system

Single entry for layout, page recipes, patterns, components, primitives, tokens, theme, icons, hooks, and utils. Import reusable UI from `@/design-system`.

## Theme Runtime

Miniapp uses **consumer-light** | **consumer-dark** only. See [THEME-RUNTIME.md](./THEME-RUNTIME.md) for load order and deprecations.

## Architecture

The design system follows a **layered model**. Each layer has strict responsibilities; see **[architecture.md](./architecture.md)** for the full guide, **[enforcement-checklist.md](./enforcement-checklist.md)** for PR/CI checks, and **[mobile-platform-guidelines.md](./mobile-platform-guidelines.md)** for iOS/Android-compatible mobile UI rules.

| Layer | Responsibility |
|-------|----------------|
| **Tokens** | Single source of truth for colors, spacing, typography, radius, shadows, motion, breakpoints. Use via CSS `var(--*)` or tokens/*.ts. |
| **Theme** | Theme config, CSS variables (tokens + theme consumer), global/reset. |
| **Primitives** | Low-level layout and typography (Box, Stack, Text, Heading, etc.). No business logic. |
| **Components** | Reusable UI (Button, Input, Modal, Toast, etc.). Consistent variant/size/tone APIs. |
| **Patterns** | Composed structures (FormField, PageHeader, Hero blocks). No data fetching. |
| **Layouts / Recipes** | Canonical page-shaped wrappers built from layouts + patterns (header badges, card sections, hero-first page blocks). |
| **App** | Feature components and pages; business logic lives here, not in the design system. |

## Content Library (page content source of truth)

**Scrollable page content** (everything inside `.page`) is specified in **[content-library.md](./content-library.md)**. That document is the canonical reference for:

- Page composition (Page Header → Hero → Section Divider → Content Cards)
- Class names (e.g. `.page-hd`, `.shead`, `.shead-lbl`, `.shead-rule`, `.op`, `.data-grid`, `.btn-primary`). CSS keeps `.shead-label`/`.shead-line` as aliases for `.shead-lbl`/`.shead-rule`.
- Plan hero patterns: `.plan-hero` (library.css) is the legacy content-library hero block. `PlanCard` (with optional `eyebrow`) is the Amnezia-spec implementation. Prefer `PlanCard` for new code.
- Progress: Prefer `ProgressBar` component or `.progress-bar-fill` (frame.css). Legacy: `.h-track`, `.h-fill`, `.h-fill.pct-*` (0–100) in shell/frame.css.
- Error vs danger: Semantic token is `--color-error`; `.btn-danger` uses "danger" as legacy name for the same semantic (see tokens/colors.ts).
- Buttons: Prefer the `Button` component and `getButtonClassName()` from `@/design-system` for consistency and theming. Raw `.btn`, `.btn-primary`, etc. in shell/frame.css are legacy; migrate over time. See **Mission\* vs Button** below.
- Token usage (`--ui`, `--mono`, `--s1`–`--s4`, `--bd-def`, `--tx-pri`, etc.)
- Content-level constraints (Section 18)

CSS for content lives in `styles/content/library.css` and `styles/shell/frame.css`; load order is `styles/index.css` → tokens/base.css → theme/telegram.css → theme/consumer.css → layout/zones.css → shell/frame.css → content/library.css.

## Conventions

- **Z-index:** Single source for shell: `theme/z-index.ts` (Z_HEADER, Z_NAV = 200) and shell/frame.css `:root` (`--z-header`, `--z-nav`). Use `var(--z-*)` in CSS. `tokens/base.css` / `theme/consumer.css` set 180/210 in some theme blocks but are overridden by shell.
- **Inline vs Stack:** Prefer `Inline` for horizontal layouts (gap/align/wrap); `Stack direction="horizontal"` is equivalent — use one consistently.
- **Spacing tokens:** Primary scale is `--spacing-1`…`--spacing-16` (tokens/spacing.ts). Legacy aliases: `--sp-*` and `--ds-space-*` in miniapp-primitives-aliases.css.

## Library structure

Layers: **tokens** → **theme** → **primitives** → **components** → **patterns** → **recipes** → App. Layouts and styles support structure and theming.

| I want to… | Folder |
|------------|--------|
| Change a color, spacing, or motion token | `tokens/`, `theme/` |
| Add a layout building block (box, stack, text) | `primitives/` |
| Add a form control or button | `components/forms/`, `components/buttons/` |
| Add feedback (modal, toast, skeleton) | `components/feedback/` |
| Add a page block (card, hero, empty state) | `patterns/blocks/`, `patterns/cards/`, `patterns/home/` |
| Add a Mission-style card/chip/alert | `patterns/mission/` |
| Add a page-shaped wrapper (header badge, card section) | `recipes/` |

## Structure

- **tokens/** — colors, spacing, radius, typography, shadows, zIndex, motion, breakpoints
- **theme/** — ThemeProvider, tokens-map, z-index constants
- **primitives/** — Layout (Box, Container, Inline, Panel, Stack) → Separator (Divider) → Typography (Text, Heading). See [primitives/README.md](../../src/design-system/primitives/README.md).
- **components/** — typography (Display, H1–H3, Body, Caption) → Buttons → Forms → Feedback → Display → Utility. See [components/README.md](../../src/design-system/components/README.md).
- **patterns/** — Grouped by domain: `mission/` (Mission*), `content/` (FormField, ButtonRow, ContentForms/ContentButtons), `blocks/` (FallbackScreen, PageStateScreen, EmptyStateBlock, OfflineBanner), `cards/` (ListCard, ServerCard), `home/` (Home*), `ui/` (DataGrid, StatusChip, OverflowActionMenu). Product-specific patterns (heroes, tier/usage/billing cards, DangerZone, LimitStrip, TroubleshooterStep, SessionMissing) live in `src/components` and are imported from `@/components`.

### Field vs FormField

- **Field** (components/forms): label + slot + description + error; uses Label, HelperText; semantic structure. Prefer for new forms.
- **FormField** (patterns/content/ContentForms): content-library class-based (`.field-group`, `.field-label`); different API (label, input, action). Use for content-library layouts.
- **layouts/** — PageScaffold, PageSection, SectionDivider, ScrollZone, HeaderZone, ShellContextBlock, StickyBottomBar; layout CSS in styles/layout/zones.css
- **recipes/** — Grouped by page: `shared/` (PageHeader, PageHeaderBadge, PageCardSection, FooterHelp, HelperNote), `home/` (ModernHeader, ProfileRow, PlanCard, RenewalBanner, NewUserHero, NoDeviceCallout, ModernHeroCard), `support/` (FaqDisclosureItem), `settings/` (LabeledControlRow), `devices/` (CompactSummaryCard), `flow/` (CompactStepper). For settings-style action rows, use **ListRow** (patterns/cards).
- **hooks/** — useThemeMode, useBreakpoint
- **utils/** — getAriaLabelProps (accessibility). Class merge: use `cn` from `@vpn-suite/shared`.
- **styles/** — CSS entry and token/component styles

## App layer contract

App-layer pages should do only three things:

- page container wiring
- route-specific orchestration
- composition of page-model hooks + `@/design-system`

Keep reusable structure in `design-system/recipes` or `design-system/patterns`, and keep page-level derivation in app-layer page-model hooks rather than inside TSX render branches.

Within a page, keep hierarchy singular:

- one owner for a given status signal in a page zone (`PageHeaderBadge` or hero status or section chip, not all three)
- no nested header chrome for the same block (`PageCardSection` title plus `MissionModuleHead` repeating it)

## Route Styling Contract

Miniapp pages do not own local CSS files under `src/pages`.

- Reusable UI styling lives in `design-system/styles/`.
- Route-owned page-family presentation lives in `src/styles/app/`.
- `design-system/styles/` must not contain page ancestor selectors such as `.home-page` or `.settings-page`.
- If a page needs a reusable structural wrapper or page-shaped layout, promote it into `design-system/recipes` or `design-system/patterns`.
- CI enforces this through `npm run design:check`.

## Import Rules

- **Page-models:** Import from `@/design-system` barrel only. Allowed: `useToast`, types (`MissionChipTone`, `PageHeaderBadgeTone`, `MissionTone`). No components.
- **Pages and sub-pages:** Import from `@/design-system` barrel by default. The only allowed direct imports are chunk-safe ownership paths:
  `@/design-system/layouts/PageFrame`,
  `@/design-system/patterns/FallbackScreen`,
  `@/design-system/patterns/PageStateScreen`.
- **Page-model hooks in pages:** Import from `@/page-models` barrel only. No `@/page-models/useXxxPageModel` or `@/page-models/helpers` deep paths.

## Storybook taxonomy

- `Foundations` for tokens, theme, motion, spacing, color, breakpoints, environment parity.
- `Primitives` for low-level layout and typography building blocks.
- `Components` for reusable controls and feedback primitives like Button, Input, Modal, Toast, Popover, InlineAlert, Skeleton.
- `Patterns` for composed reusable structures.
- `Layouts` for shell and page-composition contracts, including page recipes.
- `Pages/Contracts` for production-faithful route coverage.
- `Pages/Sandbox` for redesign and side-by-side review boards.
- `States` for cross-cutting state contracts.

`npm run storybook:taxonomy` and `npm run design:check` enforce this structure.

## Tone Type Reference

| Component | Tone type | Allowed values |
|-----------|-----------|----------------|
| MissionChip, StandardSectionBadge | MissionChipTone | neutral, blue, green, amber, red |
| PageHeaderBadge, StandardPageBadge | PageHeaderBadgeTone | neutral, info, success, warning, danger |
| MissionCard, MissionOperationArticle | MissionTone | blue, green, amber, red (no neutral) |
| MissionProgressBar | MissionHealthTone | healthy, warning, danger |
| MissionAlert | MissionAlertTone | info, warning, error, success |

The split is intentional (chip vs header vs card semantics). Do not mix tone types.

## Mission* vs Button

Use the design-system components for buttons and button groups; avoid raw class names.

| Use | For |
|-----|-----|
| `Button` | Base button with `variant`, `size`, `tone`, `loading`, `iconOnly`. Use for custom flows or when Mission* variants don't fit. |
| `MissionPrimaryButton` | Primary CTA (blue); thin wrapper over `Button variant="primary" size="lg"` with optional `tone` (default, warning, danger). |
| `MissionSecondaryButton` | Secondary action (outline-style). |
| `MissionPrimaryLink` | Primary-styled link (`<Link>`). Use when the action navigates. |
| `MissionSecondaryLink` | Secondary-styled link. |
| `getButtonClassName()` | For link elements styled as buttons (e.g. `<a className={getButtonClassName("primary", "lg")}>`). |
| `ButtonRow` | Two-column button layout (1fr 1fr). **Always use `ButtonRow`**, not `div className="btn-row"`. |
| `ButtonRowAuto` | Primary full-width + secondary auto-width layout. |

Raw `.btn-primary`, `.btn-secondary`, `.btn-row` are legacy. New code must use `Button` / `Mission*` + `ButtonRow`.

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
lan `nextStepCard` config into model.
