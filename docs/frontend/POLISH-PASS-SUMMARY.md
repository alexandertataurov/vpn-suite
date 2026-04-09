# Frontend Polish Pass — Structured Codebase Summary

Use this summary for targeted polish prompts (UI visuals, spacing, animations, responsiveness, performance). Covers **Admin** (operator SaaS), **Miniapp** (Telegram Web App), and shared design foundations.

---

## 1. App overview

### Admin (`frontend/admin/`)
- **Purpose:** Operator-grade SaaS for VPN fleet, users, devices, billing, telemetry, automation.
- **Main flows:** Login → Dashboard (overview, strips, cluster matrix, server table) → Servers / Users / Devices / Telemetry / Automation / Revenue / Billing / Audit / Settings. Deep flows: Server detail (drawer/tabs), User detail, Device issue/config, Control plane, Payments monitor, Styleguide (dev).
- **Entry:** `src/App.tsx` (lazy routes, `AdminLayout`, `ProtectedRoute`, `ErrorBoundary`). Layout: `AdminLayout.tsx` → `AppShell`, `MissionBar`, `NavRail`/sidebar, `PageContent`, `CommandPalette`.
- **Key pages:** `Dashboard`, `Telemetry`, `Servers`, `Users`, `UserDetail`, `Devices`, `Billing`, `Revenue`, `ControlPlane`, `Audit`, `Settings`, `Styleguide`, plus Revenue/Risk/Ops (SubscriptionsHealth, PaymentsMonitor, Referrals, AbuseRisk, RetentionAutomation, PricingEngine, PromoCampaigns, ChurnPrediction, DevOps, CohortAnalytics).

### Miniapp (`frontend/miniapp/`)
- **Purpose:** Consumer Telegram Mini App — VPN subscription, plan selection, checkout (Telegram Stars), devices, referral, support, settings.
- **Main flows:** Bootstrap (auth + session + onboarding) → Home → Plan → Checkout or trial → Devices (get config) → Support / Referral / Settings. Stack flows: Onboarding, Checkout, Server selection, Referral (full-page scroll).
- **Entry:** `src/App.tsx` → `BootstrapController`, `TabbedShellLayout` (tabs) / `StackFlowLayout` (stack), lazy page routes. Layouts: `MiniappLayout.tsx` (header + main + bottom nav), `StackFlowLayout` (single scroll).
- **Key pages:** `Home`, `Plan`, `Checkout`, `Devices`, `Support`, `Settings`, `Referral`, `ServerSelection`, `Onboarding`.

---

## 2. Tech stack

| Area | Admin | Miniapp |
|------|--------|---------|
| **Runtime** | React 18, Vite 6 | React 18, Vite 6 |
| **Routing** | react-router-dom 6 | react-router-dom 6 |
| **Data** | TanStack Query 5, Zustand | TanStack Query 5 |
| **Charts** | ECharts (echarts, echarts-for-react), Recharts | — |
| **Virtualization** | @tanstack/react-virtual | — |
| **Animations** | framer-motion (BootSequence, ServersBulkToolbar), CSS keyframes (utilities.css `.animate-in`), Tailwind `animate-spin` | CSS only (transitions in buttons/inputs); no animation library |
| **Icons** | lucide-react | lucide-react |
| **Styling** | **Dual:** (1) Design system CSS — `admin.css` imports 50+ files from `design-system/` (tokens, base, primitives, table, layout, data-display, feedback, navigation, console, typography, utilities). (2) Tailwind — `tailwind.css` (base/components/utilities), `tailwind-merge` via `shared/utils/cn.ts`. No CSS modules; BEM-like `.ds-*` and component-specific classes. | **Single:** Plain CSS — `miniapp.css` + `styles/miniapp-*.css`, `design-system/styles/tokens/base.css` + `theme/consumer.css`. Token-driven; no Tailwind, no CSS modules. Design-system styles in `design-system/styles/content/` (buttons, inputs, card, modal-drawer, etc.). |
| **Theme** | `@vpn-suite/shared/theme` (ThemeProvider); themes: dark, dim, light; key `vpn-suite-admin-theme` | Same ThemeProvider; themes: consumer-light, consumer-dark; key `vpn-suite-miniapp-theme` |
| **Other** | cmdk (command palette), Sentry | Sentry, Telegram WebApp SDK (via hooks) |

---

## 3. Design style

### Admin — “Starlink / Aerospace” operator UI
- **Tokens:** `design-system/tokens.css` — “STARLINK VISUAL DNA”, **zero rounded corners**, single accent.
- **Colors:** Dark-first (`:root` / `data-theme="dark"`): `--color-void` #060809, `--color-base` #0A0E12, `--color-surface` #0E1419, `--color-elevated` #141C24; text `--color-text-primary` #EDF2F8, muted #6E8499; **accent** #0EA5E9 (sky blue); semantic: nominal (green), warning (amber), critical (red), standby (gray). Chart palette 1–5 + grid/axis/tooltip.
- **Typography:** `design-system/typography.css` — **Chakra Petch** (display, uppercase, letter-spacing), **DM Mono** (body), **JetBrains Mono** (data/metrics). Scale: `--text-2xs` (10px) → `--text-3xl` (48px). Scoped under `[data-console="operator"]`.
- **Spacing:** 4px grid: `--space-1` (4px) … `--space-16` (64px). Many legacy `--space-*px` values still present.
- **Motion:** `--duration-fast`, `--ease-out-expo`; `.animate-in` fade-up with nth-child stagger (40ms steps); framer-motion for boot sequence and bulk toolbar slide-up.

### Miniapp — Consumer, mobile-first
- **Tokens:** `styles/miniapp-tokens.css` — OKLCH primitives (gray, primary, success, warning, error); semantic `--color-bg`, `--color-surface`, `--color-text`, `--color-accent`, etc. Light/dark via `data-theme="light"` / `"dark"`.
- **Visual:** Optional HUD grid background (`.hud-bg`), `--app-height` for viewport; touch targets `--size-touch-target: 44px`, `--height-btn-lg: 44px`.
- **Typography:** `--miniapp-font-sans` (body); tokens for sizes/weights.
- **Spacing:** 8px grid in layout (`--spacing-sm/md/lg`), `--container-pad`; stack/cluster/grid in `miniapp-layout.css`.

### Cross-app (ui-techspec.md / design/UI-ALIGNMENT-DECISION-LOG.md)
- Target: “Minimal, confident, premium fintech/SaaS” (Revolut / Linear / Stripe quality bar).
- Depth via subtle elevation; typography-first; card-based sections; no decorative gradients/textures.
- Shared semantic token names where possible; admin uses operator-specific tokens, miniapp consumer tokens.

---

## 4. Component structure

### Admin
- **Layout:** `AdminLayout.tsx` — sidebar (NavRail) collapse state, MissionBar (top), AppShell, PageContent, CommandPalette. Responsive: `useBreakpoint` (XS/SM/MD/LG/XL), Shell.css media + container queries.
- **Design system:** `design-system/` — primitives (Button, Input, Badge, Skeleton, etc.), layout (Card, Panel, SectionHeader, Field, FormSection, ScrollArea), data-display (MetricTile, StatCard, EmptyState, Alert, LiveIndicator, ProfileCard, DeviceCard, QrPanel, BulkActionsBar), feedback (Modal, Drawer, Toast, InlineAlert, ErrorState, PageError, CommandPalette), navigation (Tabs, DropdownMenu, Pagination, Breadcrumb), table (Table, VirtualTable). Console-specific: Operator.css, Telemetry.css, Dashboard/ClusterMatrix/Devices/Audit/Topology/etc.
- **Feature components:** `components/` — layout (AppShell, MissionBar, NavRail, Panel, SectionHeader), operator (HealthBar, ClusterMatrix, OperatorServerTable, LiveStatusBlock, SystemHeartbeat), telemetry (ClusterHealthCharts, AlertsPanel, IncidentPanel, …), servers (ServerCard, ServersBulkToolbar, RowActionsMenu), devices (DeviceDetailDrawer, EditDeviceModal), health, node-commander, overlays (ConfigContentModal, CriticalActionGuard).
- **Templates:** `templates/DashboardPage.tsx`, `FormPage`, `DetailPage`, `ListPage`, `SettingsPage`.

### Miniapp
- **Layout:** `TabbedShellLayout` (header + main + bottom nav with tabs), `StackFlowLayout` (full-height scroll). `MiniappLayout.tsx` defines both; tabs: Home, Devices, Plan, Support, Account.
- **Bootstrap:** `BootstrapController.tsx`, `useBootstrapMachine.ts` — splash, onboarding, session loading, error screens.
- **UI:** `design-system/` — Button, InlineAlert, Skeleton, PageScaffold, ActionRow, etc.; pages use `@/design-system` and `@/components`.
- **Pages:** Self-contained; use `useSession`, `useWebappToken`, shared components (SessionMissing, FallbackScreen, DeviceCard, etc.).

### Shared (design / code)
- **Admin:** `shared/` under admin (theme, api-client, types) + design-system.
- **Miniapp:** `design-system/` + `lib/` — theme (tokens), api-client via `@vpn-suite/shared`, types, icons (`lib/icons.ts`). Design-system at `@ds` or `@/design-system`.

---

## 5. What’s already done well

- **Token systems:** Both apps use CSS custom properties as single source of truth; admin has a clear “zero radius, one accent” rule; miniapp has OKLCH and light/dark semantics.
- **Documentation:** [ui-techspec.md](ui-techspec.md), [design/UI-ALIGNMENT-DECISION-LOG.md](design/UI-ALIGNMENT-DECISION-LOG.md), [adaptive-ui.md](adaptive-ui.md), [miniapp-layout-architecture.md](miniapp-layout-architecture.md), release checklist (contrast, focus, reduced-motion, 44px CTA).
- **Responsive strategy:** Admin: breakpoints (640/1024/1440/1920), container queries (topbar, dashboard grid, operator card), content-aware `data-content-empty` / `data-content-dense`. Miniapp: mobile-first, `--app-height`, safe areas, 600/900px breakpoints, single scroll container.
- **Accessibility:** Focus and reduced-motion mentioned in checklist; semantic structure and aria in layouts and modals.
- **Performance:** Lazy routes in both apps; admin uses VirtualTable and TanStack Virtual; chart libs (ECharts/Recharts) used for heavy data.
- **Consistency:** Shared theme provider pattern; shared semantic token names across apps; design-system primitives used widely in admin.
- **Staggered reveal:** Admin has `.animate-in` and framer-motion in a few high-impact places (boot, bulk toolbar).

---

## 6. Biggest polish opportunities

### Visuals & spacing
- **Legacy spacing:** Admin `tokens.css` has many non-grid `--space-*px` values; migrate to 4px grid and remove or alias legacy tokens.
- **Inline styles:** Admin still has a large number of `style={{}}` usages (e.g. `OperatorServerTable`, `HealthBar`, `ServerRowDrawer`, `Revenue`, `Dashboard` sections, `DeviceDetailDrawer`, `ConfigContentModal`). Move to token-based classes or design-system components to unify spacing and colors.
- **Miniapp spacing:** Ensure all screens use `--spacing-*` / `--container-pad` consistently; check Plan, Checkout, Devices, Settings for ad-hoc margins/paddings.
- **Admin/miniapp alignment:** UI-ALIGNMENT-DECISION-LOG and consumer theme mapping are only partially done; miniapp still has its own token set. Align semantic tokens and remove duplicate patterns where possible.

### Animations & micro-interactions
- **Admin:** Framer-motion is used in only 2–3 places (BootSequence, ServersBulkToolbar). Consider: page/section enter transitions, list item stagger on Dashboard/Telemetry, modal/drawer open/close, loading state transitions. Respect `prefers-reduced-motion` (already referenced in docs).
- **Miniapp:** No animation library; transitions exist in CSS for buttons/inputs. Add: tab switch feedback (already has haptics), skeleton → content transition, error/success toast or inline feedback micro-motion, optional subtle list/stagger on Home/Plan.
- **Shared:** Define a small set of duration/easing tokens and reuse in both apps (e.g. `--duration-fast` / `--ease-out-expo` already in admin).

### Responsiveness
- **Admin:** Verify XS (<640px): single column, overlay nav, stacked cards; SM (640–1024): collapsible sidebar; container queries for topbar and dashboard. Check Telemetry, Control Plane, Revenue, and long tables on small viewports.
- **Miniapp:** [miniapp-layout-architecture.md](miniapp-layout-architecture.md) defines 600/900px and max-width; verify Plan grid (1 col → 2 col), Checkout and Referral on narrow viewports, and bottom nav safe area on notched devices.
- **Touch targets:** Release checklist requires ≥44px for main CTAs on mobile; audit admin (when used on tablet) and miniapp (all primary buttons and tabs).

### Performance
- **Admin:** Heavy dashboard (OperatorDashboardContent, ClusterMatrix, many strips) — consider virtualization or lazy-load below fold; chart components (ChartFrame, ClusterHealthCharts) — ensure ECharts/Recharts options don’t block main thread.
- **Miniapp:** Lazy routes are in place; check bundle size of shared chunk and ensure no large unused deps; bootstrap sequence (auth + session + onboarding) is critical path — keep it minimal.
- **Both:** Ensure images/assets are optimized; check for unnecessary re-renders in list/detail views (React Query + memo where needed).

### Consistency & finish
- **Admin:** Two styling systems (design-system CSS + Tailwind) can drift; prefer design-system tokens and components for new work; use Tailwind only for one-off utilities and ensure `cn()` merges with ds-* classes correctly.
- **Empty/error/loading states:** Audit EmptyState, ErrorState, FallbackScreen, Skeleton usage across admin and miniapp; unify copy and layout where it makes sense.
- **Focus visible:** Checklist calls out focus-visible for all interactive elements; audit buttons, links, inputs, selects, tabs in both apps.
- **Miniapp session/error UX:** Already improved (friendly messages, retry); ensure all error paths use the same pattern and that Retry truly refetches or re-auths.

### Specific files to target (examples)
- **Admin:** `OperatorServerTable.tsx`, `HealthBar.tsx`, `ServerRowDrawer.tsx`, `OperatorDashboardContent.tsx`, `Revenue.tsx`, `DeviceDetailDrawer.tsx`, `ConfigContentModal.tsx`, `DashboardSettings.tsx`, `ConnectionNodesSection.tsx` — reduce inline styles and align to tokens.
- **Admin layout:** `Shell.css`, `Operator.css` — responsive and container-query behavior; `NavRail`/sidebar collapse animation.
- **Miniapp:** `miniapp.css` / `miniapp-layout.css` — spacing and responsive rules; `Home.tsx`, `Plan.tsx`, `Checkout.tsx`, `Devices.tsx` — layout and CTA sizing.
- **Shared:** `design-system/primitives/Button.css`, `design-system/feedback/Modal.css`, `design-system/feedback/Drawer.css` — transitions and focus; miniapp `design-system/styles/content/` button/input styles — align with tokens.

---

*Reference: `frontend/admin/`, `frontend/miniapp/`, `docs/frontend/` (adaptive-ui, ui-techspec, cleanup-audit), `docs/ops/release-checklist.md`, `docs/frontend/design/UI-ALIGNMENT-DECISION-LOG.md`.*
