## Telegram Mini App — Copy & Terminology for Beta

Version: `v0.1-beta-launch`

This document fixes **terminology**, **CTA labels**, and **page-level copy skeletons**
for the Telegram mini app beta.

---

### 1. Terminology glossary (use vs avoid)

| Concept          | Use (beta)                             | Avoid / notes                                      |
| ---------------- | --------------------------------------- | -------------------------------------------------- |
| Plan             | **Plan** (product tier)                | Subscription (except in billing/legal context)     |
| Subscription     | **Subscription** (billing lifecycle)   | Plan when talking about billing state              |
| Device           | **Device** (user’s phone/laptop/etc.)  | Connection, slot                                   |
| Connection state | **Setup completed / Not set up yet**   | Connected, Protected, Secure (unless verifiable)   |
| Server           | **Server location** or **Location**    | Node, Exit, Route                                  |
| Restore          | **Restore access**                     | Recover, Login recovery (unless explicitly login)  |
| VPN app          | **VPN app** / **Native VPN app**       | Client, Agent, Daemon                              |
| Config           | **Config** / **Configuration file**    | Key, Secret, Token (except in technical docs)      |

**Rules**

- Do not claim **connection** status inside the mini app unless the backend can
  prove it. Prefer “Setup completed” vs “Connected”.
- Use **Plan** when helping the user choose or compare offers.
- Use **Subscription** only for billing/renewal/expiry explanations.

---

### 2. CTA copy map (shared actions)

Preferred CTA labels and their meaning:

- `Choose plan` — user is selecting a plan for the first time or to upgrade.
- `Continue to checkout` — user moves from plan selection to payment.
- `Continue to payment` — platform-specific payment step in checkout.
- `Open VPN app` — opens the native VPN app (never modifies connection directly).
- `Copy config` — copies configuration or access details to clipboard.
- `Add device` — starts device issuance/creation.
- `Manage devices` — opens device list/management.
- `Restore access` — runs restore flow for expired/broken access.
- `Contact support` — opens primary support channel or support page.
- `Select server` — confirms server/location choice.
- `Retry` — retries the last failed network action in place.

Avoid vague CTAs (`Continue`, `Proceed`, `Submit`, `Next`, `Manage`) unless the
surrounding copy makes the action obviously unambiguous.

---

### 3. Page-level copy skeletons (titles, subtitles, primary CTA)

These are **skeletons**, not final marketing copy. Keep them plain and operational.

**Onboarding (`/onboarding`)**

- Title: “Set up VPN access”
- Subtitle: “We’ll help you pick a plan and issue your first device config.”
- Primary CTA:
  - `Choose plan` (no subscription)
  - `Go to devices` (already subscribed)

**Home (`/`)**

- Title: “Your VPN access”
- Subtitle (no subscription): “You don’t have an active plan yet.”
- Subtitle (active subscription, no devices): “Access is active. Set up your first device.”
- Subtitle (active subscription, devices): “Your devices are ready to use with the VPN app.”
- Primary CTA:
  - `Choose plan` / `Add device` / `Manage devices` (per state matrix).

**Plan (`/plan`)**

- Title: “Choose your plan”
- Subtitle (no subscription): “Pick a plan that matches how you use VPN.”
- Subtitle (active subscription): “You’re on [Plan Name]. You can change or renew below.”
- Primary CTA:
  - `Continue to checkout` (selected plan).

**Checkout (`/plan/checkout/:planId`)**

- Title: “Confirm your plan”
- Subtitle: “Review your plan and complete payment in Telegram.”
- Primary CTA:
  - `Continue to payment` (or equivalent Stars/payment label).

**ConnectStatus (`/connect-status`)**

- Title: “VPN setup status”
- Subtitle (no devices): “Issue a config so your VPN app can connect.”
- Subtitle (devices, setup pending): “Your config is ready. Finish setup in the VPN app.”
- Subtitle (setup completed): “Your devices are set up. Open the VPN app to connect.”
- Primary CTA:
  - `Add device` / `Open VPN app` / `Manage devices` (per state).

**Devices (`/devices`, `/devices/issue`)**

- Title: “Devices”
- Subtitle (no devices): “Devices appear here after you issue a config.”
- Subtitle (devices exist): “Manage which devices can use your VPN access.”
- Primary CTA:
  - List: `Add device`
  - Issue view: `Copy config` or `Open VPN app`.

**ServerSelection (`/servers`)**

- Title: “Server location”
- Subtitle: “Choose where your VPN traffic should exit.”
- Primary CTA:
  - `Select server`.

**Referral (`/referral`)**

- Title: “Invite friends”
- Subtitle (referral available): “Share your link. Both of you get VPN benefits.”
- Subtitle (unavailable): “Referrals are not available on your current plan yet.”
- Primary CTA:
  - `Copy link` or `Copy code`.

**RestoreAccess (`/restore-access`)**

- Title: “Restore access”
- Subtitle: “If your session expired or your access broke, try restoring it here.”
- Primary CTA:
  - `Restore access`.

**Settings (`/settings`)**

- Title: “Settings”
- Subtitle: “Account and app preferences that are safe to change.”
- Primary primary-like link:
  - Contextual links such as `Manage devices` or `Contact support` — but only one should be visually primary.

**Support (`/support`)**

- Title: “Get help”
- Subtitle: “If something looks wrong in the app or your VPN access, start here.”
- Primary CTA:
  - `Contact support`.
- Secondary CTAs:
  - `Restore access`, `Manage devices`, `Choose plan` (route to self‑service flows).

---

This glossary and skeleton set is the reference for the beta copy audit and should
be kept in sync with UI as flows are refined. Any deliberate deviations must be
called out in page-level audit notes.

