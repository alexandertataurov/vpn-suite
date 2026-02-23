# Frontend Test Matrix

Routes × flows × states. Coverage rule: every route needs ≥1 smoke and ≥1 error-state test.

## Admin Routes

| Page/Route | User story | Preconditions | Steps | Expected | Data needed | Automation | Priority |
|------------|------------|---------------|-------|----------|-------------|------------|----------|
| /login | Admin logs in | Unauthenticated | Enter creds, submit | Redirect to / | Admin creds | e2e (auth-dashboard) | P0 |
| / (Dashboard) | View operator dashboard | Authenticated | Navigate to / | Dashboard loads | API data | e2e (release-smoke, nav-and-pages) | P0 |
| /telemetry | View telemetry | Authenticated | Navigate, select tab | Telemetry loads | Hosts, containers | e2e (telemetry-docker) | P1 |
| /automation | View control plane | Authenticated | Navigate | Topology loads | Topology API | e2e (nav-and-pages) | P1 |
| /servers | List servers | Authenticated | Navigate, filter, sort | Table loads | Servers list | e2e (servers-users) | P0 |
| /servers/:id | Server detail | Authenticated | Click server | Detail loads | Server, peers, telemetry | e2e (release-smoke) | P0 |
| /servers/new | Create server | Authenticated | Fill form, submit | Server created | — | e2e (servers-users) | P1 |
| /servers/:id/edit | Edit server | Authenticated | Edit, submit | Server updated | Server | e2e | P1 |
| /users | List users | Authenticated | Navigate | Users table | Users API | e2e (servers-users) | P0 |
| /users/:id | User detail | Authenticated | Click user | Detail loads | User API | e2e | P1 |
| /billing | Billing tabs | Authenticated | Navigate, switch tabs | Subscriptions/payments | Billing API | e2e | P1 |
| /devices | Devices list | Authenticated | Navigate | Devices table | Devices API | e2e (devices) | P1 |
| /audit | Audit log | Authenticated | Navigate | Audit table | Audit API | e2e | P2 |
| /settings | Settings | Authenticated | Navigate | Settings form | — | e2e (nav-and-pages) | P2 |
| /integrations/outline | Outline | Authenticated | Navigate | Outline UI | Outline API | e2e | P2 |
| /styleguide | Styleguide | Authenticated | Navigate | Components | — | e2e | P2 |

## Miniapp Routes

| Page/Route | User story | Preconditions | Steps | Expected | Data needed | Automation | Priority |
|------------|------------|---------------|-------|----------|-------------|------------|----------|
| / | Home | Session | Navigate | Home loads | /me | e2e | P1 |
| /plans | Plans | Session | Navigate | Plans list | Plans API | e2e | P1 |
| /checkout/:planId | Checkout | Session | Select plan, pay | Invoice/redirect | Plans, invoice API | e2e (checkout) | P0 |
| /devices | Devices | Session | Navigate | Devices list | /me devices | e2e (device-issue) | P1 |
| /profile | Profile | Session | Navigate | Profile | /me | e2e | P2 |
| /help | Help | Session | Navigate | Help content | — | e2e | P2 |
| /referral | Referral | Session | Navigate | Referral link | Referral API | e2e | P2 |

## States per Flow

| State | Component | Verification |
|-------|-----------|--------------|
| loading | Skeleton / Spinner | Unit or E2E |
| error | ErrorState / PageError | Error boundary + retry |
| empty | EmptyState | Empty list/table |
| success | Data UI | Smoke E2E |

## E2E Specs (Admin)

| Spec | Coverage |
|------|----------|
| release-smoke | Login → servers → server detail → users → logout |
| auth-dashboard | Login via UI, dashboard |
| nav-and-pages | Protected pages, nav |
| servers-users | Servers CRUD, users |
| devices | Devices list |
| telemetry-docker | Telemetry tab, Docker hosts |
| api-smoke | GET /health |
| negative-fallback | Error/fallback |
| smoke | App loads, login reachable |

## E2E Specs (Miniapp)

| Spec | Coverage |
|------|----------|
| checkout | Plans → checkout flow |
| device-issue | Device issue flow |

## Gaps

- Miniapp: /profile, /help, /referral, / (home) lack dedicated E2E
- Admin: /audit, /settings, /integrations/outline, /styleguide lack dedicated smoke
- Error-state tests: shared harness via negative-fallback; add per-route error tests for P0 routes
