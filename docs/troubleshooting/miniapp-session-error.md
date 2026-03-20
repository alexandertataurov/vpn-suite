# Miniapp: "Session error — Session could not be started. Please try again."

## Where it comes from

- **UI:** `BootstrapController` shows `BootErrorScreen` when bootstrap phase is `startup_error` (`frontend/miniapp/src/bootstrap/BootstrapController.tsx`, `useBootstrapMachine.ts`).
- **Trigger:** The message **"Session error"** + **"Session could not be started. Please try again."** is set when **POST `/api/v1/webapp/auth`** fails (non-timeout) in the `telegram_ready` → `authenticating` step.

So the failure is in **webapp auth** (exchanging Telegram `init_data` for a session token).

## Backend: when `/webapp/auth` fails

| Cause | HTTP | Backend detail |
|-------|------|----------------|
| Bot token not set | **503** | `TELEGRAM_BOT_TOKEN` empty → "WebApp auth not configured" |
| Invalid/expired initData | **401** | `validate_telegram_init_data()` fails → "Invalid or expired initData" |
| User id missing in initData | **401** | "User id missing" |

`validate_telegram_init_data()` in `backend/app/core/security.py` returns `None` when:

- `init_data` or `bot_token` is empty
- No `hash` in query string
- HMAC check fails (wrong bot token, tampered/expired initData, or wrong algorithm)
- JSON parse of `user` fails
- Any exception during parsing

## Frontend: what triggers the message

- In `useBootstrapMachine.ts`, `authenticateWebApp(initData)` is called when there is no stored token.
- On **rejection** (any thrown error from the API client):
  - If **timeout:** title "Session error", message "Request timed out. Try again."
  - Else: title **"Session error"**, message **"Session could not be started. Please try again."**

So **any** non-timeout failure of POST `/webapp/auth` (503, 401, network, CORS, wrong URL, etc.) shows that same message.

## Checklist to debug

1. **Backend config**
   - Ensure `TELEGRAM_BOT_TOKEN` is set in the environment used by the API (e.g. `.env` or compose).  
   - Config field is `telegram_bot_token` in `backend/app/core/config.py` (env: `TELEGRAM_BOT_TOKEN`).

2. **API reachability**
   - Miniapp resolves the API root via `getApiBaseUrl()` in `frontend/miniapp/src/config/env.ts` (`VITE_API_BASE_URL` if set, else `${window.location.origin}/api/v1`). `getBaseUrl()` in the API client layer is the same value.
   - If the miniapp is served from a different origin than the API, build with `VITE_API_BASE_URL` including **`/api/v1`** (e.g. `https://vpn.example.com/api/v1`).
   - Check browser DevTools → Network: does POST to `/api/v1/webapp/auth` hit the right host? Status code? Response body?

3. **CORS**
   - Backend must allow the miniapp origin in `CORS_ALLOW_ORIGINS`. If the request is blocked by CORS, the client sees a network error → same "Session could not be started" message.

4. **initData**
   - Only Telegram provides valid `init_data` when opening the Web App from the bot. Opening the miniapp URL in a normal browser (or with wrong bot) yields invalid/missing initData → 401 → same message.
   - Ensure the app is opened from the correct Telegram bot (e.g. menu / link that opens the Web App).

5. **Backend logs**
   - 503: check that `telegram_bot_token` is loaded (no 503 when token is set).
   - 401: check for "Invalid or expired initData" or "User id missing"; then confirm bot token matches the bot that opened the app and initData is from Telegram.

## Quick verification

- **503:** `curl -X POST https://<API>/api/v1/webapp/auth -H "Content-Type: application/json" -d '{"init_data":"test"}'` → 503 and "WebApp auth not configured" when `TELEGRAM_BOT_TOKEN` is unset.
- **401:** Same request with token set returns 401 and "Invalid or expired initData" for fake `init_data`.
- In browser: open miniapp from Telegram bot, DevTools → Network → find `webapp/auth` request and inspect status and response body.
