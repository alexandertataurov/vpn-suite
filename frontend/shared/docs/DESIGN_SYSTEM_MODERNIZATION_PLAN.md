# Design System Modernization Plan

**Vibe:** Neutral, high-contrast, enterprise SaaS (Linear/Vercel style)

---

## 1. Before / After Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Color sources** | 4+ (admin.css hex, tailwind.css, tailwind.config, tokens.json) | 1: `tokens/colors.json` → tokens.css |
| **Tailwind colors** | Hardcoded hex | `var(--color-*)` |
| **Typography** | Dual scale (fluid + brief px) | Single composite `--text-*` scale |
| **Headings** | Mix of h1, text-2xl, text-xl | Consistent `--text-h1` … `--text-h4` |
| **Raw hex in code** | ~90 in admin, 6 in TS/TSX | 0 (except token source) |
| **Theme support** | Dark/light/dim via tokens | Same; no blocking |

---

## 2. Token Schema (Primitive + Semantic)

### 2.1 Primitives

```
gray-0..1000 (or 50..950)
blue, green, yellow, red, purple: 50..950
brand (optional): 50..950
```

### 2.2 Semantics

```
bg, surface, surface-2, overlay
text, text-muted, text-inverse
border, border-muted
primary, primary-hover, primary-active, on-primary
danger, success, warning, info (+ -muted for subtle bg)
ring, disabled, link, link-hover
```

---

## 3. Exact Files to Change

### Phase 1 — Token source & build

| File | Change |
|------|--------|
| `tokens/colors.json` | Add blue/green/yellow/red full ramps (optional); ensure semantic mapping |
| `tokens/typography.json` | Add `text-stat`, `text-table`, `text-label`, `text-code` if missing |
| `scripts/build-tokens.js` | Add new semantic aliases; optionally deprecate brief scale |
| `src/theme/tokens.css` | Generated; no manual edit |

### Phase 2 — Remove duplicate palettes

| File | Change |
|------|--------|
| `admin/src/admin.css` | Remove lines 2–47 hex block; import shared tokens |
| `admin/src/tailwind.css` | Replace hex with `var(--*)` |
| `admin/tailwind.config.ts` | Map surface, accent, text to CSS vars |

### Phase 3 — Charts & components

| File | Change |
|------|--------|
| `admin/charts/chartConfig.ts` | Use `var(--color-success)`, etc. or token refs |
| `admin/charts/theme.ts` | Resolve from tokens only; no hex fallbacks |
| `admin/charts/opsTimeseries.ts` | Shadow from token or var |
| `admin/charts/opsSparkline.ts` | Same |
| `admin/MiniSparkline.tsx` | `color={getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim()}` or token |

### Phase 4 — Shared UI cleanup

| File | Change |
|------|--------|
| `shared/src/ui/styles.css` | Remove oklch fallback; replace `--color-warning-600` with `--color-warning` |

### Phase 5 — Typography alignment

| File | Change |
|------|--------|
| `admin/src/admin.css` | `.dashboard h1`, page headers → `--text-h1` or `--text-h2` |
| `miniapp/src/miniapp.css` | Replace `--text-2xl`, `--text-base` with composite where applicable |
| `admin/components/PageHeader.tsx` | Use `Heading` or `--text-h2` |
| `admin/components/SectionHeader.tsx` | Use `--text-h3` |

---

## 4. Migration Steps (PR-sized chunks)

### PR 1 — Token spec + audits (no code)

- Add `COLOR_AUDIT.md`, `TYPO_AUDIT.md`, `TOKENS_SPEC.md`, `DESIGN_SYSTEM_GUARDRAILS.md`
- Add `scripts/check-tokens.sh` (grep for hex)
- Update Storybook Colors + Typography docs

### PR 2 — Admin palette removal

- Remove admin.css hex block; ensure shared tokens load first
- Update tailwind.css and tailwind.config to use vars
- Visual QA: Admin app in dark/light

### PR 3 — Charts tokenization

- chartConfig, theme, opsTimeseries, opsSparkline, MiniSparkline
- Verify charts render correctly in both themes

### PR 4 — Shared UI fixes

- styles.css: oklch fallback, color-warning-600
- CodeBlock, Divider, etc. (minor)

### PR 5 — Typography consolidation

- Admin/Miniapp: standardize headings and body to composite tokens
- Add `--text-stat`, `--text-table`, `--text-label` to build if needed
- Update PageHeader, SectionHeader, Breadcrumb

### PR 6 — Guardrails

- CI: run check-tokens.sh
- Storybook: token compliance checklist
- Contrast doc in Storybook

---

## 5. Updated Storybook Docs Plan

### Colors page (`Design System/Colors`)

- **Primitives:** Gray, blue, green, yellow, red, purple ramps (swatches)
- **Semantics:** bg, surface, text, border, primary, danger, success, warning, info, ring
- **Themes:** Toggle dark/light/dim; show semantic swatches per theme
- **Contrast:** Table of verified pairs (AA pass)

### Typography page (`Design System/Typography`)

- **Type scale table:** display, h1..h4, body, body-sm, caption, overline, code, button, stat, table, label
- **Font stacks:** sans, mono
- **Weights & line heights:** reference
- **Sample:** "The quick brown fox" per role
- **Numeric:** tabular-nums example for stat

### New: Token Compliance story

- Checklist component or MDX section
- Links to guardrails doc
