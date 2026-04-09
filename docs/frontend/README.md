# Frontend Documentation

Single source for VPN Suite frontend: apps, design system, components, tables, testing, and Storybook.

---

## Quick Start

| Need | Doc |
|------|-----|
| **Apps, routes, stack** | [Overview](#overview) (below) |
| **Design tokens, components** | [design/](design/) |
| **Table usage** | [tables/tables-guide.md](tables/tables-guide.md) |
| **E2E / test matrix** | [testing/frontend-test-matrix.md](testing/frontend-test-matrix.md) |
| **Storybook** | [storybook/](storybook/) |
| **Adaptive UI** | [adaptive-ui.md](adaptive-ui.md) · [adaptive-ui-test-plan.md](adaptive-ui-test-plan.md) |
| **Miniapp layout** | [miniapp-layout-architecture.md](miniapp-layout-architecture.md) |
| **Miniapp app overview** | [miniapp-app.md](miniapp-app.md) |
| **Miniapp design system** | [miniapp-design-system-overview.md](miniapp-design-system-overview.md) · [miniapp-design-system/](miniapp-design-system/) |
| **Admin design system** | [admin-design-system/README.md](admin-design-system/README.md) |
| **Navigation catalog** | [navigation-patterns-catalog.md](navigation-patterns-catalog.md) |
| **UI tech spec** | [ui-techspec.md](ui-techspec.md) |

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
| [design-system.md](design/design-system.md) | Color tokens, spacing, radius, shadows, layout, UX rules |
| [typography-tokens.md](design/typography-tokens.md) | Typography scale, Tailwind mapping |
| [foundations-governance.md](design/foundations-governance.md) | Token usage rules, enforcement |
| [ui-guide.md](design/ui-guide.md) | Component usage, patterns, don'ts |
| [amnezia-miniapp-design-guidelines.md](design/amnezia-miniapp-design-guidelines.md) | Miniapp design guidelines |

### Design system deep dives

| Doc | Purpose |
|-----|---------|
| [admin-design-system/README.md](admin-design-system/README.md) | Migrated admin design-system docs, QA checklists, and accessibility notes |
| [miniapp-app.md](miniapp-app.md) | Miniapp app entrypoint, Storybook contract, run commands |
| [miniapp-design-system-overview.md](miniapp-design-system-overview.md) | Miniapp design-system overview and doc map |
| [miniapp-design-system/README.md](miniapp-design-system/README.md) | Canonical miniapp design-system guide |


### [components/](components/) — Component inventory

| Doc | Purpose |
|-----|---------|
| [component-inventory.md](components/component-inventory.md) | Shared + admin component list, cell helpers, operator mode |

### [tables/](tables/) — Table system

| Doc | Purpose |
|-----|---------|
| [tables-guide.md](tables/tables-guide.md) | **Primary guide** — Table, TableContainer, TableSkeleton, column API |
| [arch-table-system.md](tables/arch-table-system.md) | Architecture, goals, canonical components |
| [table-styles-guide.md](tables/table-styles-guide.md) | CSS classes, deprecated patterns |
| [table-qa-checklist.md](tables/table-qa-checklist.md) | QA checklist for tables |
| [migration-plan.md](tables/migration-plan.md) | Migration phases for table unification |

### [testing/](testing/) — Tests & E2E

| Doc | Purpose |
|-----|---------|
| [frontend-test-matrix.md](testing/frontend-test-matrix.md) | Routes × flows × states, E2E specs, gaps |

### [storybook/](storybook/) — Storybook

| Doc | Purpose |
|-----|---------|
| [../storybook-ai-contract.md](../storybook-ai-contract.md) | Repo-level Storybook contract for reusable UI |
| [../ai-ui-workflow.md](../ai-ui-workflow.md) | Required UI workflow for AI and engineers |
| [structure.md](storybook/structure.md) | IA, sidebar hierarchy |
| [conventions.md](storybook/conventions.md) | Story conventions |
| [guardrails.md](storybook/guardrails.md) | Guardrails, checks |

## Related

- **Codebase map:** [docs/codebase-map.md](../codebase-map.md) §3 Frontend
