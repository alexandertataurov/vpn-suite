# Font Size Audit — Token Usage and Inconsistencies

**Date**: 2026-03-19  
**Scope**: frontend/miniapp — typography token usage across CSS

---

## 1. Canonical Token Scale

**Consumer theme** ([consumer.css](frontend/miniapp/src/design-system/styles/theme/consumer.css)):

| Token | Value | Use |
|-------|-------|-----|
| `--typo-display-size` | 24px | Hero/display |
| `--typo-h1-size` | 24px | Page title |
| `--typo-h2-size` | 18px | Section title |
| `--typo-h3-size` | 16px | Card title |
| `--typo-h4-size` | 15px | Subheading |
| `--typo-body-size` | 16px | Body text |
| `--typo-body-sm-size` | 14px | Secondary body |
| `--typo-caption-size` | 14px | Caption |
| `--typo-meta-size` | 11px | Labels, meta |

**Base tokens** ([base.css](frontend/miniapp/src/design-system/styles/tokens/base.css)):

| Token | Value |
|-------|-------|
| `--font-size-xs` | 12px |
| `--font-size-sm` | 13px |
| `--font-size-md` | 14px |
| `--font-size-lg` | 16px |

**Frame fallback** (when not consumer-dark/consumer-light): `--typo-caption-size: 13px`, `--typo-meta-size: 12px` — differs from consumer.

---

## 2. Hardcoded Font Sizes — Fixed

| File | Was | Now |
|------|-----|-----|
| routes.css `.section-desc` | 12.5px | `var(--font-size-xs)` |
| routes.css `.devices-list-card .empty-state-block-title` | 15px | `var(--typo-h4-size)` |
| routes.css `.devices-list-card .empty-state-block-message` | 13px | `var(--font-size-sm)` |
| routes.css `.referral-share-card__handle` | 11px | `var(--typo-meta-size)` |
| routes.css `.referral-share-card__url` | 13px | `var(--font-size-sm)` |
| routes.css `.referral-share-card__notice-title` | 13px | `var(--font-size-sm)` |
| routes.css `.referral-share-card__notice-message` | 12px | `var(--font-size-xs)` |
| SettingsAccountCard.css `.ac-identity .avatar` | 14px | `var(--typo-body-sm-size)` |
| SettingsAccountCard.css `.ac-eyebrow` | 9.5px | `var(--typo-meta-size)` |
| SettingsAccountCard.css `.ac-name` | 17px | `var(--typo-h3-size)` |
| SettingsAccountCard.css `.ac-stat-label` | 9px | `var(--typo-meta-size)` |
| SettingsAccountCard.css `.ac-stat-value` | 15px | `var(--typo-h4-size)` |
| SettingsAccountCard.css `.ac-stat-dim` | 12px | `var(--font-size-xs)` |
| DisclosureItem.css `.disclosure-item__content-inner` | 13px | `var(--font-size-sm)` |
| modern.css `.avatar--md` | 14px | `var(--typo-body-sm-size)` |
| routes.css `.referral-share-card__label` | 10px | `var(--typo-meta-size)` |
| modern.css `.section-label` | 12px | `var(--amnezia-plan-eyebrow, var(--typo-meta-size))` |
| routes.css `.section-desc` | 12px | `var(--amnezia-hero-desc, var(--typo-caption-size))` |
| Support contact card | — | Uses RowItem (amnezia-row-label, amnezia-row-sub) |
| routes.css `.flow-eyebrow` | 11px | `var(--amnezia-plan-eyebrow, var(--typo-meta-size))` |
| routes.css `.flow-title` | 16px | `var(--amnezia-hero-title, var(--typo-h3-size))` |
| routes.css `.flow-desc` | 13px | `var(--amnezia-hero-desc, var(--typo-caption-size))` |
| routes.css `.faq-list .disclosure-item__*` | 13px | `var(--amnezia-row-label)` / `var(--amnezia-row-sub)` |

---

## 3. Remaining Hardcoded (frame.css)

**frame.css**: 50+ instances of `font-size: Npx` and `font: Npx` in shell/legacy layer; tokenization deferred.

**library.css**: Tokenized. See FONT-SPACING-AUDIT.md.

---

## 4. Token Conflicts

- **consumer vs frame fallback**: `--typo-caption-size` 14px vs 13px; `--typo-meta-size` 11px vs 12px. App typically uses consumer; frame applies when `data-theme` is absent.
- **base.css `--font-size-N`**: Naming `--font-size-12: 13px` is confusing (number ≠ value). Prefer `--font-size-xs/sm/md/lg` or `--typo-*`.

---

## 5. Recommendations

1. Use `--typo-*` for semantic roles (body, caption, meta, headings).
2. Use `--font-size-xs/sm/md/lg` for generic sizing.
3. Avoid new hardcoded px; add tokens if scale gap exists (e.g. 9px → consider `--typo-meta-size` or new `--typo-2xs`).
