# Button Component Audit

## Current Implementation Summary

### Components


| Component    | Location                   | Role                                              |
| ------------ | -------------------------- | ------------------------------------------------- |
| `Button`     | `shared/ui/Button.tsx`     | Primary button primitive                          |
| `ButtonLink` | `shared/ui/ButtonLink.tsx` | Link styled as button (uses `getButtonClassName`) |
| `CopyButton` | `shared/ui/CopyButton.tsx` | Composed: `Button` + clipboard + toast            |


---

## Variants (current)


| Variant   | CSS class     | Used                      |
| --------- | ------------- | ------------------------- |
| primary   | btn-primary   | Default, CTAs             |
| secondary | btn-secondary | Cancel, secondary actions |
| ghost     | btn-ghost     | Tertiary, icon buttons    |
| danger    | btn-danger    | Destructive actions       |


**Missing (per spec):** `outline`, `link`

---

## Sizes (current)


| Size | CSS    | min-height |
| ---- | ------ | ---------- |
| sm   | btn-sm | 28px       |
| md   | btn-md | 36px       |
| lg   | btn-lg | 44px       |


**Missing:** `icon` (square, icon-only size)

**Special:** `kind="connect"` overrides size to lg and adds `.connect-button` (font-weight 600, padding).

---

## States (current)


| State         | Implemented | Notes                                     |
| ------------- | ----------- | ----------------------------------------- |
| default       | ✅           |                                           |
| hover         | ✅           | Via CSS                                   |
| active        | ✅           | `transform: translateY(1px)`              |
| focus-visible | ✅           | `outline: 2px solid var(--color-primary)` |
| disabled      | ✅           | `opacity: 0.6`, `cursor: not-allowed`     |
| loading       | ✅           | `aria-busy`, spinner, disabled            |


---

## Icon Behavior (current)

- No `startIcon`, `endIcon`, or `iconOnly` props.
- Icons are inline children with `<span aria-hidden>…</span>` or emoji.
- CopyButton: icon + VisuallyHidden label; aria-label on Button.
- Icon-only buttons use `aria-label` manually (e.g. `aria-label="Copy server ID"`).
- **Risk:** No enforcement that icon-only has aria-label.

---

## API Issues

1. `**asChild` declared but NOT implemented** — Button passes props to `<button>`; child Link gets no styling. Usage in Settings, OutlineIntegrations renders `<button><Link>…</Link></button>` (invalid HTML). Should use ButtonLink.
2. **No `forwardRef`** — Cannot pass ref to underlying button.
3. **No `startIcon`/`endIcon`** — Inconsistent icon patterns.
4. **No `iconOnly`** — No validation of aria-label.
5. **No `fullWidth`** — Layout overrides via className.
6. **No `loadingText`** — Children change during loading (e.g. "Saving...") causing layout shift.

---

## Per-Page / Override CSS


| Location      | Override                                                                         | Issue                                          |
| ------------- | -------------------------------------------------------------------------------- | ---------------------------------------------- |
| `admin.css`   | `.admin-main .btn-primary { border-radius: var(--radius-lg); }`                  | Primary buttons in main area get larger radius |
| `admin.css`   | `.admin-sidebar-footer .btn { padding-inline: var(--spacing-2); min-width: 0; }` | Sidebar footer buttons shrunk                  |
| `admin.css`   | `.login-btn { margin-top: var(--spacing-sm); }`                                  | Layout via className                           |
| `miniapp.css` | `.miniapp-main .btn-primary { border-radius: var(--radius-lg); }`                | Same as admin-main                             |


These should be removed; design spec should define one canonical look.

---

## Raw / Legacy Button Usage (not using Button)


| File                    | Element              | Class / Pattern                                       |
| ----------------------- | -------------------- | ----------------------------------------------------- |
| `AdminLayout.tsx`       | `<button>`           | `admin-menu-btn` (hamburger)                          |
| `Billing.tsx`           | `<button>`           | `telemetry-tab` (tab)                                 |
| `QrPanel.tsx`           | `<button>`           | `btn btn-ghost btn-sm` (raw classes)                  |
| `AuthGuard.tsx`         | `<button>`           | `btn btn-primary mt-md`                               |
| `Users.tsx`             | `<button>`, `<Link>` | `data-table-action-btn`                               |
| `Tabs.tsx`              | `<button>`           | `ref-tab` (tab)                                       |
| `Servers.tsx`           | `<Button>`           | `ref-preset-btn` + `ref-preset-active` (toggle group) |
| `Telemetry.tsx`         | `<button>`           | Custom tab                                            |
| `DropdownMenu.tsx`      | menu item            | `dropdown-menu-item btn btn-ghost btn-sm`             |


---

## Inconsistencies

1. **Tab components** — Billing, Tabs, Telemetry use raw styled buttons; different focus/keyboard handling.
2. **Table action buttons** — `data-table-action-btn` is a custom ghost/icon style; could map to `Button variant="ghost" size="icon"`.
3. **QrPanel download** — Raw `btn btn-ghost btn-sm`; should use `Button`.
4. **AuthGuard** — Raw `btn btn-primary`; should use `Button`.
5. **asChild usage** — Settings/OutlineIntegrations use `Button asChild`; broken. Replace with `ButtonLink`.

---

## Token Usage

- All colors, spacing, radius use design tokens (`--color-`*, `--spacing-*`, `--radius-*`). ✅
- No random hex/px scattered. ✅

---

## Migration Priorities

1. Fix `asChild` usages → use `ButtonLink`.
2. Replace raw buttons in QrPanel, AuthGuard with `Button`.
3. Add `outline`, `link` variants and `icon` size per spec.
4. Add `startIcon`, `endIcon`, `iconOnly` with aria-label enforcement.
5. Implement `asChild` (Radix Slot) or deprecate and use ButtonLink.
6. Add `forwardRef`, `fullWidth`, `loadingText`.
7. Remove per-page overrides (admin-main, miniapp-main, sidebar-footer, login-btn).
8. Unify tab styling (consider shared Tab component) or keep tabs separate (different semantics).
9. Replace `data-table-action-btn` with `Button variant="ghost" size="icon"` + aria-label.
