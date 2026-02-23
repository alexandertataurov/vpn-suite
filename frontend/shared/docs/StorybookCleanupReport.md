# Storybook Cleanup Report

## PR1 — Infrastructure + Foundations

### Changes
- Added Storybook addons: `@storybook/addon-interactions`.
- Added viewports: `Operator 1440`, `Compact 390`.
- Added theme switcher support for `dim`.
- Normalized Storybook canvas to token-based shell.
- Refactored TokenGrid/TokenSwatch to class-based styling.
- Consolidated Foundations docs: removed duplicate top-level docs and added new Foundations sections.

### Removed / Moved
- Removed duplicate docs: `frontend/shared/src/docs/Colors.mdx`, `Spacing.mdx`, `Typography.mdx`, `Radius.mdx`, `Shadows.mdx`, `Icons.mdx`.
- Added new docs:
  - `frontend/shared/src/docs/foundations/ZIndex.mdx`
  - `frontend/shared/src/docs/foundations/Theming.mdx`
  - `frontend/shared/src/docs/foundations/IconsGuidelines.mdx`
- Merged `ElevationSurfaces.mdx` into `ZIndex.mdx` and removed the standalone doc.

### Evidence
- Duplicates superseded by `frontend/shared/src/docs/foundations/*` equivalents.

## PR2 — Canonical Primitives + Showcase

### Changes
- Added canonical primitives: `StatusBadge`, `MetricCell`, `LoadingSkeleton` alias.
- Added storybook CSS utility classes and migrated docs to token-based classes.
- Updated story titles to canonical tree where applicable.
- Standardized primitive/component stories to required golden set.

### Evidence
- New primitive files: `frontend/shared/src/ui/primitives/StatusBadge.tsx`, `frontend/shared/src/ui/primitives/MetricCell.tsx`.
- Story titles updated under `frontend/shared/src/ui/**/**/*.stories.tsx`.

## PR3 — Legacy Migration + Deletions

### Removed / Migrated
- Removed legacy layout components: `Box`, `Grid`, `Stack`, `Section`, legacy `Panel`, legacy `Divider`.
- Removed legacy display components: `Card`, legacy `Badge`.
- Removed `DataTable` and legacy `TableCell` exports; added `TableContainer`.
- Migrated admin/miniapp usage to `Panel`, `PrimitiveStack`, `TableContainer`, `PrimitiveBadge`.

### Evidence
- Usage scan shows no remaining imports of legacy paths:
  - `rg -n "layout/(Box|Grid|Panel|Section|Stack|Divider)|display/(Card|Badge)|table/(DataTable|TableCell)" frontend` → no results.

## PR4 — Patterns + Pages

### Changes
- Added pattern stories: `OperatorHeader`, `HealthStrip`, `MetricRow`, `EmptyStates`, `ErrorStates`, `LoadingStates`.
- Added reference page stories: `Dashboard`, `Servers`, `Telemetry`, `Miniapp/Overview`.
- Completed golden story coverage across all Storybook stories (Overview/Variants/Sizes/States/WithLongText/DarkMode/Accessibility).

## PR5 — Coverage Completion + Miniapp Pages

### Changes
- Added miniapp page stories: `HomePage`, `DevicesPage`, `ProfilePage`, `HelpPage`.
- Added miniapp Storybook helpers: fetch mocks + fixtures + layout wrapper.
- Added miniapp CSS to Storybook preview for accurate page styling.
- Added docs for admin modals and drawer: `ConfigContentModal`, `IssueConfigModal`, `ServerRowDrawer`.
- Added patterns docs: `OperatorHeader`, `OperatorToolbar`, `HealthStrip`, `FreshnessBadge`, `MetricRow`, `RowActionsMenu`, `BulkActionsBar`, `StatusStrip`, `ErrorStates`, and updated `EmptyStates`, `LoadingStates`.
- Added Storybook checklist and fixtures documentation.

### Fixes
- Router double-render in Storybook preview (conditional MemoryRouter wrapper + story-level `router.disabled`).
- Toast usage in Storybook (global `ToastContainer` wrapper).

### Evidence
- New helpers: `frontend/miniapp/src/storybook/*`.
- Miniapp CSS imported in `frontend/shared/.storybook/preview.tsx`.
- New docs: `frontend/shared/src/docs/components/ConfigContentModal.mdx`, `IssueConfigModal.mdx`, `ServerRowDrawer.mdx`.
- New patterns docs under `frontend/shared/src/docs/patterns/*`.
- `frontend/shared/docs/StorybookChecklist.md` and `StorybookFixtures.md`.

## Missing Components (Not Implemented)

- IconButton
- Radio
- Switch
- Tooltip
- Popover
- SidebarNav
- Navbar/Topbar (standalone)
- HealthScore
- IncidentList

## Deliverables
- Final Storybook tree: `frontend/shared/docs/StorybookTree.md`
- Component inventory: `frontend/shared/docs/ComponentInventory.md`
- Docs pages: `frontend/shared/src/docs/primitives/*.mdx`, `frontend/shared/src/docs/components/*.mdx`
