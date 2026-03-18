# Settings Page — Inconsistencies & Drift Audit

**Status**: Fixed 2026-03-18. i18n, FooterHelp, RENEWAL, dead CSS addressed.

## Summary

| Category | Count | Severity | Status |
|----------|-------|----------|--------|
| i18n drift | 6 | WARNING | ✓ Fixed |
| Component pattern drift | 2 | DRIFT | Documented |
| CSS duplication / legacy | 3 | DRIFT | Dead single-line removed |
| Hardcoded copy | 2 | COSMETIC | ✓ Fixed |

---

## 1. i18n Drift — Hardcoded Strings

**Rule**: All user-facing copy must use `t()` from `useI18n`. i18n keys exist but are not used.

| Location | Current (hardcoded) | i18n key available | Fix |
|----------|---------------------|---------------------|-----|
| Settings.tsx:235 | `"Setup guide"` | — | Add `settings.setup_guide_title` |
| Settings.tsx:234 | `"Manage devices and review connection instructions."` | — | Add `settings.setup_guide_description` |
| Settings.tsx:195 | `"Get the latest config there."` / `"Add your first device and get its config."` | — | Add keys or use model |
| Settings.tsx:346 | `"Cancel"` | `common.cancel` | Use `t("common.cancel")` |
| Settings.tsx:356 | `"Saving…"` | — | Add `settings.saving` |
| Settings.tsx:359 | `"Save profile"` | `settings.save_profile` | Use `t("settings.save_profile")` |
| Settings.tsx:370–386 | `"Name"`, `"Email"`, `"Phone"`, `"Your name"`, `"you@example.com"`, `"+1 234 567 8900"` | `settings.field_*`, `settings.field_*_placeholder` | Use `t("settings.field_name")` etc. |
| SettingsAccountOverviewCard.tsx:50 | `"RENEWAL"` | — | Add `settings.renewal_label` (uppercase eyebrow) |
| FooterHelp (Settings.tsx:391–393) | `"Having trouble?"`, `"View setup guide"` | — | Add `footer.having_trouble`, `footer.view_setup_guide` (shared across Home, Plan, Support, RestoreAccess, Devices, Settings) |

---

## 2. Component Pattern Drift

### 2.1 ListRow vs SettingsActionRow

- **Settings page** uses `ListRow` for all action rows (edit profile, language, plan, devices, cancel, FAQ, support, reset, logout, delete).
- **Design-system** exposes `SettingsActionRow` (recipes/) with `modern-list-item`, `row-item`, tone/danger/actionIndicator support.
- **library.css** defines `.settings-card` + `.settings-divider` for content-library layout.
- **Settings** uses `ListCard` + `ListRow` instead of `SettingsCard` + `SettingsActionRow`.

**Drift**: Two parallel patterns for settings rows. `ListRow` is the modern choice; `SettingsActionRow` uses `modern-list-item` (different CSS). PlanBillingHistorySection and SubscriptionCancellationModal also use `ListRow` + `settings-list-card`. No usage of `SettingsActionRow` in pages.

**Recommendation**: Keep `ListRow` as the canonical settings row. Document that `SettingsActionRow` is legacy or deprecated for settings pages; or migrate Settings to `SettingsActionRow` if design-system wants a single recipe.

### 2.2 SettingsCard vs ListCard + settings-list-card

- **library.css** `.settings-card`: `SettingsCard` component with `SettingsDivider` for auto-dividers.
- **routes.css** `.settings-list-card`: different padding, shadow, no border.
- **SettingsPage** uses `ListCard className="home-card-row module-card settings-list-card"` — never `SettingsCard`.

**Drift**: `SettingsCard` exists in content library but Settings uses `ListCard` + app-level `settings-list-card`. PlanBillingHistorySection uses same pattern.

---

## 3. CSS Duplication & Legacy

### 3.1 settings-list-row (unused)

- **routes.css** defines `.settings-list-row`, `.settings-list-row__icon`, `__body`, `__title`, `__description`, `__value`, `__action`, `--danger`, `--warning`.
- **Settings** uses `ListRow` component, which renders `row-item` / `modern-list-item` (from ListCard.tsx). No `.settings-list-row` in DOM.
- **LanguageMenuRow** passes `className="settings-list-row--single-line-description"` to ListRow. That class targets `.settings-list-row__description`, but ListRow/RowItem outputs `.ri-sub`. **Dead CSS** — no effect.

**Drift**: `.settings-list-row` is legacy HTML structure; `ListRow` uses RowItem (`.row-item`, `.ri-sub`). RowItem already clamps subtitle to 1 line via `-webkit-line-clamp: 1` on `.ri-sub`.

### 3.2 Toggle sizing inconsistency

| Source | Track | Knob |
|--------|-------|------|
| modern.css `.miniapp-shell .ts-toggle` | 38×22 | 18×18 |
| routes.css `.settings-toggle-row.toggle-setting` | 40×24 | 16×16 |

**Drift**: Settings toggle overrides design-system toggle dimensions. `ToggleRow` uses `ts-toggle`; `settings-toggle-row` overrides `.ts-track`, `.ts-knob` with different sizes.

### 3.3 settings-account-card vs settings-account-card (modern.css)

- **modern.css** defines `.settings-account-card`, `.settings-account-card__group`, `.settings-account-avatar`, etc.
- **SettingsAccountOverviewCard** uses these classes.
- **library.css** defines `.settings-card` (different — card with dividers).

**Status**: No overlap; naming is consistent. `settings-account-card` is account-specific; `settings-card` is generic content-library card.

---

## 4. Class Name Clutter

Settings page uses multiple modifiers on the same card:

```tsx
className="home-card-row module-card settings-list-card"
```

- `home-card-row`: layout/row styling
- `module-card`: card styling
- `settings-list-card`: settings-specific overrides (routes.css)

**Drift**: Three classes; other pages (Home, Support) use similar. Consider a single `settings-card` or `settings-list-card` that composes the rest.

---

## 5. FooterHelp

- **Settings.tsx:391–393**: `note="Having trouble?"`, `linkLabel="View setup guide"`, `onLinkClick={() => navigate("/support")}`.
- **Home.tsx**: Same pattern.
- **Support page**: Same FooterHelp.

**Check**: `FooterHelp` — does it accept i18n keys or is it always passed strings? If shared, add i18n keys for `footer.having_trouble`, `footer.view_setup_guide`.

---

## 6. Checklist

| Item | Status |
|------|--------|
| No hardcoded hex in Settings | ✓ |
| No inline styles | ✓ |
| No `style={{...}}` | ✓ |
| Uses design tokens | ✓ |
| Page uses PageScaffold, PageLayout, PageSection | ✓ |
| Uses ListRow (not raw HTML) | ✓ |
| Settings page has Storybook story | ✓ (SettingsPage.stories.tsx) |
| All copy via i18n | ✗ |

---

## Recommended Fixes (Priority)

1. **CRITICAL**: Replace hardcoded profile modal copy with i18n (`settings.field_*`, `settings.save_profile`, `common.cancel`).
2. **WARNING**: Add `settings.setup_guide_title`, `settings.setup_guide_description` and use `t()`.
3. **WARNING**: Add `settings.renewal_label` for SettingsAccountOverviewCard "RENEWAL".
4. **DRIFT**: Remove or clarify `.settings-list-row` vs `ListRow`; ensure `settings-list-row--single-line-description` applies to ListRow output.
5. **DRIFT**: Document ListRow vs SettingsActionRow usage; decide canonical pattern.
6. **COSMETIC**: Align toggle dimensions (modern.css vs routes.css) or document why Settings needs different sizes.
