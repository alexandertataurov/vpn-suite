# Component Inventory — Bloomberg Operator Design System

**Date:** 2026-02-21  
**Status:** Post-implementation verification

## Shared UI Components (frontend/shared/src/ui/)

| Component | File | Type | Variants | Inline Styles | Arbitrary Tailwind | Refactored |
|-----------|------|------|----------|---------------|--------------------|------------|
| Button | Button.tsx | Atomic | primary/secondary/ghost/outline/danger/link; sm/md/lg/icon | No | No | ✓ |
| ButtonLink | ButtonLink.tsx | Atomic | same as Button | Optional style prop | No | ✓ |
| Input | Input.tsx | Atomic | — | No | No | ✓ |
| Textarea | Textarea.tsx | Atomic | — | No | No | ✓ (new) |
| Select | Select.tsx | Atomic | — | No | No | ✓ |
| Checkbox | Checkbox.tsx | Atomic | — | No | No | ✓ |
| Field | Field.tsx | Utility | — | No | No | ✓ |
| Label | Label.tsx | Atomic | — | No | No | ✓ |
| Radio | — | Missing | — | — | — | Add if needed |
| Table | Table.tsx | Data | density; loading; selection | getColumnStyle (required) | No | ✓ |
| VirtualTable | VirtualTable.tsx | Data | maxHeight; rowHeight | containerStyle; row pos; getColumnStyle | No | ✓ |
| TableCell | TableCell.tsx | Atomic | truncate, numeric, mono, align | No | No | ✓ |
| DataTable | table/DataTable.tsx | Layout | maxHeight | style prop | No | ✓ |
| Pagination | Table.tsx | Data | — | No | No | ✓ |
| TableSkeleton | table/TableSkeleton.tsx | Feedback | — | cell padding | No | ✓ |
| Badge | Badge.tsx | Feedback | neutral/info/success/warning/danger; sm/md; dot | No | No | ✓ |
| Toast | Toast.tsx | Feedback | success/error/info | No | No | ✓ (z-index fixed) |
| InlineAlert | InlineAlert.tsx | Feedback | info/warning/error | No | No | ✓ |
| Spinner | Spinner.tsx | Feedback | sm/md | No | No | ✓ |
| Skeleton | Skeleton.tsx | Feedback | default/line/card/list/shimmer | width/height (dynamic) | No | ✓ |
| EmptyState | EmptyState.tsx | Feedback | — | No | No | ✓ |
| ErrorState | ErrorState.tsx | Feedback | — | No | No | ✓ |
| PageError | PageError.tsx | Feedback | — | No | No | ✓ |
| Tabs | Tabs.tsx | Nav | — | No | No | ✓ |
| Modal | Modal.tsx | Overlay | ConfirmModal, ConfirmDanger | No | No | ✓ |
| Drawer | Drawer.tsx | Overlay | width | width when custom | No | ✓ |
| DropdownMenu | DropdownMenu.tsx | Overlay | align; portal | position (required) | No | ✓ |
| Card | Card.tsx | Layout | default/glass/raised/panel | No | No | ✓ |
| Panel | Panel.tsx | Layout | header; actions | No | No | ✓ (new) |
| Box | Box.tsx | Layout | base/raised/overlay/subtle | tokens via style | No | ✓ |
| Section | Section.tsx | Layout | title; actions | No | No | ✓ |
| Stack | Stack.tsx | Layout | direction; gap | tokens via style | No | ✓ |
| Grid | Grid.tsx | Layout | columns; gap | tokens via style | No | ✓ |
| FormStack | FormStack.tsx | Layout | — | No | No | ✓ |
| Inline | Inline.tsx | Layout | gap; align | tokens via style | No | ✓ |
| Divider | Divider.tsx | Atomic | horizontal/vertical | No | No | ✓ |
| Text | Text.tsx | Typography | body/muted/caption/code/danger; sm/base/lg | No | No | ✓ |
| Heading | Heading.tsx | Typography | level 1–4 | No | No | ✓ |
| StatusIndicator | StatusIndicator.tsx | Feedback | — | No | No | ✓ |
| LiveIndicator | LiveIndicator.tsx | Feedback | — | Yes (animation) | No | ✓ |
| BulkActionsBar | BulkActionsBar.tsx | Layout | — | Yes | No | — |
| CopyButton | CopyButton.tsx | Utility | — | No | No | ✓ |
| CodeBlock | CodeBlock.tsx | Utility | — | Yes | No | — |
| QrPanel | QrPanel.tsx | Utility | — | Yes | No | — |
| ProgressBar | ProgressBar.tsx | Feedback | — | width % (dynamic) | No | ✓ |
| RelativeTime | RelativeTime.tsx | Utility | — | No | No | ✓ |
| HelperText | HelperText.tsx | Utility | hint/error | No | No | ✓ |
| Stat | Stat.tsx | Feedback | delta | No | No | ✓ |
| CodeText | CodeText.tsx | Typography | — | No | No | ✓ |
| DeviceCard | DeviceCard.tsx | Composite | — | No | No | ✓ |
| ProfileCard | ProfileCard.tsx | Composite | — | No | No | ✓ |
| VisuallyHidden | VisuallyHidden.tsx | Utility | — | No | No | ✓ |
| SearchInput | SearchInput.tsx | Atomic | — | No | No | ✓ |
| InlineError | InlineError.tsx | Feedback | — | No | No | ✓ |

## Admin-Specific Components

| Component | File | Type | Refactored |
|-----------|------|------|------------|
| StatusBadge | admin/components/StatusBadge.tsx | Feedback | ✓ (token CSS) |
| ServersCommandPalette | admin/components/ServersCommandPalette.tsx | Overlay | ✓ (token CSS) |
| CommandPalette | admin/components/CommandPalette.tsx | Overlay | — |
| FilterBar | admin/components/FilterBar.tsx | Utility | — |
| PageHeader | admin/components/PageHeader.tsx | Layout | — |
| TableSection | admin/components/TableSection.tsx | Layout | — |
| Toolbar | admin/components/Toolbar.tsx | Layout | — |
| Breadcrumb | admin/components/Breadcrumb.tsx | Nav | — |
| MetricTile | admin/components/MetricTile.tsx | Admin | — |
| ChartFrame | admin/charts/ | Admin | — |
| EChart | admin/charts/ | Admin | — |
| ServerRow | admin/components/ServerRow.tsx | Admin | — |
| ServerRowDrawer | admin/components/ServerRowDrawer.tsx | Admin | — |

## Cell Helpers (table/)

| Helper | File | Deprecated? | Notes |
|--------|------|-------------|-------|
| CellText | CellHelpers.tsx | No | truncate + tooltip |
| CellNumber | CellHelpers.tsx | No | numeric align |
| CellActions | CellHelpers.tsx | No | right align |
| CellCompound | CellHelpers.tsx | TABLE_STYLES_GUIDE | Still used by Users |
| CellAvatar | CellHelpers.tsx | TABLE_STYLES_GUIDE | Still used |
| CellPrimary | CellHelpers.tsx | TABLE_STYLES_GUIDE | Still used |
| CellMuted | CellHelpers.tsx | TABLE_STYLES_GUIDE | Still used |
| CellSecondary | CellHelpers.tsx | — | Still used |

## Design Consistency (Operator)

All pages and elements use operator tokens when `[data-console="operator"]` is set:
- **AdminLayout**: `data-console="operator"` on main layout
- **Login**: `data-console="operator"` on login-page for consistency
- **Shared overrides**: page-header, ref-section, tabs-page, card, modal, drawer, dropdown, table, badge, btn, input
- **Admin overrides**: login-card, ref-table-section, ref-filter-bar, ref-toolbar, section-header, breadcrumb

## Operator Mode

- **Scope:** `[data-console="operator"]` on AdminLayout and Login page
- **Tokens:** `--spacing-op-*`, `--radius-op`, `--table-row-height-op`, `--text-op-*`, `--line-height-op-*`
- **Theme:** light + operator-dark (via data-theme dark/dim)

## Remaining Inline Styles (acceptable)

- **Table/VirtualTable:** `getColumnStyle` for dynamic column widths (required)
- **VirtualTable:** row position, container height (required for virtualization)
- **Drawer:** width when custom (required)
- **DropdownMenu:** position for portal (required)
- **Skeleton:** width/height (dynamic props)
- **ProgressBar:** width % (dynamic)
- **Box/Stack/Grid:** layout via tokens (design intentional)
- **Stories:** layout wrappers (dev-only)

## Missing Primitives

- **Radio:** No shared Radio component. Add if form needs it.
- **Tooltip:** Chart tooltips only; no generic UI Tooltip.
