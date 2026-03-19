# Further Design System Audit — Round 2

**Date**: 2026-03-19  
**Scope**: Z-index, animation, dead CSS, remaining drift

---

## 1. Z-Index Stacking

| File | Value | Context | Issue |
|------|-------|---------|-------|
| BottomSheet.css | var(--z-modal) | Overlay | ✓ Fixed; zones.css sets --z-modal: 1000 for miniapp |
| Modal.css | var(--z-modal) | Overlay | ✓ Fixed |
| frame.css | 1, 2, 3 | Toast children | Local stacking; OK |
| library.css | 0, 1 | Card layers | Local stacking; OK |
| BillingPeriodToggle.css | 0, 1 | Segmented control | Local stacking; OK |
| PlanCard.module.css | 0, 1 | Card layers | Local stacking; OK |

**Fixed**: zones.css sets `--z-modal: 1000` for miniapp (above Telegram WebView). BottomSheet and Modal use `var(--z-modal)`.

---

## 2. Animation / Transition Duration

| Pattern | Count | Examples | Token |
|---------|-------|----------|-------|
| `0.12s` | Many | frame.css, RowItem, DisclosureItem | `--duration-micro` (80ms) or add `--duration-fast` (150ms) |
| `0.14s` | Several | frame.css | No exact token; `--duration-fast` = 150ms |
| `0.15s` | Several | NoDeviceCallout, btn, BillingPeriodToggle | `--duration-fast` (150ms) |
| `0.18s` | Several | frame.css, Modal | `--duration-normal` (250ms) or add 180ms |
| `0.22s`, `0.24s` | frame.css | Popover animations | `--duration-normal` (250ms) |

**base.css tokens**: `--duration-instant: 80ms`, `--duration-fast: 150ms`, `--duration-normal: 250ms`, `--duration-slow: 400ms`

**Fixed**: Replaced 0.12s/0.14s→`var(--duration-micro)`, 0.15s→`var(--duration-fast)`, 0.18s→`var(--duration-enter)` in BottomSheet, Modal, NoDeviceCallout, BillingPeriodToggle, library.css, modern.css, frame.css.

---

## 3. Dead / Orphaned CSS

| Selector | Location | Status |
|----------|----------|--------|
| `.settings-account-banner` (full tree) | routes.css | No TSX usage per SETTINGS-TOKEN-CSS-AUDIT |
| `.settings-card` | library.css | Not used by Settings page; used by SettingsDivider/content-library |
| `SettingsCard` component | — | Unused; pages use ListCard + settings-list-card |
| `stagger-1` … `stagger-5` | library.css | LEGACY-AUDIT: remove or tokenize |
| `.modern-list-item` | — | RowItem uses `.row-item`; `.home-card-row .modern-list-item` may not match |

**Recommendation**: Remove `.settings-account-banner` if confirmed dead. Document SettingsCard deprecation.

---

## 4. Remaining Hardcoded Values (by file)

### library.css (~74 instances)
- gap: 2, 3, 4, 5, 6, 8, 10, 12, 14, 18, 24px
- padding: 1, 2, 3, 4, 6, 8, 10, 12, 13, 14, 15, 16, 17, 18px
- Values in 4px scale (4, 8, 12, 16, 24) → `var(--spacing-*)`

### frame.css (~219 instances)
- font-size, padding, margin, gap, border-radius
- High volume; tokenize consumer-facing first

### routes.css (3 instances)
- Per prior audit; verify if any remain

### Other design-system CSS
- NoDeviceCallout: `inset: -6px` (focus ring), `width: 20px`, `13px` (icons) — acceptable for icons
- BillingPeriodToggle, InlineAlert, Modal, etc.: scattered values

---

## 5. Status Since Prior Audits

| Item | Status |
|------|--------|
| NoDeviceCallout colors | ✓ Fixed |
| frame.css .btn spacing/typography | ✓ Fixed |
| frame.css popover padding | ✓ Fixed |
| library.css page-hd-badge, toggle-setting | ✓ Fixed |
| routes.css, app.css hex colors | Not in design:check scope for app.css; routes.css — verify |
| Z-index BottomSheet/Modal | ✓ Fixed |
| Animation duration tokens | ✓ Fixed |
| Dead CSS removal | Open |

---

## 6. Priority Order

1. **Z-index**: Align BottomSheet/Modal to `--z-modal` or document 1000
2. **Animation**: Replace common durations (0.12s, 0.15s, 0.18s) with tokens
3. **Dead CSS**: Remove `.settings-account-banner` if unused
4. **library.css**: Batch tokenize gap/padding for 4px-scale values
5. **frame.css**: Incremental font-size tokenization (deferred)
