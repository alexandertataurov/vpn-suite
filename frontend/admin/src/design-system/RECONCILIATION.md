# Primitives Reconciliation — Summary

**Date:** 2026-03-02

## Changes Applied

### Tokens (canonical: `tokens/tokens.css`)
- **Added** `--surface-4: #232a2f` — deepest inset surfaces (used by extended components)
- **Added** `--r-lg: 6px` — large containers
- **Updated** `--radius-lg` alias from `var(--r-md)` to `var(--r-lg)`

### HTML Demos
- **primitives.html**: Added `--surface-4`, `--r-lg`; page max-width 1100px → 1120px
- **typography.html**: Page max-width 1080px → 1120px
- **primitives-extended.html**: Already aligned (surface-4, r-lg, 1120px)

### Documentation
- **primitives-datasheet.md**: Added `--surface-4`, `--r-lg`; Stat Card, Skeleton, Divider to inventory; 14 components
- **primitives-techspec.md**: Added `--surface-4`; clarified border opacity (20–22%)
- **primitives-ext-datasheet.md**, **primitives-ext-techspec.md**: Already correct

## Alignment Matrix

| Asset | --surface-4 | --r-lg | Page 1120px | Notes |
|-------|-------------|--------|-------------|-------|
| tokens.css | ✓ | ✓ | — | Canonical source |
| primitives.html | ✓ | ✓ | ✓ | v1 + v2 tokens |
| primitives-extended.html | ✓ | ✓ | ✓ | v2 |
| typography.html | ✓ | — | ✓ | Self-contained tokens |
| primitives.css | — | — | — | Uses tokens, no local :root |
| primitives-extended.css | uses | uses | — | Component CSS only |

## React Primitives (primitives/*.tsx)

| Component | In ext-datasheet | Notes |
|-----------|------------------|-------|
| Tabs, Accordion, Modal, Dropdown, CommandPalette | ✓ | v2 |
| DataTable, Table, VirtualTable | Data Table | Table = base; DataTable/VirtualTable = variants |
| Breadcrumb, Pagination, Toast, Stepper, Timeline | ✓ | v2 |
| Slider, DatePicker, Popover, Avatar, EmptyState | ✓ | v2 |
| Meter, Drawer | ✓ | v2 |
| Widget | ✓ | Composite pattern |
| Spinner | — | App-specific; not in datasheet |
| ErrorState | — | Variant of Empty State |
| BadgeCount | Badge count sub-type | ✓ |
| Skeleton, Card | ✓ | v1 |

## Remaining Gaps (non-breaking)

1. **typography.html** uses `--text-dim`; primitives use `--text-disabled` — tokens.css has both.
2. **primitives.css** references only surface-1/2/3; primitives-extended.css adds surface-4.
3. **Spinner**, **ErrorState** are app primitives not yet documented in datasheets.
