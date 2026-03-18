# Support Page — Drift & Inconsistencies Audit

**Date:** 2026-03-18  
**Status:** Fixed 2026-03-18  
**Scope:** `frontend/miniapp/src/pages/Support.tsx` and related components

---

## Summary

| Category | Count | Severity | Status |
|----------|-------|----------|--------|
| FooterHelp navigation drift | 1 | DRIFT | Documented |
| Pattern drift (SupportActionList vs ListRow) | 1 | DRIFT | ✓ Fixed |
| Legacy components (SupportContactCard) | 1 | WARNING | ✓ Fixed |
| Dead CSS (routes.css) | 1 | LOW | ✓ Fixed |
| Card class chain vs Settings | 1 | DRIFT | Documented |
| FAQ container (ListCard vs faq-list) | 1 | DRIFT | ✓ Fixed |
| Deprecated FaqDisclosureItem props | 1 | COSMETIC | ✓ Fixed |

---

## 1. FooterHelp Navigation Drift

| Page | "View setup guide" → navigates to |
|------|-----------------------------------|
| Home, Plan, Settings, RestoreAccess, Devices | `/support` |
| **Support** | `/devices` |

**Why**: Support page is already on `/support`, so the link goes to devices (setup guide = device setup).

**Drift**: Semantically inconsistent. Other pages treat "View setup guide" as "go to Support". On Support, it means "go to Devices". Consider:
- Rename link on Support to `footer.view_devices_setup` or keep and document as intentional.
- Or navigate to `/devices` with a hash/fragment for setup section.

**Recommendation**: Document as intentional; or add `footer.view_devices_setup` for Support-only variant.

---

## 2. SupportActionList vs ListRow — Pattern Drift

**Status:** ✓ Fixed. Support page now uses `SupportActionList` with `MissionOperationLink` (internal) and `MissionOperationAnchor` (external href). Extended SupportActionList to support optional `href` and `onItemClick` for Telegram `openLink`.

---

## 3. SupportContactCard — Legacy Pattern

**LEGACY-AUDIT.md** (line 31): `modern-contact-card` → replace with `ListCard + Button`.

| Current | Replacement |
|---------|-------------|
| `modern-contact-card` | ListCard |
| `btn-accent` on Button | `Button variant="primary"` (no accent override) |

**SupportContactCard** uses:
- `modern-contact-card`, `modern-contact-card__*` (modern.css)
- `modern-header-label`
- `Button ... className="modern-contact-card__cta btn-accent"`

**Recommendation**: Refactor to ListCard + StatusChip + Button. Remove `btn-accent`; use design-system Button styling.

---

## 4. Dead CSS — routes.css

| Class | Used in TSX? |
|-------|--------------|
| `.support-faq-list` | No |
| `.support-faq-item` | No |
| `.support-faq-trigger` | No |
| `.support-faq-symbol` | No |

Support page uses `FaqDisclosureItem` → `DisclosureItem` (`.disclosure-item`, `.disclosure-item__trigger`). The `support-faq-*` classes are legacy from a previous FAQ implementation.

**Recommendation**: Remove `.support-faq-list`, `.support-faq-item`, `.support-faq-trigger`, `.support-faq-symbol` and related rules from routes.css.

---

## 5. Card Class Chain — Support vs Settings

| Page | ListCard classes |
|------|------------------|
| Settings | `home-card-row module-card settings-list-card` |
| **Support** | `home-card-row` only |
| Plan (billing) | `home-card-row module-card settings-list-card billing-history-list-card` |

**SETTINGS-TOKEN-CSS-AUDIT.md** §14: Support uses one class; Settings/Plan use three. `module-card` adds frame.css rules; `settings-list-card` overrides padding, border, shadow.

**Drift**: Support quick paths and FAQ cards may render with different padding/shadow than Settings list cards. If visual parity is desired, add `module-card` (and optionally `settings-list-card`) to Support ListCards.

---

## 6. FAQ Section — ListCard vs faq-list

| Consumer | FAQ container |
|----------|---------------|
| Support page | `ListCard className="home-card-row"` |
| FaqDisclosureItem.stories | `<div className="faq-list">` |

**FaqDisclosureItem.css** defines `.faq-list` with `--card-row-bg`, `--card-row-border`, `border-radius: 14px`.  
**Support** wraps FaqDisclosureItems in ListCard (`modern-list home-card-row`), which uses `--color-surface`, `--color-border`.

**Drift**: Different container tokens. FaqDisclosureItem.stories use `faq-list`; Support uses ListCard. Both produce a card-like list. Consider:
- Use `faq-list` on Support for design-system parity, or
- Document that ListCard is an acceptable FAQ container and update FaqDisclosureItem.stories to show both.

---

## 7. FaqDisclosureItem Deprecated Props

Support uses:
```tsx
<FaqDisclosureItem
  title={item.title}
  body={item.body}
  isOpen={openFaq === index}
  onToggle={() => setOpenFaq(...)}
/>
```

**FaqDisclosureItem** deprecates `title`/`body` in favor of `question`/`answer`. Both are supported via fallback.

**Recommendation**: Migrate to `question` and `answer` for consistency.

---

## 8. Checklist

| Item | Status |
|------|--------|
| No hardcoded hex in Support page | ✓ |
| No inline styles | ✓ |
| Uses design tokens | ✓ |
| Page uses PageScaffold, PageLayout, PageHeader, PageSection | ✓ |
| All copy via i18n | ✓ |
| FooterHelp navigation consistent | ✗ (intentional; documented) |
| Uses design-system SupportActionList | ✓ |
| SupportContactCard uses design-system primitives | ✓ |
| FAQ uses faq-list | ✓ |
| SupportContactCard CTA uses openLink (Telegram) | ✓ |
| Troubleshooter back button wired | ✓ |

---

## Recommended Fixes (Priority)

1. **WARNING**: Refactor SupportContactCard to ListCard + Button; remove `btn-accent`, `modern-contact-card`.
2. **DRIFT**: Decide SupportActionList vs ListRow as canonical; migrate or deprecate.
3. **LOW**: Remove dead `.support-faq-*` CSS from routes.css.
4. **DRIFT**: Align FAQ container — use `faq-list` on Support or document ListCard as valid.
5. **COSMETIC**: Migrate FaqDisclosureItem props from `title`/`body` to `question`/`answer`.
6. **DRIFT**: Document FooterHelp "View setup guide" → `/devices` on Support as intentional.

---

## Further Audit (2026-03-18)

| Category | Severity | Location | Status |
|----------|----------|----------|--------|
| **SupportContactCard external link** | WARNING | SupportContactCard.tsx | ✓ Fixed — added `onContactClick` prop; Support page passes `openLink` |
| **Unused model fields** | DRIFT | useSupportPageModel.ts | ✓ Fixed — removed `hero.eyebrow`, `hero.edge`, `hero.glow` |
| **Troubleshooter back button** | LOW | Support.tsx | ✓ Fixed — passes `onBack` and `backLabel` from model |
| **Icon size** | LOW | SupportActionList | Documented — uses 20px (MissionOperation pattern); ListRow uses 15/13 |
| **FAQ key** | LOW | Support.tsx | ✓ Fixed — `key={index}` |
| **faq-list border-radius** | COSMETIC | FaqDisclosureItem.css | ✓ Fixed — `var(--radius-lg)` |
| **Content-library spec gap** | DOC | content-library.md | Out of scope — spec vs implementation |
| **SupportActionList story route** | LOW | SupportActionList.stories.tsx | ✓ Fixed — `/restore` → `/restore-access` |
| **support-step CSS** | LOW | routes.css | ✓ Fixed — removed dead `.support-step` rules |
