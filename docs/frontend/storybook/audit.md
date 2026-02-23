# Storybook Structural Audit

**Date:** 2025-02-21  
**Updated:** Review + guardrails  
**Storybook:** 8.6.x @ `frontend/shared/`  
**Story count:** 50 (shared: 46, admin: 4, miniapp: 1)

---

## Live Sidebar Tree

```
Design System
├── Introduction
├── Foundations
│   ├── Colors, Typography, Spacing, Radius, Shadows, Icons, Motion
├── Components (flat, 35+ items)
│   ├── Badge, Button, ButtonLink, Card, Checkbox, CodeBlock, CodeText...
│   ├── CopyButton, DeviceCard, Divider, Drawer, DropdownMenu...
│   ├── EmptyState, ErrorState, Field, FormStack, Heading, HelperText...
│   ├── Inline, InlineAlert, InlineError, Input, Label, LiveIndicator...
│   ├── Modal, PageError, ProfileCard, ProgressBar, QrPanel, RelativeTime...
│   ├── SearchInput, Section, Select, Skeleton, Spinner, Stack...
│   ├── Stat, StatusIndicator, Table, TableCell, Tabs, Text...
│   └── Toast, VisuallyHidden
├── Patterns
│   ├── BulkActionsBar, ConfirmationFlows, EmptyStates
│   ├── Forms, LoadingStates, TablesWithActions
└── Admin
    ├── Breadcrumb, MetricTile, MiniappLayout, PageHeader
    ├── ServersEmptyState, StatusBadge
```

---

## Severity-Ranked Problems

| Severity | Problem |
|----------|---------|
| High | Flat Components list (35+ items), no nested groups |
| High | ~~addon-a11y~~ Added |
| High | ~~No CI build/check~~ Added storybook:check + build |
| Medium | No dedicated VirtualTable story (covered in Table.stories) |
| Medium | Inconsistent story sets (Overview/Variants/States) per component |
| Medium | No density toolbar for table-heavy components |
| Low | Story naming drift (Default vs Primary vs Variants) |
| Low | Canvas padding may vary per story |

---

## Quick Wins (Done)

- [x] Add addon-a11y
- [x] Add storybook:check script + CI step
- [ ] Add density global (Phase 4)

---

## Structural Refactors (Multi-PR)

- Rebuild sidebar IA with nested groups
- DOCS_TEMPLATE enforcement
- Full coverage expansion (Overview, Variants, States, etc.)

---

## Current State Summary

| Metric | Value |
|--------|-------|
| Framework | @storybook/react-vite |
| Addons | essentials, links, addon-themes, addon-a11y |
| MDX docs | Foundations (7), Patterns (5), Introduction |
| Sidebar | Foundations, Components, Patterns, Admin (flat Components) |

---

## Component Audit Table

| Component | Location | Stories | Docs | States | Gaps |
|-----------|----------|---------|------|--------|------|
| Button | shared/ui | 10 | Yes (purpose) | All | - |
| ButtonLink | shared/ui | 3 | Basic | - | Admin duplicate |
| Badge | shared/ui | - | Basic | - | Variants story |
| Input | shared/ui | 4 | Basic | Some | Focus, a11y |
| Field | shared/ui | - | Basic | - | - |
| Checkbox | shared/ui | - | Basic | - | - |
| Select | shared/ui | - | Basic | - | - |
| SearchInput | shared/ui | - | Basic | - | - |
| Card | shared/ui | 1 | Basic | - | Variants, states |
| Table | shared/ui | 5 | Basic | - | - |
| Modal | shared/ui | 3 | Basic | - | - |
| Drawer | shared/ui | 1 | Basic | - | - |
| Tabs | shared/ui | - | Basic | - | - |
| DropdownMenu | shared/ui | 1 | Basic | - | - |
| Toast | shared/ui | 3 | Yes | - | - |
| InlineAlert | shared/ui | 3 | Basic | - | - |
| EmptyState | shared/ui | 3 | Basic | - | - |
| ErrorState | shared/ui | - | Basic | - | - |
| Skeleton | shared/ui | - | Basic | - | - |
| Spinner | shared/ui | - | Basic | - | - |
| Stack | shared/ui | 2 | Basic | - | - |
| FormStack | shared/ui | - | Basic | - | - |
| PageHeader | admin | 5 | Basic | - | Admin-specific |
| Breadcrumb | admin | - | Basic | - | - |
| MetricTile | admin | 4 | Basic | - | KPI pattern |
| StatusBadge | admin | - | Basic | - | - |
| ServersEmptyState | admin | 3 | Basic | - | Server pattern |
| MiniappLayout | miniapp | - | Basic | - | - |

---

## Key Findings

1. ~~**Duplicate:**~~ Admin `ButtonLink.stories.tsx` removed; shared story used.
2. ~~**Flat structure:**~~ Reorganized into Foundations / Components / Patterns / Admin.
3. ~~**Missing foundations:**~~ MDX added for Spacing, Radius, Shadows, Icons, Motion.
4. ~~**Missing component:**~~ Toast.stories.tsx added.
5. ~~**Weak docs:**~~ All components have `parameters.docs.description.component`.
6. **Inconsistent naming:** Mix of Default, Primary, Variants across stories.
7. ~~**No theming:**~~ manager.ts with brand theme; addon-themes for dark/light/dim.

---

## Proposed Sidebar Hierarchy

```
Design System (intro)
├── Foundations
│   ├── Colors
│   ├── Typography
│   ├── Spacing
│   ├── Radius
│   ├── Shadows
│   ├── Icons
│   └── Motion
├── Components
│   ├── Actions: Button, ButtonLink, CopyButton
│   ├── Forms: Input, Field, Checkbox, Select, SearchInput, FormStack
│   ├── Layout: Card, Stack, Inline, Section, Divider
│   ├── Data: Table, Badge, Stat, CodeBlock
│   ├── Overlays: Modal, Drawer, DropdownMenu
│   ├── Feedback: Toast, InlineAlert, Spinner, Skeleton
│   ├── States: EmptyState, ErrorState
│   └── ...
├── Patterns
│   ├── Forms, Tables with actions, Empty states
│   ├── Loading states, Confirmation flows
└── Admin
    ├── PageHeader, Breadcrumb, MetricTile, StatusBadge
    ├── ServersEmptyState
```
