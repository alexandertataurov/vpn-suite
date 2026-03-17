# Navigation patterns — catalog

All navigation-related components, Storybook stories, and app pages in the project. Paths below are relative to `frontend/admin/` unless noted.

---

## 1. Design-system navigation primitives (source)

| Component      | Path |
|----------------|------|
| Breadcrumb     | `src/design-system/navigation/Breadcrumb.tsx` |
| Tabs           | `src/design-system/navigation/Tabs.tsx` |
| CommandBar     | `src/design-system/navigation/CommandBar.tsx` |
| Pagination     | `src/design-system/navigation/Pagination.tsx` |
| FormActions    | `src/design-system/navigation/FormActions.tsx` |
| DropdownMenu   | `src/design-system/navigation/DropdownMenu.tsx` |
| PanelGrid      | `src/design-system/navigation/PanelGrid.tsx` |

---

## 2. App layout / chrome (navigation UI)

| Component       | Path | Notes |
|-----------------|------|--------|
| NavRail         | `src/components/layout/NavRail.tsx` | Main app nav (used in AdminLayout) |
| Sidebar         | `src/components/layout/Sidebar.tsx` | Collapsible sidebar |
| TopBar          | `src/components/layout/TopBar.tsx` | Top bar |
| MissionBar      | `src/components/layout/MissionBar.tsx` | Mission/context bar |
| AppShell        | `src/components/layout/AppShell.tsx` | Shell: NavRail + content |
| CommandPalette  | `src/components/chrome/CommandPalette.tsx` | Global command palette (⌘K) |
| PageHeader      | `src/components/PageHeader.tsx` | Page title + breadcrumb + actions |
| AvionicsBreadcrumbs | Used in AdminLayout (breadcrumb in shell) |

*TopBar and MissionBar still have no dedicated stories.*

---

## 3. Storybook stories (navigation-related)

| Storybook title              | File |
|-----------------------------|------|
| **Navigation/Overview**     | `src/design-system/stories/navigation/Navigation.stories.tsx` (includes Side nav, FormActions, DropdownMenu) |
| **Navigation/NavRail**     | `src/components/layout/NavRail.stories.tsx` |
| **Navigation/Sidebar**     | `src/components/layout/Sidebar.stories.tsx` |
| **Navigation/AppShell**    | `src/components/layout/AppShell.stories.tsx` |
| **Components/Navigation/Breadcrumbs**  | `src/components/Breadcrumb.stories.tsx` |
| **Components/Navigation/Tabs**         | `src/design-system/stories/display/Tabs.stories.tsx` |
| **Components/Data Table/Pagination**   | `src/design-system/table/Pagination.stories.tsx` |
| **Components/Overlays/DropdownMenu** | `src/design-system/stories/misc/DropdownMenu.stories.tsx` |
| **Components/CommandPalette**| `src/components/CommandPalette.stories.tsx` |
| **Components/CommandPalette/ServersCommandPalette** | `src/components/ServersCommandPalette.stories.tsx` |
| **Patterns/OperatorHeader** (PageHeader) | `src/components/PageHeader.stories.tsx` |
| **Patterns/OperatorToolbar**| `src/components/Toolbar.stories.tsx` |
| **Components/Button**   | `src/design-system/stories/Button.stories.tsx` |

---

## 4. Page-level stories (use CommandBar / nav patterns)

| Storybook title   | File | Nav usage |
|-------------------|------|-----------|
| **Pages/Dashboard**   | `src/pages/Dashboard.stories.tsx`   | CommandBar |
| **Pages/Servers**     | `src/pages/ServersPage.stories.tsx` | CommandBar |
| **Pages/Telemetry**   | `src/pages/Telemetry.stories.tsx`  | CommandBar |

---

## 5. App routes (pages using AdminLayout → NavRail + shell)

Defined in `src/App.tsx`; layout in `src/layouts/AdminLayout.tsx` (NavRail, MissionBar, AppShell, CommandPalette, AvionicsBreadcrumbs).

- `/` — Dashboard  
- `/telemetry` — Telemetry  
- `/automation` — Control plane  
- `/servers`, `/servers/new`, `/servers/:id`, `/servers/:id/edit`  
- `/users`, `/users/:id`  
- `/devices`  
- `/billing`, `/revenue`  
- `/audit`  
- `/subscriptions-health`, `/payments-monitor`  
- `/referrals`, `/abuse-risk`, `/retention-automation`, `/pricing-engine`, `/churn-prediction`  
- `/devops`, `/cohort-analytics`, `/promo-campaigns`  
- `/settings`  
- `/styleguide`  
- `/login` (no shell)

---

## 6. Other docs

- **FoundationNav** (foundations doc nav): `src/design-system/docs/foundations/components/FoundationNav.tsx` — link grid to foundation stories, not app routes.

---

## Summary

- **Design-system nav:** Breadcrumb, Tabs, CommandBar, Pagination, FormActions, DropdownMenu, PanelGrid.  
- **Stories:** Navigation/Overview, Breadcrumbs, Tabs, Pagination, DropdownMenu, CommandPalette, PageHeader, Toolbar, ButtonLink; page stories for Dashboard, Servers, Telemetry.  
- **Layout/chrome:** NavRail, Sidebar, TopBar, MissionBar, AppShell, CommandPalette — used in AdminLayout; no standalone stories.  
- **Pages:** All main app routes use AdminLayout (NavRail + shell).
