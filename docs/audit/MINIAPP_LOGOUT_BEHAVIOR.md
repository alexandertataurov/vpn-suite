## Miniapp Logout / Session Behavior

- The miniapp **does not expose a user-facing logout or “sign out” control**.
- Webapp sessions are:
  - established via `POST /webapp/auth` with Telegram init-data
  - refreshed via token refresh logic in the client
  - treated as invalid on 401/`UNAUTHORIZED`, which sends the user back through bootstrap.
- Bootstrap explicitly handles:
  - missing or invalid init-data (startup error with guidance to reopen from bot)
  - expired sessions (`UNAUTHORIZED` on `/webapp/me`) with a retry path and clear messaging.

### Invariants

- No “fake authenticated” state:
  - when the token expires or `/webapp/me` fails with 401, the app shows a startup/session error and requires retry/reopen.
- Sensitive actions (plans, devices, settings) all depend on a valid `WebAppMeResponse` and `useWebappToken`.

### Rationale

- Telegram Mini Apps rely on Telegram as the identity provider; the primary way to “log out” is to close the miniapp or revoke access at the bot level.
- A local logout button would only clear the webapp token and force re-auth with the same Telegram identity on next open, providing little real security benefit while increasing UX complexity.

