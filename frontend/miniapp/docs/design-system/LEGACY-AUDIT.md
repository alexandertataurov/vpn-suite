# Miniapp Legacy Design Audit

**Date:** 2025-03-17  
**Scope:** frontend/miniapp only  
**Purpose:** Full inventory of legacy UI to remove per Design System Unification Plan

---

## 1. Buttons

| Legacy | Location | Replacement |
|-------|----------|-------------|
| `modern-primary-button` | OnboardingStepCard (7×), Home, PlanOptionsSection, TroubleshooterStep, SupportContactCard, SettingsAccountOverviewCard, PlanHeroCard | `Button variant="primary"` |
| `modern-primary-button--success` | OnboardingStepCard, Home | `Button status="success"` |
| `modern-secondary-button` | TroubleshooterStep (2×) | `Button variant="secondary"` |
| `modern-share-button` | PlanOptionsSection | `Button variant="secondary"` |
| `modern-banner` | OnboardingStepCard (2×), Home | `Button variant="secondary"` or custom Banner pattern |
| `modern-icon-button` | ModernHeader | `Button variant="ghost" size="icon"` |
| `.btn`, `.btn-primary`, `.btn-secondary` | frame.css, library.css | Keep for design-system Button; remove raw usage |

---

## 2. Cards

| Legacy | Location | Replacement |
|-------|----------|-------------|
| `modern-hero-card` | DevicesSummaryCard, SettingsAccountOverviewCard | HeroCard pattern |
| `modern-action-card` | RestoreAccess, ServerSelection, Home | ActionCard pattern |
| `modern-plan-card`, `modern-plan-grid` | PlanOptionsSection | SelectionCard / plan pattern |
| `troubleshooter-card` | TroubleshooterStep | StepCard or ListCard |
| `modern-contact-card` | SupportContactCard | ListCard + Button |
| `devices-add-wizard-card` | Devices page | design-system pattern |
| `modern-list`, `modern-list-item` | ListCard, Support | ListCard (already uses) |

---

## 3. Layout

| Legacy | Location | Replacement |
|-------|----------|-------------|
| `modern-content-pad` | RestoreAccess, ServerSelection, Checkout, Referral, Settings, Support, Plan, Devices, Home | ScrollZone + `--miniapp-content-gutter` |
| `modern-section` | Support, Plan | PageSection |
| `stagger-1` … `stagger-5` | library.css + pages | Remove or use token-based animation |
| `modern-header`, `modern-header-*` | ModernHeader recipe | Keep as recipe; ensure token-based |
| `modern-footer-help` | Onboarding, Home | design-system pattern |

---

## 4. Hardcoded Colors

| File | Count | Examples |
|------|-------|----------|
| frame.css | 36+ | `#10151a`, `#07090b`, `#f2f6f9`, `rgba(...)` |
| app.css | 10 | `#F8FAFC`, `rgba(37,99,235,0.08)`, `white` |
| routes.css | 4 | `#F2F3F6`, `#6B7280`, `#D1D5DB`, `#374151` |
| consumer.css | 34 | Full theme palettes (hex) |
| base.css | 33 | Primitives (oklch) — keep |
| layout-story.css | 1 | `color: #000` |

---

## 5. Hardcoded Spacing

| File | Examples |
|------|----------|
| frame.css | `padding: 16px`, `12px`, `8px`, `margin: 6px` |
| library.css | `padding: 10px 12px`, `9px 11px`, `14px 16px` |
| app.css | `padding: 16px 24px`, `margin: 16px`, `gap: 12px` |
| routes.css | `padding: 11px 12px`, `margin: 6px 0 32px` |

**Allowed scale:** 4, 8, 12, 16, 20, 24, 32 (via `--spacing-*`)

---

## 6. Inline Styles

| Location | Count |
|----------|-------|
| design-system/stories/*.tsx | 20+ files |
| App code | 0 (enforced by design:check) |

---

## 7. Utility Classes (u-mt-*, u-mb-*, etc.)

Defined in `design-system/styles/tokens/base.css`. Use these or token-based alternatives.

| Class | Maps to | Used In |
|-------|---------|---------|
| `u-mt-4` | `--spacing-4` (16px) | RestoreAccess, ServerSelection |
| `u-mt-12` | `--spacing-3` (12px) | ServerSelection, CheckoutFlowCard |
| `u-mt-16` | `--spacing-4` (16px) | RestoreAccess, CheckoutFlowCard, ServerSelection, Home, Checkout |
| `u-mt-24` | `--spacing-6` (24px) | RestoreAccess, ServerSelection, Support, Plan, Devices |
| `u-mb-8` | `--spacing-2` (8px) | ServerSelection, Support, Plan, Devices |
| `u-p-16` | `--spacing-4` (16px) | RestoreAccess, CheckoutFlowCard |
| `u-flex-1` | `flex: 1` | (grep) |

---

## 8. Deprecated Tokens

| Token | Used In | Replacement |
|-------|---------|-------------|
| `--md-*` | app.css :root, modern-* classes | Use `--color-*`, `--radius-*` directly |
| `--op-*`, `--tx-*`, `--bd-*`, `--s0`–`--s4` | library.css, frame.css | Semantic tokens |
| `--space-gutter` | app.css | `--miniapp-content-gutter` |
| `--tx-ter` | routes.css | `--color-text-tertiary` |

---

## 9. Files to Trim

1. **app.css** — Remove `.modern-*` after migration; move `:root` aliases to base.css or remove
2. **frame.css** — Remove page-specific blocks; keep shell + btn-* for Button
3. **library.css** — Remove duplicate btn-*, stagger-*; consolidate
4. **routes.css** — Tokenize colors; reduce page-specific overrides
5. **layout-story.css** — Remove `color: #000`

---

## 10. Support Page Tone Props

Support.tsx uses `tone="modern-blue"`, `tone="modern-green"`, `tone="modern-amber"` on ListCard. Replace with design-system tone tokens: `blue`, `green`, `amber` (or `default`, `success`, `warning`).
