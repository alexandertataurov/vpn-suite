# UI Alignment Backlog (Single Source)

This backlog consolidates the actionable UI/design alignment work across **admin**, **miniapp**, and **shared**.

**Sources**
- `docs/frontend/audits/admin-ui-gap-analysis.md`
- `docs/frontend/audits/ui-inconsistencies.md`
- `docs/audits/ui-audit.md`
- `docs/frontend/tables/table-unification-audit.md`
- `docs/audits/tables-audit.md`
- `docs/frontend/components/component-inventory.md`

---

## A. Foundations (tokens, theming, typography)

- [ ] **Consumer theme mapping (miniapp)**: add consumer semantic mappings that keep **semantic token names identical** (`--color-bg`, `--color-text`, `--color-accent`, …) while changing the values for miniapp brand.
  - **Touches**: `frontend/miniapp/src/design-system/styles/tokens/base.css`
  - **Outcome**: miniapp can use `data-theme="consumer-light"` / `data-theme="consumer-dark"` without hardcoding colors.

- [ ] **Dim theme correctness**: `ThemeProvider` supports `"dim"`, and `tokens/colors.json` defines it, but ensure token build outputs `html[data-theme="dim"] { … }`.
  - **Touches**: `frontend/admin/src/design-system/tokens/tokens.css`

- [ ] **Theme mounting consistency**: standardize per-app defaults and allowed themes.
  - **Admin**: `dark | light | dim`
  - **Miniapp**: `consumer-light | consumer-dark`
  - **Touches**: `frontend/admin/src/main.tsx`, `frontend/miniapp/src/main.tsx`

---

## B. Shared UI primitives (missing / inadequate / drift)

### Missing primitives that drive divergence
- [ ] **Radio / RadioGroup** (explicitly missing in inventories; common form need)
  - **Target**: `frontend/admin/src/design-system/primitives/` (admin) and/or `frontend/miniapp/src/design-system/` (miniapp)
  - **DoD**: token-only styling, keyboard accessible, Storybook stories.

- [ ] **Tooltip** (only chart tooltips exist; add if any UI needs it outside charts)
  - **DoD**: accessible (`aria-describedby`, focus/hover, Escape), token-only styling, Storybook stories.

### “Exists but inadequate” (from admin-ui-gap-analysis)
- [ ] **SearchInput**: replace string className concat with `cn()` and align label/error structure with `Field` where possible.
  - **File**: `frontend/admin/src/design-system/primitives/Input.tsx` (or a dedicated SearchInput primitive if still needed)

- [ ] **Select**: add optional loading/empty affordances (keep native select; do not introduce combobox unless needed).
  - **File**: `frontend/admin/src/design-system/primitives/` (Select-equivalent) or feature-local wrapper

### Reuse opportunities (reduce app-local duplication)
- [ ] **Copy patterns**: ensure ad-hoc clipboard logic is replaced by shared `CopyButton` / `CodeBlock` where applicable.
  - **Targets**: `frontend/admin/src/components/IssueConfigModal.tsx`, `frontend/admin/src/components/ConfigContentModal.tsx`, logs viewers.

---

## C. Tables (enforce canonical system everywhere)

> Canonical table kit is in `frontend/admin/src/design-system/primitives/` and documented in `docs/frontend/tables/*`.

- [ ] **Servers page**: remove manual table styling drift; ensure selection, density, virtualization, and stale-row styling are all within the unified table system APIs/classes.
  - **Primary**: `frontend/admin/src/features/servers/ServersPage.tsx`

- [ ] **Telemetry DockerOverview**: confirm grid-table uses unified `data-table-grid-*` styles and shared tokens.
  - **Primary**: `frontend/admin/src/features/telemetry/TelemetryPage.tsx`

- [ ] **Miniapp tables/empty states**: ensure `.table-empty` and Table components behave consistently under consumer theme.

---

## D. App migrations (admin + miniapp)

### Admin
- [ ] Replace deprecated classes from `docs/frontend/design/ui-guide.md` where still present (`ref-action-btn*`, `ref-settings-card`, `dashboard-muted`, `dashboard-value`, etc.).
- [ ] Contain page CSS to layout-only (no new visual hardcoding).

### Miniapp
- [ ] Ensure consumer theme is used (no reliance on admin operator tokens).
- [ ] Replace any remaining app-local controls with `@vpn-suite/shared/ui` primitives.
- [ ] Standardize feedback states (loading/empty/error) to shared components.

---

## E. Strict gates (prevent new UI drift)

- [ ] **Foundations lint**: run + enforce `npm run foundations:lint -w shared` in the normal workflow.
- [ ] **Storybook gate**: enforce `npm run storybook:check -w shared` and `npm run build-storybook -w shared`.
- [ ] **“No raw hex/rgb/hsl” check**: add a repo-local check (per `frontend/shared/docs/DESIGN_SYSTEM_GUARDRAILS.md`) scoped to `frontend/` with explicit allowlist.

---

## F. Verification (definition of done)

- [ ] **Admin route baseline**: Dashboard, Servers, Telemetry, Settings, Styleguide.
- [ ] **Miniapp route baseline**: Home, Plans, Checkout, Devices/Profile.
- [ ] **A11y**: keyboard navigation, focus-visible, overlay semantics (Modal/Drawer), contrast.
- [ ] **Perf sanity**: no layout thrash, keep motion ≤ 200ms where specified.

