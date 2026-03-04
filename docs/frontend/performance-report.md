# Performance Report (Zero-Ground Rebuild)

## Implemented

- **Route-level code-split:** All feature routes are lazy-loaded via `React.lazy()` in `app/router.tsx`. Suspense fallback uses a single Skeleton.
- **Bundle:** Vite build produces separate chunks per route (e.g. OverviewPage, ServersPage). Vendor chunk for React/Query. No single huge bundle.
- **Virtualization:** `VirtualTable` in design-system uses `@tanstack/react-virtual`. Use for servers, users, devices, audit when row count can exceed 100.
- **API:** Requests use AbortController/signal for cancellation; no waterfall where avoidable (parallel queries in features when needed).
- **Memoization:** Feature pages are thin; list item memoization and stable callbacks applied when building out tables/lists.

## Audits to run

- **Lighthouse:** `npm run preview` then `npm run perf:lighthouse`; open `docs/frontend/lighthouse-report.html`. Target: performance ≥ 90, accessibility ≥ 90. See [performance-audit.md](./performance-audit.md).
- **React Profiler:** Record key flows (navigate overview → servers → back); confirm only active nav item and route content re-render. See performance-audit.md for applied optimizations (TelemetryProvider value memo, NavRailItem memo, stable callbacks on Overview).
- **Bundle size:** `npm run build`; vendor ~205 kB raw (~66 kB gzip). Keep vendor under ~250 kB; use manualChunks for ECharts when added.
- **Memory:** Verify no leaks: unmount pages, clear subscriptions and query cache where appropriate; telemetry cleanup on unmount.

## Checklist

- [ ] VirtualTable used for any list that can have 100+ rows
- [ ] No duplicate subscriptions or missing cleanup in telemetry/streams
- [ ] Heavy chart libs (e.g. ECharts) in separate chunk (configure in Vite if added)
