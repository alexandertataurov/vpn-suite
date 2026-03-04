# Performance Audit — Lighthouse & React Profiler

## Bundle (current)

From `npm run build`:

| Chunk | Size (gzip) | Notes |
|-------|-------------|--------|
| vendor | 204 kB (65.6 kB) | React, Query, Router, Zustand — already code-split from app |
| index | 15.2 kB (5.4 kB) | Router, Shell, core |
| OverviewPage | 3.5 kB (1.4 kB) | Largest feature chunk (health-snapshot + toolbar + modal) |
| LoginPage | 1.8 kB (0.9 kB) | |
| BillingPage | 0.9 kB | Tabs + useSearchParams |
| Route chunks | 0.2–0.5 kB each | Lazy-loaded |
| CSS | 13.5 kB (3.2 kB) | Tokens + primitives + admin |

**Vendor:** Keep under ~250 kB raw; add `manualChunks` for ECharts/Recharts when used so chart pages don’t pull all vendor.

---

## Lighthouse

**How to run:** From repo root (or `frontend/admin`):

1. `cd frontend/admin && npm run build && npm run preview` (leave running).
2. In another terminal: `cd frontend/admin && npm run perf:lighthouse`.
3. Open `docs/frontend/lighthouse-report.html`.

**Typical targets:** Performance ≥ 90, Accessibility ≥ 90. Focus on:

- **LCP:** Minimal render-blocking; lazy routes and one main CSS bundle.
- **CLS:** Reserve space for nav/shell (fixed layout); skeletons for content.
- **TBT:** Keep main thread light; avoid large sync work in root (we don’t).
- **A11y:** Form labels (login), focus order, contrast (tokens), button/link semantics.

**If scores are low:**

- Performance: Ensure preview is production build; run against deployed URL if possible.
- Accessibility: Fix reported issues (labels, roles, contrast); re-run.

---

## React Profiler — findings and fixes

### 1. TelemetryProvider context value (done)

**Issue:** New object every render → all `useTelemetry()` consumers re-render on any parent update.

**Fix:** Memoize context value with `useMemo` depending on `cluster` and `connectionState`. Implemented in `core/telemetry/provider.tsx`.

### 2. NavRail on route change (done)

**Issue:** Each `NavLink` re-renders when `location` changes because `className` is a function; the whole list re-renders.

**Fix:** Use `useLocation()` in `NavRail`, compute `isActive` per item, and render a memoized `NavRailItem` with `Link` + `isActive` prop. Only items whose `isActive` changes re-render. Implemented in `layout/NavRail.tsx`.

### 3. OverviewPage — Settings button (recommended)

**Issue:** `onClick={() => setSettingsOpen(true)}` creates a new function each render; child `Button` may re-render.

**Fix:** `const openSettings = useCallback(() => setSettingsOpen(true), []);` and pass `openSettings` to the Settings button. Same for modal `onClose` if needed.

### 4. Shell / MissionBar

**Observation:** Shell and MissionBar are thin; no heavy state. `ShellActions` (logout) uses `useAuthStore`; Zustand selectors prevent full-app re-renders. No change required unless Profiler shows Shell re-rendering too often.

### 5. List and table pages (when implemented)

- **Servers / Users / Devices / Audit:** Use `VirtualTable` for 100+ rows; avoid rendering full lists.
- **Row components:** Wrap each row in `memo()` and pass only the row data + handlers; keep callbacks stable with `useCallback` at the parent that owns the handler.
- **Query selectors:** When using TanStack Query, prefer `select` in `useQuery` so only the selected slice triggers re-renders when it changes.

---

## Concrete optimizations applied

| Area | Change |
|------|--------|
| TelemetryProvider | `useMemo` for context value; stable fallback for `useTelemetry()` when outside provider. |
| NavRail | `NavRailItem` memoized; `useLocation()` + computed `isActive`; `Link` instead of `NavLink` for stable props. |

---

## Checklist (ongoing)

- [ ] Run Lighthouse on `/admin/` (and `/admin/servers` when implemented); capture scores in this doc or `lighthouse-report.html`.
- [ ] In React DevTools Profiler: record “Navigate overview → servers → back”; confirm only active nav item and route content re-render.
- [ ] When adding data tables: use `VirtualTable`; memoize row components; stable `useCallback` for actions.
- [ ] When adding ECharts/Recharts: add `manualChunks` in Vite so chart libs load only on chart routes.
