# Frontend Security Audit

## Checks

| Check | Status | Notes |
|-------|--------|-------|
| innerHTML/dangerouslySetInnerHTML | ✓ None | No XSS vector |
| Secrets in FE code | ✓ None | Gitleaks runs on repo |
| Token storage | ✓ sessionStorage | access/refresh in sessionStorage |
| npm audit | CI | npm audit --audit-level=high in frontend-checks |
| CSP compatibility | N/A | No obvious violations; FE uses standard patterns |

## Token Strategy

- **Auth**: sessionStorage (vpn_admin_access, vpn_admin_refresh)
- **Prefs**: localStorage (theme, sidebar, region, density, saved views)
- Tokens not in localStorage; session scoped

## Error Discipline

- No stack traces to client
- ApiError structure: code, message, statusCode
- User-visible errors: actionable messages only (getErrorMessage, getTelemetryErrorMessage)

## Dependencies

- npm audit run in CI; 15 vulnerabilities (1 moderate, 14 high) reported post-install
- `npm audit fix` blocked by peer dep conflict (Storybook/react); use `--legacy-peer-deps` or upgrade Storybook/React when safe
