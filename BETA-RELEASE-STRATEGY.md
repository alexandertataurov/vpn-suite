# Beta Release Prompt Pack — VPN Access Miniapp

## Purpose

This prompt pack is designed to help an AI agent redesign and polish the current VPN access miniapp for beta release with better depth, sharper decisions, and less generic output.

### Product context

* This is a VPN access miniapp
* The app sells and manages VPN access/configs
* The app does **not** directly connect or disconnect VPN
* The actual VPN connection happens inside the native **AmneziaVPN** app
* Beta release should feel like a **one-pager product**
* The experience should be simple, clear, mobile-first, and low-friction
* The main goal is to reduce confusion, improve conversion, and make the product feel coherent

### Required flows

#### New user

1. Sees onboarding screen
2. Sees welcome message and link to download AmneziaVPN
3. Goes to plan selection
4. Adds device
5. Sees instruction on how to import `.conf` into AmneziaVPN

#### Existing user

1. Lands on main page
2. Sees current plan and access/connection information
3. Sees devices
4. Can access settings

### Main page requirements

* Header with title, profile badge, and settings gear icon
* Main hero with current plan and access/connection info
* Devices section below hero

### Settings page requirements

* Change plan
* Cancel plan
* Delete plan/subscription/access if supported
* Autorenew setting
* FAQ

---

# Recommended order of execution

Use the prompts in this order:

1. Product framing / beta strategy
2. Information architecture
3. New user flow
4. Existing user flow
5. Main page wireframe
6. Settings page
7. UX copy
8. UI polish / visual consistency
9. Edge cases / failure states
10. Frontend implementation plan
11. QA / beta audit

After each result, run the critique prompts at the end of this document.

---

# 1) Product framing / beta strategy prompt

```text
Act as a senior product strategist, UX lead, and beta-launch consultant.

Your task: define the best beta-release product strategy for the current VPN access miniapp.

Context:
- This is a Telegram miniapp / mobile-first app.
- The app does NOT directly connect or disconnect VPN.
- The app sells and manages VPN access/configs.
- The actual VPN connection happens in the native AmneziaVPN app.
- The beta release should feel like a one-pager experience: simple, linear, clear, and low-friction.
- The current app likely has too many fragmented screens, mixed metaphors, and unnecessary complexity.

Main user flows:
1. New user
- Sees onboarding screen
- Sees welcome message and link to download AmneziaVPN
- Chooses plan
- Adds device
- Gets instructions on how to import .conf into AmneziaVPN

2. Existing user
- Lands on screen with current plan and connection/access information
- Sees devices
- Can go to settings

Main page requirements:
- Main hero with information about plan and connection/access
- Devices section below hero
- Header with profile badge and settings gear icon

Settings page requirements:
- Change plan
- Cancel plan
- Delete plan/subscription/access if supported
- Autorenew setting
- FAQ

Your job:
1. Reframe the app into a beta-ready product with one clear mental model
2. Define what “one-pager app” should mean here
3. Decide which screens should exist, merge, or be removed
4. Define the best new-user and existing-user entry states
5. Identify product confusion risks, especially around the difference between:
   - buying/managing access in miniapp
   - connecting in AmneziaVPN
6. Explain what must be in beta and what should be postponed

Output format:
1. Product positioning for beta
2. Core mental model for the user
3. Recommended app structure for beta
4. New user state vs existing user state
5. What to merge/remove/defer
6. Top product risks before beta
7. Non-negotiable UX principles for this product

Be opinionated, practical, and concrete.
Do not give generic advice.
Prefer simplification over feature richness.
```

---

# 2) Information architecture prompt

```text
Act as a senior information architect and mobile product designer.

Your task: redesign the information architecture of the current VPN access miniapp for a beta release.

Context:
- The app should feel like a one-pager experience
- It sells and manages VPN access/configs
- It does not directly create VPN tunnel connection
- Native AmneziaVPN handles connection
- The goal is a simple, coherent mobile-first flow with minimal navigation overhead

Required states/pages:
- Onboarding for new users
- Plan selection
- Add device
- Post-device setup instructions for importing .conf into AmneziaVPN
- Existing user main page with plan/access/devices
- Settings page with subscription actions, autorenew, FAQ

Your tasks:
1. Design the final IA for beta
2. Decide whether each step should be:
   - a standalone page
   - a step in one flow
   - a modal/sheet/section
   - removed entirely
3. Reduce fragmentation and duplicate logic
4. Ensure the structure works for both new and existing users
5. Make the app feel like one guided product, not a bunch of disconnected screens

Output format:
1. Final sitemap / state map
2. Entry points by user type
3. Navigation model
4. Required states and transitions
5. What should be merged
6. What should be removed
7. What should be modal/sheet vs full page
8. Why this IA is better for beta

Be specific and decisive.
Do not stay abstract.
```

---

# 3) New user flow prompt

```text
Act as a senior UX designer and conversion-focused onboarding specialist.

Your task: design the best possible new user onboarding flow for a beta VPN access miniapp.

Context:
- User is new
- The miniapp sells/manages VPN access and config files
- The actual connection is done in AmneziaVPN
- The new user flow must be extremely clear, low-friction, and mobile-first
- The app should feel like one guided setup flow

Required new user flow:
1. Onboarding screen with welcome message
2. Link/button to download AmneziaVPN
3. Continue to plan selection
4. Choose plan
5. Add device
6. Show instructions for importing .conf to AmneziaVPN after device is added

Your tasks:
1. Design the full step-by-step flow
2. Define the purpose of each step
3. Define what user should see, understand, and do on each step
4. Minimize confusion around:
   - what this app does
   - what AmneziaVPN does
   - when/where the user actually connects
5. Reduce drop-off and friction
6. Design ideal empty/loading/success/error states for each step

Output format:
1. New user flow overview
2. Step-by-step breakdown
3. UX goal of each step
4. Key UI elements per step
5. Key copy per step
6. Risks/confusion points per step
7. Recommended fixes
8. Beta simplifications

Be concrete.
Make product decisions.
Optimize for clarity and completion.
```

---

# 4) Existing user flow prompt

```text
Act as a senior product designer focused on retention, subscription UX, and account management.

Your task: redesign the existing user experience for a beta VPN access miniapp.

Context:
- Existing users should not go through onboarding again
- They should land directly on the main page
- The app manages access and config files
- Actual VPN connection happens in AmneziaVPN
- Main page should be simple, useful, and easy to scan

Existing user needs:
- See current plan
- See access/connection status
- See devices
- Access settings quickly
- Manage subscription
- Understand what to do next if there is an issue

Your tasks:
1. Design the best landing experience for an existing user
2. Define the hero content hierarchy
3. Define how device list should work
4. Define what “connection/access information” should mean without falsely implying direct VPN tunnel control
5. Define empty / expired / paused / error / no-device states
6. Make this screen useful without overloading it

Output format:
1. Existing user landing experience
2. Main page content hierarchy
3. Hero block structure
4. Devices section structure
5. Key actions and their priority
6. Important user states and how to present them
7. UX mistakes to avoid
8. Beta-ready simplifications

Be explicit.
Avoid vague UX language.
Prioritize clarity and retention.
```

---

# 5) Main page wireframe prompt

```text
Act as a senior mobile UI/UX designer.

Your task: create a detailed wireframe-level specification for the main page of a beta VPN access miniapp.

Context:
- Existing user main screen
- Header includes page heading, profile badge, and settings gear icon
- Main hero contains current plan and access/connection information
- Devices section is below hero
- The app does not directly connect VPN; it only manages access/configs

Your tasks:
1. Design the full structure of the main page
2. Define exact section order
3. Define what content belongs in the hero
4. Define what should be visually primary vs secondary
5. Define device card/list structure
6. Define CTA hierarchy
7. Define variants for important states

Required states to cover:
- Active paid plan
- Trial / starter plan if applicable
- Expiring soon
- Expired
- No device yet
- Device limit reached
- Pending setup
- Payment/subscription issue

Output format:
1. Page structure from top to bottom
2. Header wireframe
3. Hero wireframe
4. Devices section wireframe
5. CTA/action hierarchy
6. State variants
7. UX notes for spacing, hierarchy, and scanability
8. Common mistakes to avoid

Be practical and implementation-friendly.
Do not generate generic design fluff.
```

---

# 6) Settings page prompt

```text
Act as a senior UX designer for settings, subscriptions, and account management.

Your task: design a clean, beta-ready settings page for a VPN access miniapp.

Context:
- Settings page must include:
  - Change plan
  - Cancel plan
  - Delete plan/subscription/access if supported
  - Autorenew setting
  - FAQ
- The page must be simple, trustworthy, and not scary
- Destructive actions must exist but should not dominate the page
- This is mobile-first

Your tasks:
1. Design the information hierarchy of the settings page
2. Decide section grouping and order
3. Define how subscription actions should be presented
4. Define how autorenew should be explained
5. Define how destructive actions should be separated
6. Design FAQ placement and style
7. Reduce legalistic or technical confusion

Output format:
1. Settings page structure
2. Section order and rationale
3. Subscription management block
4. Autorenew block
5. FAQ block
6. Destructive actions block
7. UX copy recommendations
8. Mistakes to avoid

Be very concrete.
Focus on trust, clarity, and actionability.
```

---

# 7) UX copy prompt

```text
Act as a senior UX writer and product copy strategist.

Your task: rewrite the app copy for a beta VPN access miniapp so it is clear, direct, and easy to understand.

Context:
- The app manages VPN access and config files
- The actual VPN connection is done in AmneziaVPN
- Copy must reduce confusion and support conversion
- Copy must be short, mobile-friendly, and human
- Avoid technical overload
- Avoid fake “connect now” language if the miniapp cannot connect directly

Areas to cover:
- Onboarding
- Plan selection
- Add device
- Post-device config import instructions
- Main hero
- Devices section
- Settings page
- Autorenew
- FAQ
- Empty/error/success states

Your tasks:
1. Rewrite all major headings
2. Rewrite button labels
3. Rewrite helper text
4. Rewrite instructional text
5. Rewrite status labels so they are technically honest
6. Ensure the difference between miniapp and AmneziaVPN is crystal clear

Output format:
1. Copy principles
2. Onboarding copy
3. Plan page copy
4. Add device copy
5. Post-setup instruction copy
6. Main page copy
7. Settings page copy
8. Empty/error/success state copy
9. Labels to avoid
10. Better replacements

Make the copy concise, explicit, and product-smart.
No generic marketing fluff.
```

---

# 8) UI polish / visual consistency prompt

```text
Act as a senior product designer and design-system auditor.

Your task: audit and improve the app UI for a beta release so it looks coherent, polished, and trustworthy.

Context:
- Current app may have inconsistent spacing, typography, button styles, cards, headings, badges, and interaction patterns
- Beta should feel visually stable and intentional
- This is a mobile-first Telegram miniapp
- The app should look like one product, not multiple design experiments stitched together

Your tasks:
1. Identify likely visual inconsistency risks
2. Define a consistent visual system for beta
3. Recommend rules for:
   - typography
   - spacing
   - cards
   - lists
   - badges
   - buttons
   - icons
   - section hierarchy
4. Prevent visual drift between onboarding, main page, devices, and settings
5. Recommend what to simplify or standardize before beta

Output format:
1. Top visual issues likely blocking beta quality
2. Visual consistency rules
3. Component styling rules
4. Hierarchy rules
5. Interaction consistency rules
6. What to standardize immediately
7. What can wait until after beta
8. Final beta polish checklist

Be strict and practical.
Focus on things that materially improve perceived quality.
```

---

# 9) Edge cases / failure states prompt

```text
Act as a senior UX architect specializing in edge cases, failure handling, and product resilience.

Your task: design all important edge cases and failure states for a beta VPN access miniapp.

Context:
- App manages subscription/access/configs
- Actual connection happens in AmneziaVPN
- Beta must not feel broken or confusing when things go wrong
- Most trust is lost in unclear states, not in obvious failures

Flows to cover:
- No plan selected
- Payment failed
- Plan expired
- Device creation failed
- Device limit reached
- Config generation/download failed
- User has plan but no device
- User imported config but still cannot connect
- Autorenew failed
- Plan cancellation pending
- Backend state mismatch
- Empty FAQ / missing support path if relevant

Your tasks:
1. Identify the most important edge cases
2. Define how each should appear in UI
3. Define the best next action for the user
4. Ensure copy stays honest and calm
5. Prevent ambiguous or dead-end states

Output format:
1. Edge case inventory
2. State-by-state breakdown
3. UI treatment
4. Recommended CTA
5. Recommended copy pattern
6. Common mistakes to avoid

Be realistic and product-minded.
Do not skip ugly edge cases.
```

---

# 10) Frontend implementation prompt

```text
Act as a senior frontend architect, UX engineer, and release manager.

Your task: turn the beta app redesign into an implementation-ready frontend plan.

Context:
- This is a VPN access miniapp
- Beta should feel like a one-pager app
- Main user flows:
  - new user onboarding → plan → add device → config import instruction
  - existing user main page → plan/access info → devices → settings
- Settings page includes plan actions, autorenew, FAQ
- The app should not imply it can directly connect/disconnect VPN

Your tasks:
1. Break the redesign into implementation phases
2. Define which components should be reused
3. Define which screens/states should be merged
4. Define route/state strategy
5. Identify risky areas for beta
6. Recommend what to ship first and what to postpone
7. Reduce design drift and screen-specific hacks

Output format:
1. Implementation phases
2. Component/state map
3. Route/state architecture
4. Priority order
5. Risky areas
6. Tech debt to avoid during beta refactor
7. What to defer until post-beta
8. Final launch-readiness checklist

Be implementation-oriented, not theoretical.
Optimize for shipping a stable beta fast.
```

---

# 11) QA / beta audit prompt

```text
Act as a senior QA lead, product auditor, and beta release reviewer.

Your task: perform a pre-beta audit of the redesigned VPN access miniapp.

Context:
- The app must feel like a one-pager product
- The app manages access/configs, not direct VPN connection
- Core flows:
  - onboarding
  - plan selection
  - add device
  - config import instruction
  - existing user main page
  - settings page
- The goal is to identify anything that could confuse users, break trust, or reduce conversion before beta release

Audit goals:
1. Check UX clarity
2. Check consistency across states
3. Check misleading copy or metaphors
4. Check navigation friction
5. Check dead ends and missing CTAs
6. Check design drift
7. Check whether the product honestly communicates what it does

Output format:
1. Critical issues
2. High priority issues
3. Medium priority issues
4. UX clarity problems
5. Copy problems
6. Visual consistency problems
7. Edge case gaps
8. Beta launch blockers
9. Nice-to-have improvements after beta

Be brutally honest and specific.
Do not soften weak areas.
Prioritize issues by user impact.
```

---

# Critique prompt after each step

Use this after any response to force a stronger second pass.

```text
Now critique your own output as a principal product designer.
Find weak assumptions, vagueness, missing edge cases, and anything that still feels too generic for a beta release.
Then rewrite the previous output in a sharper, more implementation-ready way.
```

---

# Simplification prompt after each step

Use this to cut fluff and force a more ship-ready result.

```text
Now make this output stricter, simpler, and more mobile-first.
Remove anything non-essential for beta.
Force stronger hierarchy, fewer actions per screen, and clearer user next steps.
```

---

# Optional final synthesis prompt

Use this after all prompts are completed.

```text
Now synthesize all previous outputs into one final beta-release product spec.

Requirements:
- Preserve only decisions that are useful for beta
- Remove contradictions
- Resolve overlaps between flows, wireframes, copy, edge cases, and implementation
- Produce one coherent spec for design + frontend + QA

Output format:
1. Beta product summary
2. Final IA
3. New user flow
4. Existing user flow
5. Main page spec
6. Settings page spec
7. UX copy guidelines
8. Edge cases
9. Implementation priorities
10. Beta launch checklist

Be concise, strict, and execution-oriented.
```

---

# Recommended working method

For best results:

* Run one prompt at a time
* After each result, run:

  1. critique prompt
  2. simplification prompt
* Save only the improved version
* At the end, run the final synthesis prompt

This prevents the usual AI sludge monster:

* generic UX talk
* fake completeness
* contradictory decisions
* too many nice-to-have ideas
* beta scope creep

---

# Beta principle summary

Use these principles across all outputs:

* One clear mental model
* One primary action per state
* No fake VPN control inside miniapp
* Strong distinction between access management and connection
* Minimal navigation
* Mobile-first hierarchy
* Honest status labels
* Fewer screens, fewer branches, fewer surprises
* Beta scope over feature ambition
* Clarity beats cleverness
