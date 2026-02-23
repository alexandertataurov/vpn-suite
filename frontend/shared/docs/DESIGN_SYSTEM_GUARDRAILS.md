# Design System Guardrails

Prevent regression: enforce token-only usage and document compliance.

---

## 1. "No raw hex" enforcement

### 1.1 ESLint / stylelint (optional)

```bash
# Block hex in CSS/SCSS (exclude tokens build output)
# stylelint rule: color-no-hex
```

### 1.2 Grep-based CI check

```bash
# Fail if hex/rgb/hsl found outside allowed paths
! grep -rE '#[0-9a-fA-F]{3,8}\b|rgb\(|rgba\(|hsl\(' \
  --include='*.css' --include='*.tsx' --include='*.ts' \
  --exclude-dir=node_modules \
  --exclude='tokens.css' \
  --exclude='build-tokens.js' \
  frontend/
```

Implemented in `scripts/check-tokens.sh`, run in CI (`.github/workflows/ci.yml`).

### 1.3 Allowed exceptions

- `tokens/colors.json` (source)
- `shared/scripts/build-tokens.js` (generates tokens)
- `shared/src/theme/tokens.css` (generated; do not edit)
- `admin/src/charts/theme.ts` (fallback hex in `resolveCssColor` for SSR/canvas)
- `admin/src/charts/presets/*.ts` (rgba in ECharts extraCssText for tooltip shadow)

---

## 2. Storybook token compliance checklist

Add to `Design System/Colors` and `Design System/Typography` docs:

- [ ] All semantic colors documented with swatches
- [ ] All type roles documented with sample
- [ ] Primitive ramps shown (gray, primary, status)
- [ ] Theme switcher (dark/light/dim) demonstrated
- [ ] Contrast: key pairs meet WCAG AA (document in Storybook)
- [ ] No hardcoded values in Storybook MDX (use `var(--token)`)

---

## 3. Contrast verification

| Pair | Expected ratio | Check |
|------|----------------|-------|
| text on bg | 4.5:1 (normal), 3:1 (large) | Use contrast checker |
| primary button (on-primary on primary) | 4.5:1 | Verify |
| muted text on bg | 4.5:1 or 3:1 | Verify |
| focus ring on bg | 3:1 | Verify |

Document results in Storybook Colors page.

---

## 4. PR checklist

When touching design tokens or UI:

- [ ] No new hex/rgb/hsl in components or pages
- [ ] Tailwind colors use `var(--*)` references
- [ ] Typography uses composite `--text-*` or `--font-size-*`
- [ ] New components use semantic tokens
- [ ] Storybook docs updated if tokens change
