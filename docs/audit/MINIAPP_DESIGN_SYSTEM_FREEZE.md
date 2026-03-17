## Telegram Mini App — Design-System Freeze for Beta

Version: `v0.1-beta-launch`

Scope: `frontend/miniapp/src/design-system`

This document freezes the **allowed primitives** and layout rules for the mini app beta.
New screens must compose from these building blocks; no one-off page-specific systems.

---

### 1. Allowed primitives (canonical implementations)

**Page**

- Canonical shell: `PageFrame` (`design-system/layouts/PageFrame.tsx`)
  - Uses `PageScaffold` + `PageHeader` + `HeaderBell`.
  - Responsible for title, subtitle, header actions, and notification bell.
- Low-level scaffold: `PageScaffold` (`design-system/layouts/PageScaffold.tsx`)
  - Applies `miniapp-page-scaffold page` class; owns page padding and background.
- Rule:
  - All beta‑critical pages should use `PageFrame` unless a full-screen special case
    (e.g. `PageStateScreen`) is explicitly documented.

**TopBar**

- `PageHeader` + `HeaderBell` + optional `headerAction` (via `PageFrame`).
- Rule:
  - No custom, page-local header bars; use `PageFrame` and its header wiring.

**Section**

- Layout section primitives:
  - `PageSection`, `SectionDivider`, `ShellContextBlock` (layouts).
  - `Stack`, `Inline`, `Container` (primitives) for vertical/horizontal grouping.
- Rule:
  - Use `PageSection` for vertical grouping within a page.
  - Use `Container` for horizontal padding/width, not raw `div` with custom padding.

**Card**

- Structural primitives:
  - `Panel` (`design-system/primitives/Panel.tsx`) — generic card shell.
  - `ListCard` (`design-system/patterns/ListCard.tsx`) — list-style cards.
  - `HomeHeroPanel`, `MissionCard` — specialized hero/state cards.
- Rule:
  - For generic cards, prefer `Panel`.
  - For list rows with card treatment, prefer `ListCard`.
  - Do not introduce new `card-*` class shells for beta.

**Button**

- Canonical button: `Button` (`design-system/components/Button/`).
  - Variants: `primary`, `secondary`, `ghost`, `outline`, `danger`, `link`.
  - Sizes: `sm`, `md`, `lg`, `icon`.
  - Special `kind="connect"` for primary connection/setup CTAs.
- Rule:
  - All clickable CTAs use `Button` (or `asChild` with `getButtonClassName`).
  - No raw `<button>` / `<a>` with custom classes for primary actions.

**Input**

- Form primitives:
  - `Field`, `Label`, `HelperText`, `Input`, `Select`, `Textarea`
    (`design-system/components/forms`).
- Rule:
  - Always wrap inputs in `Field` with `Label` and optional `HelperText`.
  - No custom input styling outside these primitives.

**ListItem / Row**

- Recommended patterns:
  - `LabeledControlRow` (`design-system/page-recipes/LabeledControlRow.tsx`)
  - `DataGrid` (`design-system/patterns/DataGrid.tsx`) for denser tabular content.
- Rule:
  - Settings-style rows: use `LabeledControlRow`.
  - Data tables: use `DataGrid` where possible, else reuse its spacing and typography.

**StatusBadge**

- Canonical badge: `StatusChip` (`design-system/patterns/StatusChip.tsx`).
  - Variants: `active`, `paid`, `info`, `pend`, `offline`.
- Rule:
  - All pill/badge status indicators use `StatusChip`.
  - No additional bespoke badge color systems for beta.

**Modal**

- Canonical modal: `Modal` (`design-system/components/feedback/Modal.tsx`).
- Rule:
  - All blocking overlays must use `Modal`.
  - No ad‑hoc full-screen overlays without `Modal` unless explicitly justified.

**EmptyState**

- List‑level empty: `EmptyStateBlock` (`design-system/patterns/EmptyStateBlock.tsx`).
  - Tones via `MissionAlert` with `tone="info"`.
- Page‑level empty/error: `PageStateScreen` (`design-system/patterns/PageStateScreen.tsx`).
- Rule:
  - Per-list “no data yet” → `EmptyStateBlock`.
  - Page‑blocking / auth / fatal error states → `PageStateScreen`.

**ErrorState**

- Inline errors: `InlineAlert` (`components/feedback/InlineAlert.tsx`).
- Page‑blocking errors: `PageStateScreen` with alert tone set appropriately.
- Rule:
  - Prefer `InlineAlert` near the failed action.
  - Escalate to `PageStateScreen` only when the whole page is non-interactive.

**LoadingState**

- Skeletons: `Skeleton` (`components/feedback/Skeleton.tsx`).
- Global/app bootstrap: existing bootstrap/loading layers in `app/`.
- Rule:
  - Use `Skeleton` for structured loading (lists, cards, forms).
  - Avoid generic “Loading…” text without skeletons on main flows.

---

### 2. Layout and spacing rules (beta)

**Page padding**

- Horizontal padding:
  - Owned by `PageScaffold` + `Container`.
  - Do not add custom `padding-inline` on pages; wrap content in `Container` instead.

**Section gaps**

- Vertical spacing:
  - Use `Stack` (`primitives/Stack.tsx`) for vertical stacking with consistent gap.
  - Avoid hard-coded margin stacks (e.g. `mt-4 mb-6`) on each section.

**Card padding**

- Use the default internal padding from `Panel`, `ListCard`, and hero/state cards.
- Avoid per-card padding overrides unless required for dense tables.

**Button height & radius**

- Heights and radii are encoded in `.btn-*` classes used by `Button`.
- Rule:
  - Do not override button `border-radius` or `height` with local CSS.

**Input height**

- Inputs inherit consistent sizing from `Input`, `Select`, `Textarea`.
- Rule:
  - Do not locally override line-height or padding on form controls.

**Icon size rules**

- Icon sizing is driven by button/row typography.
- Rule:
  - Icons inside buttons use the `btn-icon-slot` treatment from `Button`.
  - Do not introduce new arbitrary icon sizes; follow existing patterns.

**Typography hierarchy**

- Titles: `Heading` or `PageFrame` title.
- Body/copy: `Text` (`primitives/typography` or `components/Typography`).
- Rule:
  - Page titles come from `PageFrame`.
  - Do not introduce new ad-hoc font sizes for headers.

**State colors**

- Use:
  - `StatusChip` variants for state badges.
  - `MissionAlert` tones for alerts and `EmptyStateBlock`.
  - Button `tone` for warning/danger primary actions.
- Rule:
  - No new ad‑hoc colors; map to existing tones/variants only.

---

### 3. Mapping pages to primitives (beta)

This is the target composition for beta‑critical pages:

- `Onboarding`: `PageFrame` + `PageSection` + hero `Panel` + primary `Button`.
- `Home`: `PageFrame` + summary `Panel` + `StatusChip` + `Button` primary CTA.
- `Plan`: `PageFrame` + `Panel` for plan cards + `StatusChip` where needed.
- `Checkout`: `PageFrame` + compact summary `Panel` + primary `Button`.
- `ConnectStatus`: `PageFrame` + `Panel` or `PageStateScreen` + `StatusChip`.
- `Devices`: `PageFrame` + `ListCard` / `DataGrid` rows + `EmptyStateBlock`.
- `ServerSelection`: `PageFrame` + `ListCard` rows + `StatusChip`.
- `Referral`: `PageFrame` + `Panel` + `EmptyStateBlock` for no‑data state.
- `RestoreAccess`: `PageFrame` + `PageStateScreen` for blocking flows.
- `Settings`: `PageFrame` + `LabeledControlRow` rows.
- `Support`: `PageFrame` + `Panel` with `Button` CTAs and `InlineAlert` as needed.

Any necessary deviations must be documented in a per‑page audit note and treated
as candidates for post‑beta cleanup.

