# Miniapp Legacy Design Audit

**Date:** 2025-03-17  
**Scope:** frontend/miniapp only  
**Purpose:** Full inventory of legacy UI to remove per Design System Unification Plan

**Removed:** TroubleshooterStep, SupportContactCard (replaced by TroubleshooterFlowCard, ListCard + RowItem).

---

## 1. Buttons

| Legacy | Location | Replacement |
|-------|----------|-------------|
| `modern-primary-button` | OnboardingStepCard (7×), Home, PlanOptionsSection, SettingsAccountOverviewCard, PlanHeroCard | `Button variant="primary"` |
| `modern-primary-button--success` | OnboardingStepCard, Home | `Button status="success"` |
| `modern-secondary-button` | (removed) | `Button variant="secondary"` |
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
| `troubleshooter-card` | (removed; was TroubleshooterStep) | TroubleshooterFlowCard |
| `modern-contact-card` | (removed; was SupportContactCard) | ListCard + RowItem |
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
| layout-story.css | 0 | (verified; none) |

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
| `--tx-ter` | library.css | Replaced with `--color-text-tertiary` |
| `--tx-dim` | frame.css, library.css | Replaced with `--color-text-tertiary` |

---

## 9. Files to Trim

1. **app.css** — Remove `.modern-*` after migration; move `:root` aliases to base.css or remove
2. **frame.css** — Remove page-specific blocks; keep shell + btn-* for Button
3. **library.css** — Remove duplicate btn-*, stagger-*; consolidate. **Removed:** `.plan-hero`, `.conn-card`, `.summary-hero`, `.acct-hero`, `.connect-status-page` (dead blocks)
4. **routes.css** — Tokenize colors; reduce page-specific overrides
5. **layout-story.css** — Remove `color: #000` — **Done:** verified no `#000` in layout-story.css

---

## 10. Support Page Tone Props

Support.tsx uses `tone="modern-blue"`, `tone="modern-green"`, `tone="modern-amber"` on ListCard. Replace with design-system tone tokens: `blue`, `green`, `amber` (or `default`, `success`, `warning`).

---

## 11. Further Audit (2025-03-18) — Dead CSS & Orphaned Tokens

### 11.1 Dead CSS blocks (no TSX usage)

| Block | Location | Notes |
|-------|----------|-------|
| `.hero-visual-grid`, `.hero-visual-tile`, `.hero-visual-topline`, `.hero-visual-key`, `.hero-visual-value`, `.hero-visual-progress` | library.css ~233–273 | Legacy conn-card content; conn-card removed |
| `.conn-context-rail`, `.conn-telemetry-block`, `.conn-context-chip`, `.conn-context-key`, `.conn-context-value`, `.conn-context-value--link`, `.conn-context-value--ip` | library.css ~275–317 | Legacy conn-card; no TSX usage |
| `.conn-status-data-grid`, `.conn-server-link` | library.css ~343–359 | No TSX usage |
| `.conn-status-btn-row` | library.css ~1177 | No TSX usage |
| `.plan-hero-actions`, `.plan-hero-manage-link`, `.plan-hero-planid` | library.css ~1190–1215 | Orphaned after .plan-hero removal; plan-hero-meta kept (PlanHeroCard uses it) |
| `.feat-row`, `.feat-ico`, `.feat-text`, `.feat-val`, `.feat-val.yes`, `.feat-val.no` | library.css | Only in content-library.md; no app usage |
| `.m-tile` | library.css | Only in content-library.md; no app usage |

### 11.2 Unused keyframes

| Keyframe | Location | Notes |
|----------|----------|-------|
| `hero-card-glow-drift` | library.css ~2154 | Never referenced in `animation:` |
| `hero-visual-rise` | library.css ~2168 | Never referenced |
| `hero-sheen` | library.css ~2180 | Never referenced |

### 11.3 Undefined / missing tokens

| Token | Used In | Issue |
|-------|---------|-------|
| `--teal` | library.css (dc-val.teal, conn-context-value--link, .m-tile, etc.) | Not defined in miniapp theme; admin has it. Add to consumer.css or replace with `--color-accent` |
| `--surface-1`, `--surface-2` | library.css (hero-visual-tile, conn-context-chip) | Undefined; likely meant `--color-surface`, `--color-surface-2` |

### 11.4 Legacy plan-billing-page selectors (unused by current app)

Plan page uses `PlanBillingHeroCard` (modern-hero-card) and `PlanOptionsSection` (modern-plan-card). These BEM blocks are dead:

- `.plan-billing-page .plan-summary-card` and all `__*` descendants
- `.plan-billing-page .plan-tier-card` and all `__*` descendants
- `.plan-billing-page .plan-tier-features`, `.plan-tier-feature`
- `.plan-billing-page .feat-row`, `.feat-text`, `.feat-val`

**Keep:** `.plan-billing-page__*` (plans-section, billing-period, secondary-section, history-actions, next-step-card) — these are used.

### 11.5 Media query orphans

After removing conn-card, acct-hero, summary-hero:

- `@media (max-width: 420px) .hero-visual-grid { grid-template-columns: 1fr }` — hero-visual-grid has no TSX usage
- `@media (max-width: 420px) .conn-context-chip { ... }` — conn-context-chip dead

### 11.6 Recommended next steps

1. **Remove dead blocks:** hero-visual-*, conn-context-*, conn-status-*, conn-server-link, conn-status-btn-row
2. **Remove orphaned plan-hero-*:** plan-hero-actions, plan-hero-manage-link, plan-hero-planid (keep plan-hero-meta)
3. **Remove unused keyframes:** hero-card-glow-drift, hero-visual-rise, hero-sheen
4. **Fix tokens:** Add `--teal` to consumer.css (e.g. `--teal: var(--color-accent)` or semantic alias), or replace with `--color-accent`; fix `--surface-1`/`--surface-2` → `--color-surface`/`--color-surface-2` in hero-visual-tile and conn-context-chip (or remove those blocks)
5. **Trim plan-billing-page CSS:** Remove `.plan-summary-card` and `.plan-tier-card` rules; keep only `plan-billing-page__*` and shared layout rules
6. **Remove media query orphans:** .hero-visual-grid, .conn-context-chip from @media (max-width: 420px)
7. **feat-row, feat-ico, m-tile:** Remove if no design-system recipe uses them; else keep for content-library docs only

**Done (2025-03-18):** All 7 steps implemented. Added `--teal` to consumer.css (light: #0e7490, dark: #2dd4bf).

---

## 12. Further Audit Round 2 (2025-03-18)

### 12.1 Additional dead CSS removed

| Block | Notes |
|-------|-------|
| `.m-tile`, `.m-key`, `.m-val`, `.m-unit`, `.m-sub`, `.metrics` | No TSX usage; DevicesSummaryCard uses modern-device-metric |
| `.usage-summary-*`, `.usage-fill*` | No TSX usage |
| `.plan-renew-list`, `.plan-renew-strip` | No TSX usage |
| `.tier-card`, `.tier-select-btn`, `.tier-*` (all) | Plan page uses modern-plan-card; e2e updated to use button role |
| `.snap-carousel--cards .tier-card`, `.tier-card--empty` | Legacy carousel tier layout |
| `.plan-billing-page .plan-hero-name span`, `.plan-billing-page .usage-summary-label` | Orphaned after plan-hero/usage-summary removal |
| `.plan-billing-page .tier-desc` | Removed from max-width rule |

### 12.2 E2E fix

- `checkout.spec.ts`: `.tier-select-btn` → `getByRole("button", { name: /Select|Choose|Switch/i })` (plan cards use Button, not tier-select-btn)

---

## 13. Further Audit Round 3 (2025-03-18) — Undefined Tokens

### 13.1 Tokens fixed

| Token | Issue | Fix |
|-------|-------|-----|
| `--green-glow` | Used in library.css status-dot.online, undefined | Added to consumer.css (light + dark) |
| `--control-ghost-hover-bg`, `--control-outline-hover-bg`, `--control-outline-hover-border` | Used in library.css, frame.css; undefined | Added to consumer.css |
| `--control-disabled-bg`, `--control-disabled-fg`, `--control-disabled-placeholder` | Used in library.css field-input:disabled | Added to consumer.css |
| `--control-pressed-bg`, `--control-segment-bg`, `--control-segment-indicator-shadow` | Used in library.css | Added to consumer.css |
| `--control-placeholder`, `--control-muted-border`, `--control-muted-fg` | Used in frame.css | Added to consumer.css |

---

## 14. Deep Audit Round 4 (2025-03-18)

### 14.1 Dead CSS removed from library.css

| Block | Notes |
|-------|-------|
| `.expiry-row`, `.expiry-meta`, `.expiry-lbl`, `.expiry-val` | No TSX usage; app uses ProgressBar / modern-progress-bar-fill |
| `.plan-billing-page__usage .shead-lbl` | Orphaned selector; no TSX uses plan-billing-page__usage |
| `.bar-track`, `.bar-fill`, `.bar-fill--animated`, `.bar-fill.ok/warn/crit/info` | No TSX usage; app uses progress-bar-fill (frame.css) and modern-progress-bar-fill (modern.css) |

### 14.2 SnapCarousel removed

- Deleted `SnapCarousel.tsx`; removed export from recipes/index.ts
- Removed `.snap-carousel` and `.snap-carousel:focus-visible` from library.css
- Removed `@media (prefers-reduced-motion: reduce) .snap-carousel` rule

### 14.3 Tone props: modern-* removed

- **SettingsActionRow**: Component deleted. ListRow is canonical for settings rows.
- **ListCard**: Removed `modern-*` from `ListRowIconTone`; simplified `resolveModernTone` default to `modern-icon-tone--neutral`

### 14.4 layout-story.css

- Verified: no `color: #000` in layout-story.css (audit §9 item 5 done)
- storybook.css `--color-bg: #000000` for Storybook dark theme is acceptable
