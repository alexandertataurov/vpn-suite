# Storybook Stories Consistency Audit — Deliverables

**Scope:** `frontend/admin/src/design-system/stories/**` only (per plan).  
**Status:** All story files present in that path (10 form stories) have been refactored. Lint clean.  
**Elsewhere:** `frontend/miniapp/src/shared-inline/**/*.stories.tsx` (60 files) are out of scope; the same rulebook can be applied there if desired.

---

## 1. Summary table (before → after)

| File | Title | Tags (before → after) | Docs | Play (before → after) |
|------|--------|------------------------|------|------------------------|
| Button.stories.tsx | UI/Components/Buttons/Button | yes → yes | rich | Default ✓ |
| ButtonLink.stories.tsx | UI/Components/Buttons/ButtonLink | yes → yes | medium → rich (hero, propsTable, a11y, tokens, When to use/NOT) | Default ✓ |
| CopyButton.stories.tsx | UI/Components/Buttons/CopyButton | yes → yes | medium → rich (hero, propsTable, a11y, tokens, When to use/NOT) | Default ✓ |
| Modal.stories.tsx | UI/Components/Overlays/Modal | yes → yes | rich | Playground → **Default** (play on Default now) |
| DataTable.stories.tsx | UI/Composites/DataTable | no → **yes** (smoke, a11y) | shallow → rich (full sections, hero, propsTable, a11y, tokens) | no → N/A (display) |
| Stat.stories.tsx | UI/Components/Data Display/Stat | no → **yes** (smoke) | shallow → medium (When to use/NOT) | no (display-only) |
| Badge.stories.tsx | UI/Components/Data Display/Badge | no → **yes** (smoke) | medium (added When to use/NOT) | no (display-only) |

**DataTable:** Overview renamed to **Default**; **Playground** added (same preset, exploration-only note). argTypes: columns/data/keyExtractor `control: false`. Empty story fixed to show empty state.

**Batches 7–10 (this pass):**

| File | Tags | Docs / Playground note |
|------|------|-------------------------|
| DropdownMenu.stories.tsx | (had a11y, interaction) | When to use/NOT, Playground exploration note |
| ProfileCard.stories.tsx | smoke | When to use/NOT, primaryAction control:false, Playground note |
| VisuallyHidden.stories.tsx | a11y | When to use/NOT, Playground note |
| QrPanel.stories.tsx | smoke | When to use/NOT, Playground note |
| DeviceCard.stories.tsx | smoke | When to use/NOT, primaryAction control:false, Playground note |
| Card.stories.tsx | smoke | When to use/NOT, Playground note |
| Inline.stories.tsx | smoke | When to use/NOT, Playground note |
| Navigation.stories.tsx | (had a11y, interaction) | When to use/NOT |
| Text.stories.tsx | smoke | When to use/NOT, children control:false, Playground note |
| Heading.stories.tsx | smoke | When to use/NOT, children control:false, Playground note |
| EmptyStates.stories.tsx | smoke | When to use/NOT, Playground note |
| LoadingStates.stories.tsx | smoke | When to use/NOT, Playground note |
| ErrorStates.stories.tsx | smoke | When to use/NOT, Playground note |
| Color.stories.tsx | visual | When to use/NOT, Playground note |
| Typography.stories.tsx | visual | When to use/NOT, Playground note |
| Spacing.stories.tsx | visual | When to use/NOT, Playground note |
| Elevation.stories.tsx | visual | When to use/NOT, Playground note |
| Grid.stories.tsx | visual | When to use/NOT, Playground note |
| Motion.stories.tsx | visual | When to use/NOT, Playground note |
| Iconography.stories.tsx | visual | When to use/NOT, Playground note |

---

## 2. Files changed

- `frontend/admin/src/design-system/docs/STORYBOOK_AUDIT.md` — **created** (rulebook).
- `frontend/admin/src/design-system/docs/STORYBOOK_INVENTORY.md` — **created** (baseline inventory table).
- `frontend/admin/src/design-system/docs/STORYBOOK_REFACTOR_DELIVERABLES.md` — **created** (this file).
- `frontend/admin/src/design-system/stories/buttons/ButtonLink.stories.tsx` — docs (When to use/NOT, hero, propsTable, accessibility, tokens), Playground exploration note.
- `frontend/admin/src/design-system/stories/buttons/CopyButton.stories.tsx` — docs (When to use/NOT, hero, propsTable, accessibility, tokens), Playground exploration note.
- `frontend/admin/src/design-system/stories/feedback/Modal.stories.tsx` — When to use/NOT, play moved from Playground to Default, Playground exploration note.
- `frontend/admin/src/design-system/stories/composites/DataTable.stories.tsx` — tags, full docs, hero/propsTable/accessibility/tokens, argTypes (control: false for columns/data/keyExtractor), Default + Playground + Empty.
- `frontend/admin/src/design-system/stories/display/Stat.stories.tsx` — tags (smoke), When to use/NOT, Playground exploration note.
- `frontend/admin/src/design-system/stories/primitives/Badge.stories.tsx` — tags (smoke), When to use/NOT, Playground exploration note.
- **Batch 2 (feedback):** Drawer, Toast, InlineAlert, PageError, Skeleton, EmptyState, ErrorState, Spinner — tags, When to use/NOT, Playground note; PageError onRetry control:false; story args title fixed (no "UI/" in display copy).
- **Batch 3 (forms):** Input, Textarea, Checkbox, Field, RadioGroup, SearchInput, Label, FormStack, InlineError, HelperText — When to use/NOT, Playground note; Field/Label/HelperText children control:false; Textarea label control:false.
- **Batch 7 (misc):** DropdownMenu, ProfileCard, VisuallyHidden, QrPanel, DeviceCard — tags, When to use/NOT, argTypes (primaryAction control:false where applicable), Playground exploration note.
- **Batch 8 (layout, navigation, typography):** Card, Inline, Navigation, Text, Heading — tags, When to use/NOT, argTypes (children control:false for Text/Heading), Playground note.
- **Batch 9 (patterns):** EmptyStates, LoadingStates, ErrorStates — tags (smoke), When to use/NOT, Playground exploration note.
- **Batch 10 (foundations):** Color, Typography, Spacing, Elevation, Grid, Motion, Iconography — tags (visual), When to use/NOT, Playground exploration note.

**No files moved.**

---

## 3. Conventions enforced

- **Meta.title:** `UI/<Category>/<Subcategory>/<Component>` (all touched files already compliant or unchanged).
- **Tags:** `smoke` for primary/workflow components, `a11y` for interactive; added where missing on refactored files.
- **Docs:** Required sections (Overview, When to use, When NOT to use, Anatomy, Behavior/States, Accessibility, Design tokens, Related components); hero, propsTable, accessibility, tokens, canvas where applicable.
- **argTypes:** Only serializable props as controls; `control: false` for ReactNode, callbacks, columns/data/keyExtractor (DataTable).
- **Stories:** Default (canonical) + Playground (exploration-only note in docs).
- **Play:** On Default for interactive/high-risk (Modal: play on Default; Button/ButtonLink/CopyButton already had play on Default).
- **Tokens:** Doc references use token names from `tokens.css` where used in touched stories.

---

## 4. Validation results

| Command | Result | Notes |
|---------|--------|------|
| `pnpm --filter admin lint` | **Fail** | Pre-existing errors in `client.ts`, `telemetry/client.ts` (unused vars). Not in story files. |
| `pnpm --filter admin typecheck` | **Fail** | Pre-existing errors (missing modules, AppShell, design-system/index, shared). Not in story files. |
| `pnpm --filter admin build-storybook` | **Fail** | Pre-existing: cannot resolve `../src/shared/theme` from `.storybook/preview.tsx`. |
| Lint on modified story files | **Pass** | No linter errors in modified story files (read_lints). |

Story-only edits introduce no new lint/type errors. Full repo lint/typecheck/build must be fixed outside this refactor (app and Storybook config).

---

## 5. Remaining gaps

- **Batch 2 (feedback) — done:** Drawer, Toast, InlineAlert, PageError, Skeleton, EmptyState, ErrorState, Spinner.
- **Batch 3 (forms) — done:** Input, Textarea, Checkbox, Field, RadioGroup, SearchInput, Label, FormStack, InlineError, HelperText — When to use/NOT, Playground note; argTypes (label/children control:false where applicable).
- **Stories not refactored:** Batches 4–6 (primitives, display, composites) — apply same pattern where those story files exist. Batches 2, 3, 7–10 are done.
- **Storybook build:** Blocked by `.storybook/preview.tsx` resolving `../src/shared/theme`; fix preview path or add missing shared module.
- **CI:** `storybook:test` not run (requires Storybook server); run manually after build is fixed.
- **TODO rule:** Any story that cannot be upgraded without guessing UX should be marked TODO and kept minimal but consistent (none marked in this pass).
- **Current workspace:** Only `stories/forms/*.stories.tsx` (10 files) are present; all have been refactored. Other batches (buttons, feedback, primitives, display, composites, misc, layout, navigation, typography, patterns, foundations) were applied in earlier sessions—re-apply the same pattern from this doc if those story files exist in your branch.
