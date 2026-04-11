# Table Unification Migration Plan

Date: 2026-02-21

## Phase 1 — Inventory & Audit (done)


## Phase 2 — Architecture & API (done)

- [[07-docs/frontend/tables/arch-table-system|arch-table-system.md]]
- [[07-docs/frontend/tables/table-styles-guide|table-styles-guide.md]]

## Phase 3 — Shared Component Upgrades

1. `apps/admin-web/src/design-system/primitives/Table.tsx`
   - Add `titleTooltip`, width hints, empty/loader APIs, row click support
2. `apps/admin-web/src/design-system/primitives/VirtualTable.tsx`
   - New virtualized renderer with `Column<T>` API
3. `apps/admin-web/src/design-system/primitives/primitives.css`
   - Ensure canonical `.table-*` / `.data-table-*` class set is documented and stable

## Phase 4 — Migrations (PR-friendly order)

1. Users
   - `apps/admin-web/src/features/users/UsersPage.tsx`
   - Replace manual `<table>` with `VirtualTable`
   - Move compound cells to `TableCell`/helpers
   - Remove `TableSortHeader` usage

2. Admin tables
   - `apps/admin-web/src/features/servers/ServersPage.tsx`
   - `apps/admin-web/src/features/devices/DevicesPage.tsx`
   - `apps/admin-web/src/features/audit/AuditPage.tsx`
   - `apps/admin-web/src/features/automation/AutomationPage.tsx`

3. Billing
   - `apps/admin-web/src/features/billing/BillingPage.tsx`
   - `/payments` and `/subscriptions` redirect to `/billing?tab=...`

4. Telemetry
   - `apps/admin-web/src/features/telemetry/TelemetryPage.tsx`

## Phase 5 — Cleanup

- Remove unused table CSS in `apps/admin-web/src/design-system/primitives/` stylesheets.
- Remove any dead components or classes.
- Update Storybook with a `VirtualTable` example (admin Storybook).

## Phase 6 — QA Gates

- [[07-docs/frontend/tables/table-qa-checklist|table-qa-checklist.md]]
- Add lint rule / check to prevent raw `<table>` usage outside shared table components.
