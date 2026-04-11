# VPN Suite Admin — https://vpn.vega.llc/admin

**Full technical map:** CSS, UI, layout, functions, API calls, callbacks, components, state, and keyboard behavior.

Canonical code root for the admin app is now `apps/admin-web/`. Older `frontend/admin/` references below are legacy compatibility paths and should be read as `apps/admin-web/` unless noted otherwise.

---

## 0. Live UI snapshot (Dashboard tab)

Captured from browser at `https://vpn.vega.llc/admin` (authenticated).

- **Top bar left:** Hamburger (☰), Shield + "AmneziaWG", Region dropdown ("All regions"), "Prod" badge.
- **Top bar center:** API ok, Prom ok, Nodes PROD 1/1 (green); Sessions 4; Error Live (80s auto) Updated 14s ago 0.00%; refresh; bell; search; theme (moon); Log out.
- **Main:** "Dashboard" title; buttons Servers, Audit, Telemetry, Resync, Refresh, settings. Cards: Cluster Health Matrix (table), Telemetry health (Fresh, Nodes 7 OK / 5 degraded / 0 down), Traffic & Load, Active Incidents (0).
- **Bottom nav (mobile):** OV Dashboard (active), SV Servers, TM Telemetry, US Users, ST Settings.

---

## 1. Entry point and configuration

### 1.1 Bootstrap

| Item | Value |
|------|--------|
| **Entry file** | `apps/admin-web/src/main.tsx` |
| **Root element** | `document.getElementById("root")` |
| **Router** | `react-router-dom` `BrowserRouter` with `basename="/admin"` |
| **Base path** | `/admin` (overridable via `VITE_ADMIN_BASE` in .env) |

**Config module:** legacy path reference; current bootstrap and routing live under `apps/admin-web/src/main.tsx` and `apps/admin-web/src/App.tsx`.  
- `ADMIN_BASE`: `import.meta.env.VITE_ADMIN_BASE` or `"/admin"`. Used for redirects (e.g. logout → `${ADMIN_BASE}/login`).

### 1.2 Provider tree (order)

1. `React.StrictMode`
2. `BrowserRouter` (basename `/admin`)
3. `QueryClientProvider` — `QueryClient` with:
   - `queries.retry: 1`
   - `queries.staleTime: 30000`
   - `queries.refetchOnWindowFocus: false`
4. `TelemetryProvider` (see §9)
5. `ThemeProvider` — `themes: ["dark", "dim", "light"]`, `defaultTheme: "dark"`, `storageKey: "vpn-suite-admin-theme"`
6. `App`

### 1.3 CSS loading order (main.tsx)

1. `@vpn-suite/shared/global.css`
2. `./tailwind.css`
3. `./admin.css`

### 1.4 API base URL

**Source:** `apps/admin-web/src/shared/constants.ts` (`getBaseUrl()`)  
- If `import.meta.env.VITE_API_BASE_URL` is set: use it (trailing slash stripped).
- Else in browser: `window.location.origin + '/api/v1'`.
- Else (e.g. SSR): `"/api/v1"`.

---

## 2. Routes (App.tsx)

**File:** `apps/admin-web/src/App.tsx`

### 2.1 Route table

| Path | Lazy component | Protected | Wrapped in ErrorBoundary |
|------|----------------|-----------|--------------------------|
| `/login` | `LoginPage` | No | Yes |
| `/` | `OverviewPage` (index) | Yes | Yes |
| `/telemetry` | `TelemetryPage` | Yes | Yes |
| `/automation` | `AutomationPage` | Yes | Yes |
| `/control-plane` | — | Yes | Redirect → `/automation` replace |
| `/servers` | `ServersPage` | Yes | Yes |
| `/servers/nodes` | `VpnNodesPage` | Yes | Yes |
| `/users` | `UsersPage` | Yes | Yes |
| `/billing` | `BillingPage` | Yes | Yes |
| `/subscriptions` | — | Yes | Redirect → `/billing?tab=subscriptions` replace |
| `/payments` | — | Yes | Redirect → `/billing?tab=payments` replace |
| `/devices` | `DevicesPage` | Yes | Yes |
| `/audit` | `AuditPage` | Yes | Yes |
| `/revenue` | `RevenuePage` | Yes | Yes |
| `/settings` | `SettingsPage` | Yes | Yes |
| `/styleguide` | `StyleguidePage` | Yes | Yes |
| `/promo` | — | Yes | Redirect → `/` replace |
| `/referrals` | — | Yes | Redirect → `/` replace |
| `*` | — | — | `<Navigate to="/" replace />` |

### 2.2 Layout and protection

- **Protected shell:** All routes under path `/` use `ProtectedRoute` → `AdminLayout` → `<Outlet />`.
- **ProtectedRoute** (`apps/admin-web/src/core/auth/Guard.tsx`): reads `useAuthStore((s) => s.accessToken)`. If no token → `<Navigate to="/login" state={{ from: location }} replace />`.
- **Suspense fallback:** `<div className="admin-loading"><Skeleton height={24} /></div>`.
- **Global wrappers:** `ErrorBoundary` (outer), `ToastContainer`, `TelemetryPageViewTracker`, then `Suspense` + `Routes`.

---

## 3. Layout (AdminLayout) — detailed

**File:** `apps/admin-web/src/layout/DashboardShell.tsx`

### 3.1 Shell structure and data attribute

- Root: `<div className="admin-layout" data-console="operator">`.  
- `data-console="operator"` is used by `admin-operator.css` for operator-specific tokens and component styles (sidebar, nav, top bar, tables, etc.).

### 3.2 Skip link

- `<a href="#admin-main" className="skip-link">Skip to main content</a>` — for keyboard/a11y.

### 3.3 Top bar (`.admin-top-bar`)

**Layout:** CSS Grid `grid-template-columns: auto 1fr auto`; `min-height: 48px`; `padding: 8px 12px`; `border-bottom: 1px solid var(--border-subtle)`; `position: sticky; top: 0`; `z-index: var(--z-header)`.

**Left (`.admin-top-bar-left`):**
- **Menu button** (mobile only, visible &lt;768px): `<button type="button" className="admin-menu-btn" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">` — Unicode `\u2630` (☰). Focus outline: `2px solid var(--color-primary)`.
- **Brand:** `<NavLink to="/" className="admin-brand" aria-label="AmneziaWG Admin" end>`. Contains `<Shield className="admin-brand-icon" />` and `<span className="admin-brand-text">AmneziaWG</span>`. On &lt;768px `.admin-brand-text` is `display: none`.
- **Region:** `<label className="admin-region-switch">` with `<span className="admin-region-label">Region</span>` and `<Select options={regionOptions} value={activeRegion} onChange={handleRegionChange} aria-label="Scope by region" className="admin-region-select" />`. Options: "All regions" + unique server regions from `useServerListFull()`.
- **Env badge:** `<span className="admin-env-badge" title="Environment">Prod</span>` — static.

**Center (`.admin-top-bar-center`)** `role="region" aria-label="System health"`:
- If `operatorQuery.data?.health_strip` exists: `<TopStatusBar data={operatorQuery.data.health_strip} />`.
- If `operatorQuery.isError`: fallback strip with single block "API" / "Down" (`.operator-health-block--down`, `.operator-topbar-value--down`).
- Else: loading strip with "Status" / "…".

**Right (`.admin-top-bar-right`):**
- **LiveStatusBlock** — props: `last_updated`, `freshness` (from `operatorQuery.data?.health_strip`), `onRefresh={handleRefresh}`.
- **Alerts link:** `<Link to="/" className="admin-alerts-trigger" aria-label={…} title="View incidents">` with Bell icon; optional `<span className="admin-alerts-count admin-alerts-count--critical|admin-alerts-count--warning">` showing `operatorQuery.data.incidents.length` when &gt; 0.
- **Search button:** `className="admin-search-trigger"`, `onClick={() => setCommandOpen(true)}`, `aria-label="Search (Ctrl+K)"`. Contains Search icon and `<span className="admin-search-label">Search</span>`.
- **Theme toggle:** `<Button variant="ghost" size="sm" onClick={toggleTheme}>` — Sun when theme is dark, Moon otherwise.
- **Log out:** `<Button variant="ghost" size="sm" onClick={logout} className="admin-logout-btn">Log out</Button>`.

### 3.4 Operator overview query (layout)

- **Query key:** `[...OPERATOR_DASHBOARD_KEY, "5m"]` → `["dashboard", "operator", "5m"]`.
- **Query fn:** `api.get<OperatorDashboardOut>("/overview/operator?time_range=5m", { signal })`.
- **staleTime:** 8_000 ms.
- **refetchInterval:** 15_000 ms (aligned with Prometheus scrape).
- **Data used:** `health_strip` (for TopStatusBar + LiveStatusBlock), `incidents` (for alert count and link aria-label).

### 3.5 Sidebar (`.admin-sidebar`)

- **Classes:** Base + `open` when `sidebarOpen` (mobile drawer open), `collapsed` when `sidebarCollapsed`.
- **State:** `sidebarOpen` (useState, false); `sidebarCollapsed` (useState, init from `localStorage.getItem("vpn-suite-sidebar-collapsed") === "1"`).
- **Desktop (≥768px):** `position: sticky`, no transform; between 768–1279px `flex-basis: var(--width-sidebar-collapsed)` (icons-only). **Collapsed:** `flex: 0 0 var(--width-sidebar-collapsed)`; section labels and nav labels hidden; nav links centered, padding inline 0.
- **Mobile (&lt;768px):** `position: fixed`, `transform: translateX(-100%)`; with `.open` → `translateX(0)`; overlay behind (see below).
- **Nav items:** From `allNavItems` (filtered: styleguide only if `import.meta.env.DEV`). Each item: `to`, `label`, `short`, `section?`, `icon` (Lucide). Sections: CONTROL, ACCESS, NETWORK, SYSTEM. Rendered as `<span className="admin-nav-section">` (first per section, hidden on ≥768px in base layout; operator CSS shows section in sidebar) and `<NavLink to={scopedTo(to)} end={to==="/"} className={({ isActive }) => \`admin-nav-link ${isActive ? "active" : ""}\`} onClick={() => setOpen(false)}>` with icon and `<span className="admin-nav-label">`.
- **Collapse button:** `<button type="button" className="admin-sidebar-collapse" onClick={() => setSidebarCollapsed((c) => !c)} aria-label="Expand sidebar"|"Collapse sidebar">` — ChevronLeft / ChevronRight. Hidden on &lt;768px in operator CSS.

### 3.6 Overlay and main

- **Overlay:** When `sidebarOpen`, `<div className="admin-overlay" role="button" tabIndex={-1} onClick={() => setOpen(false)} onKeyDown={(e) => e.key === "Escape" && setOpen(false)} aria-label="Close menu" />`. Only relevant on mobile; `display: none` at ≥768px.
- **Main:** `<main id="admin-main" className="admin-main" tabIndex={-1}><Outlet />` + in dev `ResourceDebugPanel` and `TelemetryDebugPanel`).

### 3.7 Bottom nav (mobile)

- **Class:** `admin-bottom-nav`; `display: grid; grid-template-columns: repeat(5, 1fr)`; `display: none` at ≥768px.
- **Items:** From `mobileNavItems` (filter: `to` in `["/", "/servers", "/users", "/telemetry", "/settings"]` and for `/` only "Dashboard"). Each: `<NavLink to={scopedTo(item.to)} end={item.to==="/"} className={({ isActive }) => \`admin-bottom-link ${isActive ? "active" : ""}\`}>` with `<span className="admin-bottom-icon">item.short</span>` and `<span className="admin-bottom-label">item.label</span>`.

### 3.8 Command palette

- **Component:** `<CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} items={commandItems} />`.
- **commandItems:** Nav items as "Go to Dashboard" / "Go to {label}" with `onSelect: () => navigateTo(to)`; plus "Open command palette" (no-op toggle); "Switch theme" → `toggleTheme`. `navigateTo` applies current `activeRegion` to path (pathname + `?region=` when not "all") and closes palette.

### 3.9 Callbacks and state flows

| Callback | Effect |
|----------|--------|
| **handleRegionChange(region)** | `setActiveRegion(region)`; update `location.search` (set or delete `region`); `navigate({ pathname, search })`. |
| **handleRefresh** | `refetchOperatorDashboard()` from `useTelemetryContext()`. |
| **toggleTheme** | Cycle theme in `themes` array via `setTheme`; close command palette. |
| **logout** | `useAuthStore.getState().logout()` → clear sessionStorage, redirect to `${ADMIN_BASE}/login`. |
| **scopedTo(pathname)** | If `activeRegion === "all"` return pathname; else `{ pathname, search: \`?region=${encodeURIComponent(activeRegion)}\` }`. |
| **navigateTo(path)** | Same scoping; `navigate(scoped); setCommandOpen(false)`. |

### 3.10 Side effects (useEffect)

1. **Region from URL:** When `location.search` changes, set `activeRegion` from `?region=` or "all".
2. **Persist region:** When `activeRegion` changes, `localStorage.setItem(REGION_STORAGE_KEY, activeRegion)`.
3. **Persist sidebar collapsed:** When `sidebarCollapsed` changes, `localStorage.setItem("vpn-suite-sidebar-collapsed", sidebarCollapsed ? "1" : "0")`.
4. **Close sidebar on route change:** When `location.pathname` changes, `setOpen(false)`.
5. **Escape closes sidebar:** When `sidebarOpen` and key "Escape", `setOpen(false)` (document keydown).
6. **Global keyboard:** (see §3.11) — not in input/textarea/select: Ctrl/Cmd+K and `/` and Shift+? toggle command palette; chord `g` then within 1s `s|u|t|a|o` navigate to Servers/Users/Telemetry/Automation/Dashboard with current region.

### 3.11 Keyboard shortcuts (AdminLayout)

- **Ctrl+K / Cmd+K:** Toggle command palette (ignored in input/textarea/select/contenteditable).
- **/:** Open command palette.
- **Shift+?:** Open command palette.
- **Chord g then s:** Navigate to `/servers` (region-scoped).
- **Chord g then u:** Navigate to `/users`.
- **Chord g then t:** Navigate to `/telemetry`.
- **Chord g then a:** Navigate to `/automation`.
- **Chord g then o:** Navigate to `/` (dashboard).
- Chord uses `chordRef` (ref): first `g` stores `{ key: "g", ts }`; second key within 1000 ms triggers navigation and clears ref; any other key clears ref.

---

## 4. CSS architecture — full detail

### 4.1 Entry and imports (admin.css)

**File:** `apps/admin-web/src/admin.css`

```css
@import "./styles/admin-animations.css";
@import "./styles/admin-layout.css";
@import "./styles/admin-pages.css";
@import "./styles/admin-dashboard.css";
@import "./styles/admin-servers.css";
@import "./styles/admin-users.css";
@import "./styles/admin-tables.css";
@import "./styles/admin-misc.css";
@import "./styles/admin-operator.css";
@import "./styles/operator-dashboard.css";
```

### 4.2 admin-layout.css — classes and behavior

- **Light theme overrides:** `html[data-theme="light"] .admin-layout` sets `--surface-base`, `--surface-raised`, `--color-surface`, `--color-bg`, `--border-subtle`, `--color-border`. `html[data-theme="light"] .admin-header` sets `backdrop-filter: none`.
- **.admin-layout:** `display: flex; flex-direction: column; min-height: 100vh; background: var(--surface-base)`.
- **.admin-header** (legacy/alternate): flex, sticky, border-bottom, `--z-header`, backdrop-filter.
- **.admin-brand** / **.admin-brand-icon** / **.admin-brand-text:** flex, link styling, icon size `var(--icon-size-sm)`; on &lt;768px brand text hidden.
- **.admin-menu-btn:** touch target, border, radius; focus-visible outline; **@media (min-width: 768px)** `display: none`.
- **.admin-region-switch**, **.admin-region-label**, **.admin-region-select:** label + select styling; focus-visible accent; on &lt;767px region label hidden, select min/max width reduced.
- **.admin-body:** `display: flex; flex: 1; min-height: 0; overflow: hidden` (flex child for main + sidebar).
- **.admin-sidebar:** fixed (mobile) / sticky (desktop); width `var(--width-sidebar)`; border-inline-end; transform for drawer; transition; **.open** → translateX(0). At 768–1279px `flex-basis: var(--width-sidebar-collapsed)`.
- **.admin-overlay:** fixed inset, `--surface-overlay`, `--z-overlay`; none at ≥768px.
- **.admin-nav:** flex column, padding, gap, overflow auto, flex 1.
- **.admin-nav-section:** block, padding, uppercase, letter-spacing, tertiary color; at ≥768px (base) display none; operator CSS re-enables and styles.
- **.admin-nav-link** / **.admin-nav-icon-svg** / **.admin-nav-label:** link styling, hover/focus-visible/active (active: inverted bg and text). At 768–1279px (operator): justify center, padding inline, label hidden.
- **.admin-sidebar-collapse:** (operator) absolute position, circle button, border; hover/focus-visible; hidden &lt;768px.
- **.admin-main:** flex 1, padding `var(--spacing-12)`; overflow auto; on &lt;767px padding reduced and bottom padding for bottom nav.
- **.admin-bottom-nav:** fixed bottom, grid 5 columns, height `var(--height-bottom-nav)`, border-top; **.admin-bottom-link** / **.admin-bottom-icon** / **.admin-bottom-label**; active state; hidden ≥768px.
- **Reduced motion:** `.skip-link`, `.admin-sidebar`, `.admin-nav-link` transitions set to none.
- **Resource debug panel:** `.resource-debug-panel`, `.resource-debug-header`, `.resource-debug-grid`, `.resource-debug-row`, `.resource-debug-source`, `.resource-debug-status` (with --error/--stale/--success), `.resource-debug-error`.

### 4.3 admin-operator.css — top bar and operator shell

- **.admin-top-bar:** grid `auto 1fr auto`, gap `var(--spacing-topbar-gap-zones)`, min-height 48px, padding 8px 12px, border-bottom, `--z-header`.
- **.admin-top-bar-left/center/right:** flex; center is justify-content center; right flex-shrink 0.
- **.admin-env-badge:** small uppercase, tertiary color, border with danger tint, radius `var(--radius-op)`.
- **Live block:** `.admin-live-status-block`, `--stale` modifier (warning color); `.admin-live-dot--topbar` (6px circle); `.admin-live-dot--fresh` (success), `--degraded`/`--stale` (warning), `--unknown` (tertiary); `.admin-live-dot--pulse` (keyframes opacity); `.admin-live-status-text`, `.admin-live-updated`; `.admin-refresh-btn--spin` (single rotation keyframes).
- **data-console="operator"** root vars: `--width-sidebar: 220px`, `--width-sidebar-collapsed: 48px`, `--op-surface`, `--op-border`, `--op-transition`.
- **Operator shell:** layout/sidebar/bottom-nav background and font size/line-height.
- **Search trigger:** inline-flex, padding, border, radius; hover/focus-visible; icon and label.
- **Alerts trigger:** link-style, border transparent; **.admin-alerts-count** pill (critical = danger bg, warning = warning bg).
- **Data indicator:** `.admin-data-indicator`, `--compact`; `.admin-data-dot` (states fresh/stale/error); `.admin-data-label`, `.admin-data-updated`.
- **Nav (operator):** section visible, padding; nav link min-height, border transparent; active: primary subtle bg, 2px start border interactive, no shadow.
- **Sidebar collapsed:** flex basis/width; section and label hidden; link justify center, padding 0.
- **Main (operator):** padding `var(--spacing-layout-gutter)`, transparent bg.
- **Page header, cards, tables:** operator radius/border for metric-card, connection-node-card, dashboard-card, table-wrap, etc.; servers toolbar, presets, bulk toolbar; servers-table column widths (check, status, health, name, region, lastseen, lastsync, peers, ips, telemetry, actions); health microbar (`.table-cell-health-*`, data-pct/data-level).
- **Login:** `.login-page`, `.login-card` (operator border/shadow).
- **Bottom link (operator):** padding, hover/active use primary-subtle.

### 4.4 admin-dashboard.css — dashboard and charts

- **.ref-stats-grid:** 1 col default; 2 cols ≥768px; 4 cols ≥1200px; gap.
- **.ref-stat-card**, **.ref-stat-label-row**, **.ref-stat-icon**, **.ref-stat-label**, **.ref-stat-value**, **.ref-stat-meta** (dashboard stat font size/weight).
- **.metric-card** (position relative, overflow hidden, padding); **.metric-card-bg-icon**; **.metric-card-content/header/icon/title/body/value/meta/trend** (trend up/down/neutral colors); variants default/primary/success/warning (border and icon colors).
- **.ref-charts-grid:** 1 col; 2 cols ≥1024px.
- **.dashboard--compact** / **.dashboard--comfortable:** gap overrides for stats/charts/ops row.
- **.dashboard-ops-row:** grid 1 col; 2 cols ≥1024px; gap.
- **.ref-cluster-summary**, **.ref-cluster-summary-inner**, **.ref-cluster-summary-line**.
- **.connection-nodes** grid; **.connection-node-card** (link-style, hover border/shadow); **.connection-node-header/icon/label/type/meta/status**.
- **.dashboard-widget-header**, **.dashboard-kpi-link**, **.dashboard-settings-fields/checkboxes**.
- **.page-header-actions**, **.ref-chart-span-2**, **.ref-chart-section**, **.ref-chart-title/subtitle/head-right/meta**, **.ref-chart-wrap/svg** (line/area/grid), **.ref-chart-frame/frame-size/frame-content**, **.ref-chart-banner** (stale/partial), **.ref-chart-state** (empty state), **.ref-echart**, **.ref-chart-tooltip** (title, grid, row, dot, name, value). **:root** `--chart-axis-font-size`, `--chart-frame-default-height`.

### 4.5 admin-pages.css

- **.ref-page:** flex column, gap, min-width 0.
- **.ref-page-sections**, **.ref-section-head**, **.ref-page-header**, **.ref-page-title/meta/actions**.
- **.ref-page .empty-state** (icon, title, description, actions).
- **.toast-container** success/error/info left border.
- **.admin-layout** input focus vars.
- **.login-page** (min-height, flex center, padding), **.login-card** (max-width form), **.login-card h1/form**, **.login-error**.
- **.page-header** (flex, wrap), **.page-header-start/back**, **.page-header-title-block**, etc.

### 4.6 admin-misc.css

- **--table-virtual-max-height**.
- **.ref-settings-title**, **.ref-settings-text**.
- **.ref-telemetry-stack**, **.telemetry-overview-grid**, **.ref-peers-head**.
- **.data-source-health-strip** (label, text, muted).
- **.dashboard** h1, **.dashboard-grid**, **.dashboard-link**, **.dashboard-card**, **.dashboard-warn**.

### 4.7 Design tokens (examples)

Used across layout and operator CSS (from shared/theme or local):  
`--surface-base`, `--surface-raised`, `--surface-overlay`, `--border-subtle`, `--color-border-default`, `--text-primary`, `--text-tertiary`, `--color-neutral-*`, `--color-primary`, `--accent-primary`, `--color-success-600`, `--color-warning-600`, `--color-danger-600`, `--z-header`, `--z-overlay`, `--z-sticky`, `--width-sidebar`, `--width-sidebar-collapsed`, `--height-bottom-nav`, `--spacing-*`, `--radius-*`, `--duration-normal`, `--duration-fast`, `--ease-standard`, `--icon-size-xs/sm`, `--size-touch-target`, `--font-medium`, `--text-xs` / `--text-sm` / `--text-base`, `--text-op-*`, `--spacing-op-*`, `--radius-op`, `--color-focus-ring`, `--color-primary-subtle`, `--color-interactive-default`, `--chart-frame-height`, `--chart-frame-height-compact`.

---

## 5. API client — full detail

**File:** `apps/admin-web/src/core/api/client.ts` (moved from legacy `frontend/admin/src/api/client.ts`)

### 5.1 Creation

- **Base:** `createApiClient` from `@vpn-suite/shared/api-client` with:
  - **baseUrl:** `getBaseUrl()`
  - **getToken:** `() => useAuthStore.getState().getAccessToken()`
  - **timeoutMs:** 30_000
  - **onUnauthorized:** async callback (see §5.3)
- **Export:** `api = withInstrumentation(baseApi)`.

### 5.2 Instrumentation (withInstrumentation)

- **Per request:** Generate `X-Request-ID` (UUID or fallback `req-${Date.now()}-${random}`); add to request headers.
- **Timing:** `performance.now()` before call, after success/throw.
- **On success:** `track("api_request", { path, method, status: 200, duration_ms, correlation_id })`.
- **On throw:** `track("api_error", { path, method, code (statusCode or message), correlation_id })`. Then rethrow.
- **Wrapped methods:** `request`, `get`, `getBlob`, `post`, `put`, `patch` (all delegate to base with extra headers).

### 5.3 onUnauthorized flow

1. Read refresh token: `useAuthStore.getState().getRefreshToken()`.
2. If none: `logout()` then `window.location.href = \`${ADMIN_BASE}/login\``; return.
3. Else: call `refreshAuth(getBaseUrl(), refresh)` (shared api-client). On success: `setTokens(data.access_token, data.refresh_token)` then `window.location.reload()`. On failure: `logout()` and redirect to login.

### 5.4 Shared createApiClient (summary)

**File:** `apps/admin-web/src/core/api/client.ts`  
- Builds URL from base + path; adds `Content-Type: application/json`; adds `Authorization: Bearer ${token}` when getToken returns non-null.
- Timeout via AbortController (composed with optional caller signal); on timeout throws ApiError TIMEOUT; on network error throws NETWORK_UNREACHABLE.
- On 401 calls `onUnauthorized()` then throws UNAUTHORIZED.
- Retries: for 502/503/504, retry up to MAX_RETRIES (2) for non-safe methods.
- Parses JSON; on !res.ok uses ApiError.fromBody when body matches error shape.

---

## 6. API endpoints — exhaustive list

**Base path:** `getBaseUrl()` (e.g. `/api/v1`). All requests that need auth send `Authorization: Bearer <access>`.

### 6.1 Auth

- **POST /auth/login**  
  Body: `{ email, password }`.  
  Response: `TokenResponse` (access_token, refresh_token).  
  Caller: Login page; on success stores in sessionStorage and redirects.

### 6.2 Operator / overview

- **GET /overview/operator?time_range=5m** (or `time_range=${timeRange}`)  
  Response: `OperatorDashboardOut` (health_strip: OperatorHealthStrip, incidents).  
  Used by: AdminLayout (5m, refetch 15s), Dashboard, Telemetry tab.
- **GET /overview/health-snapshot**  
  Response: `HealthSnapshot`.  
  Used by: GlobalDataIndicator.
- **GET /overview/connection_nodes**  
  Response: `ConnectionNodesOut`.  
  Used by: ConnectionNodesSection (dashboard).

### 6.3 Servers

- **GET /servers** (query: limit, offset, region, status, sort, etc.)  
  Response: `ServerList`.  
  Used by: useServerList (full 200, paginated), TopIssuesTable, ServerDetail peers list.
- **GET /servers/device-counts**  
  Response: `ServerDeviceCountsOut`.  
  Used by: Servers page.
- **GET /servers/telemetry/summary** (optional query)  
  Response: `ServersTelemetrySummaryOut`.  
  Used by: useServerList.
- **GET /servers/snapshots/summary**  
  Response: `ServersSnapshotSummaryOut`.  
  Used by: useServerList.
- **GET /servers/:id**  
  Response: `ServerOut`.  
  Used by: ServerDetail, ServerEdit, ServerRowDrawer (patch).
- **GET /servers/:id/telemetry**  
  Response: `ServerTelemetryOut`.  
  Used by: ServerDetail, ServerRowDrawer, VpnNodesTab.
- **GET /servers/:id/peers**  
  Response: `ServerPeersOut`.  
  Used by: ServerDetail.
- **GET /servers/:id/ips**  
  Response: `ServerIpListOut`.  
  Used by: ServerRowDrawer.
- **GET /servers/:id/actions?limit=20**  
  Response: `ActionListOut`.  
  Used by: ServerDetail.
- **GET /servers/:id/logs?tail=200**  
  Response: `ServerLogsOut`.  
  Used by: ServerLogsTab.
- **POST /servers**  
  Body: server create payload.  
  Response: `ServerOut`.  
  Used by: ServerNewPage.
- **PATCH /servers/:id**  
  Body: partial server.  
  Response: `ServerOut`.  
  Used by: ServerEdit, ServerRowDrawer.
- **PATCH /servers/bulk**  
  Body: `{ updated, server_ids }`.  
  Used by: Servers bulk update.
- **POST /servers/:id/restart**  
  Body: `{ reason?, confirm_token? }`.  
  Used by: Servers page.
- **POST /servers/:id/sync**  
  Body: `{}` or `{ mode: "manual" }`.  
  Response: `ServerSyncResponse`.  
  Used by: OperatorDashboardContent, Servers page.
- **POST /servers/:id/actions**  
  Body: `{ type }`.  
  Response: `{ action_id }`.  
  Used by: ServerDetail, Servers page.
- **POST /servers/:id/peers/block**  
  Body: `{ public_key, confirm_token }`.  
  Used by: ServerDetail.
- **POST /servers/:id/peers/reset**  
  Body: `{ public_key }`.  
  Used by: ServerDetail.
- **POST /servers/:id/peers/:peerId/rotate**  
  Response: `AdminRotatePeerResponse`.  
  Used by: ServerDetail.
- **POST /servers/:id/peers/:peerId/revoke**  
  Response: `AdminRevokePeerResponse`.  
  Used by: ServerDetail.

### 6.4 Peers

- **GET /peers** (e.g. `?node_id=...&limit=200` or `?status=active&limit=200&offset=0`)  
  Response: `PeerListOut`.  
  Used by: ServerDetail, UserSessionsTable.

### 6.5 Users

- **GET /users** (query params for list)  
  Response: `UserList`.  
  Used by: Users page.
- **GET /users/:id**  
  Response: `UserDetailType`.  
  Used by: UserDetail.
- **PATCH /users/:userId**  
  Body: e.g. role, is_banned, confirm_token (for ban).  
  Used by: Users page.
- **DELETE /users/:id**  
  Body: `{ confirm_token }` (required; must match `DELETE_USER_CONFIRM_TOKEN`).  
  Used by: Users page delete modal.
- **POST /users/:id/devices/issue**  
  Body: `{ subscription_id }`.  
  Used by: UserDetail.

### 6.6 Devices

- **GET /devices/summary**  
  Response: `DeviceSummaryOut`.  
  Used by: Devices page.
- **GET /devices** (query: pagination, search, sort)  
  Response: `DeviceList`.  
  Used by: Devices page, Users (full list for dropdown).
- **GET /devices/:id**  
  Response: `DeviceOut`.  
  Used by: DeviceDetailDrawer.
- **POST /devices/:id/revoke**  
  Body: `{ confirm_token }`.  
  Used by: Devices page.
- **POST /devices/:id/delete**  
  Body: `{ confirm_token }`.  
  Used by: Devices page.
- **POST /devices/:id/reissue**  
  Response: `AdminRotatePeerResponse`.  
  Used by: Devices page.
- **POST /devices/:id/reconcile**  
  Response: `{ reconciled }`.  
  Used by: Devices page, DeviceDetailDrawer.
- **POST /devices/bulk-revoke**  
  Body: array of ids + confirm_token.  
  Response: `{ revoked, skipped, errors }`.  
  Used by: Devices page.

### 6.7 Billing

Billing page has four tabs: **Plans**, **Subscription records**, **Payments**, **Entitlement events**.

- **GET /plans** (query: limit, offset)  
  Response: `PlanList`.  
  Used by: BillingPage Plans tab (plan catalog CRUD).
- **POST /plans**, **PATCH /plans/:id**  
  Used by: BillingPage Plans tab.
- **GET /subscriptions** (query: user_id?, plan_id?, limit, offset)  
  Response: `SubscriptionList`.  
  Used by: BillingPage Subscription records tab.
- **GET /payments** (query: user_id?, status?, provider?, limit, offset)  
  Response: `PaymentList`.  
  Used by: BillingPage Payments tab.
- **GET /admin/entitlement-events** (query: user_id?, subscription_id?, event_type?, limit)  
  Response: `EntitlementEventOut[]`.  
  Used by: BillingPage Entitlement events tab.

### 6.8 Audit

- **GET /audit** (query: resource_type, resource_id, limit, offset)  
  Response: `AuditLogList`.  
  Used by: Audit page, RecentAuditTable, ServerRowDrawer.

### 6.9 Control plane / automation

- **GET /control-plane/topology/summary**  
  Response: `TopologySummaryOut`.  
  Used by: ControlPlane, VpnNodesTab.
- **GET /control-plane/topology/graph**  
  Response: `TopologyGraphOut`.  
  Used by: ControlPlane.
- **GET /control-plane/metrics/business**  
  Response: `BusinessMetricsOut`.  
  Used by: ControlPlane.
- **GET /control-plane/metrics/security**  
  Response: `SecurityMetricsOut`.  
  Used by: ControlPlane.
- **GET /control-plane/metrics/anomaly**  
  Response: `AnomalyMetricsOut`.  
  Used by: ControlPlane.
- **GET /control-plane/automation/status**  
  Response: `AutomationStatusOut`.  
  Used by: ControlPlane, ClusterAutomationSummary.
- **GET /control-plane/events?limit=12**  
  Response: `ControlPlaneEventListOut`.  
  Used by: ControlPlane.
- **POST /control-plane/placement/simulate**  
  Body: placement params.  
  Response: `PlacementSimulationOut`.  
  Used by: ControlPlane.
- **POST /control-plane/rebalance/plan**  
  Body: rebalance params.  
  Response: `RebalancePlanOut`.  
  Used by: ControlPlane.
- **POST /control-plane/failover/evaluate**  
  Response: `FailoverEvaluateOut`.  
  Used by: ControlPlane.
- **POST /control-plane/automation/run**  
  Body: run params.  
  Response: `AutomationRunOut`.  
  Used by: ControlPlane.

### 6.10 Cluster and app

- **GET /cluster/health**  
  Response: `ClusterHealthOut`.  
  Used by: ClusterAutomationSummary.
- **POST /cluster/resync**  
  Body: `{}`.  
  Used by: Dashboard (Resync button).
- **GET /app/settings**  
  Response: `AppSettingsOut`.  
  Used by: Devices page, etc.
- **POST /app/settings/cleanup-db**  
  Body: `{ confirm_token }`.  
  Response: `{ ok, message }`.  
  Used by: Settings page.

### 6.11 Telemetry / analytics

- **GET /analytics/telemetry/services**  
  Response: `TelemetryServicesOut`.  
  Used by: ScrapeStatusPanel.
- **GET /analytics/metrics/kpis**  
  Response: `MetricsKpisOut`.  
  Used by: MetricsKpisPanel.
- **GET /telemetry/docker/hosts**  
  Response: `HostSummaryListOut`.  
  Used by: useDockerTelemetry.
- **GET /telemetry/docker/containers?host_id=**  
  Response: `ContainerSummaryListOut`.  
  Used by: useDockerTelemetry.
- **GET /telemetry/docker/alerts?host_id=**  
  Response: `AlertItemListOut`.  
  Used by: useDockerTelemetry.
- Plus timeseries and logs in useDockerTelemetry.

### 6.12 Config / issue

- **GET /admin/configs/issued/:id/content**  
  Response: `{ content: string }`.  
  Used by: ConfigContentModal.
- **POST** (issue config)  
  Response: `AdminIssuePeerResponse`.  
  Used by: IssueConfigModal.

---

## 7. React Query keys (query-keys.ts) — full list

**Current status:** there is **no** central `query-keys.ts` in the admin app. Query keys are **inline arrays** passed to `useApiQuery`.

**Helper:** `apps/admin-web/src/hooks/api/useApiQuery.ts`

Examples (current):

- **Servers:** `["servers", "snapshots", "summary"]`
- **Telemetry snapshot:** `["telemetry", "snapshot"]`
- **Operator overview:** `["overview", "operator", "1h"]`
- **Docker containers:** `["telemetry", "docker", "containers"]`
- **Docker alerts:** `["telemetry", "docker", "alerts"]`
- **Telemetry services:** `["telemetry", "services"]`

---

## 8. Auth and session — full flow

**File:** `apps/admin-web/src/core/auth/store.ts`

- **Storage keys:** `vpn_admin_access`, `vpn_admin_refresh` (sessionStorage).
- **State:** `accessToken`, `refreshToken` (Zustand). Initial state from `getStored()` (both keys must exist).
- **setTokens(access, refresh):** `setStored(access, refresh)` then `set({ accessToken, refreshToken })`.
- **logout():** `clearStored()`, `set({ accessToken: null, refreshToken: null })`, then `window.location.href = \`${ADMIN_BASE}/login\``.
- **getAccessToken / getRefreshToken:** return current from store.
- **ProtectedRoute:** If no accessToken, Navigate to `/login` with `state={{ from: location }}`.
- **API 401:** Client onUnauthorized tries refresh; on failure or no refresh token, logout and redirect to login.

---

## 9. Key UI components — behavior and props

### 9.1 CommandPalette

**File:** `apps/admin-web/src/design-system/primitives/CommandPalette.tsx`

- **Props:** `open`, `onClose`, `items: CommandItem[]` where `CommandItem = { id, label, keywords?, onSelect }`.
- **Filter:** `matchQuery(query, label, keywords)` — trim, lower; match if full text includes query or every word in query is in text.
- **State:** `query`, `selectedIndex`; on open reset query and index; when filtered length changes clamp selectedIndex.
- **Keyboard (when open):** Escape → onClose; ArrowDown/ArrowUp → cycle selectedIndex; Enter → run `filtered[selectedIndex].onSelect()`.
- **Scroll:** selected item scrollIntoView block nearest.
- **Markup:** Overlay `command-palette-overlay` (click outside closes); inner `command-palette` with SearchInput `command-palette-input` and listbox `command-palette-list`; items as buttons `command-palette-item` + `selected`; empty state "No results".

### 9.2 LiveStatusBlock

**File:** current operator status surfaces live under `apps/admin-web/src/layout/` and overview/dashboard feature modules.

- **Props:** `last_updated: string`, `freshness: "fresh"|"degraded"|"stale"|"unknown"`, `onRefresh: () => void`.
- **State:** `spinning` (true on refresh, false on animation end).
- **Dot class:** `admin-live-dot admin-live-dot--topbar` + `admin-live-dot--fresh|--degraded|--stale|--unknown`; if fresh add `admin-live-dot--pulse`.
- **Stale block:** add `admin-live-status-block--stale` when freshness is stale or degraded.
- **Content:** dot (aria-hidden), "Live (15s)", RelativeTime for last_updated (updateInterval 5000), Button (RefreshCw) with `admin-refresh-btn` + `admin-refresh-btn--spin` when spinning; onAnimationEnd clears spinning.
- **ARIA:** role="status", aria-label describes live data and 15s refresh.

### 9.3 TopStatusBar

**File:** `apps/admin-web/src/layout/DashboardStatusBar.tsx`

- **Props:** `data: OperatorHealthStrip` (api_status, prometheus_status, online_nodes, total_nodes, active_sessions, peers_active, total_throughput_bps, avg_latency_ms, error_rate_pct).
- **Markup:** `.operator-health-strip.operator-top-bar-health` with three blocks: core (API, Prom, Nodes online/total), activity (Sessions, Peers, Throughput), performance (Latency, Error %). Each cell: `.operator-topbar-cell` with label and value; value classes include `operator-topbar-value--ok|down|degraded|unknown`. Core block gets `operator-health-block--down` when api_status === "down". Throughput formatted with `formatBytes`.

### 9.4 TelemetryContext

**File:** `apps/admin-web/src/core/telemetry/provider.tsx`

- **Provider:** Exposes `refetchOperatorDashboard` (refetch OPERATOR_DASHBOARD_KEY) and `refetchAllTelemetry` (refetch TELEMETRY_REFETCH_KEYS + refreshRegisteredResources).
- **TELEMETRY_REFETCH_KEYS:** OPERATOR_DASHBOARD_KEY, TELEMETRY_SNAPSHOT_KEY, TELEMETRY_TOPOLOGY_KEY, DOCKER_TELEMETRY_KEY, ANALYTICS_*, SERVERS_LIST_KEY.
- **useTelemetryContext():** returns context value; throws if null.

### 9.5 Dashboard page (high level)

**File:** `apps/admin-web/src/features/overview/OverviewPage.tsx` (previously legacy `frontend/admin/src/pages/Dashboard.tsx`)

- **Layout:** `dashboard ref-page dashboard--${settings.density}` (data-testid="dashboard-page"). PageHeader with icon LayoutGrid, title "Dashboard", and actions: Servers (Link), Audit (Link), Telemetry (Link), Resync (ConfirmModal), RefreshButton.
- **handleRefresh:** Refetches OPERATOR_DASHBOARD_KEY, PEERS_LIST_KEY, CONNECTION_NODES_KEY, AUDIT_KEY, SERVERS_LIST_DASHBOARD_KEY and refreshRegisteredResources; tracks user_action dashboard_refresh; throws if any cache/result error.
- **handleResync:** Opens confirm; on confirm POST /cluster/resync then handleRefresh; on ApiError reports to telemetry.
- **Content:** OperatorDashboardContent (and dashboard settings modal). Region options from useServerListFull(); DashboardSettings in modal with density (compact/comfortable) and widget toggles (useDashboardSettings, NS "vpn-suite-admin-dashboard").

---

## 10. Telemetry and errors

- **initTelemetry** (main.tsx): baseUrl from getBaseUrl, getToken from authStore, sendFrontendErrors true. Called before render.
- **wireGlobalErrors:** Global error handler wired to telemetry (frontend errors).
- **TelemetryPageViewTracker:** Tracks route/page view events.
- **API client:** On every request success → `track("api_request", ...)`; on throw → `track("api_error", ...)`.

---

## 11. Build and environment

- **Vite:** `apps/admin-web/vite.config.ts` — `base: "/admin/"`.
- **Env:** `VITE_API_BASE_URL`, `VITE_ADMIN_BASE` (optional).
- **E2E (Playwright):** baseURL default `http://127.0.0.1:4174/admin/`; auth helpers (e.g. in `apps/admin-web/e2e/helpers.ts`) set sessionStorage `vpn_admin_access` and `vpn_admin_refresh` after login and wait for URL `/admin/?`.

---

*This map is generated from the codebase. Live DOM may vary (e.g. login vs dashboard). For exact DOM at a given time, use browser snapshot or DevTools on https://vpn.vega.llc/admin or https://vpn.vega.llc/admin/login.*
