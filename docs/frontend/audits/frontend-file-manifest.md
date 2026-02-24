# Frontend File Manifest

100% coverage audit of frontend files. Methodology: iterate all `.ts`, `.tsx`, `.css`, `.html` under `frontend/`; categorize; assess risk; document usage.

## Columns

- **Path**: Relative to `frontend/` (or repo root for scripts)
- **Category**: core | feature | component | hook | util | api | style | asset | test | story | config | legacy | dead
- **Runtime critical?**: yes if on critical path (main, App, layout, api client, auth)
- **Used by**: Import/route/entrypoint reference (at least one)
- **Risk**: low | med | high
- **Issues found**: Count of TODO/FIXME/any/ts-ignore (0 unless noted)
- **Action**: keep | refactor | fix | delete | quarantine
- **Test coverage**: unit | integration | e2e | none

## Manifest

| Path | Category | Runtime critical? | Used by | Risk | Issues | Action | Test coverage |
|------|----------|-------------------|---------|------|--------|--------|---------------|
| admin/index.html | core | yes | Vite entry | low | 0 | keep | none |
| admin/main.tsx | core | yes | index.html | high | 0 | keep | none |
| admin/App.tsx | core | yes | main.tsx | high | 0 | keep | none |
| admin/src/api/client.ts | api | yes | pages, hooks | high | 0 | keep | none |
| admin/src/store/authStore.ts | core | yes | client.ts, Login, ProtectedRoute | high | 0 | keep | none |
| admin/src/layouts/AdminLayout.tsx | component | yes | App.tsx | high | 0 | keep | none |
| admin/src/components/ProtectedRoute.tsx | component | yes | App.tsx | high | 0 | keep | none |
| admin/src/components/ErrorBoundary.tsx | component | yes | App.tsx | high | 0 | keep | none |
| miniapp/main.tsx | core | yes | index.html | high | 0 | keep | none |
| miniapp/App.tsx | core | yes | main.tsx | high | 0 | keep | none |
| miniapp/src/components/AuthGuard.tsx | component | yes | App.tsx | high | 0 | keep | none |
| miniapp/src/api/client.ts | api | yes | hooks, Checkout | high | 0 | keep | none |
| shared/src/api-client/create-client.ts | api | yes | admin/client, miniapp/client | high | 0 | keep | none |
| shared/src/api-client/refresh-auth.ts | api | yes | admin/client | high | 0 | keep | none |
| shared/src/theme/ThemeProvider.tsx | component | yes | main.tsx (both apps) | high | 0 | keep | none |

*Full manifest: see [frontend/FILE_INVENTORY.md](../../../frontend/FILE_INVENTORY.md) (~331 files).*

## Summary

- **~331 source files** (admin, miniapp, shared)
- **Runtime critical**: main.tsx, App.tsx, layouts, api/client, authStore, AuthGuard, ProtectedRoute, ErrorBoundary, ThemeProvider
- **High risk**: auth, API clients, layouts, Login, Checkout
- **Test coverage**: unit (5 admin + 1 shared Table), e2e (11 admin + 2 miniapp specs), none (most runtime)
- **Suspicious patterns**: None (no TODO, FIXME, @ts-ignore, or `as any` in code)
- **Dead code**: None identified; all files have import/route references
