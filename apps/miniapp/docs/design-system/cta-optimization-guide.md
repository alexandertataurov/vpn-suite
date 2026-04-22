# CTA Optimization Guide

## Core rule

Every screen should have:

- one primary action
- at most one secondary action of equal visibility
- any tertiary action pushed below the fold or into helper text

## Onboarding

| Step | Current intent | Recommended CTA copy |
|------|----------------|----------------------|
| Welcome | Move into setup | `Install AmneziaVPN` or `Start setup` |
| Install app | Send the user to the store or deep link | `Open AmneziaVPN` |
| Choose plan | Move to purchase | `Choose a plan` |
| Add first device | Start device issuance | `Add first device` |
| Open VPN app | Confirm the external handoff | `I opened the app` |
| Confirm connection | Finish onboarding | `Confirm connection` |

## Home

| Surface | Primary CTA | Secondary CTA | Notes |
|---------|-------------|---------------|-------|
| Connected state | `Manage devices` | `Renew plan` | Keep the action order stable |
| No devices | `Add device` | `View plan` | Do not bury the activation path |
| Expiring plan | `Renew now` | `View plan` | Use urgency copy only when real |
| Expired plan | `Restore access` | `Choose plan` | Recovery language should be direct |

## Plan

| Surface | Primary CTA | Secondary CTA | Notes |
|---------|-------------|---------------|-------|
| Active subscription | `Renew plan` or `Manage devices` | `View billing history` | Keep current plan info above the CTA |
| No subscription | `Choose a plan` | `Learn more` | Avoid generic `Continue` |
| Trial ending | `Upgrade now` | `Compare plans` | Use the deadline in copy when available |

## Copy rules

- Use verbs that describe the actual next action.
- Avoid `Submit`, `OK`, and `Continue` unless the context already makes the action obvious.
- Use urgency language only for renewals, expirations, and payment deadlines.
- Keep the CTA label short enough to fit a single line at mobile widths.

