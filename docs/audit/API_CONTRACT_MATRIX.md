## Miniapp API Contract Matrix

| Endpoint | Used by flow | Expected request | Expected response | Validation present | Notes |
|---|---|---|---|---|---|
| `POST /api/v1/webapp/auth` | Bootstrap auth | `{ init_data }` | `{ session_token, expires_in }` | Typed in `postAuth` | Single entry for Telegram init-data exchange |
| `GET /api/v1/webapp/me` | Bootstrap, home, plan, devices, settings, restore | `-` | `WebAppMeResponse` | Typed via shared types and `useSession` | Source of truth for subscription/devices/routing |
| `POST /api/v1/webapp/onboarding/state` | Onboarding | `{ step, completed?, version }` | `{ onboarding }` | Typed in shared `WebAppOnboardingState*` | Used optimistically with fail-open |
| `GET /api/v1/webapp/plans` | Plan, home, devices, referral, settings | `-` | `{ items: PlanItem[] }` | Typed via `PlansResponse` | Drives pricing and upsell decisions |
| `POST /api/v1/webapp/payments/create-invoice` | Checkout | `{ plan_id, promo_code? }` | `WebAppCreateInvoiceResponse` | Typed in shared types | Supports free activations and Stars invoices |
| `GET /api/v1/webapp/payments/{id}/status` | Checkout polling | `-` | `WebAppPaymentStatusOut` | Typed | Status `completed|failed|cancelled|pending` mapped exhaustively |
| `POST /api/v1/webapp/subscription/restore` | Restore access | `{ subscription_id, plan_id? }` | `{ status, plan_id?, redirect_to? }` | Narrow local typing | Redirect determines post-restore route |
| `POST /api/v1/webapp/devices/issue` | Devices issue | `{}` | `WebAppIssueDeviceResponse` | Typed | Returns config variants and `peer_created` |
| `POST /api/v1/webapp/devices/{id}/replace-with-new` | Devices replace | `-` | `WebAppIssueDeviceResponse` | Typed | Re-issues config for same slot |
| `POST /api/v1/webapp/devices/{id}/confirm-connected` | Devices / connect-status | `-` | `{}` | Untyped body | Used to confirm connection after import |
| `POST /api/v1/webapp/devices/{id}/revoke` | Devices, settings reset | `-` | `{}` | Untyped body | Revokes a single device |
| `GET /api/v1/webapp/servers` | Home, servers | `-` | `WebAppServersResponse` | Typed | Lists available nodes and current preset |
| `POST /api/v1/webapp/servers/select` | Servers | `{ server_id?, mode }` | `{}` | Narrow local typing | Sets auto/manual and preferred server |
| `POST /api/v1/webapp/referral/attach` | Referral attach | `{ ref }` | `{ status?, attached?, referrer_user_id? }` | Locally validated | Idempotent; supports multiple legacy shapes |
| `GET /api/v1/webapp/referral/my-link` | Referral screen | `-` | `WebAppReferralMyLinkResponse` | Typed | Contains share URL and bot username |
| `GET /api/v1/webapp/referral/stats` | Referral screen | `-` | `WebAppReferralStatsResponse` | Typed | Referral reward progress |
| `GET /api/v1/webapp/subscription/offers` | Settings retention | `?reason_group?` | `WebAppSubscriptionOffersResponse` | Typed | Drives pause/discount/downgrade UX |
| `POST /api/v1/webapp/subscription/pause` | Settings retention | `{ subscription_id }` | `{}` | Narrow local typing | Pauses subscription |
| `POST /api/v1/webapp/subscription/resume` | Settings retention | `{ subscription_id }` | `{}` | Narrow local typing | Resumes subscription |
| `POST /api/v1/webapp/subscription/cancel` | Settings retention | `{ subscription_id?, reason_* }` | `{}` | Narrow local typing | Captures cancel reasons and variants |
| `PATCH /api/v1/webapp/me` | Settings profile/locale | `WebAppMeProfileUpdate` | `WebAppMeProfileUpdateResponse` | Typed | Updates profile and locale |
| `POST /api/v1/webapp/telemetry` | Telemetry sink | `{ event_type, payload }` | `204` | Typed via `WebappTelemetryEventType` | Fire-and-forget; errors swallowed client-side |
| `POST /api/v1/log/frontend-error` | Error reporting | `{ message, stack?, route? }` | `204` | Typed via `reportError` | Central frontend error sink |

