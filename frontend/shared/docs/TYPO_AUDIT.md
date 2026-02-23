# Typography Audit — Design System Modernization

**Date:** 2026-02  
**Scope:** Admin, Miniapp, Shared UI  
**Source of truth:** `tokens/typography.json` → `src/theme/tokens.css`

---

## 1. Current Type Scale

### Fluid scale (tokens.json)

- `--font-size-xs` … `--font-size-5xl` (clamp)
- Composite: `--text-h1` … `--text-h6`, `--text-body-lg`, `--text-body`, `--text-body-sm`, `--text-button-*`, `--text-caption`, `--text-overline`
- Font stacks: sans, serif, mono
- Weights: light..extrabold; line-height: tight..loose; letter-spacing: tighter..widest

### Brief scale (build-tokens.js compat block)

- `--text-xs`, `--text-sm`, `--text-base`, `--text-lg`, `--text-xl`, `--text-2xl` (fixed px)
- `--text-*-line` for line heights
- `--font-normal`, `--font-medium`, `--font-semibold` (400, 500, 600)

---

## 2. Problems Identified

### 2.1 Dual typography systems

| System | Tokens | Use case |
|--------|--------|----------|
| Fluid | `--font-size-*`, `--text-h1` … `--text-caption` | Shared UI, design system |
| Brief | `--text-xs`, `--text-sm`, `--text-base`, `--text-lg`, `--text-xl`, `--text-2xl` | Admin, Miniapp layout |

**Conflict:** Admin/Miniapp use `--text-2xl`, `--text-base`, `--text-sm`, `--text-xs` (px). Shared uses `--font-size-*` and composite `--text-body`, `--text-h4`. Two parallel scales cause drift (e.g. `--text-2xl` = 24px vs `--font-size-2xl` = clamp(1.875rem, ..., 2.25rem)).

### 2.2 Inconsistent heading usage

- `admin.css` `.dashboard h1`: `font-size: var(--text-2xl)` — not `--text-h1`
- `page-header-title.breadcrumb-current`: `font-size: var(--text-2xl)`
- `miniapp-page-title`: `font-size: var(--text-2xl)`
- Shared Heading component: uses `--text-h1` … `--text-h4`
- **No single “page title” role** — mix of h1, text-2xl, text-xl

### 2.3 Ad-hoc text classes

- `admin.css` line 504: `font-size: var(--text-2xl); line-height: var(--text-2xl-line)` — custom combo
- `admin.css` line 1448: `font-size: var(--text-2xl); font-weight: var(--font-medium)` — not a composite style
- `miniapp.css`: `font-size: var(--text-base)`, `var(--text-sm)`, `var(--text-2xl)` — piecemeal
- Shared `typo-*` classes: use composite `--text-body`, `--text-h1` etc. — correct

### 2.4 Missing roles

| Role | Status |
|------|--------|
| `display` | Not defined (h1 is largest) |
| `h1..h4` | Defined |
| `h5`, `h6` | Defined but rarely used |
| `body`, `body-sm` | Defined |
| `caption` | Defined |
| `overline` | Defined (typography.json) but no CSS class |
| `code` | Uses body-sm + mono; no dedicated `--text-code` |
| Table/form text | No explicit `--text-table`, `--text-label` — uses `--font-size-sm` ad hoc |
| Numeric/tabular | Stat uses `font-variant-numeric: tabular-nums`; no token |

### 2.5 Font weight token mismatch

- Typography: `--font-weight-medium` (500), `--font-weight-semibold` (600)
- Brief compat: `--font-medium` (500), `--font-semibold` (600)
- Admin uses `var(--font-medium)` — works via compat. But `--font-weight-*` vs `--font-*` is redundant.

---

## 3. Usage Patterns

| Location | Pattern | Issue |
|----------|---------|-------|
| Shared `Heading` | `--text-h1` … `--text-h4` | Correct |
| Shared `Text` | `--text-body`, `--text-body-sm`, `--text-caption` | Correct |
| Shared `Label`, `HelperText` | `--font-size-sm`, `--text-caption` | OK |
| Shared `Stat` | custom font shorthand + tabular-nums | No `--text-stat` token |
| Admin `.dashboard h1` | `--text-2xl` | Should be `--text-h1` or explicit page-title role |
| Admin page headers | `--text-2xl` | Inconsistent with shared Heading |
| Miniapp headers | `--text-base`, `--text-2xl`, `--text-sm` | Brief scale only |
| Admin styleguide | `--text-sm` for section titles | Mixed |

---

## 4. Duplicate / redundant tokens

- `--text-2xl` (24px) vs `--font-size-2xl` (clamp) — different values
- `--text-sm` vs `--font-size-sm` — same intent, different names
- `--font-normal` vs `--font-weight-normal`
- `--font-medium` vs `--font-weight-medium`

---

## 5. Summary

| Category | Severity | Count |
|----------|----------|-------|
| Dual type scales | High | 2 systems |
| Inconsistent headings | High | 5+ pages |
| Ad-hoc font combos | Medium | 10+ spots |
| Missing roles | Low | display, code, table, stat |
| Redundant tokens | Low | 4+ pairs |

---

## 6. Top 20 Offenders (files to fix first)

1. `admin/src/admin.css` — standardize h1, page headers to composite tokens
2. `miniapp/src/miniapp.css` — replace brief tokens with composite where applicable
3. `shared/scripts/build-tokens.js` — unify brief scale or deprecate
4. `shared/src/theme/tokens.css` — single source for type roles
5. `admin/tailwind.config.ts` — typography already maps to vars; ensure no px drift
6. `admin/src/pages/Styleguide.tsx` — use composite tokens
7. `admin/src/components/PageHeader.tsx` — use Heading or --text-h2
8. `admin/src/components/Breadcrumb.tsx` — consistent caption/body-sm
9. `admin/src/components/SectionHeader.tsx` — use --text-h3/h4
10. `admin/src/components/MetricTile.tsx` — use --text-stat if defined
11. `shared/src/ui/Stat.tsx` — add --text-stat to tokens
12. `shared/src/ui/Heading.tsx` — verify level→token mapping
13. `shared/src/ui/Text.tsx` — verify variant→token mapping
14. `shared/src/ui/Label.tsx` — use --text-label
15. `shared/src/ui/CodeText.tsx` — use --text-code
16–20. Table components, form layouts — explicit --text-table, --text-label
