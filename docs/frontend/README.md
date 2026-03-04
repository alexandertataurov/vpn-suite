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
| **Navigation catalog** | [navigation-patterns-catalog.md](navigation-patterns-catalog.md) |
| **UI tech spec** | [ui-techspec.md](ui-techspec.md) |
| **Cleanup audit (historical)** | [cleanup-audit.md](cleanup-audit.md) |

---

## Overview

**Stack:** React 18, Vite, react-router-dom v6, @tanstack/react-query. No file-based routing.

| App | Base path | Port | Entry |
|-----|-----------|------|-------|
| admin | `/admin/` | 5174 | `frontend/admin/src/main.tsx` |
| miniapp | `/webapp/` | 5175 | `frontend/miniapp/src/main.tsx` |
| shared | — | — | `frontend/shared/` (design system, API client, types) |

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
| [table-unification-audit.md](tables/table-unification-audit.md) | Route-by-route table inventory |
| [table-qa-checklist.md](tables/table-qa-checklist.md) | QA checklist for tables |
| [migration-plan.md](tables/migration-plan.md) | Migration phases for table unification |

### [testing/](testing/) — Tests & E2E

| Doc | Purpose |
|-----|---------|
| [frontend-test-matrix.md](testing/frontend-test-matrix.md) | Routes × flows × states, E2E specs, gaps |

### [storybook/](storybook/) — Storybook

| Doc | Purpose |
|-----|---------|
| [structure.md](storybook/structure.md) | IA, sidebar hierarchy |
| [conventions.md](storybook/conventions.md) | Story conventions |
| [guardrails.md](storybook/guardrails.md) | Guardrails, checks |
| [audit.md](storybook/audit.md) | Storybook audit |

### [audits/](audits/) — Planning & audits

| Doc | Purpose |
|-----|---------|
| [admin-ui-gap-analysis.md](audits/admin-ui-gap-analysis.md) | Admin routes, primitives, gaps, migration plan |
| [frontend-file-manifest.md](audits/frontend-file-manifest.md) | File manifest, risk, coverage |
| [ui-inconsistencies.md](audits/ui-inconsistencies.md) | UI inconsistency notes |

---

## Related

- **Codebase map:** [docs/codebase-map.md](../codebase-map.md) §3 Frontend
- **Frontend audits:** [docs/audits/](../audits/) (frontend-audit-expanded, tables-audit)
- **File inventory (in repo):** [frontend/FILE_INVENTORY.md](../../frontend/FILE_INVENTORY.md)
