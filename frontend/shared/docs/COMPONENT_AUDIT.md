# Component Audit

## Inventory

| Component | Location | Type | Token Compliance | Duplication/Overlap | Notes |
| --- | --- | --- | --- | --- | --- |
| Button | frontend/shared/src/ui/buttons/Button.tsx | Primitive | Mostly | ButtonLink, CopyButton | Variants beyond new spec; legacy sizes. |
| ButtonLink | frontend/shared/src/ui/buttons/ButtonLink.tsx | Composite | Mostly | Button | Link-styled button. |
| CopyButton | frontend/shared/src/ui/buttons/CopyButton.tsx | Composite | Mostly | Button | Adds clipboard + toast. |
| Input | frontend/shared/src/ui/forms/Input.tsx | Primitive | Mostly | SearchInput | Carries label/error (legacy). |
| Select | frontend/shared/src/ui/forms/Select.tsx | Primitive | Mostly | - | Carries label/error (legacy). |
| Checkbox | frontend/shared/src/ui/forms/Checkbox.tsx | Primitive | Mostly | - | Label built-in. |
| Field | frontend/shared/src/ui/forms/Field.tsx | Primitive | Mostly | - | Wrapper for label/hint/error. |
| Label | frontend/shared/src/ui/forms/Label.tsx | Primitive | Mostly | - | Form label. |
| HelperText | frontend/shared/src/ui/forms/HelperText.tsx | Primitive | Mostly | InlineError | Error/hint text. |
| InlineError | frontend/shared/src/ui/forms/InlineError.tsx | Primitive | Mostly | HelperText | Inline error text. |
| FormStack | frontend/shared/src/ui/forms/FormStack.tsx | Layout | Mostly | Stack | Layout helper. |
| SearchInput | frontend/shared/src/ui/forms/SearchInput.tsx | Composite | Mostly | Input | Input with icon and clear. |
| Text | frontend/shared/src/ui/typography/Text.tsx | Primitive | Mostly | Heading | Multiple size overrides. |
| Heading | frontend/shared/src/ui/typography/Heading.tsx | Primitive | Mostly | Text | Heading levels. |
| PrimitiveBadge | frontend/shared/src/ui/primitives/Badge.tsx | Primitive | Mostly | - | Canonical badge. |
| HealthBadge | frontend/shared/src/ui/composites/HealthBadge.tsx | Composite | Mostly | - | Domain status badge. |
| LiveIndicator | frontend/shared/src/ui/display/LiveIndicator.tsx | Composite | Mostly | PrimitiveBadge | Streaming state. |
| ProgressBar | frontend/shared/src/ui/display/ProgressBar.tsx | Primitive | Mixed | - | Inline style width. |
| Stat | frontend/shared/src/ui/display/Stat.tsx | Composite | Mostly | - | Metric display. |
| CodeText | frontend/shared/src/ui/display/CodeText.tsx | Primitive | Mostly | - | Inline code. |
| CodeBlock | frontend/shared/src/ui/display/CodeBlock.tsx | Composite | Mixed | - | Inline styles. |
| Tabs | frontend/shared/src/ui/display/Tabs.tsx | Composite | Mixed | - | Legacy tab patterns. |
| Panel | frontend/shared/src/ui/display/Panel.tsx | Primitive | Mostly | - | Canonical panel container. |
| Inline | frontend/shared/src/ui/layout/Inline.tsx | Layout | Mostly | PrimitiveStack | Inline layout helper. |
| PrimitiveStack | frontend/shared/src/ui/primitives/Stack.tsx | Primitive | Mostly | - | Canonical stack layout. |
| PrimitiveGrid | frontend/shared/src/ui/primitives/Grid.tsx | Primitive | Mostly | - | Canonical grid layout. |
| PrimitiveDivider | frontend/shared/src/ui/primitives/Divider.tsx | Primitive | Mostly | - | Divider. |
| Table | frontend/shared/src/ui/table/Table.tsx | Composite | Mixed | TableContainer | Table abstraction. |
| TableContainer | frontend/shared/src/ui/table/TableContainer.tsx | Primitive | Mostly | - | Canonical table container. |
| VirtualTable | frontend/shared/src/ui/table/VirtualTable.tsx | Composite | Mixed | Table | Virtualized table. |
| PrimitiveTableCell | frontend/shared/src/ui/primitives/TableCell.tsx | Primitive | Mostly | - | Table cell. |
| TableRow | frontend/shared/src/ui/table/Table.tsx | Composite | Mixed | - | Table row in Table. |
| Pagination | frontend/shared/src/ui/table/Table.tsx | Composite | Mostly | - | Table pagination. |
| TableSkeleton | frontend/shared/src/ui/table/TableSkeleton.tsx | Composite | Mixed | Skeleton | Inline styles. |
| Skeleton | frontend/shared/src/ui/feedback/Skeleton.tsx | Primitive | Mixed | - | Inline styles. |
| Spinner | frontend/shared/src/ui/feedback/Spinner.tsx | Primitive | Mostly | - | Loading spinner. |
| InlineAlert | frontend/shared/src/ui/feedback/InlineAlert.tsx | Composite | Mixed | - | Alert patterns. |
| EmptyState | frontend/shared/src/ui/feedback/EmptyState.tsx | Composite | Mixed | - | Empty state. |
| ErrorState | frontend/shared/src/ui/feedback/ErrorState.tsx | Composite | Mixed | - | Error state. |
| PageError | frontend/shared/src/ui/feedback/PageError.tsx | Composite | Mixed | ErrorState | Higher-level error. |
| Modal | frontend/shared/src/ui/feedback/Modal.tsx | Composite | Mixed | Drawer | Complex. |
| Drawer | frontend/shared/src/ui/feedback/Drawer.tsx | Composite | Mixed | Modal | Drawer. |
| Toast | frontend/shared/src/ui/feedback/Toast.tsx | Composite | Mostly | - | Toast system. |
| DeviceCard | frontend/shared/src/ui/misc/DeviceCard.tsx | Composite | Mixed | Panel | Composite panel. |
| ProfileCard | frontend/shared/src/ui/misc/ProfileCard.tsx | Composite | Mixed | Panel | Composite panel. |
| QrPanel | frontend/shared/src/ui/misc/QrPanel.tsx | Composite | Mixed | Panel | Inline styles. |
| DropdownMenu | frontend/shared/src/ui/misc/DropdownMenu.tsx | Composite | Mixed | - | Inline positioning. |
| RelativeTime | frontend/shared/src/ui/misc/RelativeTime.tsx | Primitive | Mostly | - | Format helper. |
| BulkActionsBar | frontend/shared/src/ui/misc/BulkActionsBar.tsx | Composite | Mixed | - | Inline styles. |
| VisuallyHidden | frontend/shared/src/ui/misc/VisuallyHidden.tsx | Primitive | Mostly | - | A11y utility. |

| Component | Location | Type | Token Compliance | Duplication/Overlap | Notes |
| --- | --- | --- | --- | --- | --- |
| PageHeader | frontend/admin/src/components/PageHeader.tsx | Composite | Mixed | ref-section | Header duplication. |
| MetricTile | frontend/admin/src/components/MetricTile.tsx | Composite | Mixed | Stat/Panel | Metric component. |
| TableSection | frontend/admin/src/components/TableSection.tsx | Composite | Mostly | Panel | Layout wrapper. |
| HealthStrip | frontend/admin/src/components/operator/HealthStrip.tsx | Composite | Mixed | HealthBadge | Operator health. |
| OperatorServerTable | frontend/admin/src/components/operator/OperatorServerTable.tsx | Composite | Mixed | Table/TableContainer | Operator-specific table. |
| MiniappLayout | frontend/miniapp/src/layouts/MiniappLayout.tsx | Layout | Mixed | Container/Panel | Layout wrapper. |

## Duplication Map

| Primary Component | Overlaps | Decision | Target Primitive/Composite |
| --- | --- | --- | --- |
| Panel | Card, Section | Merge | Primitive Panel + PrimitiveStack |
| Stack | Inline, FormStack | Merge | Primitive Stack |
| Badge | Legacy badge variants | Merge | Primitive Badge + HealthBadge composite |
| Table | TableContainer, VirtualTable | Consolidate | Table + TableContainer |
| Text/Heading | Multiple typographic styles | Consolidate | Primitive Text/Heading |
