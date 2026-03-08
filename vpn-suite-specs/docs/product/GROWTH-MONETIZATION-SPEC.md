# Growth & Monetization Spec v1

**Status:** Proposed  
**Audience:** Product, Growth, Backend, Frontend, Analytics, CRM, Admin  
**Scope:** Upsell, cross-sell, trial conversion, referrals, promos, churn prevention, win-back, pricing experiments, monetization telemetry

---

## 1. Purpose

This document defines the revenue layer for VPN Suite.

The product must not stop at “user connected.” It must also maximize:
- conversion from visitor to payer,
- average revenue per user,
- device-based expansion,
- retention and recovery after churn risk,
- referral-driven growth,
- monetization without turning the app into a cursed popup carnival.

---

## 2. Revenue Principles

1. **Connection first, monetization second, but always present.** Never break first-run setup with aggressive upsell.
2. **Upsell must be contextual.** Offer more value exactly where the user hits a real limit.
3. **Every paid surface must explain the gain.** More devices, better regions, premium routes, family sharing, annual savings, priority support.
4. **Churn recovery is a revenue system.** Grace, save offers, pause, and win-back are core commercial flows.
5. **Promotions must be measurable.** Every discount and bonus needs attribution and ROI visibility.
6. **Do not spray random offers.** The app should feel sharp, not like a haunted casino banner stack.

---

## 3. Monetization Surface Map

| Surface | Primary goal | Monetization role |
|---|---|---|
| `/plan` | convert new user | initial purchase, annual anchor, promo entry |
| `/checkout` | close purchase | order bump, promo confirmation, annual save framing |
| `/devices` | manage connectivity | device-limit upsell, family/team plan |
| `/servers` or server picker | get best route | premium region / streaming / performance upsell |
| `/restore-access` | recover churn-risk user | grace recovery, win-back discount |
| `/account/subscription` | manage plan | upgrade, annual switch, auto-renew retention |
| bot messages | remind / recover | invoice recovery, trial conversion, win-back |
| referral page | user acquisition | invite bonus, dual-sided referral |

---

## 4. Offer Catalog

### 4.1 Core offers

| Offer type | Trigger | User value | Business goal |
|---|---|---|---|
| Annual plan anchor | plan view | lower monthly effective price | improve cash collection and retention |
| Device expansion | device limit reached | more active devices | ARPU growth |
| Premium region / streaming add-on | user selects special region | better use-case fit | upsell power users |
| Family / team plan | multiple devices or invites | shared access | account expansion |
| Trial-to-paid offer | trial nearing end | keep settings and connection | improve conversion |
| Save offer | cancel flow | lower price / pause / downgrade | reduce churn |
| Win-back offer | expired / blocked | restore in 1 tap | recover churned revenue |
| Referral reward | invite sent / accepted | free days or balance | low-CAC growth |

### 4.2 Plan packaging recommendations

Required plan ladder:
- **Starter** — 1 device, low-friction entry
- **Personal** — 3 devices, default best-seller
- **Plus / Family** — 5+ devices, household use
- **Annual variants** for each meaningful tier

Optional later:
- premium streaming regions
- dedicated or low-load routes
- business/team seat bundle

### 4.3 Price framing rules

- Always show monthly equivalent for annual plans.
- Mark one plan as **Best Value** and one as **Most Popular**.
- Annual plan should be visually anchored above monthly-only logic.
- Show explicit savings, not vague marketing fog.
- Use Stars amount and normalized fiat equivalent in admin analytics, even if fiat is not shown to the user.

---

## 5. Upsell Engines

### 5.1 Device-limit upsell

#### Trigger
User tries to add a device and has no free slots.

#### Required UX
- show current devices,
- show revoke/replace path,
- show upgrade CTA side by side,
- explain gain in plain language: “Connect 2 more devices without removing existing ones.”

#### Offer variants
- immediate upgrade to next tier,
- temporary add-on for extra device slots,
- family plan suggestion if multiple device names imply household usage.

### 5.2 Annual conversion upsell

#### Trigger
Monthly plan selected or active monthly subscriber opens subscription page.

#### Required UX
- show annual savings in absolute and percent terms,
- show one-tap proration or apply on next renewal,
- do not hide the monthly plan; just make annual economically obvious.

### 5.3 Premium region / streaming upsell

#### Trigger
User tries premium-tagged region or repeatedly changes servers for performance.

#### Required UX
- show why the region is premium,
- show performance or use-case promise carefully and honestly,
- allow dismiss once and suppress for cooldown window.

### 5.4 Team / family expansion upsell

#### Trigger
- many devices on one account,
- repeated invite activity,
- user names devices like “mom iphone”, “macbook alex”, “tv”.

#### Required UX
- bundle more devices + better economics,
- highlight shared admin simplicity,
- allow invite directly from upgrade flow.

---

## 6. Retention Machines

### 6.1 Grace recovery

When billing fails or the period ends:
- preserve working devices for grace window,
- show countdown,
- surface restore CTA on app open and bot message,
- keep recovery path to one tap where possible.

### 6.2 Cancel deflection

Cancellation must branch by reason.

| Reason | Offer sequence |
|---|---|
| too expensive | annual discount, cheaper tier, pause |
| not using | pause, seasonal hold, lighter plan |
| too few devices | upgrade or add-on |
| slow | switch server, premium performance tier, support |
| temporary break | pause and restore later |

Rules:
- max 1-2 offers before final cancel confirmation,
- never trap the user in a maze,
- save accepted offer outcome to CRM and telemetry.

### 6.3 Win-back

For expired or cancelled users:
- keep device list visible,
- preserve last route/server metadata,
- show “Restore connection” as the main CTA,
- optionally offer time-boxed discount after cooldown,
- use pending referral days before discount if enough to recover value.

---

## 7. Referral Machine

### 7.1 Core model

Dual-sided referral is preferred:
- referee gets onboarding bonus or first-purchase discount,
- referrer gets reward days or wallet credit.

### 7.2 Required rules

- attribution survives handoff from bot to mini app,
- referral reward accrues even if referrer is currently inactive,
- pending rewards apply automatically on next valid purchase or activation,
- fraud checks must block self-referrals and obvious abuse clusters.

### 7.3 Referral UX

Referral page must show:
- personal invite link,
- reward explanation,
- pending rewards,
- earned rewards,
- invite status funnel: clicked -> signed up -> purchased -> rewarded.

---

## 8. Promo System

### 8.1 Promo types

- percent discount
- fixed Stars discount
- extra days
- upgrade bonus
- partner / influencer code
- win-back code

### 8.2 Promo rules

Promo engine must support:
- first purchase only,
- specific plan scope,
- expiry date,
- acquisition source constraints,
- cannot combine with some offers,
- admin-readable reason for rejection.

### 8.3 Promo UX

- validate inline on checkout,
- show exact effect before invoice open,
- log rejection reason cleanly,
- preserve applied promo snapshot in payment record.

---

## 9. Messaging / CRM Automations

### 9.1 Core sequences

| Sequence | Trigger | Goal |
|---|---|---|
| Trial activation | trial start | activation and habit formation |
| Trial expiring | 24h before end | paid conversion |
| Invoice recovery | invoice created but not paid | recover checkout drop-off |
| Grace reminder | access in grace | restore payment |
| Save-flow follow-up | user paused or declined save offer | re-open value path |
| Win-back | expired for N days | recover churned users |
| Referral nudge | user connected successfully | invite friends while sentiment is high |

### 9.2 Messaging rules

- messages must reference current user state,
- no duplicate spam across bot + app banners inside short cooldown,
- every automation must have suppression logic,
- track send -> open -> click -> convert.

---

## 10. Admin / Growth Console Requirements

Admin must expose:
- conversion by plan and acquisition source,
- annual vs monthly mix,
- upsell acceptance by trigger type,
- save-offer acceptance by cancel reason,
- grace recovery rate,
- trial conversion rate,
- referral funnel,
- promo ROI and abuse flags,
- win-back cohort performance.

Operators must be able to:
- enable/disable offer campaigns,
- set cooldowns,
- configure copy blocks,
- configure targeting predicates,
- inspect why a user saw or did not see an offer.

---

## 11. Telemetry Additions

Required monetization events:
- `upsell_impression`
- `upsell_clicked`
- `upsell_dismissed`
- `upgrade_completed`
- `downgrade_selected`
- `annual_switch_viewed`
- `annual_switch_completed`
- `add_on_selected`
- `save_offer_shown`
- `save_offer_declined`
- `winback_offer_shown`
- `winback_offer_accepted`
- `promo_rejected`
- `crm_message_sent`
- `crm_message_clicked`

---

## 12. Prioritized Rollout

### Phase 1
- annual anchor on pricing
- device-limit upsell
- cancel reason branching with save offers
- trial conversion reminders
- monetization telemetry

### Phase 2
- family/team expansion flow
- win-back campaigns
- referral funnel v2
- promo engine hardening

### Phase 3
- premium region add-ons
- personalized offer targeting
- admin campaign controls
- experiment framework / A-B support

---

## 13. Non-goals

This spec does not require:
- dark-pattern countdown nonsense,
- fake scarcity,
- manipulative forced upsells during initial connection,
- pricing experiments without telemetry,
- manual operator hacks as a substitute for offer rules.

The machine should make money because it is well-designed, not because it screams at the user in twelve places at once.
