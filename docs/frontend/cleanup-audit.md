# Frontend safe repo cleanup audit

Historical audit of the frontend codebase: route map, dependency graph, unused pages/components/hooks/utils/styles/assets. PR roadmap below has been completed; keep this doc for route map and structure reference.

> **Note:** Route map and app layout may have evolved; verify against `frontend/admin/src/app/router.tsx` and `frontend/miniapp/src/App.tsx` if in doubt.

## Relevant files and entry points

| App     | Entry                           | Router config                         | Layout                        |
| ------- | ------------------------------- | ------------------------------------- | ----------------------------- |
| admin   | `frontend/admin/src/main.tsx`   | `frontend/admin/src/app/router.tsx`   | RootLayout (Guard) → DashboardShell |
| miniapp | `frontend/miniapp/src/main.tsx` | `frontend/miniapp/src/App.tsx`        | MiniappLayout, AuthGuard      |

**Stack:** React 18, Vite, react-router-dom v6, @tanstack/react-query. No file-based routing.

---

## Route map (all active routes)

### Admin (basename `/admin`)

| Path                                                            | Page file                                    | Lazy |
| --------------------------------------------------------------- | -------------------------------------------- | ---- |
| `/login` | `features/login/LoginPage.tsx` | yes |
| `/` | `features/overview/OverviewPage.tsx` | yes |
| `/servers` | `features/servers/ServersPage.tsx` | yes |
| `/telemetry` | `features/telemetry/TelemetryPage.tsx` | yes |
| `/automation` | `features/automation/AutomationPage.tsx` | yes |
| `/revenue` | `features/revenue/RevenuePage.tsx` | yes |
| `/billing` | `features/billing/BillingPage.tsx` | yes |
| `/subscriptions`, `/payments` | Redirect → `/billing?tab=...` | — |
| `/users` | `features/users/UsersPage.tsx` | yes |
| `/devices` | `features/devices/DevicesPage.tsx` | yes |
| `/audit` | `features/audit/AuditPage.tsx` | yes |
| `/settings` | `features/settings/SettingsPage.tsx` | yes |
| `/styleguide` | `features/styleguide/StyleguidePage.tsx` | yes |
| `*` | Redirect → / | — |

### Miniapp (basename `/webapp`)

| Path                                 | Page file                    | Lazy |
| ------------------------------------ | ---------------------------- | ---- |
| `/`, `/devices`, `/profile`, `/help` | Home, Devices, Profile, Help | yes  |
| `/plans`                             | Plans.tsx                    | yes  |
| `/checkout/:planId`                  | Checkout.tsx                 | yes  |
| `/referral`                          | Referral.tsx                 | yes  |

**Sub-pages (components, not routes):** this list is legacy; verify current composition under `frontend/admin/src/features/*` and `frontend/miniapp/src/pages/*`.

---

## Orphaned pages

**Result: None.** All page files are in App.tsx route config or imported by parent pages.

---

## Unused components / hooks / utils

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

### Hooks / utils: all used

useDashboardSettings, useServerList*, statusBadges, telemetry-freshness, dashboard/selectors — all have import sites.

---

## Styles and assets

- **Styles:** All admin/shared CSS modules in use. No orphaned styles.
- **Assets:** No images in public/; icons from lucide-react.

---

## PR-safe removal plan

### PR1: Documentation (no deletions)

- Add this audit doc

### PR2: Safe removals (completed)

- ThresholdLegend removed
- LoadingSkeleton export reintroduced as alias for Skeleton
- ServersEmptyState removed (component + stories)

### PR3: Storybook normalization (completed)

- Standardized Storybook stories to golden set (Overview/Variants/Sizes/States/WithLongText/DarkMode/Accessibility).

---

## Deliverables summary

1. **Route map:** 16 admin + 7 miniapp routes (audit date); verify against current App.tsx.
2. **Orphaned pages:** None at audit time.
3. **Unused components:** None remaining after PR2.
4. **Redundant exports:** None remaining.
5. **PR roadmap:** PR1 (doc) and PR2 (safe removals) completed.
