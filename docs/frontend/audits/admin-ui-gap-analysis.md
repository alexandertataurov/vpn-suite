# Admin UI Gap Analysis + Missing Primitives Spec

Repo-grounded inventory, "what exists vs what should exist" matrix, missing primitives/domain components with typed APIs, dependency graph, and 8–15 PR migration plan.

---

## 1. Admin routes and pages (source of truth)

Routes defined in `frontend/admin/src/App.tsx`.

| Route | Page file | Major UI blocks |
|-------|-----------|-----------------|
| `/login` | `frontend/admin/src/pages/Login.tsx` | Form (email/password), Button, PageError |
| `/` (Dashboard) | `frontend/admin/src/pages/Dashboard.tsx` | MetricTile grid, TimeSeriesPanel (2 charts), Recent activity list |
| `/servers` | `frontend/admin/src/pages/Servers.tsx` | FilterBar, virtualized ServerRow list, selection, ServersBulkToolbar, ServerRowDrawer, ConfirmDanger, IssueConfigModal |
| `/servers/new` | `frontend/admin/src/pages/ServerNew.tsx` | Form (inputs/select), PageHeader, ButtonLink |
| `/servers/:id` | `frontend/admin/src/pages/ServerDetail.tsx` | PageHeader, tablist (overview/peers/telemetry/actions/logs/config), MetricTile grid, Table (peers/actions), ConfirmDanger (block/rotate/revoke/reset), IssueConfigModal, ServerLogsTab |
| `/servers/:id/edit` | `frontend/admin/src/pages/ServerEdit.tsx` | Form, PageHeader, inputs, ButtonLink |
| `/users` | `frontend/admin/src/pages/Users.tsx` | Custom table layout, StatusBadge, Drawer, FilterBar-like filters, Pagination |
| `/users/:id` | `frontend/admin/src/pages/UserDetail.tsx` | PageHeader, KeyValue-style blocks, table-empty, ButtonLink |
| `/devices` (Peers) | `frontend/admin/src/pages/Devices.tsx` | TableSection, Table or DeviceCard list, Toolbar, selection, bulk revoke (ConfirmDanger), ConfigContentModal |
| `/telemetry` | `frontend/admin/src/pages/Telemetry.tsx` | Tab container; sub-panels in `frontend/admin/src/pages/telemetry/` |
| `/telemetry` (Docker tab) | `frontend/admin/src/pages/telemetry/DockerServicesTab.tsx` | Table, TimeSeriesPanel, DockerOverviewTable |
| `/telemetry` (Container detail) | `frontend/admin/src/pages/telemetry/ContainerDetailsPanel.tsx` | TimeSeriesPanel (multiple), charts |
| `/telemetry` (VPN nodes) | `frontend/admin/src/pages/telemetry/VpnNodesTab.tsx` | Table, StatusBadge |
| `/telemetry` (Logs) | `frontend/admin/src/pages/telemetry/LogsViewer.tsx` | Virtualized log list, copy |
| `/telemetry` (Alerts) | `frontend/admin/src/pages/telemetry/AlertsPanel.tsx` | Alerts list |
| `/automation` | `frontend/admin/src/pages/ControlPlane.tsx` | Card, Table, Input, Checkbox, Button, PageError, Skeleton |
| `/audit` | `frontend/admin/src/pages/Audit.tsx` | TableSection, Table, Pagination, Input, Button, PageError |
| `/billing` (subscriptions, payments tabs) | `frontend/admin/src/pages/Billing.tsx` + PaymentsTab, SubscriptionsTab | TableSection, Table, Badge, Button, PageError |
| `/settings` | `frontend/admin/src/pages/Settings.tsx` | Form fields, Button |
| `/styleguide` | `frontend/admin/src/pages/Styleguide.tsx` | Demo of shared primitives |

Layout: `frontend/admin/src/layouts/AdminLayout.tsx` — sidebar nav, region Select, command palette (Ctrl+K), theme toggle, Outlet.

---

## 2. Shared UI primitive inventory (usage counts)

Counts are file-level (files that import or use the primitive). Source: grep across `frontend/`.

| Primitive | Location | Usage (files) | Adequacy note |
|-----------|----------|---------------|----------------|
| Button | `frontend/shared/src/ui/Button.tsx` | 35+ | Adequate. variant/size/loading, cn(). |
| Badge | `frontend/shared/src/ui/Badge.tsx` | 6+ | Adequate. |
| Card | `frontend/shared/src/ui/Card.tsx` | 5+ | Adequate. |
| Section | `frontend/shared/src/ui/Section.tsx` | 2+ (TableSection, ChartCard) | Adequate. |
| Table | `frontend/shared/src/ui/Table.tsx` | 11+ | Adequate. columns, sort, selection, keyExtractor. |
| Pagination | `frontend/shared/src/ui/Table.tsx` | 3+ | Adequate. |
| Field | `frontend/shared/src/ui/Field.tsx` | Used by Input/Select | Adequate. label + error slot. |
| Input | `frontend/shared/src/ui/Input.tsx` | 20+ | Adequate. label, error, cn(). |
| Select | `frontend/shared/src/ui/Select.tsx` | 15+ | Inadequate: no async/search, no empty/loading state. |
| Checkbox | `frontend/shared/src/ui/Checkbox.tsx` | 5+ | Adequate. |
| SearchInput | `frontend/shared/src/ui/SearchInput.tsx` | 2+ | Inadequate: string concat for className; duplicates label/error. |
| Modal | `frontend/shared/src/ui/Modal.tsx` | 8+ | Adequate. |
| ConfirmModal | `frontend/shared/src/ui/Modal.tsx` | 1 | Adequate. |
| ConfirmDanger | `frontend/shared/src/ui/Modal.tsx` | 4+ | Adequate. reason + confirm_token. |
| Drawer | `frontend/shared/src/ui/Drawer.tsx` | 2+ | Adequate. |
| Skeleton | `frontend/shared/src/ui/Skeleton.tsx` | 24+ | Adequate. |
| EmptyState | `frontend/shared/src/ui/EmptyState.tsx` | 4+ | Adequate. |
| ErrorState | `frontend/shared/src/ui/ErrorState.tsx` | 10+ | Adequate. |
| InlineError | `frontend/shared/src/ui/InlineError.tsx` | — | Adequate. |
| PageError | `frontend/shared/src/ui/PageError.tsx` | 15+ | Adequate. |
| ToastContainer / useToast | `frontend/shared/src/ui/Toast.tsx` | 20+ | Adequate. |
| StatusIndicator | `frontend/shared/src/ui/StatusIndicator.tsx` | — | Adequate. Dot + label; uses string concat (could use cn()). |
| DeviceCard, ProfileCard, ConnectButton | shared/ui | miniapp/admin | Adequate for current use. |

Utility: `cn()` at `frontend/shared/src/utils/cn.ts` — clsx only (no tailwind-merge). Adequate for current CSS-class-based styling.

---

## 3. Admin-only component inventory (usage counts)

| Component | Location | Used in (files) | Pattern |
|-----------|----------|-----------------|---------|
| PageHeader | `frontend/admin/src/components/PageHeader.tsx` | Servers, ServerDetail, ServerEdit, ServerNew, Devices, Users, etc. | Title + description + icon + back + actions |
| Breadcrumb | `frontend/admin/src/components/Breadcrumb.tsx` | PageHeader (optional) | Nav trail |
| Toolbar | `frontend/admin/src/components/Toolbar.tsx` | Devices, others | Horizontal actions row |
| FilterBar | `frontend/admin/src/components/FilterBar.tsx` | Servers only | Search + status + sort + lastSeen + density + region |
| TableSection | `frontend/admin/src/components/TableSection.tsx` | Devices, Billing (PaymentsTab, SubscriptionsTab), Audit | Section + title/actions + children + optional Pagination |
| StatusBadge | `frontend/admin/src/components/StatusBadge.tsx` | ServerDetail, ServerRow, Users, VpnNodesTab | Dot + label + optional subtitle (active/inactive/error/maintenance) |
| MetricTile | `frontend/admin/src/components/MetricTile.tsx` | ServerDetail, Dashboard | Label/value/unit/trend/state/icon |
| TimeSeriesPanel | `frontend/admin/src/components/TimeSeriesPanel.tsx` | ContainerDetailsPanel, Dashboard | Title, status badge, loading/error/empty, children |
| IssueConfigModal | `frontend/admin/src/components/IssueConfigModal.tsx` | Servers, ServerDetail | Issue config form + QR + download/copy |
| ConfigContentModal | `frontend/admin/src/components/ConfigContentModal.tsx` | Devices | Modal + pre (config content) + copy/download |
| ServerRow | `frontend/admin/src/components/ServerRow.tsx` | Servers (virtual list) | Single row: StatusBadge, cells, Sync/Reconcile/Drain/Configure/Issue config/Restart |
| ServerRowDrawer | `frontend/admin/src/components/ServerRowDrawer.tsx` | Servers | Drawer: server meta, tabs, link to detail, Copy ID |
| ServersBulkToolbar | `frontend/admin/src/components/servers/ServersBulkToolbar.tsx` | Servers | Bulk drain/provisioning + confirm |
| ServerLogsTab | `frontend/admin/src/components/ServerLogsTab.tsx` | ServerDetail | Logs stream UI |
| CommandPalette | `frontend/admin/src/components/CommandPalette.tsx` | AdminLayout | Ctrl+K navigation |
| ButtonLink | `frontend/admin/src/components/ButtonLink.tsx` | Servers, ServerEdit, ServerNew, Users | Link styled as button |
| FormField | `frontend/admin/src/components/FormField.tsx` | ServerEdit, ServerNew, etc. | Label + control + error (admin-specific) |
| ErrorBoundary | `frontend/admin/src/components/ErrorBoundary.tsx` | App | Page-level error + retry |

Charts (admin): `ChartFrame`, `ChartCard` (deprecated), `EChart`, telemetry chart components under `frontend/admin/src/charts/`.

---

## 4. Current UX patterns (where used)

- **Loading:** Skeleton used in App (suspense fallback), Dashboard, ServerDetail, Servers, Devices, ControlPlane, Audit, UserDetail, LogsViewer, AlertsPanel, ChartFrame, Styleguide, miniapp.
- **Empty:** EmptyState (Servers, Users, Styleguide); `.table-empty` in Table and several pages.
- **Error:** PageError on most data pages; ErrorState in TimeSeriesPanel and panel-level flows; ErrorBoundary at app root.
- **Toast:** useToast for success/error after mutations (Servers, ServerDetail, Devices, etc.).
- **Danger confirm:** ConfirmDanger for restart (Servers), block/rotate/revoke/reset (ServerDetail), bulk revoke (Devices).
- **Tabs:** Ad-hoc tablist (role="tablist") in ServerDetail, ServerRowDrawer, Telemetry page.
- **Copy to clipboard:** Ad-hoc in IssueConfigModal, ConfigContentModal, ServerRowDrawer, LogsViewer (navigator.clipboard + toast).

---

## 5. What exists vs what should exist (matrix)

### Adequate (keep as-is)

- Button, Badge, Card, Section, Table, Pagination, Field, Input, Checkbox, Modal, ConfirmModal, ConfirmDanger, Drawer, Skeleton, EmptyState, ErrorState, InlineError, PageError, Toast, StatusIndicator, cn().
- Admin: PageHeader, Breadcrumb, TableSection, StatusBadge, MetricTile, TimeSeriesPanel, FilterBar (Servers), ServerRow/ServerRowDrawer (specialized list).

### Exists but inadequate

- **SearchInput:** Use cn(); align label/error with Field.
- **Select:** Add optional loading/empty state; consider async/search for large option sets (Combobox).
- **StatusIndicator:** Use cn() for className merge.

### Missing (add)

- **Tokens/utilities:** VisuallyHidden, Icon wrapper (size/alignment).
- **Layout:** Stack, Inline, Divider.
- **Forms:** Textarea, Switch, RadioGroup, Slider, DateTimePicker, SegmentedControl, Combobox.
- **Feedback:** Spinner, ProgressBar, InlineAlert, ErrorBoundaryPanel (section-level).
- **Overlays:** Tooltip, Popover, DropdownMenu/RowActions.
- **Data display:** CodeBlock, CopyButton, QrPanel, KeyValueList, RelativeTime.
- **Table system:** RowActions (kebab), BulkActionsBar (unified), QuickFilters, ColumnVisibility (optional).
- **Charts:** TimeRangePicker, Sparkline (generalize MiniSparkline), ThresholdLegend.
- **Streaming:** LiveIndicator, EventTimeline, LogViewer primitive.

---

## 6. Missing primitives spec (usage, TS props, migration targets, a11y)

### VisuallyHidden

- **Usage:** Accessible label for icon-only buttons (e.g. Sync, Close, Copy).
- **Props:** `children: ReactNode`, `className?`, `as?: 'span'|'div'`.
- **Migration:** Any icon-only control that lacks aria-label or visible text; use as child with screen-reader text.
- **A11y:** Renders off-screen (sr-only); no keyboard change.

### Stack / Inline / Divider

- **Stack:** `direction?: 'row'|'column'`, `gap?: token`, `align?`, `className?`, `children`.
- **Inline:** `gap?`, `wrap?`, `align?`, `className?`, `children`.
- **Divider:** `orientation?: 'horizontal'|'vertical'`, `className?`.
- **Migration:** Replace repeated `style={{ display: 'flex', gap: '...' }}` and `<hr/>`/borders in modals, drawers, forms.
- **A11y:** Divider decorative (aria-hidden if no semantic role).

### Spinner

- **Usage:** Inline loading (button, table cell, panel header).
- **Props:** `size?: 'sm'|'md'`, `className?`, `aria-label?: string`.
- **Migration:** Optional replacement for Skeleton in tight spaces; Button already has loading state.
- **A11y:** aria-busy/aria-label on container.

### ProgressBar

- **Usage:** Queued actions (staged execution), sync/reconcile progress.
- **Props:** `value: number` (0–100), `max?`, `label?`, `className?`, `data-testid?`.
- **Migration:** ServerDetail Actions tab, Servers bulk sync.
- **A11y:** role="progressbar", aria-valuenow, aria-valuemin, aria-valuemax, aria-label.

### InlineAlert

- **Usage:** Non-modal warning/error in panel (e.g. profile incompatible, cert expiring).
- **Props:** `variant: 'info'|'warning'|'error'`, `title: string`, `message?: string`, `className?`, `data-testid?`.
- **Migration:** Server detail header, ServerRowDrawer, Config tab.
- **A11y:** role="alert" or role="status", aria-live.

### CopyButton

- **Usage:** Single action to copy value to clipboard with toast feedback.
- **Props:** `value: string`, `label?: string`, `copiedMessage?: string`, `className?`, `data-testid?`.
- **Migration:** IssueConfigModal, ConfigContentModal, ServerRowDrawer (Copy ID), LogsViewer.
- **A11y:** aria-label, announce success via toast.

### CodeBlock

- **Usage:** Monospace block with optional copy/download (configs, logs snippet).
- **Props:** `value: string`, `language?: 'ini'|'conf'|'text'`, `maxHeight?: number`, `wrap?: boolean`, `actions?: ReactNode`, `className?`, `data-testid?`.
- **Migration:** ConfigContentModal, IssueConfigModal result (pre block).
- **A11y:** Pre with appropriate lang if syntax-highlighted; focusable for keyboard copy.

### QrPanel

- **Usage:** QR display + optional download/copy actions.
- **Props:** `value: string`, `size?: number`, `downloadLabel?`, `copyLabel?`, `onDownload?`, `onCopy?`, `className?`.
- **Migration:** IssueConfigModal result (QR + copy buttons).
- **A11y:** Alt text or aria-label describing QR purpose.

### RelativeTime

- **Usage:** “5m ago” with tooltip for exact timestamp.
- **Props:** `date: Date | string`, `className?`, `title?` (default to formatted exact time).
- **Migration:** Servers list (last seen, snapshot), ServerRowDrawer, ServerDetail header, peer handshake.
- **A11y:** title or aria-label with exact time.

### Tabs (primitive)

- **Usage:** Consistent tablist/tabpanel pattern with keyboard nav.
- **Props:** `items: { id: string; label: string; disabled? }[]`, `value: string`, `onChange: (id: string) => void`, `ariaLabel: string`, `children` (panel content keyed by id), `className?`.
- **Migration:** ServerDetail, Telemetry page, ServerRowDrawer (optional).
- **A11y:** role="tablist", role="tab", role="tabpanel", aria-selected, aria-controls, id linkage, Arrow key nav.

### DropdownMenu / RowActions

- **Usage:** Kebab menu for row actions (avoid long action columns).
- **Props:** `trigger: ReactNode`, `items: { id: string; label: string; onClick: () => void; disabled?; danger? }[]`, `align?`, `className?`.
- **Migration:** Optional consolidation in ServerRow, Devices table row actions.
- **A11y:** focus trap, Escape to close, Arrow keys, Enter/Space to activate.

### BulkActionsBar

- **Usage:** Bar shown when rows selected; primary actions (revoke, drain, …) + clear selection.
- **Props:** `selectedCount: number`, `onClear: () => void`, `actions: ReactNode`, `className?`.
- **Migration:** Unify Servers (ServersBulkToolbar) and Devices bulk revoke bar into one pattern.
- **A11y:** role="region", aria-label "Bulk actions".

### TimeRangePicker

- **Usage:** Last 1h/6h/24h/7d/custom for telemetry.
- **Props:** `value: string`, `onChange: (value: string) => void`, `options: { value: string; label: string }[]`, `className?`.
- **Migration:** Dashboard charts, ContainerDetailsPanel, any time-series view.
- **A11y:** Same as Select (label, aria-label).

### LiveIndicator

- **Usage:** “Live” / “Paused” / “Reconnecting” for streams.
- **Props:** `status: 'live'|'paused'|'reconnecting'|'error'`, `className?`.
- **Migration:** ServerLogsTab, LogsViewer.
- **A11y:** role="status", aria-live="polite".

---

## 7. Missing domain components (mapped to pages/flows)

| Domain component | Target page/flow | Primitives it uses |
|------------------|------------------|--------------------|
| ServerHealthHeader | ServerDetail (header block) | PageHeader, StatusBadge, RelativeTime, MetricTile, InlineAlert |
| ServerActionsPanel | ServerDetail > Actions tab | Button, ProgressBar, Table (actions list), EventTimeline (optional) |
| PeerStatusCell | ServerDetail > Peers table | RelativeTime, Badge/StatusIndicator |
| PeerBulkManager | Devices (bulk revoke/suspend) | BulkActionsBar, ConfirmDanger, ProgressBar |
| ConfigIssuerModal | IssueConfigModal | Modal, Input, Select, QrPanel, CodeBlock, CopyButton, Toast |
| ProfileEditor | ServerEdit / Config tab | Textarea, InlineAlert, validation state |
| TelemetryOverviewGrid | ServerDetail Telemetry + Dashboard | MetricTile, TimeSeriesPanel, TimeRangePicker |
| AuditLogViewer | Audit page | FilterBar pattern, Table, Pagination |
| RiskBanner | Server detail header, drawer | InlineAlert |

---

## 8. Component dependency graph

```mermaid
flowchart TD
  ServerHealthHeader --> PageHeader
  ServerHealthHeader --> StatusBadge
  ServerHealthHeader --> RelativeTime
  ServerHealthHeader --> MetricTile
  ServerHealthHeader --> InlineAlert

  ConfigIssuerModal --> Dialog
  ConfigIssuerModal --> Input
  ConfigIssuerModal --> Select
  ConfigIssuerModal --> QrPanel
  ConfigIssuerModal --> CodeBlock
  ConfigIssuerModal --> CopyButton
  ConfigIssuerModal --> Toast

  ServersList --> FilterBar
  ServersList --> ServerRow
  ServersList --> BulkActionsBar
  ServerRow --> StatusBadge
  ServerRow --> MiniSparkline
  ServersList --> ConfirmDanger

  ServerDetail --> Tabs
  ServerDetail --> ServerActionsPanel
  ServerActionsPanel --> ProgressBar
  ServerActionsPanel --> EventTimeline

  TelemetryPage --> TimeRangePicker
  TelemetryPage --> TimeSeriesPanel
  LogsViewer --> LogViewerPrimitive
  LogViewerPrimitive --> LiveIndicator
```

---

## 9. Migration plan (8–15 PRs)

| PR | Scope | Files / focus | DoD |
|----|--------|----------------|-----|
| 1 | Author this doc | `docs/ADMIN_UI_GAP_ANALYSIS.md` | Review and merge. |
| 2 | Layout + a11y primitives | shared: VisuallyHidden, Stack, Inline, Divider | Typed, cn(), a11y notes, Styleguide demo. |
| 3 | Feedback primitives | shared: Spinner, ProgressBar, InlineAlert | Typed, tokens, Styleguide. |
| 4 | CopyButton + CodeBlock | shared; migrate IssueConfigModal, ConfigContentModal, LogsViewer copy | No duplicate copy logic; toast feedback. |
| 5 | QrPanel | shared; migrate Issue config result QR + actions | Single QR + download/copy pattern. |
| 6 | RelativeTime | shared; migrate Servers list, drawer, ServerDetail, peers | Consistent “X ago” + tooltip. |
| 7 | Tabs primitive | shared or admin; migrate ServerDetail tablist | Same behavior, keyboard nav. |
| 8 | DropdownMenu / RowActions | shared; migrate row action clusters where useful | No regression in actions. |
| 9 | BulkActionsBar | Unify Servers + Devices bulk selection bar | One pattern, same API contract. |
| 10 | Combobox (optional) | shared; first use-case (e.g. user picker) | Async search, accessible. |
| 11 | TimeRangePicker + ThresholdLegend | admin telemetry; align panels | Consistent range + legend. |
| 12 | LiveIndicator + LogViewer wrapper | shared/admin; migrate LogsViewer | Reusable stream UI. |
| 13 | Playwright coverage | Critical flows for new primitives | No regressions. |

Order: 1 → 2, 3 (parallel) → 4, 5, 6 → 7 → 8, 9 → 10 (optional) → 11, 12 → 13.

---

## 10. DoD checklist (per primitive/PR)

- **Accessibility:** Keyboard navigable, focus visible, correct aria roles/labels, Escape closes overlays.
- **Typing:** Strict TS props; no ad-hoc payload objects where a type exists.
- **Theme:** Use CSS vars/tokens; no hardcoded hex/rgb in components.
- **Behavior:** No regressions in servers list, server detail, issue config, or actions.
- **Tests:** Unit tests for utilities (e.g. RelativeTime); Playwright for critical user flows.
- **Demo:** Add to `frontend/admin/src/pages/Styleguide.tsx` where it helps operators.

### Regression checklist (before release)

- Servers list: load, filter, sort, select, bulk drain/provisioning, restart (ConfirmDanger), Issue config.
- Server detail: tabs, MetricTiles, peers table, block/rotate/revoke/reset (ConfirmDanger), Issue config, Logs tab.
- Devices: load, filter, table/cards, single/bulk revoke (ConfirmDanger), Config content modal.
- Dashboard: MetricTiles, TimeSeriesPanels, recent activity.
- Audit / Billing (subscriptions, payments): TableSection + Table + pagination.
