# Mini App Routing Spec

**Status:** Proposed  
**Audience:** Frontend, Backend, Product, QA  
**Scope:** session bootstrap, first-run routing, restore routing, route guards, route resolution logic

---

## 1. Purpose

This document defines the state-driven routing rules for the VPN Suite Mini App.

The core principle is brutal in its simplicity: users should not be dropped onto a generic page and expected to perform archaeology. The app should route them to the next missing outcome.

---

## 2. Routing Philosophy

Route choice must be based on user state, not just URL availability.

### Primary user outcomes
- buy access,
- issue first device,
- complete connection,
- manage active service,
- restore service after lapse.

---

## 3. Bootstrap Flow

```text
Telegram Mini App open
  -> POST /webapp/auth
  -> GET /webapp/me
  -> derive recommended route
  -> redirect once
  -> render target screen
```

### Backend responsibility
Either:
- compute `routing.recommended_route` inside `GET /webapp/me`, or
- expose `GET /webapp/session-route`.

---

## 4. Canonical Route Map

| Route | Purpose |
|---|---|
| `/` | connected dashboard / general home |
| `/plan` | plan selection and pricing |
| `/checkout` | pre-invoice confirmation |
| `/devices` | connectivity center |
| `/devices/issue` | new device issuance |
| `/connect-status` | finish onboarding and confirm connection |
| `/restore-access` | expired/grace recovery flow |
| `/account/subscription` | subscription management |
| `/support` | diagnostics, FAQs, escalation |

---

## 5. Route Resolution Rules

### Canonical pseudocode

```ts
function resolveRoute(state: SessionState): string {
  if (!state.hasSubscription) return '/plan';
  if (state.isExpiredWithGrace) return '/restore-access';
  if (state.hasSubscription && !state.hasIssuedDevice) return '/devices/issue';
  if (state.hasIssuedDevice && !state.hasConfirmedConnection) return '/connect-status';
  if (state.isCancelledButStillValid) return '/account/subscription';
  return '/';
}
```

### Precedence notes
- `restore-access` must beat generic dashboard.
- `devices/issue` must beat generic home for newly paid users.
- `connect-status` must beat dashboard until the first connection is confirmed.

---

## 6. State-to-Route Matrix

| User state | Route |
|---|---|
| no subscription | `/plan` |
| active trial or paid sub, no device | `/devices/issue` |
| device issued, connection not confirmed | `/connect-status` |
| connected user | `/` |
| expired with grace | `/restore-access` |
| cancelled but still active until period end | `/account/subscription` |

---

## 7. First-Run Flow

### Target sequence
```text
/start
  -> Open App
  -> auth
  -> /plan if needed
  -> /checkout
  -> pay
  -> /devices/issue
  -> config delivery
  -> /connect-status
  -> /
```

### Requirements
- first-run should not land on generic dashboard,
- device issuance should happen immediately after successful payment,
- connect confirmation should be a dedicated stop before the dashboard.

---

## 8. Route Guards

### `/plan`
Allowed for:
- users without active purchasable entitlement,
- upgrade/downgrade comparisons,
- restore and win-back offers.

### `/checkout`
Requires:
- selected plan,
- valid session,
- optional promo validation result.

### `/devices/issue`
Requires:
- active or trial entitlement,
- slot availability or explicit replacement flow.

### `/connect-status`
Requires:
- at least one issued device,
- not yet confirmed connected for current onboarding cycle.

### `/restore-access`
Requires one of:
- `access_status = grace`,
- expired user with valid win-back path,
- cancelled user with restorable setup.

---

## 9. UX Rules by Route

### `/plan`
Must show:
- plan cards,
- current state badge,
- trial eligibility,
- restore context when relevant.

### `/checkout`
Must show:
- selected plan,
- price in Stars,
- device limit,
- renewal behavior,
- promo effect,
- clear “what happens next” summary.

### `/devices/issue`
Must show:
- platform selection,
- smart server recommendation,
- QR / file / text delivery options,
- minimal instructions.

### `/connect-status`
Must show:
- “are you connected?” confirmation,
- troubleshooting link,
- optional handshake verification.

### `/restore-access`
Must show:
- previous setup summary,
- one-tap restore CTA,
- pending rewards or promos where relevant.

---

## 10. Failure Routing

### Common cases

| Case | Fallback route |
|---|---|
| auth failed | bot relaunch or auth retry shell |
| payment created but no plan selected | `/plan` |
| slot full during issue | `/devices` with replacement dialog |
| expired and no grace | `/plan` or `/restore-access` win-back mode |
| device exists but config missing | `/devices/issue` with rebuild intent |

---

## 11. Telemetry Hooks

Every routing milestone should emit telemetry:
- `screen_open`
- `onboarding_started`
- `onboarding_step_viewed`
- `checkout_viewed`
- `winback_clicked`
- `connect_confirmed`

Route changes without telemetry are just vibes in a trench coat.

---

## 12. Acceptance Criteria

This spec is implemented when:
- initial route is determined from user state,
- newly paid users are routed directly into device issuance,
- onboarding is not considered complete before connection confirmation,
- grace and restore users land on recovery routes,
- slot overflow routes into replacement/upgrade rather than a dead end.


## Monetization routing addendum

Routing must support commercial context without turning the app into a popup clown car.

### Requirements
- device-limit users may be routed to inline upgrade modal from `/devices`, not full hard redirect unless required,
- expired users in grace should route to `/restore-access` with recovery CTA first,
- cancelled-but-active users may see annual-switch or save messaging on `/account/subscription`,
- trial users nearing expiry may receive conversion banners, but setup and active connection views must remain primary.
