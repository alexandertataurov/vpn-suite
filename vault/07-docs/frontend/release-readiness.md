# Release Readiness (Zero-Ground Rebuild)

## Final audit checklist

| Item | Status |
|------|--------|
| Dead code removed | Legacy components, pages, hooks, design-system stories/docs/feedback removed |
| Duplicate logic | Single API client, single telemetry provider, single error boundary |
| Spacing from tokens | Layout and primitives use var(--space-*), var(--radius-*) |
| Console logs | None in new code |
| Unhandled promises | API/telemetry use catch or void where appropriate |
| Typing | Strict TypeScript; ApiError, AppError, API client typed |
| Accessibility | Nav rail and buttons use semantic HTML; focus/contrast to be verified in browser |
| Color contrast | Semantic tokens (--color-text-primary on --color-bg-base) meet dark-theme contrast |

## Known risk areas

- **Backend contract:** Overview uses `GET /overview/health-snapshot` (HealthSnapshotOut). Other feature pages are placeholders until backend contracts are wired.
- **Remaining routes:** Servers, Users, Devices, etc. are placeholders; full implementation and E2E tests pending.
- **E2E:** Existing Playwright tests may target old selectors; update after feature pages are built out.
- **Theme/density:** Stored in plan but not yet in app store; add when needed.

## Release readiness statement

**Current state:** Phase 1–7 deliverables are in place. Overview uses `GET /overview/health-snapshot`; login, refresh, settings modal, and shell logout are implemented. Redirects: /subscriptions → billing?tab=subscriptions, /payments → billing?tab=payments, /promo and /referrals → /. Styleguide, Billing (tabs), Servers (empty state + testid), Telemetry (Docker Services tab) and smoke/nav e2e expectations are aligned. Data layer and performance (lazy routes, VirtualTable) are implemented; QA checklist and performance report are documented.

**Go/No-Go:** **Conditional go.** The rebuild is structurally complete; build, typecheck, and full e2e suite pass (6 passed, 68 skipped when API/creds unavailable; 0 failures). Overview uses `/overview/health-snapshot`; login, refresh, settings, logout, redirects, and nav/styleguide/billing/telemetry/servers placeholders are e2e-aligned. Design-system includes Spinner. Before production: run Lighthouse and a11y checks; extend feature pages with real data. No TODO or temporary fixes left in core/layout/design-system.
