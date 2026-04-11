# QA Checklist (Zero-Ground Rebuild)

## UX stress scenarios

| Scenario | Expected behavior | Status |
|----------|--------------------|--------|
| Slow API (3–5s) | Loading state (Skeleton/Spinner); no blank screen or unhandled rejection | Implement loading in features via Query states |
| 500 errors | Error state + Retry; no crash | ErrorBoundary + ErrorState + retry in queries |
| Empty data | EmptyState component; no "undefined" or broken layout | Use EmptyState in lists/tables |
| Partial data | Degraded or partial render; no crash | Handle partial in selectors; show PartialDataBanner if needed |
| Network loss | Offline message or banner; retry when back | Query retry + optional offline detector |
| 401 Unauthorized | Redirect to /login; no silent failure | API client onUnauthorized → logout → redirect |
| Expired token | Refresh or redirect; consistent behavior | Same as 401; refresh can be added in client |
| Large dataset (10k+ rows) | VirtualTable; no full DOM blow-up | Use VirtualTable for servers, users, devices, audit |

## Implementation notes

- All data-fetching features should use `useApiQuery` or `useQuery` with `useApi()` and render loading (Skeleton), error (ErrorState + onRetry), and empty (EmptyState) states.
- ErrorBoundary catches render errors; mapApiErrorToAppError for API errors in UI.
