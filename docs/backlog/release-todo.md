# Frontend Release TODO

## Done (Phase 1)

- FE-001: package-lock sync
- FE-002–FE-018: Typecheck errors
- FE-010: Storybook Loading/Error/Empty variants
- PR1 (Gates): Lint, typecheck, tests, build, storybook, token check

## Active Items

### Release Blockers

| ID | Title | Source |
|----|-------|--------|
| FE-20 | npm audit: 15 vulns (blocked by Storybook/react peer dep) | fe-security-audit |
| FE-21 | Add miniapp E2E to CI | frontend-audit-expanded |

### Cleanup (Dead Code)

| ID | Title | Files | Source |
|----|-------|-------|--------|
| FE-22 | Remove SubscriptionsPage, PaymentsPage | Subscriptions.tsx, Payments.tsx | frontend-audit-expanded |

### Consistency

| ID | Title |
|----|-------|
| FE-23 | Centralize getErrorMessage (25+ call sites) |
| FE-24 | Centralize basename (VITE_ADMIN_BASE) |

## PR Plan

1. **PR2 (Tests)**: Miniapp E2E in CI; smoke for audit/settings
2. **PR3 (Cleanup)**: Delete Subscriptions.tsx, Payments.tsx
3. **PR4 (Polish)**: getErrorMessage, basename

## Acceptance

- All release gates green; E2E pass (requires backend)
