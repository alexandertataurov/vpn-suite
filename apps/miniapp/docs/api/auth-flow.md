# Auth Flow — Bootstrap, Refresh, Reconnect, 401

## Overview

The miniapp uses Telegram `init_data` for authentication. The backend exchanges `init_data` for a session token. Token is stored in memory only (never localStorage).

## Flow

```
init_data (Telegram) → POST /webapp/auth → session_token + expires_in
                                              ↓
                                    setWebappToken(token, expires_in)
                                              ↓
                                    Bearer token on all API calls
```

## Bootstrap

1. **useBootstrapMachine** (boot_init → telegram_ready → authenticating)
2. Calls **authenticateWebApp(initData)** (bootstrap/authBootstrap.ts)
3. **postAuth(initData)** → POST /webapp/auth (no Bearer) → `{ session_token, expires_in }`
4. **setWebappToken(token, expires_in)** — stores in memory, notifies useWebappToken subscribers
5. Session query runs; onboarding or app_ready

**Deduplication:** `authenticateWebApp` uses a module-level promise to avoid duplicate in-flight auth requests.

## Refresh

1. **useWebappTokenRefresh** runs when token and initData exist
2. Schedules refresh before expiry (e.g. 60s before, or on 30s poll)
3. **postAuth(initData)** → same endpoint, no Bearer (works near expiry when token may be stale)
4. On success: **setWebappToken(newToken, expires_in)** and reschedule
5. On failure: reschedule anyway (no user feedback; next API call will 401)

## Reconnect (Session Missing UI)

1. **SessionMissing** shows when user has no token or session failed
2. User taps Reconnect → **postAuth(initData)** → setWebappToken, invalidate me query
3. **.catch** → addToast with err.message (ApiError) or "Could not reconnect"

## 401 Handling

1. Any API call returns 401 → **onUnauthorized** fires (api/client.ts)
2. **setWebappToken(null)** → clears token, notifies subscribers
3. **window.dispatchEvent("webapp:unauthorized")**
4. **main.tsx** listener → `queryClient.invalidateQueries({ queryKey: webappQueryKeys.all })`
5. UI re-renders; pages that depend on token show SessionMissing

**Result:** Token clear + query invalidation drive UI. Event is for cross-cutting cleanup (e.g. analytics).

## Key Files

| File | Role |
|------|------|
| api/client.ts | token store, webappApi, onUnauthorized |
| api/endpoints/auth.ts | postAuth(initData) |
| bootstrap/authBootstrap.ts | authenticateWebApp (deduplicated) |
| hooks/useWebappTokenRefresh.ts | proactive refresh |
| components/SessionMissing.tsx | reconnect UI |
| main.tsx | webapp:unauthorized listener |
