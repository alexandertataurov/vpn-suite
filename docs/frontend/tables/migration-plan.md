# Table Unification Migration Plan

Date: 2026-02-21

## Phase 1 — Inventory & Audit (done)

- `TABLE_UNIFICATION_AUDIT.md`

## Phase 2 — Architecture & API (done)

- `ARCH_TABLE_SYSTEM.md`
- `TABLE_STYLES_GUIDE.md`

## Phase 3 — Shared Component Upgrades

1. `frontend/shared/src/ui/Table.tsx`
   - Add `titleTooltip`, width hints, empty/loader APIs, row click support
2. `frontend/shared/src/ui/VirtualTable.tsx`
   - New virtualized renderer with `Column<T>` API
3. `frontend/shared/src/ui/table/TableSortHeader.tsx`
   - Deprecate, align class to `.table-sort`
4. `frontend/shared/src/ui/styles.css`
   - Remove `.data-table-*` styles; consolidate into `.table-*`
   - Add `table-row-clickable`
5. `frontend/shared/src/ui/index.ts`
   - Export `VirtualTable`

## Phase 4 — Migrations (PR-friendly order)

1. Users
   - `frontend/admin/src/pages/Users.tsx`
   - Replace manual `<table>` with `VirtualTable`
   - Move compound cells to `TableCell`/helpers
   - Remove `TableSortHeader` usage

2. Dashboard tables
   - `frontend/admin/src/pages/dashboard/TopIssuesTable.tsx`
   - `frontend/admin/src/pages/dashboard/RecentAuditTable.tsx`
   - Use `Table` loading/empty APIs

3. Admin tables
   - `frontend/admin/src/pages/Servers.tsx`
   - `frontend/admin/src/components/ServerRow.tsx` (refactor into column renderers)
   - `frontend/admin/src/pages/Devices.tsx`
   - `frontend/admin/src/pages/Audit.tsx`
   - `frontend/admin/src/pages/ControlPlane.tsx`
   - `frontend/admin/src/pages/ServerDetail.tsx`

4. Billing
   - `frontend/admin/src/pages/billing/PaymentsTab.tsx`
   - `frontend/admin/src/pages/billing/SubscriptionsTab.tsx`
   - `/payments` and `/subscriptions` redirect to `/billing?tab=...`

5. Telemetry
   - `frontend/admin/src/pages/telemetry/DockerOverviewTable.tsx` -> `VirtualTable`
   - `frontend/admin/src/pages/telemetry/VpnNodesTab.tsx`

## Phase 5 — Cleanup

- Remove unused CSS from `frontend/shared/src/ui/styles.css`.
- Remove any dead components or classes.
- Update Storybook (`frontend/shared/src/ui/Table.stories.tsx`) with `VirtualTable` example.

## Phase 6 — QA Gates

- `TABLE_QA_CHECKLIST.md`
- Add lint rule / check to prevent raw `<table>` usage outside shared table components.

