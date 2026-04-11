# Primitives v2 — Pre-PR checklist

Use this checklist before merging PRs that touch dashboard UI. Full spec: [[07-docs/frontend/admin-design-system/design-system|design-system.md]].

## Pre-PR checklist

Run every item before declaring work done. Every unchecked item blocks merge.

### TOKENS

- [ ] Every color is `var(--*)`
- [ ] No hex values outside `:root`
- [ ] Surface token matches visual depth of component

### TYPOGRAPHY

- [ ] All UI text (labels, buttons, values, badges) uses `--font-mono`
- [ ] Only multi-sentence prose uses `--font-sans`
- [ ] Font sizes from the 8-size scale only
- [ ] Labels and badges are uppercase

### COMPONENTS

- [ ] No custom implementations where a system component exists
- [ ] Status badges use `.badge` or `.t-badge` — not plain colored text
- [ ] Loading states use skeleton shimmer, not spinner
- [ ] Empty/null table cells display — (em-dash)
- [ ] KPI numbers formatted with `.toLocaleString()`

### LAYOUT

- [ ] KPI card grid: `gap: 3px`
- [ ] Card padding: ≤ 16px any side
- [ ] Left-edge accent present on all KPI and chart cards
- [ ] No adjacent same-surface elements without a border between them
- [ ] No box-shadow for in-page elevation

### MOTION

- [ ] No `transition: all` — specific properties only
- [ ] No JS `setTimeout` for visual changes
- [ ] Degraded/warning status dots pulse (ringpulse)
- [ ] Critical/offline status dots are static (no animation)
- [ ] Page-load cards use fadeup with stagger

### ACCESSIBILITY

- [ ] All interactive elements have `:focus-visible` ring
- [ ] Minimum touch target 24×24px for every interactive element (buttons, links, icon buttons)
- [ ] Icon-only buttons have `aria-label`
- [ ] Error inputs have `aria-invalid` + `aria-describedby`
- [ ] ARIA roles present per the Accessibility Reference table in design-system.md

### REACT

- [ ] No inline `style` props
- [ ] No `<form>` elements (use `<div>` + handler)
- [ ] No `localStorage` / `sessionStorage`
- [ ] Named exports (not default)
- [ ] Variant/size defaults in destructuring

### LINT

- [ ] `pnpm lint` passes with zero new warnings

## Manual test (per increment)

- [ ] Load Overview, Servers, Telemetry, Devices, Users; confirm shell, nav, and page head
- [ ] Open one modal and one drawer; confirm focus and close
- [ ] Trigger success and warning toasts; confirm warning does not auto-dismiss
- [ ] Rollback: revert listed files if issues appear
