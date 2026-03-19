# Devices Page — CSS Drift & Inconsistencies Audit

**Date**: 2026-03-19

## Issues Addressed

### 1. Config disclosure not styled (CRITICAL)

**Root cause**: ConfigCardContent renders `config-disclosure` inside CompactSummaryCard. routes.css targets `.devices-utility-card .config-disclosure`, but no parent had `devices-utility-card`.

**Fix**: Added `className="devices-utility-card"` to CompactSummaryCard in ConfigCardContent.

---

### 2. Typography token drift (FONT-SIZE-AUDIT)

| Selector | Was | Now |
|----------|-----|-----|
| `.devices-list-card .empty-state-block-title` | `var(--text-body, 15px)` | `var(--typo-h4-size)` |
| `.devices-list-card .empty-state-block-message` | `var(--text-caption, 13px)` | `var(--font-size-sm)` |

---

### 3. Hardcoded values in frame.css devices-add-wizard

| Property | Was | Now |
|----------|-----|-----|
| gap | 16px, 8px, 10px | `var(--spacing-4)`, `var(--spacing-2)` |
| padding | 18px | `var(--spacing-4)` |
| border-radius | 20px | `var(--radius-lg)` |
| font (kicker) | 11px | `var(--typo-meta-size)` |
| font (message, list) | 14px | `var(--typo-body-sm-size)` |

---

### 4. Orphaned CSS removed

**routes.css**:
- `.page-shell--devices` — unused (PageLayout does not add it)
- `.devices-summary-card` — DevicesSummaryCard uses `modern-hero-card`
- `.devices-summary-grid`, `__item`, `__label`, `__value`, `__value--*` — DevicesSummaryCard uses `modern-device-grid` / `modern-device-metric`
- `.devices-summary-card .btn-row` — never matched
- `@media (max-width: 560px) .devices-summary-grid` — orphaned

**library.css**:
- `.devices-hero-cells`, `.devices-hero-cell--count`, `.devices-hero-cell--pending` — DevicesSummaryCard uses `modern-device-grid`; no TSX usage
- `@media .devices-hero-cell--count` — orphaned

---

### 5. i18n for DevicesSummaryCard eyebrow

**Fix**: Added `devices.eyebrow_label` ("DEVICE MANAGEMENT" / "УПРАВЛЕНИЕ УСТРОЙСТВАМИ"); DevicesSummaryCard uses `t("devices.eyebrow_label")` instead of hardcoded "DEVICE MANAGEMENT".

---

## Full drift checklist (Devices page)

| Check | Status |
|-------|--------|
| Hardcoded hex colors | None in devices-specific CSS |
| Inline styles | None (ProgressBarFill `setProperty` for `--progress-width` is acceptable) |
| Typography | Uses `--typo-*`, `--font-size-sm` per FONT-SIZE-AUDIT |
| devices-utility-card | Applied to ConfigCardContent for config-disclosure styling |
| devices-summary-section | Kept; DevicesSummaryCard receives it |
| devices-hero-cells | Removed (dead) |
| devices-add-wizard | Tokenized in frame.css |
| DevicesSummaryCard | Uses HeroCard variant="status", modern-device-grid; eyebrow i18n |
| AddDeviceWizardContent | Design-system recipe for devices-add-wizard |
| ProgressBarFill | width: var(--progress-width, 0) in modern.css; setProperty acceptable |

---

## Deferred Items (Completed 2026-03-19)

### 1. DevicesSummaryCard → HeroCard pattern

- Extended HeroCard with `variant="status"` for horizontal layout (icon left, text right).
- Added `eyebrow`, `subtitle` (ReactNode), `children` props.
- DevicesSummaryCard now uses `<HeroCard variant="status" ...>`.
- Added CSS for `modern-status-group`, `modern-pulse-indicator`, `modern-status-text`, `modern-status-title` in modern.css.

### 2. devices-add-wizard → design-system pattern

- Created AddDeviceWizardContent recipe in recipes/devices/.
- Accepts `step`, `nameSlot`, `installKicker`, `installMessage`, `installSteps`, `storeLinks`.
- Devices.tsx uses AddDeviceWizardContent instead of raw HTML.

### 3. ProgressBarFill --progress-width

- Added `width: var(--progress-width, 0)` to `.modern-progress-bar-fill` in modern.css.
- setProperty for --progress-width remains acceptable (CSS variable, not inline style).
| #devices-section .shead | Kept (PageSection uses it) |
