# Settings Page — Token & CSS Inconsistencies Audit

**Date**: 2026-03-18  
**Scope**: Settings page, related components, and all `.settings-*` CSS

---

## 1. Token Drift — Hardcoded Values

### 1.1 Spacing (should use `--spacing-*`)

| Location | Value | Token equivalent |
|----------|-------|------------------|
| routes.css `.settings-account-banner` | `min-height: 64px` | `--spacing-16` (64px) or add `--size-settings-banner-min` |
| routes.css `.settings-toggle-row.toggle-setting` | ~~13px 16px, 13px~~ → `var(--spacing-3)`, `var(--spacing-4)` | ✓ Fixed |
| routes.css `.settings-list-card` | `padding: var(--spacing-1)` | ✓ |
| routes.css `.settings-context-list` | `min-width: 220px` | No token; consider `--size-min-menu-width` |
| routes.css `.settings-row-skeleton` | `height: 60px` | Not in scale (64px = spacing-16) |
| library.css `.toggle-setting` | `gap: 14px`, `padding: 14px` | `--spacing-4` (16px) — 14px not in scale |
| library.css `.settings-card > :not(.settings-divider)` | `margin-top: 14px` | `--spacing-4` |

**Allowed scale**: 4, 8, 12, 16, 20, 24, 32 (via `--spacing-*`)

### 1.2 Typography (should use `--font-size-*`, `--text-*`)

| Location | Value | Token |
|----------|-------|-------|
| routes.css `.settings-account-banner__avatar` | `font: 700 16px/1` | `--font-size-md`, `--font-weight-bold` |
| routes.css `.settings-account-banner__name` | `font: 600 17px/1.2` | `--font-size-md` (17px non-standard) |
| routes.css `.settings-account-banner__meta` | `font: 400 13px/1.45` | `--text-caption` ✓ (fallback 13px) |
| routes.css `.settings-account-banner__eyebrow` | `font: 700 10px/1.2 var(--font-mono)` | `--font-size-xs` (10px) |
| routes.css `.settings-profile-modal__hint` | `color: var(--color-text-muted)` | ✓ |

### 1.3 Shadow (should use `--shadow-*`)

| Location | Value | Token |
|----------|-------|-------|
| routes.css `.settings-list-card` | ~~ad-hoc~~ → `var(--shadow-card)` | ✓ Fixed |
| routes.css `.settings-account-card` | → `var(--shadow-elevated)` in modern.css | ✓ Fixed |

### 1.4 Border radius

| Location | Value | Token |
|----------|-------|-------|
| routes.css `.settings-account-banner__avatar` | `border-radius: 999px` | ✓ (circle) |
| routes.css `.settings-toggle-row.toggle-setting` | `border-radius: var(--radius-lg)` | ✓ |

---

## 2. CSS Duplication & Override Conflicts

### 2.1 `.settings-account-card` — ✓ Consolidated (2026-03-18)

Moved gradient/background from routes.css into modern.css. Single source. routes.css override removed.

### 2.2 Settings vs content-library `.settings-card`

| Class | Location | Used by |
|-------|----------|---------|
| `.settings-card` | library.css | Content-library card with dividers (SettingsDivider) |
| `.settings-card` | — | **Not used** by Settings page |

Settings uses `ListCard` + `settings-list-card`, never `SettingsCard` / `.settings-card`.

### 2.3 `.settings-account-banner` vs `.settings-account-card`

- **settings-account-banner**: routes.css — legacy layout; used by older components (e.g. settings-account-banner__header, __eyebrow).
- **settings-account-card**: modern.css + routes.css override — used by SettingsAccountOverviewCard.

**Note**: `settings-account-banner__header` and `settings-account-banner__eyebrow` exist in routes.css but SettingsAccountOverviewCard uses `settings-account-card__group`, `settings-account-eyebrow`, etc. — different BEM trees. No naming collision.

---

## 3. Toggle Sizing — ✓ Aligned (2026-03-18)

| Source | Context | Track | Knob | translateX |
|--------|---------|-------|------|------------|
| **library.css** | Base `.ts-toggle` | 44×26 | 18×18 | 20px |
| **modern.css** | `.miniapp-shell .ts-toggle` | 38×22 | 18×18 | 16px |
| **routes.css** | `.settings-toggle-row .ts-toggle` | 38×22 | 18×18 | 16px |

Settings toggle aligned with design-system (modern.css).

---

## 4. Class Name Clutter

Settings page cards use:

```tsx
className="home-card-row module-card settings-list-card"
```

- `home-card-row`: layout (from Home styles)
- `module-card`: card base (from library.css)
- `settings-list-card`: settings-specific overrides (routes.css)

**Drift**: Settings imports Home layout classes. Consider a single `settings-list-card` that composes the rest, or a `SettingsListCard` wrapper.

---

## 5. Unused or Orphaned Classes

| Class | Defined in | Used by |
|-------|------------|---------|
| `.settings-action-value` | — | SettingsLanguageMenuRow, PlanBillingHistorySection | 
| `.settings-action-row__value` | library.css (plan-billing-page scope) | PlanBillingHistorySection uses `.settings-action-value` | 
| `.settings-action-row` | library.css (plan-billing-page) | PlanBillingHistorySection uses `.settings-action-row` | 

**SettingsLanguageMenuRow** uses `settings-action-value` but there is **no global style** for it in Settings context. PlanBillingHistorySection uses `.settings-action-row` + `.settings-action-row__value`; library.css styles `.settings-action-row__value` (font-size). The class `settings-action-value` may inherit from parent or have no explicit style.

---

## 6. Token Usage Summary

| Category | Status |
|----------|--------|
| Colors | ✓ No hardcoded hex in Settings CSS |
| Spacing | 13px, 14px, 60px, 64px not in token scale |
| Typography | 10px, 13px, 16px, 17px — some use `--text-caption`, others raw |
| Shadows | Ad-hoc `color-mix` shadows instead of `--shadow-*` |
| Motion | ✓ `var(--duration-micro)`, `var(--ease-standard)` used |

---

## 7. Recommendations (Priority)

| Priority | Item | Status |
|----------|------|--------|
| **HIGH** | `.settings-account-card` dual definition | ✓ Consolidated in modern.css |
| **MEDIUM** | Toggle sizing | Pending — align or document |
| **MEDIUM** | Spacing 13px, 14px | ✓ Replaced with `--spacing-3`, `--spacing-4` |
| **LOW** | Shadow tokens | ✓ `--shadow-card`, `--shadow-elevated` |
| **LOW** | Class clutter | Pending |
| **LOW** | `settings-action-value` | Pending |

---

## 8. PageHeader — Font Sizes & Paddings

| Location | Issue | Token / Fix |
|----------|-------|-------------|
| PageHeader.css `.page-header` | `padding: var(--spacing-6) var(--spacing-4) var(--spacing-4)` | ✓ Uses tokens |
| PageHeader.css `.page-header` | `gap: var(--miniapp-grid-gap)` → `var(--spacing-3)` in zones | ✓ |
| PageHeader.css `.page-header-back` | ~~34px~~ → `var(--size-page-header-back)` | ✓ Token in zones.css |
| PageHeader.css `.page-header-back svg` | `width: 14px`, `height: 14px` | Hardcoded; icon size |
| PageHeader.css `.page-header-title` | `font-size: var(--font-size-lg)` | ✓ |
| PageHeader.css `.page-header-subtitle` | `font-size: var(--font-size-sm)` | ✓ |
| responsive.css | `.page-header-title` → `--amnezia-page-header-title-sm: 16px` | Override at breakpoint |

**PageHeader on Settings**: No Settings-specific overrides. Same as Devices, Checkout, etc.

---

## 9. PageSection & Layout

| Location | Issue | Fix |
|----------|-------|-----|
| frame.css `.page-section--compact` | ~~8px~~ → `var(--spacing-2)` | ✓ Fixed |
| frame.css `.page-shell--dense` | ~~10px~~ → `var(--spacing-3)` | ✓ Fixed |
| PageSection | Uses `Stack gap="2"` (8px) | Compact adds `page-section--compact` which sets gap: 8px on section |

**Settings uses** `PageSection compact` throughout — gets 8px gap. Stack gap="2" = 8px. Consistent.

---

## 10. Settings-Specific Font Sizes (Used)

| Component | Class | Current | Token |
|-----------|-------|---------|-------|
| SettingsAccountOverviewCard | settings-account-eyebrow | `var(--font-size-xs)` | ✓ modern.css |
| SettingsAccountOverviewCard | settings-account-name | `var(--font-size-md)` | ✓ modern.css |
| SettingsAccountOverviewCard | settings-account-status | `var(--font-size-sm)` | ✓ modern.css |
| settings-toggle-row | .ts-desc | `var(--text-caption, 13px)` | ✓ |
| settings-profile-modal__hint | — | `font: var(--text-caption)`, `color: var(--color-text-muted)` | ✓ Fixed |

**settings-account-banner***: Dead CSS — no TSX uses it. Can be removed.

---

## 12. Dead CSS — ✓ Removed (2026-03-18)

| Class | Status |
|-------|--------|
| `.settings-account-banner` + all `__*` | Removed |
| `.beta-settings-page` | Removed |

**Note**: `settings-page` does not exist in library.css; storybook-parity-audit reference is outdated.

---

## 13. Page Layout & Scroll

| Page | PageLayout scrollable | ScrollZone (ViewportLayout) |
|------|----------------------|----------------------------|
| Settings | `false` | Yes (parent) |
| Devices, Support, Plan, Home, Checkout | `false` | Yes |

All pages use `scrollable={false}`; ScrollZone in ViewportLayout provides scroll. PageLayout gap uses `--miniapp-section-gap` (24px).

---

## 14. Card Class Chain — Settings vs Other Pages

| Page | ListCard classes |
|------|------------------|
| Settings | `home-card-row module-card settings-list-card` |
| Support | `home-card-row` |
| Plan (billing) | `home-card-row module-card settings-list-card billing-history-list-card` |
| Devices | `devices-list-card` |

**Drift**: Settings and PlanBillingHistorySection use three shared classes; Support uses one. `module-card` adds frame.css rules; `settings-list-card` overrides padding, border, shadow in routes.css.

---

## 15. ListRow / RowItem Class Mapping

| Component | Output class | Styling source |
|-----------|--------------|----------------|
| ListRow | → RowItem → `row-item` | RowItem.css (padding, icon); `.modern-list-item, .row-item` grouped in modern.css |
| SettingsActionRow | `modern-list-item row-item` | modern.css `.modern-list-item-*` |

`.home-card-row .modern-list-item` (padding, icon) targets `modern-list-item`; RowItem uses `row-item` only. RowItem has its own padding in RowItem.css, so no visual gap. Two parallel BEM trees (modern-list-item vs row-item/ri-*) for similar UI.

---

## 16. i18n — ✓ Fixed (2026-03-18)

| Location | Keys added |
|----------|------------|
| SessionMissing | common.session_expired_message, common.reopen_from_bot_message |
| FallbackScreen | common.could_not_load_settings_title, common.please_try_again |
| addToast | settings.support_unavailable |
