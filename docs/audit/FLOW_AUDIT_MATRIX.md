## Miniapp Flow Audit Matrix

| Flow | Business outcome | Designed state | Actual state | Evidence | Status | Owner | Issues |
|---|---|---|---|---|---|---|---|
| App open / bootstrap | User reaches correct shell (home/onboarding/restore) with valid session | Defined | Implemented | `useBootstrapMachine` tests, e2e onboarding | PASS | Frontend | — |
| Onboarding | First-time user completes funnel and lands on plan | Defined | Implemented with fail-open | `useBootstrapMachine`, onboarding e2e specs | PASS | Frontend | Backend outage on `/onboarding/state` relies on fail-open |
| Plan selection | User sees correct plans and can select/upgrade | Defined | Implemented | `usePlanPageModel`, checkout e2e | PASS | Frontend/API | No dedicated subscription-state E2E yet beyond checkout |
| Checkout / payment | Successful payment leads to active subscription | Defined | Implemented for happy path; timeout/fail handled | `useCheckoutPageModel`, checkout e2e | PASS | Frontend/API | Polling relies on simple timeout; no E2E around failed payments |
| Subscription restore | Expired/grace user can restore to active plan | Defined | Implemented with telemetry and error states | `useRestoreAccessPageModel` + unit test | PARTIAL | Frontend/API | No E2E; backend statuses beyond `restored` not exercised |
| Devices | User can issue/manage configs within device limit | Defined | Implemented with upsell + limit telemetry | `useDevicesPageModel`, device-issue e2e, device-limit unit test | PASS | Frontend/API | At-limit behavior only unit-tested; no E2E for limit breach |
| Server selection | User can switch routing/server safely | Defined | Implemented with telemetry and offline state | `useServerSelectionPageModel` unit test | PARTIAL | Frontend/API | No E2E; backend error taxonomy not asserted |
| Referral attach | Incoming referral reliably attached once | Defined | Implemented with retries + telemetry | `useReferralAttach` unit test | PARTIAL | Frontend/API | No E2E across launch/deeplink variants |
| Support hub | User can self-serve or escalate to chat | Defined | Implemented (routing only) | Manual, `useSupportPageModel` | PARTIAL | Frontend | No explicit support telemetry; no tests |
| Settings / retention | User can update profile and pause/cancel | Defined | Implemented with telemetry | `useSettingsPageModel` logic, unit tests elsewhere | PASS | Frontend/API | No E2E for cancel/pause flows |

