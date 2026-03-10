## Telegram Mini App — Beta Telemetry & Error Surfaces

Version: `v0.1-beta-launch`

This document maps **required beta telemetry events** and **error surface rules**
for the Telegram mini app, based on `TELEMETRY_SPEC.md` and `webappTelemetry.ts`.

---

### 1. Event taxonomy alignment (beta funnel)

Required events and their expected triggers:

| Event name                | Trigger location                               | Notes / payload fields (at minimum)                     |
| ------------------------- | ---------------------------------------------- | ------------------------------------------------------- |
| `onboarding_started`      | When `/onboarding` first renders for a session | `screen_name="onboarding"`, `is_returning`             |
| `onboarding_completed`    | When user leaves onboarding via primary CTA    | `screen_name`, `completion_path` (plan vs devices)      |
| `plan_selected`           | When user selects a plan card                  | `screen_name="plan"`, `plan_id`, `billing_period`       |
| `checkout_started`        | When checkout screen mounts with a valid plan  | `screen_name="checkout"`, `plan_id`, `price_amount`     |
| `checkout_failed`         | When payment/create-invoice fails              | `screen_name`, `plan_id`, `error_code`, `reason`        |
| `checkout_completed`      | When payment is confirmed as successful        | `screen_name`, `plan_id`, `payment_provider`, `amount`  |
| `setup_viewed`            | When `/connect-status` loads                   | `screen_name="connect-status"`, `has_devices`, `setup_status` |
| `config_copied`           | When user taps `Copy config` anywhere          | `screen_name`, `device_id` or `config_type`            |
| `vpn_app_open_attempted`  | When user taps `Open VPN app`                  | `screen_name`, `entry_point`                            |
| `device_added`            | When device issue succeeds                     | `screen_name="devices"`, `device_id`, `plan_id`         |
| `device_revoked`          | When a device revoke/replace succeeds          | `screen_name="devices"`, `device_id`, `action`          |
| `restore_started`         | When user taps `Restore access`                | `screen_name="restore-access"`                          |
| `restore_failed`          | When restore API fails                         | `screen_name`, `error_code`, `reason`                   |
| `support_opened`          | When `/support` is opened                      | `screen_name="support"`, `entry_point`                  |

Existing miniapp events such as `restore_access_*`, `referral_*`, `device_limit_reached`,
and `server_switched` must remain wired and gain `build_version` automatically
via `sendWebappTelemetry`.

---

### 2. Error tracking baseline

**Global**

- All telemetry is sent via `sendWebappTelemetry` (`src/telemetry/webappTelemetry.ts`).
- `build_version` must be included on every payload (already appended in helper).

**Uncaught errors**

- Global error boundary (`AppErrorBoundary`) must:
  - Capture React render errors.
  - Send a generic error event (e.g. `frontend_error`) with:
    - `screen_name`
    - `error_name`
    - `error_message`
    - `component_stack` (if reasonable)
  - Show a user‑facing fallback that offers `Contact support`.

**Upgrade rules for beta**

- Any error that fully blocks:
  - `/onboarding`, `/plan`, `/plan/checkout/:planId`, `/devices`, `/connect-status`,
    `/restore-access` must:
    - Trigger a telemetry event (specific or generic) and
    - Show a visible error state (InlineAlert or PageStateScreen).

---

### 3. API error surface model (critical endpoints)

For each class of critical API calls:

**Auth / session / bootstrap**

- Endpoints: `/webapp/auth`, `/webapp/me`, `/webapp/onboarding/state`.
- UI surfaces:
  - Inline errors during bootstrap where possible.
  - Fallback to `PageStateScreen` with clear “Cannot load your account right now.”
  - Always provide `Restore access` and `Contact support` paths.
- Telemetry:
  - `bootstrap_failed` with `error_code`, `reason`, `stage`.

**Subscription / plan / checkout**

- Endpoints: `/webapp/plans`, `/webapp/payments/create-invoice`, `/webapp/payments/{id}/status`.
- UI surfaces:
  - `/plan`: Inline error or `EmptyStateBlock` when plans cannot load.
  - `/plan/checkout/:planId`: Inline error near summary, plus secondary `Contact support`.
- Telemetry:
  - `plan_selected`, `checkout_started`, `checkout_failed`, `checkout_completed`.

**Restore access**

- Endpoints: `/webapp/subscription/restore`, `/webapp/me`.
- UI surfaces:
  - `/restore-access`: Inline error under CTA, never silent failure.
  - Clear description of what user should try next or that support is needed.
- Telemetry:
  - Already defined: `restore_access_started`, `restore_access_succeeded`, `restore_access_failed`.
  - Map them to `restore_started` / `restore_failed` in analytics taxonomy if needed.

**Devices**

- Endpoints: `/webapp/devices/issue`, `/webapp/devices/{id}/replace-with-new`, `/webapp/devices/{id}/revoke`, `/webapp/devices/{id}/confirm-connected`.
- UI surfaces:
  - Inline error per row or per action.
  - List‑level `EmptyStateBlock` when fetch fails with retry + support CTA.
- Telemetry:
  - `device_limit_reached`, `device_added`, `device_revoked` with `device_id`, `plan_id`.

**Server selection**

- Endpoints: `/webapp/servers`, `/webapp/servers/select`.
- UI surfaces:
  - `EmptyStateBlock` for server list failures.
  - Inline error when selection fails, plus retry.
- Telemetry:
  - `server_switched` with `server_id`, `mode`.

**Referral**

- Endpoints: `/webapp/referral/attach`, `/webapp/referral/my-link`, `/webapp/referral/stats`.
- UI surfaces:
  - Inline errors near referral attach inputs or info blocks.
  - No broken “earn rewards” card without real data.
- Telemetry:
  - `referral_detected`, `referral_attach_started`, `referral_attach_succeeded`, `referral_attach_failed`.

---

### 4. Error UX rules (no silent async behavior)

For all network actions in beta:

- **Loading**:
  - Use skeletons, loading spinners, or disabled CTAs with `aria-busy=true`.
  - Never leave primary CTAs active while a request is in flight.
- **Success**:
  - Update state immediately or navigate to the next screen.
  - Do not require manual refresh to see the effect.
- **Error**:
  - Show a specific error message in context.
  - Provide either:
    - `Retry` (same screen), or
    - `Contact support` (navigates to `/support`).
- **Telemetry**:
  - Every hard error path should either:
    - Emit a domain-specific event (preferred), or
    - Emit a generic `frontend_error` with enough context to debug.

This checklist is the reference during beta audit for telemetry and error surfaces;
implementation should be verified per page and per flow.

