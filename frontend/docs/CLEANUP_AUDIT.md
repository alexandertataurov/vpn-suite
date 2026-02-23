# Frontend SAFE Repo Cleanup Audit

Comprehensive audit of the frontend codebase: route map, dependency graph, unused pages/components/hooks/utils/styles/assets, with evidence-based removal plan and PR roadmap.

## Relevant Files & Entry Points


| App     | Entry                           | Router Config                         | Layout                        |
| ------- | ------------------------------- | ------------------------------------- | ----------------------------- |
| admin   | `frontend/admin/src/main.tsx`   | `frontend/admin/src/App.tsx` (inline) | AdminLayout, ProtectedRoute   |
| miniapp | `frontend/miniapp/src/main.tsx` | `frontend/miniapp/src/App.tsx`        | MiniappLayout, AuthGuard      |
| shared  | `frontend/shared/src/index.ts`  | —                                     | ThemeProvider, ToastContainer |


**Stack:** React 18, Vite, react-router-dom v6, @tanstack/react-query. No file-based routing.

---

## Route Map (all active routes)

### Admin (basename `/admin`)


| Path                                                            | Page File                                    | Lazy |
| --------------------------------------------------------------- | -------------------------------------------- | ---- |
| `/login`                                                        | Login.tsx                                    | yes  |
| `/`                                                             | Dashboard.tsx                                | yes  |
| `/telemetry`                                                    | Telemetry.tsx                                | yes  |
| `/automation`                                                   | ControlPlane.tsx                             | yes  |
| `/control-plane`                                                | Redirect → /automation                       | —    |
| `/servers`, `/servers/new`, `/servers/:id`, `/servers/:id/edit` | Servers, ServerNew, ServerDetail, ServerEdit | yes  |
| `/users`, `/users/:id`                                          | Users, UserDetail                            | yes  |
| `/billing`                                                      | Billing.tsx                                  | yes  |
| `/subscriptions`, `/payments`                                   | Redirect → billing                           | —    |
| `/devices`                                                      | Devices.tsx                                  | yes  |
| `/audit`                                                        | Audit.tsx                                    | yes  |
| `/settings`                                                     | Settings.tsx                                 | yes  |
| `/integrations/outline`                                         | OutlineIntegrations.tsx                      | yes  |
| `/outline`, `/settings/integrations/outline`                    | Redirect → /integrations/outline             | —    |
| `/styleguide`                                                   | Styleguide.tsx                               | yes  |
| `*`                                                             | Redirect → /                                 | —    |


### Miniapp (basename `/webapp`)


| Path                                 | Page File                    | Lazy |
| ------------------------------------ | ---------------------------- | ---- |
| `/`, `/devices`, `/profile`, `/help` | Home, Devices, Profile, Help | yes  |
| `/plans`                             | Plans.tsx                    | yes  |
| `/checkout/:planId`                  | Checkout.tsx                 | yes  |
| `/referral`                          | Referral.tsx                 | yes  |


**Sub-pages (components, not routes):** VpnNodesTab, AlertsPanel, DockerServicesTab, DockerOverviewTable, LogsViewer, ContainerDetailsPanel, ConnectionNodesSection, TopIssuesTable, OperatorDashboardContent, ClusterAutomationSummary, RecentAuditTable, DashboardSettings, SubscriptionsTab, PaymentsTab — all imported by parent pages.

---

## Orphaned Pages

**Result: None.** All page files are in App.tsx route config or imported by parent pages.

---

## Unused Components / Hooks / Utils

### Safe to remove (2 proofs)


| Module | Path | Proof A | Proof B |
| --- | --- | --- | --- |
| _None (removed)_ | — | — | — |


### Needs verification


| Module | Path | Evidence |
| --- | --- | --- |
| _None (removed)_ | — | — |


### Shared UI: Storybook-only (keep as design-system docs)

InlineError, StatusStrip, Box, Grid, SkeletonCard, TableSortHeader, CellText, CellNumber, CellActions, CellSecondary.

### Redundant export


| Export | File | Evidence |
| --- | --- | --- |
| _None (removed)_ | — | — |


### Hooks / utils: All used

useDashboardSettings, useServerList*, statusBadges, telemetry-freshness, dashboard/selectors — all have import sites.

---

## Styles & Assets

- **Styles:** All admin/shared CSS modules in use. No orphaned styles.
- **Assets:** No images in public/; icons from lucide-react.

---

## PR-Safe Removal Plan

### PR1: Documentation (no deletions)

- Add this audit doc

### PR2: Safe removals (completed)

- ThresholdLegend removed
- LoadingSkeleton export reintroduced as alias for Skeleton
- ServersEmptyState removed (component + stories)

### PR3: Storybook normalization (completed)

- Standardized Storybook stories to golden set (Overview/Variants/Sizes/States/WithLongText/DarkMode/Accessibility).

---

## Deliverables Summary

1. Route Map: 16 admin + 7 miniapp routes, all active
2. Orphaned pages: None
3. Unused: none remaining from audit
4. Redundant exports: none remaining from audit
5. PR roadmap: PR1 → PR2 (completed)
