# Font Size & Spacing Audit — Device Consistency

**Date**: 2026-03-19  
**Scope**: frontend/miniapp — typography and spacing token usage across viewports

---

## 1. Canonical Tokens

### Typography (consumer theme)
- `--typo-*` for semantic roles (h1–h4, body, caption, meta)
- `--font-size-xs/sm/md/lg` for generic sizing
- `--amnezia-*` for Amnezia-specific responsive overrides

### Spacing (4px base)
- `--spacing-0-5` (2px), `--spacing-1` (4px), `--spacing-2` (8px), `--spacing-3` (12px), `--spacing-4` (16px), etc.
- `--miniapp-*` for layout (card-padding, data-cell-padding, row-gap, etc.)

---

## 2. Fixes Applied

### Responsive typography (responsive.css)
| Selector | Was | Now |
|----------|-----|-----|
| `.row-item` padding | `12px 14px` | `var(--spacing-3) var(--miniapp-card-padding-tight)` |

### NoDeviceCallout.css
| Property | Was | Now |
|----------|-----|-----|
| padding, gap, margin | 16px, 18px, 14px, 8px, 2px, 5px, 6px, 12px | `var(--spacing-*)`, `var(--miniapp-*)` |
| font-size | 14px, 12px | `var(--typo-body-sm-size)`, `var(--font-size-xs)` |
| font-family | "Inter" | `var(--font-sans)` |
| border-radius | 14px, 10px | `var(--radius-lg)`, `var(--radius-sm)` |

### BillingPeriodToggle.css
| Property | Was | Now |
|----------|-----|-----|
| font-size | 13px, 10px | `var(--font-size-sm)`, `var(--typo-meta-size)` |
| padding | 2px 7px | `var(--spacing-0-5) var(--spacing-2)` |

### library.css
| Property | Was | Now |
|----------|-----|-----|
| padding | `var(--spacing-0-5, 2px)` | `var(--spacing-0-5)` |
| margin, gap, padding (toggle-setting) | 14px | `var(--spacing-3)` |

### frame.css
| Property | Was | Now |
|----------|-----|-----|
| gap (module-card) | `max(..., 12px)`, `max(..., 10px)` | `max(..., var(--spacing-3))`, `max(..., var(--spacing-2))` |
| margin-top (module-card children) | 2px, 4px | `var(--spacing-0-5)`, `var(--spacing-1)` |
| padding (select-sheet-overlay) | 16px 12px | `var(--spacing-4) var(--spacing-3)` |
| top, left, right (toast-container) | +8px, 16px | `+ var(--spacing-2)`, `var(--spacing-4)` |
| gap (toast-container) | 6px | `var(--spacing-1)` |
| gap, padding (select-sheet) | 12px, 10px 14px 14px | `var(--spacing-3)`, `var(--spacing-2) var(--spacing-3) var(--spacing-3)` |

---

## 3. Remaining (Deferred)

**frame.css**: 50+ hardcoded font sizes in shell/legacy layer. Tokenization deferred per FONT-SIZE-AUDIT.

**6px gap**: Not in 4px scale. Replaced with `var(--spacing-1)` (4px) where applied; 2px difference acceptable.

---

## 4. Device-Specific Rules

- **≤360px (--vp-narrow)**: responsive.css reduces plan-name, hero-title, page-header, profile-name, row-item padding; ri-label, ri-sub font sizes.
- **Amnezia theme**: Defines `--amnezia-*-sm` for narrow viewport overrides.
- **Touch vs pointer**: `@media (pointer: coarse)` used for touch-target adjustments; no font/spacing changes.
