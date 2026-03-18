# Design System Drift — Consolidated Audit

**Last updated**: 2026-03-18  
**Status**: In progress. Many items remain.

---

## 1. Resolved

| Item | Fix |
|------|-----|
| PageHeader canonical | Migrated Devices, Checkout, Onboarding, Referral, ServerSelection, ConnectStatus to PageHeader |
| Settings i18n | Profile modal, setup guide, devices row, renewal, footer — fixed |
| FooterHelp i18n | footer.having_trouble, footer.view_setup_guide — fixed |
| Dead .settings-list-row CSS | Removed from routes.css |
| useToast / ToastContainer | PageSandbox wraps with ToastContainer |
| Dead CSS (.settings-account-banner, .beta-settings-page) | Removed from routes.css |
| Toggle sizing | Settings aligned to modern.css (38×22, 18×18) |
| useToast Fast Refresh | Moved to useToast.ts |

---

## 2. i18n Drift — Fixed (2026-03-18)

| Location | Fix |
|----------|-----|
| Home InviteFriendsCard | home.invite_friends_title, home.invite_friends_subtitle |
| Home NewUserHero | home.setup_required_*, home.choose_plan_cta, home.view_guide_label |
| Home ListRow (new user) | home.primary_manage_devices, home.devices_none_added |
| Home NoDeviceCallout | home.no_devices_title, home.no_devices_subtitle, home.add_device_cta |
| Home RenewalBanner | home.renewal_expired_*, home.renewal_expiring_* |
| Home FallbackScreen | common.retry |
| Home ModernHeader loading | home.app_title |
| Home Manage Devices row | home.manage_devices |
| Checkout PageSection | checkout.section_title_review_pay, checkout.section_desc_* |
| Checkout HelperNote | checkout.footer_note |

### Remaining i18n (low priority)

| Location | Hardcoded | Key |
|----------|-----------|-----|
| Home Badge | "Full", "Renew", "{n}d left" | home.badge_full, home.badge_renew, home.days_left |
| useAccessHomePageModel | ACCESS_UI_MAP strings | Page model needs i18n injection |

---

## 3. Remaining — Component Pattern Drift

| Pattern | Issue | Recommendation |
|---------|-------|----------------|
| ListRow vs SettingsActionRow | SettingsActionRow exists, unused in pages. ListRow is canonical. | ✓ Documented in README |
| SettingsCard vs ListCard | SettingsCard (library.css) unused; pages use ListCard + settings-list-card | Either migrate to SettingsCard or deprecate SettingsCard |
| home-card-row module-card settings-list-card | Three classes on every card | Consider single .settings-list-card that composes |

---

## 4. Remaining — CSS / Layout

| Item | Location | Issue |
|------|----------|-------|
| Toggle sizing | — | ✓ Aligned Settings to modern.css |
| Hardcoded colors | routes.css, app.css, frame.css | LEGACY-AUDIT lists 4+ in routes.css |
| Hardcoded spacing | frame.css, library.css, routes.css | px values instead of --spacing-* |

---

## 5. ToastContainer — Production

**Issue**: useToast throws when used outside ToastContainer. Production app has OverlayLayer (ToastContainer) wrapping BootstrapController. If Settings still fails in production, possible causes:

- BootstrapController renders BootLoadingScreen/BootErrorScreen **instead of** children — those screens don't use useToast, so no error.
- When phase is app_ready, children (AppRoutes) render. Settings is inside. ToastContainer is ancestor. Should work.
- **Hypothesis**: Storybook or a different entry path (e.g. embedded iframe) may not have ToastContainer. PageSandbox fix addresses Storybook.

---

## 6. Priority Fixes

1. ~~**High**: Add i18n for Home page~~ ✓ Done
2. ~~**Medium**: Document ListRow vs SettingsActionRow~~ ✓ Done
3. ~~**Medium**: Add checkout i18n~~ ✓ Done
4. **Low**: Align or document toggle dimensions.
5. **Low**: Consolidate card class names.

---

## 7. Settings Audit Addenda (2026-03-18)

See **SETTINGS-AUDIT-CONTINUED.md** for PageHeader visual verification and remaining actionable items.

See **SETTINGS-TOKEN-CSS-AUDIT.md** for:

- Dead CSS: `.settings-account-banner` (full tree), `.beta-settings-page` — no TSX usage
- Card class chain: Settings uses `home-card-row module-card settings-list-card` vs Support `home-card-row` only
- ListRow/RowItem: `.home-card-row .modern-list-item` may not match RowItem (has `row-item` only)
- `settings-page` ancestor: Not in library.css; storybook-parity-audit ref outdated
