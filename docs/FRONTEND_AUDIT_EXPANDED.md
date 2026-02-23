# Frontend Audit — 10x Expanded Supplement

This document expands the main audit plan with exhaustive detail. Use with [.cursor/plans/frontend_audit_refactor_*.plan.md] for the consolidated plan.

---

## Phase 0 — Architecture (Expanded)

### Framework build matrix

| Item | Admin | Miniapp | Shared |
|------|-------|---------|--------|
| React | 18.3.1 | 18.3.1 | peer ^18\|^19 |
| Vite | 6.0.1 | 6.0.1 | — |
| @vitejs/plugin-react | 4.3.3 | 4.3.3 | — |
| Tailwind | 3.4.16 | — | — |
| @tanstack/react-query | 5.62.0 | 5.62.0 | 5.90.21 (dev) |
| zustand | 5.0.1 | — | — |
| react-router-dom | 6.28.0 | 6.28.0 | 6.30.3 (dev) |
| echarts | 6.0.0 | — | — |
| @tanstack/react-virtual | 3.13.18 | — | — |

### Routing map (complete)

| Path | Component | Guard | Redirect target |
|------|-----------|-------|-----------------|
| /login | LoginPage | None | — |
| / | AdminLayout | ProtectedRoute | — |
| / (index) | DashboardPage | ProtectedRoute | — |
| /telemetry | TelemetryPage | ProtectedRoute | — |
| /automation | ControlPlanePage | ProtectedRoute | — |
| /control-plane | — | — | /automation |
| /servers | ServersPage | ProtectedRoute | — |
| /servers/new | ServerNewPage | ProtectedRoute | — |
| /servers/:id/edit | ServerEditPage | ProtectedRoute | — |
| /servers/:id | ServerDetailPage | ProtectedRoute | — |
| /users | UsersPage | ProtectedRoute | — |
| /users/:id | UserDetailPage | ProtectedRoute | — |
| /billing | BillingPage | ProtectedRoute | — |
| /subscriptions | — | — | /billing?tab=subscriptions |
| /devices | DevicesPage | ProtectedRoute | — |
| /payments | — | — | /billing?tab=payments |
| /audit | AuditPage | ProtectedRoute | — |
| /settings | SettingsPage | ProtectedRoute | — |
| /integrations/outline | OutlineIntegrationsPage | ProtectedRoute | — |
| /outline | — | — | /integrations/outline |
| /settings/integrations/outline | — | — | /integrations/outline |
| /styleguide | StyleguidePage | ProtectedRoute | — |
| * | — | — | / |

### Query key inventory (every occurrence)

| Key pattern | File | Line | Used for |
|-------------|------|------|----------|
| OVERVIEW_KEY | Dashboard | 66,83–87 | overview stats |
| DASHBOARD_TIMESERIES_KEY | Dashboard | 73,84 | dashboard timeseries |
| CONNECTION_NODES_KEY | ConnectionNodesSection | 11; Dashboard | 85; ServerEdit | 50 |
| AUDIT_KEY | Dashboard | 86; RecentAuditTable | 9 | audit list |
| SERVERS_LIST_KEY | ServerEdit, ServerRowDrawer, Servers | many | server list |
| SERVERS_LIST_DASHBOARD_KEY | Dashboard | 87; TopIssuesTable | 7 | dashboard servers |
| SERVERS_LIST_FULL_KEY | useServerList | 62,151 | full 200 servers |
| DOCKER_TELEMETRY_KEY | useDockerTelemetry | 21,34,51,72,93 | docker hosts, containers, metrics, logs, alerts |
| DEVICES_KEY | Devices | 104,134,146 | devices list |
| USERS_KEY | Users | 84,106,125,126 | users list, devices |
| ["server", id] | ServerEdit, ServerDetail | 27,47,60,123 | single server |
| ["server-telemetry", id] | ServerDetail | 66,82,599 | server telemetry |
| ["server-peers", id] | ServerDetail | 72,81,94,137,156,598 | peers |
| ["peers", id] | ServerDetail | 105,138,157 | peers (alternate) |
| ["server-actions", id] | ServerDetail | 112,122 | actions |
| ["cluster", "health"] | ClusterAutomationSummary | 22 | cluster health |
| ["control-plane", "automation", "status"] | ClusterAutomationSummary | 29 | automation status |
| ["control-plane", "topology-summary"] | ControlPlane | 44 | topology |
| ["control-plane", "topology-graph"] | ControlPlane | 49 | graph |
| ["control-plane", "business"] | ControlPlane | 54 | business metrics |
| ["control-plane", "security"] | ControlPlane | 59 | security metrics |
| ["control-plane", "anomaly"] | ControlPlane | 65 | anomaly metrics |
| ["control-plane", "events"] | ControlPlane | 76 | events |
| ["subscriptions", offset, searchTrigger] | Subscriptions (dead), SubscriptionsTab | 21,19 | subscriptions |
| ["payments", offset, searchTrigger] | Payments (dead), PaymentsTab | 21,19 | payments |
| OUTLINE_STATUS_KEY | OutlineIntegrations | 58 | outline status |
| OUTLINE_KEYS_KEY | OutlineIntegrations | 64,90,105,118,130,131,144,166,179 | keys |
| OUTLINE_SERVER_KEY | OutlineIntegrations | 71,130,143,154 | server |
| OUTLINE_METICS_KEY | OutlineIntegrations | 78,132,145,167,180 | metrics |
| ["servers", serverId, "ips"] | ServerRowDrawer | 53 | server IPs |
| ["servers", serverId, "telemetry"] | ServerRowDrawer | 58 | server telemetry |
| ["audit", "server", serverId] | ServerRowDrawer | 63 | server audit |
| ["server-logs", serverId] | ServerLogsTab | 19 | logs |
| ["telemetry", "topology-summary"] | VpnNodesTab | 46 | topology |
| ["telemetry", "server", activeServerId] | VpnNodesTab | 67 | server telemetry |
| ["audit", offset, resourceType, ...] | Audit | 31 | audit list |
| ["webapp", "me"] | useSession, Devices | 7,18 | miniapp session |
| ["webapp", "plans"] | Plans | 19 | plans |
| ["webapp", "referral", "link"] | Referral | 9 | referral link |
| ["webapp", "referral", "stats"] | Referral | 14 | referral stats |
| ["user", id] | UserDetail | 17,26 | user detail |

Note: SERVERS_LIST_KEY vs ["servers", ...] — ServerRowDrawer uses ["servers", serverId, "ips"] (inconsistent prefix).

### API client internals

- create-client.ts L3–6: SAFE_METHODS, MAX_RETRIES 2, RETRY_STATUSES [502,503], DEFAULT_TIMEOUT_MS 15000
- L49–54: request() composes URL, headers, token, timeout, signal
- L91–98: 401 → onUnauthorized, then throw
- L96–99: retry on 502/503 for safe methods
- parseResponse: JSON parse, ApiError on !res.ok, isApiErrorBody check
- No getBlob or responseType; assumes JSON

### State and persistence

| Store | File | Keys / vars | Persistence |
|-------|------|-------------|-------------|
| authStore | authStore.ts | accessToken, refreshToken | sessionStorage vpn_admin_access, vpn_admin_refresh |
| Theme | index.html inline script | data-theme | localStorage vpn-suite-theme (light/dark/dim) |
| Dashboard settings | useDashboardSettings | widgets, timeRange | localStorage |
| Servers density | Servers.tsx L82 | vpn-suite-servers-density | localStorage |
| Saved views | savedViews.ts | — | localStorage |
| webapp token | miniapp/api/client.ts | token (module) | none |

---

## Phase 1 — Systems Audit (Expanded)

### A) UI system — component inventory

**Shared UI** (shared/src/ui/): Button, ButtonLink, Field, Input, Checkbox, Select, SearchInput, Card, Skeleton, EmptyState, ErrorState, InlineError, PageError, StatusIndicator, DeviceCard, ProfileCard, Modal, ConfirmModal, ConfirmDanger, Drawer, Table, VirtualTable, Pagination, TableCell, DataTable, TableSkeleton, TableSortHeader, Badge, Section, ToastContainer, useToast, VisuallyHidden, Stack, Box, Grid, FormStack, Inline, Divider, Spinner, ProgressBar, InlineAlert, CopyButton, CodeBlock, QrPanel, RelativeTime, Text, Heading, Label, HelperText, Stat, CodeText, Tabs, DropdownMenu, BulkActionsBar, LiveIndicator.

**Admin-only**: StatusBadge, TableSection, FilterBar, PageHeader, Toolbar, Breadcrumb, CommandPalette, ServersCommandPalette, TimeRangePicker, MetricTile, ChartFrame, EChart, ConfigContentModal, IssueConfigModal, ServerRow, ServerRowDrawer, ServerLogsTab, ThresholdLegend, ServersBulkToolbar, ServersEmptyState, MiniSparkline.

**Table usage**: Table (Devices, SubscriptionsTab, PaymentsTab, Audit, ServerDetail peers/actions, OutlineIntegrations, TopIssuesTable, RecentAuditTable); VirtualTable (Users, DockerOverviewTable); Servers uses custom useVirtualizer + ServerRow (VIRTUAL_THRESHOLD 200).

**Tab patterns**: shared Tabs.tsx exists; Telemetry.tsx and Billing.tsx use `.telemetry-tabs` (admin.css L1871) with manual aria-selected, onKeyDown (ArrowLeft/Right, Home/End).

**Design tokens**: tokens-map.ts (PRIMITIVES, SEMANTICS, COMPONENT_TOKENS); tokens.css; --z-toast 1400 in tokens; styles.css toast uses z-index 1100 (mismatch).

### B) Data layer — API call sites

- All admin API calls go through `api` from admin/api/client.ts
- All miniapp API calls go through `webappApi` from miniapp/api/client.ts
- Raw fetch: OutlineIntegrations L290–298 (QR blob), refresh-auth.ts (auth/refresh), logFrontendError (log/frontend-error), useServersStream L132 (SSE or fetch)
- useServersStream: custom fetch for stream; not using api client

**Invalidation patterns**: ServerDetail has 10+ invalidateQueries calls; OutlineIntegrations has 15+; ServerRowDrawer invalidates SERVERS_LIST_KEY on auto-sync.

### C) State — hooks with useEffect/useCallback/useMemo

36 files use one or more. Notable: useDashboardSettings (4), useServersStream (5), CommandPalette (5), AdminLayout (9), Servers (10), useDockerTelemetry (multiple), ControlPlane (5).

### D) Routing — dead code

- SubscriptionsPage, PaymentsPage: Exported but not in App.tsx routes; routes redirect to Billing. Files exist and are dead.

### E) Auth — token flow

1. Login: api.post /auth/login → setTokens(access, refresh) → navigate(from)
2. Request: getToken() → Authorization header
3. 401: onUnauthorized → refreshAuth(getBaseUrl(), refresh) → setTokens → window.location.reload()
4. Refresh fail: logout → window.location.href="/admin/login"
5. Logout: clearStored, set null, window.location.href="/admin/login"

Miniapp: webappApi.post /webapp/auth → setWebappToken → no persistence.

### F) Error handling — error boundary

- ErrorBoundary: getDerivedStateFromError, componentDidCatch → logFrontendError → render PageError with onRetry=window.location.reload
- logFrontendError: POST /log/frontend-error, fire-and-forget, includes route, componentStack, userAgent, buildHash

### G) Performance — virtualization

- Servers: useVirtualizer (L280); VIRTUAL_THRESHOLD 200; only virtualizes when visibleItems.length > 200; rowHeight 48/64
- VirtualTable: always virtualizes; used by Users, DockerOverviewTable
- Table: no virtualization; used for smaller lists

**Duplicate logic**: getCellClasses, getColumnStyle, renderCellContent duplicated between Table.tsx and VirtualTable.tsx (49–116 in Table, 49–86 in VirtualTable).

### H) Testing — coverage

- Unit: Table.test, TableCell.test, selectors.test (3 files)
- E2E: admin (api-smoke, smoke, nav-and-pages, negative-fallback, telemetry-docker), miniapp (checkout, device-issue)
- CI: frontend-e2e runs admin E2E only; no miniapp E2E in CI
- Lint: eslint src --ext .ts,.tsx
- Token check: scripts/check-tokens.sh (no raw hex)

---

## Phase 2 — Duplicates (Expanded)

### Format / numeric

- formatDate, formatDateLong, formatDateTime: shared/utils/format.ts only — no duplicates
- formatPct: format.ts L43; formatPercent01 L49; both in shared
- formatBytes: format.ts L129; used via shared
- Ad-hoc: DockerOverviewTable L74,83,85 uses item.cpu_pct.toFixed(1), formatBytes; ServerRow L76,78 uses Number(t.cpu_pct).toFixed(0); ControlPlane L30,242,251,324,606,615 uses .toFixed; selectors L26,34,42,43,50,58 uses toLocaleString. Consolidate: prefer formatPct/formatBytes for consistency.

### Status mapping

- serverHealthToStatusBadge (StatusBadge.tsx L58): running/ok→active, degraded→maintenance, error→error, else→pending
- serverStatusToVariant (statusMap.ts L9): running/ok→success, degraded→warning, error→danger, else→neutral
- serverVisualToBadgeStatus (ServerRow.tsx L19): maps visual status to StatusBadgeStatus
- Overlap: both map server health; StatusBadge uses dot+label UI; Badge uses variant color. Keep both; document in BADGE_AUDIT.

### Toast error pattern

Repeated 25+ times: `err instanceof ApiError ? err.message : "Generic message"`. Consolidate to getErrorMessage(err).

### Tab UI

- Telemetry: L64–93, buttons with telemetry-tabs, telemetry-tab, onKeyDown
- Billing: L60–101, same pattern
- Shared Tabs: Tabs.tsx has TabsItem[], controlled value, onChange. Could wrap telemetry-tabs in a reusable component.

### Table cell helpers

- getCellClasses, getColumnStyle, renderCellContent: identical in Table.tsx and VirtualTable.tsx. Extract to shared table/utils.ts.

---

## Phase 3 — Top 50 Risks (Expanded)

| # | Sev | Finding | File:Line | Impact |
|---|-----|---------|-----------|--------|
| 1 | P1 | Raw fetch for QR | OutlineIntegrations:292 | No 401, retry, timeout |
| 2 | P1 | Hardcoded /admin/login | authStore:55, api/client:11 | Deploy path break |
| 3 | P2 | Dead SubscriptionsPage, PaymentsPage | Subscriptions.tsx, Payments.tsx | Dead code |
| 4 | P2 | Miniapp token in memory | miniapp/api/client:3–9 | Lost on refresh |
| 5 | P2 | No response validation | All api.get | Type mismatch runtime |
| 6 | P2 | Single error boundary | App.tsx | Full app crash |
| 7 | P2 | Servers custom useVirtualizer vs VirtualTable | Servers:280 | Two patterns |
| 8 | P2 | Query key inconsistency | ["servers", serverId] vs SERVERS_LIST_KEY | Cache fragmentation |
| 9 | P2 | CLUSTER_HEALTH_KEY, AUTOMATION_STATUS_KEY local to ClusterAutomationSummary | ClusterAutomationSummary:17–18 | Not in query-keys.ts |
| 10 | P2 | ControlPlane keys ["control-plane", ...] inline | ControlPlane:44–76 | Not in query-keys.ts |
| 11 | P2 | useServersStream raw fetch | useServersStream:132 | Bypasses api client |
| 12 | P2 | Refresh on 401 reloads page | api/client:17 | Poor UX |
| 13 | P3 | telemetry-tabs duplicate | Telemetry, Billing | Divergence |
| 14 | P3 | StatusBadge vs statusMap | StatusBadge, statusMap | Overlap |
| 15 | P3 | z-index 1100 vs --z-toast 1400 | styles.css, tokens | Mismatch |
| 16 | P3 | No miniapp E2E in CI | ci.yml | Regressions |
| 17 | P3 | import.meta cast repeated | getBaseUrl, logFrontendError, Referral | Type helper |
| 18 | P3 | retry: 1 in QueryClient | admin/main:12 | Low retry |
| 19 | P3 | getCellClasses/getColumnStyle/renderCellContent duplicated | Table, VirtualTable | DRY |
| 20 | P3 | ServerRow toFixed vs formatPct | ServerRow:76,78 | Inconsistent |
| 21 | P3 | LogsViewer permission message hardcoded | LogsViewer:63 | "telemetry:logs:read" |
| 22 | P3 | Dashboard L111 formatDateTime with lastTs — points[].ts may be undefined | Dashboard:111 | Needs null check |
| 23 | P3 | ControlPlane L105,128 sort by created_at — optional chaining | ControlPlane:105,128 | (b?.created_at) ?? 0 |
| 24 | P3 | OutlineIntegrations L485 lastTrafficSeen * 1000 | OutlineIntegrations:485 | Unix seconds assumption |
| 25 | P3 | No useMemo on ServerRow in Servers | Servers | Re-render all rows |
| 26 | P3 | deviceCountsQuery skipDeviceCounts404 | Servers:233 | 404 skips device counts |
| 27 | P3 | DataTable class data-table-wrap vs .data-table-wrap | DataTable.tsx:30 | Verify CSS exists |
| 28 | P3 | chartConfig, theme in admin/charts | ChartFrame, EChart | Admin-coupled |
| 29 | P3 | useServerList canShareFullCache logic | useServerList:151 | Cache sharing edge cases |
| 30 | P3 | AuthGuard useEffect [attemptAuth] | AuthGuard:32 | attemptAuth changes when initData changes |
| 31 | P3 | RelativeTime setInterval 60_000 | RelativeTime:40 | 1min tick |
| 32 | P3 | Toast duration 5000 default | Toast:21 | Not configurable per call |
| 33 | P3 | CopyButton clipboard fallback | CopyButton | Copies fallback message on error |
| 34 | P3 | Pagination totalPages Math.max(1, ...) | Table:303 | Prevents 0 pages |
| 35 | P3 | Modal role=dialog | Modal:61 | Correct |
| 36 | P3 | Drawer role=dialog | Drawer:64 | Correct |
| 37 | P3 | CommandPalette role=listbox, option | CommandPalette:107,116 | Correct |
| 38 | P3 | DropdownMenu keyboard nav | DropdownMenu:73–79 | first menuitem focus |
| 39 | P3 | VpnNodesTab activeServerId in queryKey | VpnNodesTab:67 | Enables cache per server |
| 40 | P3 | bulkSyncProgress state in Servers | Servers:90 | Sync progress tracking |
| 41 | P3 | confirm_token in mutation payloads | ServerDetail, Servers | Security pattern |
| 42 | P3 | Login from state | Login:17 | location.state.from |
| 43 | P3 | ProtectedRoute Navigate replace | ProtectedRoute:10 | replace: true |
| 44 | P3 | Servers ServerRowDrawer selectedServerId | Servers:79 | Drawer state |
| 45 | P3 | IssueConfigModal issuedConfigId | IssueConfigModal | Modal state |
| 46 | P3 | Billing tab document.getElementById focus | Billing:25,41,46 | Keyboard nav |
| 47 | P3 | Telemetry tab same pattern | Telemetry:27,44,50 | Keyboard nav |
| 48 | P3 | E2E PLAYWRIGHT_BASE_URL 4174 | playwright.config:3 | Preview port |
| 49 | P3 | E2E PLAYWRIGHT_BASE_URL miniapp 5175 | miniapp playwright:3 | Dev port |
| 50 | P3 | scripts/release_api_happy_path.sh | ci.yml:273 | External script |

---

## Phase 4 — PR steps (Expanded)

### PR 1: Remove dead code

- Delete frontend/admin/src/pages/Subscriptions.tsx
- Delete frontend/admin/src/pages/Payments.tsx
- Grep for SubscriptionsPage, PaymentsPage — confirm no imports
- npm run build, npm run typecheck
- E2E: npm run test:e2e (admin)

### PR 2: Add getBlob to api client

- create-client.ts: Add `getBlob(path, init?)` that returns `Promise<Blob>`; same URL/auth/timeout; parseResponse → res.blob() for 200
- OutlineIntegrations: Replace fetch block L286–302 with `const blob = await api.getBlob(\`/outline/keys/${r.id}/qr\`); setQrBlobUrl(URL.createObjectURL(blob));`
- Test: Outline page, click QR button

### PR 3: getErrorMessage util

- shared/src/utils/error.ts: `export function getErrorMessage(err: unknown, fallback = "An error occurred"): string { return err instanceof ApiError ? err.message : err instanceof Error ? err.message : fallback; }`
- shared index: export getErrorMessage
- Replace 25+ `err instanceof ApiError ? err.message : "…"` with `getErrorMessage(err, "…")`
- Files: ServerNew, ServerEdit, ServerDetail, Devices, Servers, Users, UserDetail, ControlPlane, OutlineIntegrations, ConfigContentModal, IssueConfigModal, ServerRowDrawer, CopyButton, miniapp Devices

### PR 4: Centralize basename

- admin/src/config.ts: `export const ADMIN_BASE = import.meta.env?.VITE_ADMIN_BASE ?? "/admin";`
- authStore: `window.location.href = \`${ADMIN_BASE}/login\`;`
- api/client: same
- .env.example: VITE_ADMIN_BASE=/admin

### PR 5: Extract table cell helpers

- shared/src/ui/table/cellUtils.ts: getCellClasses, getColumnStyle, renderCellContent
- Table.tsx, VirtualTable.tsx: import from cellUtils

### PR 6: Consolidate query keys

- query-keys.ts: Add SERVER_KEY(id), SERVER_TELEMETRY_KEY(id), SERVER_PEERS_KEY(id), PEERS_KEY(id), SERVER_ACTIONS_KEY(id), CLUSTER_HEALTH_KEY, AUTOMATION_STATUS_KEY, CONTROL_PLANE_* keys
- Update ServerDetail, ClusterAutomationSummary, ControlPlane, ServerRowDrawer, VpnNodesTab, Audit

### PR 7: Use shared Tabs for Billing/Telemetry

- Create BillingTabs, TelemetryTabs using shared Tabs or extract TabPanel
- Replace manual buttons + aria with Tabs

### PR 8: Granular error boundaries

- Wrap ServersPage, UsersPage, ControlPlanePage, ServerDetailPage in ErrorBoundary
- Or create RouteErrorBoundary wrapper

### PR 9–12: (Optional) Bundle gate, Servers→VirtualTable, zod spike, STATUS_MAPPING doc

---

## Phase 5 — Quick wins (Expanded)

1. Delete Subscriptions.tsx, Payments.tsx
2. Add getErrorMessage, replace 25+ occurrences
3. Add api.getBlob, fix OutlineIntegrations QR
4. Add admin/src/config.ts with ADMIN_BASE
5. Extract table cell helpers to cellUtils
6. Audit numeric columns: add `numeric: true` where missing (Audit created_at, Devices created_at, Users created_at, Payments amount, etc.)

**Verification**: `npm run build && npm run typecheck && npm run lint && npm test`; manual Outline QR, login/logout.
