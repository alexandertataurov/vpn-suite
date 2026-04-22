# Miniapp User Flow Simplification & Guidance System

This document turns the current Mini App journey model into a simpler, guidance-first UX for non-technical users.

## Scope

- Mini App routes in `apps/miniapp/src/app/routes.tsx`
- Onboarding, device setup, support, restore access, and subscription flows
- Guidance surfaces: empty states, tooltips, success/error states, help articles, and diagnostic handoffs

## Product model

- The Mini App is the control surface for plans, configs, devices, and support.
- The native AmneziaVPN app is where the VPN connection actually happens.
- Users should never have to infer this relationship from the UI. We need to explain it explicitly, then repeat it at the point of action.

## Current journey map

These are the current user journeys as the codebase exposes them today. Step counts are estimated from the UI path, not from analytics.

### 1. First-time activation

| Step | Current surface | Decision point | Friction |
|------|-----------------|-----------------|----------|
| 1 | Open Mini App | None | No mental model for what the app does |
| 2 | Bootstrap / onboarding gate | Whether onboarding is required | User does not know why they are here |
| 3 | Onboarding / plan prompt | Trial, subscribe, or skip | Unclear if access is required first |
| 4 | Device setup / issue config | Which device to set up | "Config" is technical jargon |
| 5 | Native app import | Open AmneziaVPN and import | App switching breaks context |
| 6 | Return to Mini App / connect status | Whether import succeeded | No strong confirmation or next action |

### 2. Config import

| Step | Current surface | Decision point | Friction |
|------|-----------------|-----------------|----------|
| 1 | `/devices` or onboarding setup path | Choose add device / issue config | Terminology is inconsistent |
| 2 | `/devices/issue` | Which device to target | User may not know the difference between device and config |
| 3 | Deeplink / file handoff | Open the native app | No clear explanation of what opens next |
| 4 | Native app import | Tap "Add Config" in the VPN app | Success is not visible in the Mini App |
| 5 | `/connect-status` or back navigation | Confirm setup finished | Users may not know they should return |

### 3. Multiple devices

| Step | Current surface | Decision point | Friction |
|------|-----------------|-----------------|----------|
| 1 | `/devices` | How many devices are active | Quota may not be obvious enough |
| 2 | Add device entry point | This device vs another device | Device/config/connection are easy to confuse |
| 3 | Config issue flow | Choose device target | The flow is not framed as "add another device" |
| 4 | Return to device list | Remove, replace, or keep | No explicit success state for the new device |

### 4. Troubleshooting

| Step | Current surface | Decision point | Friction |
|------|-----------------|-----------------|----------|
| 1 | User sees connection failure in native app | Return to Mini App or not | The Mini App is not clearly positioned as the help hub |
| 2 | `/support` or `/restore-access` | Which help path to choose | Help is not always contextual |
| 3 | Self-checks | Whether config is missing, expired, or app is absent | Missing diagnostics cause support escalation |
| 4 | Contact support | Whether to include device / subscription details | Back-and-forth increases support load |

## Target flow redesign

The target model is a two-step mental model:

1. Get access
2. Connect your device

Everything else is support, recovery, or management.

### 1. First-time activation

| Target step | Surface | Outcome |
|-------------|---------|---------|
| 1 | Welcome / onboarding landing | Explain the two-app model in plain language |
| 2 | Plan decision | If needed, start trial or subscription; if already active, skip |
| 3 | Device setup | Import config to AmneziaVPN with a visual handoff explanation |
| 4 | Success confirmation | Tell the user to open AmneziaVPN and connect |

**Reduction:** roughly 6 screens of implicit reasoning to 4 explicit steps.

### 2. Config import

| Target step | Surface | Outcome |
|-------------|---------|---------|
| 1 | Pre-import screen | Explain what will happen before the app switch |
| 2 | Native app handoff | Show a loading state while opening AmneziaVPN |
| 3 | Return / success state | Confirm the import and provide the next action |

**Reduction:** from a fragmented handoff to one guided action with a visible success state.

### 3. Multiple devices

| Target step | Surface | Outcome |
|-------------|---------|---------|
| 1 | Devices list | Show quota clearly: `2/5 active` |
| 2 | Add device choice | Default to `This device` and make `Another device` secondary |
| 3 | Device setup | Issue a config for the chosen device |
| 4 | Device added confirmation | Show the new device in the list and the next action |

**Reduction:** removes the need to understand internal concepts before acting.

### 4. Troubleshooting

| Target step | Surface | Outcome |
|-------------|---------|---------|
| 1 | Contextual help entry point | Offer help from Home, Devices, and Settings |
| 2 | Diagnostic checklist | Check app install, config import, active subscription, and internet |
| 3 | Recovery action | Re-import config, renew subscription, or contact support |
| 4 | Support handoff | Auto-attach device and subscription context |

**Reduction:** support becomes a last resort, not the first stop.

## Guidance system

### Guidance surfaces

| Surface | Purpose | Rule |
|---------|---------|------|
| Welcome and onboarding | Set the mental model | Explain Mini App vs native app immediately |
| Tooltips | Clarify one concept | One or two sentences max |
| Empty states | Convert or educate | Always pair explanation with a CTA |
| Success states | Confirm completion | Show what happened and what to do next |
| Error states | Recover gracefully | Explain the issue, then offer one clear next step |
| Help center | Self-service support | Keep articles short, actionable, and searchable |

### Trigger rules

- Show help when a user sees a concept for the first time.
- Show help after an invalid action or failed import.
- Keep advanced content hidden unless the user asks for it.
- Repeat the Mini App ↔ native app explanation near every handoff.

### Copy rules

- Use verbs: `Start`, `Import`, `Connect`, `Add`, `Retry`.
- Prefer benefit language over technical terms.
- Replace `config` with `VPN settings` when the target user is non-technical.
- Say what happens next before asking for action.

### CTA rules

| Context | Preferred CTA |
|---------|----------------|
| Onboarding | `Get Started` |
| Trial or purchase | `Start Free Trial`, `Subscribe` |
| Config handoff | `Import Config` |
| Native app launch | `Open AmneziaVPN` |
| Device management | `Add New Device` |
| Recovery | `Try Again`, `Re-import Config` |

## Recommended copy library

### Welcome

- `Private Internet Access, Made Simple`
- `Get started in 2 steps`
- `Mini App manages your plan and devices. AmneziaVPN connects the VPN.`

### Pre-import

- `Tap below to import your VPN settings. AmneziaVPN will open next.`
- `When the app opens, tap Add Config to finish setup.`

### Success

- `Config imported successfully`
- `You're ready to connect in AmneziaVPN`
- `Open AmneziaVPN to turn protection on`

### Error

- `We couldn't import the config`
- `Check that AmneziaVPN is installed and try again`
- `If it still fails, contact support with the diagnostic summary`

## Empty state patterns

### No devices yet

- Explain that no VPN device has been added yet.
- Offer `Add Your First Device`.
- Mention the device limit if the plan has one.

### No active subscription

- Explain why the user cannot proceed.
- Offer a trial or purchase path.
- Keep the value proposition near the CTA.

### No connection history

- Explain that history appears after the first successful connection.
- Offer `Open AmneziaVPN` or `Import Config` depending on state.

## Help center structure

### Entry points

- Home: `VPN not working?`
- Devices: `Troubleshoot import`
- Settings: `Help & Support`
- Restore access: `I lost access`

### Article groups

- Quick start
- Import config
- Add another device
- VPN not connecting
- Subscription and billing
- Restore access

### Article template

1. What this is
2. What to try first
3. Common causes
4. Recovery action
5. Escalation path

## Support handoff context

When the user opens support, attach structured context from the app state.

```json
{
  "user_id": "tg:12345",
  "subscription_status": "active",
  "subscription_expires_at": "2026-05-01",
  "device_count": 2,
  "device_limit": 5,
  "last_action": "import_config_failed",
  "current_surface": "/devices/issue",
  "app_version": "1.2.3",
  "platform": "ios",
  "locale": "en"
}
```

## Implementation map

This is where the guidance system belongs in the current app:

| Route / component | Guidance role |
|-------------------|---------------|
| `/onboarding` | Welcome, two-step mental model, plan decision, app handoff |
| `/devices` | Quota, empty state, add-device CTA, device naming help |
| `/devices/issue` | Pre-import guidance, loading, and recovery |
| `/connect-status` | Success confirmation and next-step CTA |
| `/support` | Troubleshooting checklist and FAQ |
| `/restore-access` | Recovery path for missing or expired access |
| `PageStateScreen` / `EmptyStateBlock` | Route-level empty and error states |
| `HelpFooter` / `HelperNote` | Inline help and escalation links |
| `FallbackScreen` | Failure recovery with retry or support |

## Suggested delivery sequence

1. Align copy and flow labels across onboarding, devices, and support.
2. Add pre-import and post-import guidance to the device setup path.
3. Upgrade empty states for first-run and no-subscription cases.
4. Add contextual help links and diagnostic context to support handoff.
5. Validate the entire journey in Storybook and Playwright before rollout.

## Success metrics

- Onboarding completion without support contact
- Time to first successful config import
- First-try device setup success rate
- Self-serve resolution rate for troubleshooting
- Support ticket volume for import and connection issues

