# Settings Audit — Continued (2026-03-18)

**Scope**: PageHeader visual verification, remaining drift, next actions.

---

## 1. PageHeader — Visual Verification (Settings)

From Settings page screenshots:

| Element | Current | Token / Status |
|---------|---------|----------------|
| Back button | Circular, subtle border, lighter bg | `var(--size-page-header-back)` (34px) ✓ |
| Back icon | Chevron left | 14×14px hardcoded in PageHeader.css |
| Gap (button ↔ title) | ~12px | `var(--miniapp-grid-gap)` = `var(--spacing-3)` ✓ |
| Title | Bold white | `var(--font-size-lg)`, `var(--font-weight-bold)`, `var(--color-text)` ✓ |
| Subtitle | Muted grey | `var(--font-size-sm)`, `var(--color-text-tertiary)` ✓ |
| Padding | Top/sides/bottom | `var(--spacing-6) var(--spacing-4) var(--spacing-4)` ✓ |

**Verdict**: PageHeader on Settings matches design tokens. No Settings-specific overrides.

---

## 2. Remaining Drift — Actionable

| Priority | Item | Location | Action |
|----------|------|----------|--------|
| ~~**LOW**~~ | ~~Dead CSS~~ | routes.css | ✓ Removed `.settings-account-banner` + `__*`, `.beta-settings-page` |
| ~~**LOW**~~ | ~~Toggle sizing~~ | routes.css | ✓ Aligned to modern.css (38×22 track, 18×18 knob) |
| ~~**LOW**~~ | ~~ToggleRow/ListRow drift~~ | routes.css | ✓ Font sizes, padding, min-height, left indent aligned |
| ~~**LOW**~~ | ~~Card class clutter~~ | Settings.tsx | ✓ Removed home-card-row, module-card; settings-list-card padding: 0 |
| **LOW** | Icon sizes | Settings, Support, Home, ListRow | 15/13 pattern used; no `--icon-size-row` token. Document or add token |
| **LOW** | PageHeader back icon | PageHeader.css L35–38 | 14px hardcoded; consider `--size-page-header-icon` |
| **COSMETIC** | Card class chain | Settings.tsx | `home-card-row module-card settings-list-card` — consider single `.settings-list-card` that composes |

---

## 3. Already Fixed (Reference)

- useToast / ToastContainer in OnboardingSandbox, harnesses
- PageHeader `backAriaLabel`, i18n `common.back_aria`
- Settings i18n (profile modal, setup guide, devices, renewal, footer)
- `.settings-account-card` consolidated in modern.css
- `.settings-toggle-row` spacing → `var(--spacing-3)`, `var(--spacing-4)`
- Shadow tokens on `.settings-list-card`, `.settings-account-card`

---

## 4. Next Recommended Fix

**Icon sizes** — Add `--icon-size-row` token (15/13 pattern) or document as convention.
