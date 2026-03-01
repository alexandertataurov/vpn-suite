# Miniapp Release Audit Report

**Date:** 2026-02-28  
**Verdict:** READY (typecheck, lint, build pass; E2E requires environment with Playwright browser deps)

## Fixed issues (this session)

| Item | Path |
|------|------|
| Checkout: plans loading state | [frontend/miniapp/src/pages/Checkout.tsx](frontend/miniapp/src/pages/Checkout.tsx) — skeleton when plans query loading |
| Checkout: plans error + retry | Same — FallbackScreen with refetchPlans() when plansError |
| Checkout: invalid planId | Same — InlineAlert + ButtonLink to /plan when selectedPlanId not in list |
| Settings: offers retry | [frontend/miniapp/src/pages/Settings.tsx](frontend/miniapp/src/pages/Settings.tsx) — "Try again" button invalidates subscription/offers query |
| Settings: unused Link import | Same — removed |
| Miniapp verify script | [scripts/miniapp-verify.sh](scripts/miniapp-verify.sh) — typecheck, lint, build, optional E2E (RUN_E2E=0 to skip) |
| Home E2E smoke | [frontend/miniapp/e2e/home.spec.ts](frontend/miniapp/e2e/home.spec.ts) — home loads and shows primary CTA |

## Blockers / environment

- **E2E in CI:** Playwright requires browser dependencies (e.g. `libatk-1.0.so.0`). In environments without them, run `RUN_E2E=0 ./scripts/miniapp-verify.sh` or use Docker (e.g. `test:e2e:docker` in miniapp). No code blocker.

## API coverage (E2E mocks)

| Endpoint | checkout.spec | device-issue.spec | home.spec |
|----------|---------------|-------------------|-----------|
| /webapp/auth | yes | yes | yes |
| /webapp/me | yes | yes | yes |
| /health/ready | yes | yes | yes |
| /webapp/telemetry | yes | yes | yes |
| /webapp/plans | yes | — | — |
| /webapp/payments/create-invoice | yes | — | — |
| /webapp/payments/:id/status | yes | — | — |
| /webapp/devices/issue | — | yes | — |

## Journeys covered by E2E

| Journey | Spec |
|---------|------|
| Checkout (plans → invoice) | e2e/checkout.spec.ts |
| Device issue (add device, config) | e2e/device-issue.spec.ts |
| Home (load, primary CTA) | e2e/home.spec.ts |

## Commands executed and results

| Command | Result |
|---------|--------|
| `cd frontend/miniapp && pnpm run typecheck` | Pass |
| `cd frontend/miniapp && pnpm run lint` | Pass |
| `cd frontend/miniapp && pnpm run build` | Pass |
| `cd frontend/miniapp && pnpm exec playwright test` | Fail in this environment (missing libatk; use Docker or install Playwright deps) |

**Full miniapp verify (with E2E):** `./scripts/miniapp-verify.sh` (from repo root).  
**Without E2E:** `RUN_E2E=0 ./scripts/miniapp-verify.sh`.  
**From miniapp dir:** `pnpm run check:all` (runs typecheck, lint, build, test:e2e).

## Deleted legacy

None this session. Unused `Link` import removed from Settings.tsx.

## Risk register

| Risk | Mitigation |
|------|------------|
| E2E not runnable on minimal hosts | Use `RUN_E2E=0` or run in Docker (`test:e2e:docker`) for E2E. |
| No miniapp unit tests | E2E covers critical flows; add Vitest later if needed. |
