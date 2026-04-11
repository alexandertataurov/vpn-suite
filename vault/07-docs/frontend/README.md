# Frontend Documentation

Single source for VPN Suite frontend: apps, design system, components, tables, testing, and Storybook.

---

## Quick Start

| Need | Doc |
|------|-----|
| **Apps, routes, stack** | [Overview](#overview) (below) |
| **Design tokens, components** | [design/](design/) |
| **Table usage** | [[07-docs/frontend/tables/tables-guide|tables/tables-guide.md]] |
| **E2E / test matrix** | [[07-docs/frontend/testing/frontend-test-matrix|testing/frontend-test-matrix.md]] |
| **Storybook** | [storybook/](storybook/) |
| **Adaptive UI** | [[07-docs/frontend/adaptive-ui|adaptive-ui.md]] · [[07-docs/frontend/adaptive-ui-test-plan|adaptive-ui-test-plan.md]] |
| **Miniapp layout** | [[07-docs/frontend/miniapp-layout-architecture|miniapp-layout-architecture.md]] |
| **Miniapp app overview** | [[07-docs/frontend/miniapp-app|miniapp-app.md]] |
| **Miniapp design system** | [[07-docs/frontend/miniapp-design-system-overview|miniapp-design-system-overview.md]] · [miniapp-design-system/](miniapp-design-system/) |
| **Admin design system** | [[07-docs/frontend/admin-design-system/README|admin-design-system/README.md]] |
| **Navigation catalog** | [[07-docs/frontend/navigation-patterns-catalog|navigation-patterns-catalog.md]] |
| **UI tech spec** | [[07-docs/frontend/ui-techspec|ui-techspec.md]] |

---

## Overview

**Stack:** React 18, Vite, react-router-dom v6, @tanstack/react-query. No file-based routing.

| App | Base path | Port | Entry |
|-----|-----------|------|-------|
| admin | `/admin/` | 5174 | `apps/admin-web/src/main.tsx` |
| miniapp | `/webapp/` | 5175 | `apps/miniapp/src/main.tsx` |
| shared | — | — | `apps/shared-web/` (design system, API client, types) |

### Admin Routes

| Path | Page |
|------|------|
| `/admin/login` | Login |
| `/admin/` | Dashboard |
| `/admin/telemetry` | Telemetry |
| `/admin/automation` | Control Plane |
| `/admin/servers`, `/servers/new`, `/servers/:id`, `/servers/:id/edit` | Servers |
| `/admin/users`, `/users/:id` | Users |
| `/admin/billing` | Billing (tabs: subscriptions, payments) |
| `/admin/subscriptions`, `/admin/payments` | Redirect → `/admin/billing?tab=...` |
| `/admin/devices` | Devices |
| `/admin/audit` | Audit |
| `/admin/settings` | Settings |
| `/admin/styleguide` | Styleguide |
| `/admin/control-plane` | Redirect → `/admin/automation` |

### Miniapp Routes

| Path | Page |
|------|------|
| `/webapp/` | Home |
| `/webapp/plans` | Plans |
| `/webapp/checkout/:planId` | Checkout |
| `/webapp/devices`, `/profile`, `/help` | Devices, Profile, Help |
| `/webapp/referral` | Referral |

### Shared UI

- **Table:** `Table`, `VirtualTable`, `TableContainer`, `TableSkeleton`, `Pagination`, `TableSortHeader`, `CellText`, `CellNumber`, etc.
- **Forms:** `Field`, `Input`, `Textarea`, `Checkbox`, `Select`, `SearchInput`
- **Feedback:** `EmptyState`, `ErrorState`, `PageError`, `Skeleton`, `Spinner`, `Modal`, `Drawer`, `ToastContainer`
- **Layout:** `Panel`, `Inline`, `Tabs`
- **Design tokens:** `tokens.css`, theme via `ThemeProvider`

### E2E Specs

**Admin:** `release-smoke`, `auth-dashboard`, `nav-and-pages`, `servers-users`, `devices`, `telemetry-docker`, `api-smoke`, `negative-fallback`, `smoke`  

**Miniapp:** `checkout`, `device-issue`

---

## Documentation Index

### [design/](design/) — Design system & tokens

| Doc | Purpose |
|-----|---------|
| [[07-docs/frontend/design/design-system|design-system.md]] | Color tokens, spacing, radius, shadows, layout, UX rules |
| [[07-docs/frontend/design/typography-tokens|typography-tokens.md]] | Typography scale, Tailwind mapping |
| [[07-docs/frontend/design/foundations-governance|foundations-governance.md]] | Token usage rules, enforcement |
| [[07-docs/frontend/design/ui-guide|ui-guide.md]] | Component usage, patterns, don'ts |
| [[07-docs/frontend/design/amnezia-miniapp-design-guidelines|amnezia-miniapp-design-guidelines.md]] | Miniapp design guidelines |

### Design system deep dives

| Doc | Purpose |
|-----|---------|
| [[07-docs/frontend/admin-design-system/README|admin-design-system/README.md]] | Migrated admin design-system docs, QA checklists, and accessibility notes |
| [[07-docs/frontend/miniapp-app|miniapp-app.md]] | Miniapp app entrypoint, Storybook contract, run commands |
| [[07-docs/frontend/miniapp-design-system-overview|miniapp-design-system-overview.md]] | Miniapp design-system overview and doc map |
| [[07-docs/frontend/miniapp-design-system/README|miniapp-design-system/README.md]] | Canonical miniapp design-system guide |


### [components/](components/) — Component inventory

| Doc | Purpose |
|-----|---------|
| [[07-docs/frontend/components/component-inventory|component-inventory.md]] | Shared + admin component list, cell helpers, operator mode |

### [tables/](tables/) — Table system

| Doc | Purpose |
|-----|---------|
| [[07-docs/frontend/tables/tables-guide|tables-guide.md]] | **Primary guide** — Table, TableContainer, TableSkeleton, column API |
| [[07-docs/frontend/tables/arch-table-system|arch-table-system.md]] | Architecture, goals, canonical components |
| [[07-docs/frontend/tables/table-styles-guide|table-styles-guide.md]] | CSS classes, deprecated patterns |
| [[07-docs/frontend/tables/table-qa-checklist|table-qa-checklist.md]] | QA checklist for tables |
| [[07-docs/frontend/tables/migration-plan|migration-plan.md]] | Migration phases for table unification |

### [testing/](testing/) — Tests & E2E

| Doc | Purpose |
|-----|---------|
| [[07-docs/frontend/testing/frontend-test-matrix|frontend-test-matrix.md]] | Routes × flows × states, E2E specs, gaps |

### [storybook/](storybook/) — Storybook

| Doc | Purpose |
|-----|---------|
| [[07-docs/storybook-ai-contract|../storybook-ai-contract.md]] | Repo-level Storybook contract for reusable UI |
| [[07-docs/ai-ui-workflow|../ai-ui-workflow.md]] | Required UI workflow for AI and engineers |
| [[07-docs/frontend/storybook/structure|structure.md]] | IA, sidebar hierarchy |
| [[07-docs/frontend/storybook/conventions|conventions.md]] | Story conventions |
| [[07-docs/frontend/storybook/guardrails|guardrails.md]] | Guardrails, checks |

## Related

- **Codebase map:** [[07-docs/codebase-map|docs/codebase-map.md]] §3 Frontend
