# Further Design System Audit

**Date**: 2026-03-19  
**Scope**: Remaining drift after CSS viewport, font, and spacing fixes

---

## 1. Remaining Hardcoded Values

### frame.css (shell/legacy layer)

| Category | Count | Examples | Recommendation |
|----------|-------|----------|----------------|
| font-size | 50+ | 8px, 9px, 10px, 12px, 13px, 14px, 15px, 16px, 22px, 24px | Deferred; tokenize incrementally |
| padding/margin/gap | 40+ | 4px, 5px, 6px, 7px, 8px, 9px, 10px, 12px, 14px, 16px, 19px, 20px | Replace with `var(--spacing-*)` |
| border-radius | 30+ | 10px, 12px, 18px, 20px, 24px, 999px | 999px = pill (keep); others → `var(--radius-*)` |

**High-impact targets** (consumer-facing):
- `.btn` padding, font-size, border-radius
- Select-sheet, modal, toast spacing
- Module-card, form-row gaps

### library.css

| Location | Value | Replace with |
|----------|-------|--------------|
| .toggle-setting min-height | 64px | `var(--miniapp-data-cell-min-height)` or token |
| Various padding/gap | 9px, 10px, 11px, 14px | `var(--spacing-*)` where in scale |

### routes.css

Per LEGACY-AUDIT: `padding: 11px 12px`, `margin: 6px 0 32px` — tokenize.

---

## 2. Hardcoded Colors

| File | Status | Notes |
|------|--------|-------|
| consumer.css, amnezia.css, base.css | ✓ Intentional | Theme palette definitions |
| banner-tokens, modal-tokens, progress-bar-tokens, button-tokens, alert-tokens | ✓ Intentional | Component theme tokens |
| NoDeviceCallout.css | ✓ Fixed | Refactored to use `var(--color-surface)`, `var(--color-text)`, etc. |
| storybook.css | ✓ Intentional | Storybook preview themes |
| routes.css | 4 instances | LEGACY-AUDIT: #F2F3F6, #6B7280, #D1D5DB, #374151 |
| app.css | 10 instances | LEGACY-AUDIT |
| frame.css | 36+ | Shell fallbacks; lower priority |

---

## 3. Inline Styles (TSX)

| Location | Count | Notes |
|----------|-------|-------|
| design-system/stories/*.tsx | 20+ files | Storybook demos; acceptable |
| story-helpers.tsx | 38 | Layout/swatch helpers |
| ProgressBar.tsx | 1 | `setProperty('--progress-width')` — acceptable |
| App pages/components | 0 | Enforced by design:check |

**Recommendation**: No action for Storybook. ProgressBar is intentional.

---

## 4. Open Items from Prior Audits

### DRIFT-AUDIT
- [ ] Hardcoded colors in routes.css, app.css, frame.css
- [ ] SettingsCard vs ListCard — migrate or deprecate
- [ ] Card class chain: `home-card-row module-card settings-list-card` — consider consolidation

### LEGACY-AUDIT
- [ ] Replace legacy button classes (modern-primary-button, etc.) with Button component
- [ ] Replace legacy card classes with design-system patterns
- [ ] stagger-1 … stagger-5 — remove or tokenize

### storybook-parity-audit
- [ ] StorybookMiniappShell — production-faithful harness
- [ ] Environment controls for theme, platform, safe-area

---

## 5. NoDeviceCallout Color Drift

~~**Current**: Defines `--nd-bg`, `--nd-border`, `--nd-icon-bg`, etc. with hex in component CSS.~~

**Fixed**: Refactored to use semantic tokens (`--color-surface`, `--color-text`, `--color-surface-2`, `--color-border`, etc.). Removed `--nd-*` theme blocks.

---

## 6. Animation / Motion

- prefers-reduced-motion: ✓ Handled (base.css, frame.css)
- Bypass: `?animations=force`, `data-animations="force"`
- Duration tokens: `--duration-*` exist; verify no hardcoded `0.18s`, `0.14s` in new code

---

## 7. Priority Order

1. **High**: Tokenize routes.css, app.css hardcoded colors (design:check violation)
2. **Medium**: frame.css consumer-facing spacing (btn, modal, toast)
3. **Medium**: NoDeviceCallout color tokens
4. **Low**: frame.css font-size (50+ instances)
5. **Low**: Legacy class migration (LEGACY-AUDIT)
