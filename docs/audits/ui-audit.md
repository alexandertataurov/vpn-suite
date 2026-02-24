# UI Audit — Unified Design System

## Inventory Summary

### Shared Package (frontend/shared/src/ui/)

| Component | Status | Notes |
|-----------|--------|-------|
| Button | Exists | Variants: primary, secondary, ghost, danger; sizes: sm, md, lg |
| Input, Select, Checkbox | Exist | Field wrapper available |
| Card, Modal, Drawer | Exist | Card variants: default, glass, raised |
| Tabs, DropdownMenu | Exist | |
| Badge, Toast, InlineAlert | Exist | |
| Skeleton, Spinner, EmptyState, ErrorState | Exist | |
| Table, DataTable, TableSkeleton | Unified | Per TABLES_AUDIT.md |
| Stack, Inline | Exist | Layout primitives |
| Text, Heading, Label, HelperText | Exist | Typography |
| MetricTile, Stat | Admin | MetricTile in admin, Stat in shared |

### Admin-Specific CSS (admin.css)

| Class Group | Purpose | Problem |
|-------------|---------|---------|
| admin-layout, admin-sidebar, admin-main | Shell layout | Keep; ensure tokens |
| admin-nav-*, admin-header-* | Navigation | Consolidate tokens |
| ref-action-btn* | Button styling | Duplicate of Button; migrate |
| ref-settings-card | Card/panel | Duplicate of Card |
| ref-form-field*, form-stack | Forms | form-stack → FormStack |
| ref-stats-grid, ref-charts-grid | Layout | Add to shared or document |
| ref-stat-card, ref-stat-* | KPI tiles | Use MetricTile |
| dashboard-muted, dashboard-value | Typography | Use Text, Stat |
| page-header-* | Page header | Standardize PageHeader |
| ref-banner | Alerts | Use InlineAlert |
| server-drawer-* | Drawer content | Use shared Drawer |
| ref-filter-bar, ref-presets | Filters | Keep; token-based |

### Per-Page Styling (style={{}})

Files with inline styles: ServerRowDrawer (33), ControlPlane (66), ConnectionNodesSection (21),  (45), Users (50), ServerDetail (34), ServerRow (16), Servers (13), VpnNodesTab (30), DockerServicesTab (41), others.

**Problems**: Layout (gap, flex) acceptable; avoid visual styling (colors, margins) in components.

### Typography

- `dashboard-muted` → Text variant="muted"
- `dashboard-value` → Stat or Heading
- `dashboard-section-title` → Heading level={4}
- Raw `className` for text → Text, Heading

### Focus / A11y

- Shared `--focus-ring`, `:focus-visible` on buttons
- Modal/Drawer: verify focus trap
- Icon-only buttons: require aria-label

### File List for Migration

**Phase 1**: form-stack → FormStack (ServerNew, ServerEdit, Users)
**Phase 2**: ref-action-btn, ref-settings-card (ServerRowDrawer, IssueConfigModal, Settings, ServerNew, ServerEdit, Devices, Audit, ControlPlane, , Login)
**Phase 3**: dashboard-muted, ref-stat-* (Dashboard, Styleguide, ConnectionNodesSection, ClusterAutomationSummary, PageHeader)
**Phase 4**: admin.css cleanup, PageHeader
**Phase 5**: UI_GUIDE.md, Styleguide expansion
