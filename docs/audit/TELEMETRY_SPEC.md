## Miniapp Telemetry Spec (Selected Flows)

### Restore access

- **Events**
  - `restore_access_started` — when user taps Restore on `/restore-access`
  - `restore_access_succeeded` — when `/webapp/subscription/restore` returns success
  - `restore_access_failed` — when restore API fails
- **Payload fields**
  - `screen_name` — `"restore-access"`
  - `plan_id` — target plan when known
  - `has_grace` — whether user had grace/expired subscription
  - `redirect_to` — backend redirect path (success)
  - `error_code`, `reason` — error classification (failure)

### Referral attach

- **Events**
  - `referral_detected` — when a valid code is captured from launch/query/early/sessionStorage
  - `referral_attach_started` — when attach request is first issued
  - `referral_attach_succeeded` — when attach succeeds or is idempotently attached
  - `referral_attach_failed` — when attach fails after retries
- **Payload fields**
  - `source` — `"launch_params" | "query" | "early" | "storage"`
  - `has_code` — true when a normalized code is present
  - `status` — backend status (`attached`, `already_attached`, `invalid_ref`, etc.)
  - `error_code` — backend error code on failure

### Device limit

- **Events**
  - `device_limit_reached` — when device issue fails due to limit
- **Payload fields**
  - `screen_name` — `"devices"`
  - `device_limit` — configured limit when known
  - `devices_used` — active device count at time of failure

### Server selection

- **Events**
  - `server_switched` — when user updates routing/server preference
- **Payload fields**
  - `screen_name` — `"servers"`
  - `server_id` — selected server id for manual mode

### Support hub (future)

- **Planned events**
  - `support_opened` — when `/support` is opened, with `entry_point`
  - Follow-ups (not yet implemented): step outcomes (resolved vs escalated)

