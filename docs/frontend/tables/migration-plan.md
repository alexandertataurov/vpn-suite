# Table Unification Migration Plan

Date: 2026-02-21

## Phase 1 — Inventory & Audit (done)

- [table-unification-audit.md](table-unification-audit.md)

## Phase 2 — Architecture & API (done)

- [arch-table-system.md](arch-table-system.md)
- [table-styles-guide.md](table-styles-guide.md)

## Phase 3 — Shared Component Upgrades

1. `frontend/admin/src/design-system/primitives/Table.tsx`
   - Add `titleTooltip`, width hints, empty/loader APIs, row click support
2. `frontend/admin/src/design-system/primitives/VirtualTable.tsx`
   - New virtualized renderer with `Column<T>` API
3. `frontend/admin/src/design-system/primitives/primitives.css`
   - Ensure canonical `.table-*` / `.data-table-*` class set is documented and stable

## Phase 4 — Migrations (PR-friendly order)

1. Users
   - `frontend/admin/src/features/users/UsersPage.tsx`
   - Replace manual `<table>` with `VirtualTable`
   - Move compound cells to `TableCell`/helpers
   - Remove `TableSortHeader` usage

2. Admin tables
   - `frontend/admin/src/features/servers/ServersPage.tsx`
   - `frontend/admin/src/features/devices/DevicesPage.tsx`
   - `frontend/admin/src/features/audit/AuditPage.tsx`
   - `frontend/admin/src/features/automation/AutomationPage.tsx`

3. Billing
   - `frontend/admin/src/features/billing/BillingPage.tsx`
   - `/payments` and `/subscriptions` redirect to `/billing?tab=...`

4. Telemetry
   - `frontend/admin/src/features/telemetry/TelemetryPage.tsx`

## Phase 5 — Cleanup

- Remove unused table CSS in `frontend/admin/src/design-system/primitives/` stylesheets.
- Remove any dead components or classes.
- Update Storybook with a `VirtualTable` example (admin Storybook).

## Phase 6 — QA Gates

- [table-qa-checklist.md](table-qa-checklist.md)
- Add lint rule / check to prevent raw `<table>` usage outside shared table components.

