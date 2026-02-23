# Color Audit — Design System Modernization

**Date:** 2026-02  
**Scope:** Admin, Miniapp, Shared UI  
**Source of truth:** `tokens/colors.json` → `src/theme/tokens.css`

---

## 1. Current Palette Structure

### Primitive tokens (tokens.json)

- **Gray:** 50..950 (OKLCH) — single ramp
- **Ink:** 800, 900 — accent dark
- **Primary:** 50..950 (blue-ish)
- **Status:** success/warning/error/info (500, 600 only)
- **Missing:** full blue/green/yellow/red ramps for charts/badges

### Semantic tokens (per theme: dark, light, dim)

- Background: primary, secondary, tertiary, inverse, overlay, scrim
- Text: primary, secondary, tertiary, inverse
- Border: subtle, default, strong
- Interactive: default, hover, active, disabled
- Status: success, warning, error, info, connected, syncing
- Badge backgrounds (legacy) removed in new token system

---

## 2. Problems Identified

### 2.1 Duplicate palettes (critical)

| File | Issue |
|------|-------|
| `admin/src/admin.css` | **48 hex values** — full primary/success/warning/danger/neutral scales override shared tokens |
| `admin/src/tailwind.css` | **10 hex values** — surface-base, surface-raised, accent-*, text-* |
| `admin/tailwind.config.ts` | **15 hex values** — surface.base/raised/overlay, accent.blue/green/etc, text.primary/secondary |
| `admin/charts/chartConfig.ts` | **9 hex/rgba values** — chart series colors |
| `admin/charts/theme.ts` | Fallback hex in `resolveCssColor()` |
| `admin/charts/opsTimeseries.ts`, `opsSparkline.ts` | `rgba(0,0,0,0.08)` box-shadow |
| `admin/MiniSparkline.tsx` | `color = "#3b82f6"` hardcoded |

**Impact:** Admin ignores shared tokens for core surfaces/text. Light/dark theme from `tokens.css` is partially overridden by admin.css `:root` and Tailwind hex.

### 2.2 Naming inconsistencies

| Current | Problem |
|---------|---------|
| `--color-bg` | Alias; prefer `--color-background-primary` |
| `--color-surface` | Alias; prefer `--color-background-secondary` |
| `--accent-primary` | Alias; prefer `--color-interactive-default` (consolidation in progress) |
| `--color-primary` | Semantic (interactive); collides with primitive `--color-primary-500` |
| `--color-text-muted` | Alias; consolidate with `--color-text-tertiary` / `--color-text-secondary` |
| `--color-text` vs `--color-text-primary` | Dual naming |
| `surface-base` vs `--color-background-primary` | Different sources |
| `--color-danger-*` | In admin.css only; shared uses `--color-error` |

### 2.3 Missing semantics

- `--color-link` / `--color-link-hover` — not explicit
- `--color-disabled` — only `interactive-disabled`; no explicit disabled text/bg
- `--color-ring` / `--color-focus` — focus-ring exists but naming inconsistent
- Subtle backgrounds for status — use semantic surface tokens only

### 2.4 Contrast risks

- Miniapp uses `--color-neutral-900` for headers; in light theme this is dark (OK). In dark theme, neutral-900 is dark gray — text on dark bg may fail if theme switches.
- Chart theme fallbacks (`#000000`, `#737373`) — may not respect dark mode.
- `admin/charts/theme.ts` resolves `--color-neutral-900` etc.; depends on admin.css overrides. Shared tokens use `--color-gray-*`; admin has `--color-neutral-*` as alias to gray.

---

## 3. Usage Patterns in Components

| Component | Tokens used | Notes |
|-----------|-------------|-------|
| Button | color-primary, color-on-primary, color-surface, color-text, color-border | Correct (semantic) |
| Badge | color-success, color-warning, color-danger, color-info | Correct |
| Input | color-bg, color-text, color-border, color-primary | Correct |
| Table | color-surface, color-border, color-text-*, color-primary-subtle | Correct |
| Modal/Drawer | color-surface, color-border, color-scrim | Correct |
| InlineAlert | color-border-default, color-background-secondary, color-warning, color-error | Correct |
| DropdownMenu | color-background-primary, color-border-default, color-error | Correct |
| styles.css | color-warning-600 (primitive) | Should use semantic |

### Hardcoded / fallback

- `styles.css` line 746, 749: `--color-warning-600` — primitive; prefer `--color-warning`
- `CodeBlock.tsx`: `var(--color-background-tertiary, var(--color-surface))` — defensive fallback OK
- `styles.css` line 937: `oklch(0.279 0.01 247)` — raw OKLCH fallback; should be token

---

## 4. Summary

| Category | Severity | Count |
|----------|----------|-------|
| Duplicate hex palettes | Critical | ~90 values across admin |
| Hardcoded hex in TS/TSX | High | 6 files |
| Naming inconsistency | Medium | 10+ aliases |
| Missing semantics | Low | link, disabled, ring |
| Raw OKLCH in shared | Low | 1 |

---

## 5. Top 20 Offenders (files to fix first)

1. `admin/src/admin.css` — remove hex palette block; rely on shared tokens
2. `admin/src/tailwind.css` — replace hex with var()
3. `admin/tailwind.config.ts` — map colors to CSS vars
4. `admin/charts/chartConfig.ts` — use token refs
5. `admin/charts/theme.ts` — ensure fallbacks resolve from tokens
6. `admin/charts/opsTimeseries.ts` — tokenize shadow
7. `admin/charts/opsSparkline.ts` — tokenize shadow
8. `admin/MiniSparkline.tsx` — use token
9. `shared/src/ui/styles.css` — remove oklch fallback, fix color-warning-600
10. `shared/src/ui/CodeBlock.tsx` — simplify fallback
11–20. Admin pages/components using Tailwind `surface-*`, `accent-*`, `text-*` — will fix via Tailwind remap
