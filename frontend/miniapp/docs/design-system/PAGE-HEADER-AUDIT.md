# PageHeader — Design Audit

**Date**: 2026-03-18  
**Status**: Canonical for all secondary pages. ModernHeader reserved for Home only.

---

## 1. Usage Matrix (Current)

| Page | Component | Title | Subtitle | onBack | action |
|------|------------|-------|----------|--------|--------|
| Home | ModernHeader | — | — | No | ProfileRow |
| Settings | **PageHeader** | ✓ | ✓ | → "/" | No |
| Plan | **PageHeader** | ✓ | ✓ | → "/" or /onboarding | No |
| Support | **PageHeader** | ✓ | ✓ | navigate(-1) | No |
| RestoreAccess | **PageHeader** | ✓ | ✓ | navigate(-1) | No |
| Devices | **PageHeader** | ✓ | ✓ | navigate(-1) | No |
| Checkout | **PageHeader** | ✓ | ✓ | handleBack or -1 | No |
| Onboarding | **PageHeader** | ✓ | ✓ | step > 0: handleBack | No |

**Rule**: PageHeader for all secondary pages. ModernHeader for Home only.

---

## 2. Component API

```tsx
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;  // undefined = no back button (Onboarding step 0)
  action?: ReactNode;   // right-aligned slot
}
```

**Unused**: `action` prop is never used by any page. Devices uses action on DevicesSummaryCard, not PageHeader.

---

## 3. StandardPageHeader vs PageHeader

| StandardPageHeader (page model) | PageHeader (component) |
|--------------------------------|-------------------------|
| `title`, `subtitle`, `badge?` | `title`, `subtitle`, `onBack`, `action?` | |

**Drift**: `StandardPageHeader.badge` exists (PlanPageModel returns it) but **PageHeader does not support badge**. Plan page does not pass badge to PageHeader. Badge is orphaned in the page model.

---

## 4. CSS & Tokens

| Property | Value | Token / Note |
|----------|-------|--------------|
| `.page-header` padding | `var(--spacing-6) var(--spacing-4) var(--spacing-4)` | ✓ |
| `.page-header` gap | `var(--miniapp-grid-gap)` (12px) | ✓ |
| `.page-header-back` size | `var(--size-page-header-back)` (34px) | ✓ zones.css |
| `.page-header-back svg` | `14px × 14px` | Hardcoded; icon size |
| `.page-header-title` | `var(--font-size-lg)`, `var(--font-weight-bold)` | ✓ |
| `.page-header-subtitle` | `var(--font-size-sm)` | ✓ |
| responsive (≤360px) | `.page-header-title` → `--amnezia-page-header-title-sm` (16px) | base.css |

**base.css**: `--amnezia-page-header-title: 16px`, `--amnezia-page-header-title-sm: 16px` — same value; responsive override may be redundant.

---

## 5. Accessibility

| Item | Current | Issue |
|------|---------|-------|
| Back button | `aria-label="Back"` | Hardcoded; not i18n |
| ModernHeader back | `aria-label="Back"` | Same |
| Semantic structure | `<header>`, `<h1>`, `<p>` | ✓ |

**Recommendation**: Add `common.back` or `common.back_aria` and pass to PageHeader. PageHeader could accept `backAriaLabel?: string` with default "Back".

---

## 6. global-page-header vs page-header

| Class | Location | Used by |
|-------|----------|---------|
| `.page-header` | PageHeader.css | PageHeader component |
| `.global-page-header` | frame.css | Legacy layout; no TSX uses it |

**global-page-header** is dead in app code. Different structure (grid, `.global-page-title`, etc.). May be used by admin or Storybook.

---

## 7. Recommendations

| Priority | Item | Action |
|----------|------|--------|
| **LOW** | aria-label "Back" | ✓ Added `common.back_aria`, `backAriaLabel` prop; all pages pass it |
| **LOW** | StandardPageHeader.badge | Either add badge support to PageHeader (Plan) or remove badge from Plan model |
| **LOW** | action prop | Unused; document or remove |
| **COSMETIC** | --amnezia-page-header-title vs -sm | Both 16px; simplify responsive override |

---

## 8. Storybook

- **PageHeader.stories.tsx**: Single Default story with `title="Settings"`, `onBack`.
- **Header.stories.tsx**: PageHeaderStory with variants (title only, with subtitle, with action).
- No story for `onBack` undefined (Onboarding step 0).
