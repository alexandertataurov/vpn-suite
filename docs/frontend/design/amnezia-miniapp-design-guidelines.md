# AmneziaVPN Mini App — Design Guidelines

> This document is the single source of truth for the AmneziaVPN Telegram Mini App UI.
> Reference it when generating new screens, components, or states.

---

## 0. Theme behavior

**Amnezia tokens apply only when `data-theme="consumer-light"`.** The file `theme/amnezia.css` overrides consumer-light tokens (warm gray bg `#f2f2ef`, near-black primary button, no shadows, borders for depth). When the user has dark mode (`consumer-dark`), the standard consumer-dark palette is used; Amnezia spec does not define a dark variant. See `docs/frontend/design/THEME-RUNTIME.md` for runtime theme flow.

---

## 1. Product context

This is a **Telegram Mini App** that handles subscription sales and device management only.
The VPN connection itself runs in the **native AmneziaVPN iOS/Android app** — this Mini App never shows connect/disconnect controls, server selection, or traffic stats beyond what's on a purchased plan.

**User flows this app owns:**
- Browse and purchase a plan
- Add / remove / view devices
- View and renew subscription
- Invite friends (referral)

**User flows this app does NOT own:**
- Connecting to VPN (→ native app)
- Server selection (→ native app)
- Live traffic or session data (→ native app)

---

## 2. Design tokens

### 2.1 Colors

```css
:root {
  /* Surfaces */
  --bg:           #f2f2ef;   /* page / screen background */
  --white:        #ffffff;   /* card surface */

  /* Borders */
  --border:       rgba(0,0,0,0.07);   /* default subtle border */
  --border-med:   rgba(0,0,0,0.11);   /* interactive elements, stronger dividers */

  /* Text */
  --text:         #111110;   /* primary — near-black, warm undertone */
  --text2:        #63625f;   /* secondary — body copy, row labels */
  --text3:        #a8a7a3;   /* tertiary — placeholders, metadata, eyebrows */

  /* Semantic: success */
  --green:        #166534;
  --green-bg:     #f0fdf4;
  --green-border: rgba(22,101,52,0.14);

  /* Semantic: warning */
  --amber:        #92400e;
  --amber-bg:     #fffbeb;
  --amber-border: rgba(146,64,14,0.15);

  /* Semantic: error / expired */
  --red:          #991b1b;
  --red-bg:       #fef2f2;
  --red-border:   rgba(153,27,27,0.15);
}
```

**Outer page background** (behind the phone frame): `#e6e6e3`

### 2.2 Border radius

```css
--r:    14px;   /* cards, banners, hero containers */
--r-sm: 10px;   /* row icons, small buttons, banner icons */
```

### 2.3 Spacing

| Token | Value | Usage |
|---|---|---|
| Page padding H | 16px | Left/right content padding |
| Page padding top | 24px | Top content padding |
| Page padding bottom | 110px | Bottom padding (clears the demo toggle) |
| Card gap | 8px | Vertical gap between all stacked cards |
| Card padding | 18px | Internal card padding |
| Row item V padding | 13px | Top/bottom padding inside list rows |
| Row item H padding | 16px | Left/right padding inside list rows |
| Profile margin-bottom | 20px | Space below profile row before hero |

### 2.4 Elevation

No drop shadows. Depth is expressed through borders only:

```css
/* Default card */
border: 1px solid var(--border);

/* Interactive elements (buttons, pills) */
border: 1px solid var(--border-med);
```

---

## 3. Typography

**Font family:** `Inter` (Google Fonts), weights 400 / 500 / 600 / 700
**Antialiasing:** `-webkit-font-smoothing: antialiased` on `body`

| Role | Size | Weight | Tracking | Color |
|---|---|---|---|---|
| Profile name | 15px | 600 | -0.3px | `--text` |
| Plan name (hero) | 28px | 700 | -0.8px | `--text` |
| Plan eyebrow | 10px | 500 | 0.6px + uppercase | `--text3` |
| Plan subtitle | 12.5px | 400 | -0.1px | `--text3` |
| Stat value | 19px | 700 | -0.5px | `--text` |
| Stat label | 9px | 600 | 0.7px + uppercase | `--text3` |
| Stat dim (`/ 5`) | 13px | 400 | — | `--text3` |
| Hero title (new user) | 20px | 700 | -0.5px | `--text` |
| Hero description | 13px | 400 | — | `--text2`, lh 1.6 |
| Badge / pill text | 11px | 600 | 0.2px | varies |
| Row label | 13.5px | 500 | -0.2px | `--text` |
| Row subtitle | 11.5px | 400 | — | `--text3` |
| Banner title | 13px | 600 | -0.2px | semantic color |
| Banner subtitle | 11.5px | 400 | — | `--text3`, lh 1.45 |
| Button (primary) | 14px | 600 | -0.2px | white |
| Button (secondary) | 13.5px | 500 | — | `--text2` |
| Small CTA pill | 12px | 600 | — | `--text` |
| Help text | 12px | 400 | — | `--text3` |
| Help link | 12px | 500 | — | `--text2`, underline |
| Avatar initials | 11.5px | 700 | 0.2px | `#065f46` |

---

## 4. Components

### 4.1 Profile row

```
Layout: flex row, align-items center, gap 10px, margin-bottom 20px

Avatar
  Size: 38 × 38px, border-radius 50%
  Background: linear-gradient(140deg, #bbf7d0 0%, #99f6e4 100%)
  Initials: 11.5px/700, color #065f46

Name: flex:1, 15px/600, --text, tracking -0.3px

Plan/status chip: see Pill chip component below

Settings button
  Size: 34 × 34px, border-radius 50%
  Background: --white, border: 1px solid --border-med
  Icon: 14 × 14px gear SVG, color --text3
  Hover: color --text2
```

### 4.2 Pill chip (profile row badge)

```css
display: inline-flex; align-items: center; gap: 4px;
border: 1px solid var(--border-med);
border-radius: 100px;
font-size: 11px; font-weight: 600; letter-spacing: 0.2px;
padding: 4px 11px;
background: var(--white);
color: var(--text2);
white-space: nowrap; line-height: 1;
```

**Variants:**

| State | Text | Text color | Background | Border |
|---|---|---|---|---|
| No plan | `Beta` | `--text3` | `--white` | `--border` |
| Active plan | `PRO` | `--text2` | `--white` | `--border-med` |
| Expiring | `PRO · 14d left` | `--amber` | `--amber-bg` | `--amber-border` |
| Expired | `Expired` | `--red` | `--red-bg` | `--red-border` |

### 4.3 Plan hero card

Structure: white card, `border-radius: var(--r)`, `overflow: hidden`, divided into two zones by a hairline.

```
┌─────────────────────────────────┐
│  plan-body  (padding 18px)      │
│  ┌─────────────────┐  ┌───────┐ │
│  │ YOUR PLAN       │  │Active │ │
│  │ Pro             │  └───────┘ │
│  │ 5 devices · ann │           │
│  └─────────────────┘           │
├─────────────────────────────────┤  ← border-top: 1px solid --border
│  plan-stats  (3-column grid)    │
│  DEVICES  │  RENEWS   │ TRAFFIC │
│  2 / 5    │  Apr 1    │ ∞       │
└─────────────────────────────────┘
```

**Status badge inside card:**

```css
display: inline-flex; align-items: center; gap: 5px;
font-size: 11px; font-weight: 600; letter-spacing: 0.1px;
padding: 4px 10px; border-radius: 100px;
border: 1px solid transparent;
```

| State | Text | Color | Background | Border |
|---|---|---|---|---|
| Active | `● Active` | `--green` | `--green-bg` | `--green-border` |
| Expiring | `● Expiring` | `--amber` | `--amber-bg` | `--amber-border` |
| Expired | `○ Expired` | `--red` | `--red-bg` | `--red-border` |

Dot: 5 × 5px circle. Active and Expiring dots animate with `blink` (opacity 1 → 0.3). Expired dot is static, opacity 0.5.

**Stats strip:**

```
3-column CSS grid. No outer padding — each cell has padding: 14px 0 14px 18px.
Column dividers: border-left: 1px solid var(--border) on p-stat + p-stat.
Stat label: 9px/600, uppercase, tracking 0.7px, --text3.
Stat value: 19px/700, tracking -0.5px, --text.
  - Dim fraction: 13px/400, --text3 (e.g. " / 5")
  - Expiring: color --amber
  - Expired: color --red
```

When plan is expired, the "Renews" label becomes "Expired".

### 4.4 Renewal banner

Appears below the plan card in **Expiring** and **Expired** states.

```css
border-radius: var(--r);
padding: 13px 15px;
display: flex; align-items: center; gap: 12px;
margin-bottom: 8px;
cursor: pointer;
transition: filter 0.15s;
border: 1px solid transparent;
```

```
Layout: [icon 34px] [body: flex:1] [chevron]

Icon wrap: 34 × 34px, border-radius: var(--r-sm)
  warn  → bg rgba(146,64,14,0.09), color --amber, warning triangle icon
  danger → bg rgba(153,27,27,0.09), color --red, refresh icon

Title: 13px/600, tracking -0.2px, semantic color
Sub:   11.5px/400, --text3, lh 1.45

Hover: filter: brightness(0.97)
```

| State | Background | Border | Title color |
|---|---|---|---|
| Expiring (warn) | `--amber-bg` | `--amber-border` | `--amber` |
| Expired (danger) | `--red-bg` | `--red-border` | `--red` |

### 4.5 List row item

Used inside `.card-row` containers. Multiple rows separated by `border-bottom: 1px solid var(--border)`.

```
Layout: flex row, align-items center, gap 13px, padding 13px 16px
Active state: background var(--bg)

[icon wrap] [body: flex:1] [right side]

Icon wrap: 36 × 36px, border-radius: var(--r-sm)
  Background: var(--bg), border: 1px solid var(--border)
  SVG icon: 15 × 15px, color: --text2

Body:
  Label: 13.5px/500, --text, tracking -0.2px
  Sub:   11.5px/400, --text3, margin-top 1.5px

Right side: flex row, gap 8px, flex-shrink: 0
  Optional badge (see badge variants)
  Chevron: 13 × 13px, color --text3, stroke-width 2.5
```

### 4.6 Badges (inline)

```css
font-size: 10.5px; font-weight: 600; letter-spacing: 0.1px;
padding: 2.5px 8px; border-radius: 100px;
border: 1px solid transparent;
```

| Variant | Text | Color | Background | Border |
|---|---|---|---|---|
| `badge-amber` | `14d left` | `--amber` | `--amber-bg` | `--amber-border` |
| `badge-red` | `Renew` | `--red` | `--red-bg` | `--red-border` |

### 4.7 Primary button

```css
width: 100%;
padding: 14px;
background: var(--text);
color: white;
border: none;
border-radius: var(--r-sm);
font-size: 14px; font-weight: 600; letter-spacing: -0.2px;
display: flex; align-items: center; justify-content: center; gap: 7px;
transition: opacity 0.15s;
margin-bottom: 8px; /* when stacked above secondary */
```

Hover: `opacity: 0.82`
Inline SVG icon: 14 × 14px

### 4.8 Secondary button

```css
width: 100%;
padding: 13px;
background: transparent;
color: var(--text2);
border: 1px solid var(--border-med);
border-radius: var(--r-sm);
font-size: 13.5px; font-weight: 500;
transition: border-color 0.15s, color 0.15s;
```

Hover: `border-color: var(--text3); color: var(--text)`

### 4.9 No-device callout

Inline horizontal card shown when a user has paid but hasn't added a device yet.

```
Background: --white, border: 1px solid --border, border-radius: var(--r)
Padding: 16px 18px
Layout: flex row, align-items center, gap 14px

[icon wrap 40px] [body: flex:1] [CTA pill]

Icon wrap: 40 × 40px, border-radius: var(--r-sm)
  Background: --bg, border: 1px solid --border
  SVG: 20 × 20px monitor, stroke-width 1.75, --text3

Body:
  Title: 14px/600, --text, tracking -0.2px
  Sub:   12px/400, --text3, margin-top 2px

CTA pill button:
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 12px; font-weight: 600; color: --text;
  background: --bg; border: 1px solid --border-med;
  border-radius: 100px; padding: 6px 12px;
  flex-shrink: 0; white-space: nowrap;
  Hover: filter: brightness(0.95)
```

### 4.10 New-user hero

Centered card shown when no plan is purchased.

```
Background: --white, border: 1px solid --border, border-radius: var(--r)
Padding: 40px 24px 28px
text-align: center

Shield icon: 44 × 44px, color --text3, stroke-width 1.25, margin-bottom 18px
Title: 20px/700, --text, tracking -0.5px, margin-bottom 7px
Description: 13px/400, --text2, lh 1.6, max-width 210px centered, margin-bottom 24px

Primary button (full width)
Secondary button (full width)
```

### 4.11 Help text

```css
text-align: center;
margin-top: 20px;
font-size: 12px;
color: var(--text3);

a {
  color: var(--text2);
  font-weight: 500;
  text-decoration: underline;
  text-decoration-color: var(--border-med);
  text-underline-offset: 2px;
}
a:hover { color: var(--text); }
```

---

## 5. Screen states

### State 1 — New user (no plan)

Profile chip: Beta (neutral)
Hero: New-user hero card with shield icon + "Setup Required"
Below: Devices row (empty state), Invite Friends row, help text
Primary CTA: "Choose a Plan →"

### State 2 — No device (paid, no device added)

Profile chip: PRO (default)
Hero: Plan card (Active badge, normal renew date)
Below plan card: No-device callout (inline prompt to add device)
Below that: Subscription row, Invite Friends row, help text

### State 3 — Active (healthy)

Profile chip: PRO (default)
Hero: Plan card (Active badge, normal renew date)
Below: Manage Devices row + Subscription row grouped, Invite Friends row, help text

### State 4 — Expiring (≤14 days until renewal)

Profile chip: `PRO · 14d left` (amber)
Hero: Plan card (Expiring badge, stat shows amber "14d")
Below plan card: Renewal banner (warn / amber)
Below: Manage Devices + Subscription rows (with `14d left` badge on Subscription), Invite Friends, help text

### State 5 — Expired

Profile chip: `Expired` (red)
Hero: Plan card (Expired badge, stat label "Expired", stat value red "Mar 10")
Below plan card: Renewal banner (danger / red)
Below: Manage Devices ("access paused" subtitle) + Renew Subscription row (with `Renew` badge), Invite Friends, help text

---

## 6. Animations

```css
/* Mount animation — applied to all top-level sections */
@keyframes up {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Usage — stagger via animation-delay */
.profile-row      { animation: up 0.3s 0.00s ease both; }
.hero-card        { animation: up 0.3s 0.04s ease both; }
.renewal-banner   { animation: up 0.3s 0.08s ease both; }
.card-row         { animation: up 0.3s 0.00s ease both; }
.help             { animation: up 0.3s 0.20s ease both; }

/* Status dot pulse */
@keyframes blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.3; }
}
/* Active dot: blink 2.5s ease-in-out infinite */
/* Expiring dot: blink 2s ease-in-out infinite */
/* Expired dot: no animation, opacity 0.5 */
```

No other animations. No hover transforms on cards. No scale, bounce, or float effects.

---

## 7. Icons

All icons are inline SVG (Lucide-style), `fill="none"`, `stroke="currentColor"`.

| Icon | Size in rows | Size in banners | Stroke width |
|---|---|---|---|
| Monitor (devices) | 15 × 15px | 20 × 20px (callout) | 2 / 1.75 |
| Box (subscription) | 15 × 15px | — | 2 |
| People (invite) | 15 × 15px | — | 2 |
| Warning triangle | — | 16 × 16px | 2 |
| Refresh | — | 16 × 16px | 2 |
| Chevron right | 13 × 13px | 13 × 13px | 2.5 |
| Arrow right | 14 × 14px (button) | — | 2.5 |
| Gear | 14 × 14px | — | 2 |
| Shield | 44 × 44px (hero) | — | 1.25 |
| Plus | 13 × 13px | — | 2.5 |

---

## 8. Rules — what not to do

- **No drop shadows.** Depth comes from borders only.
- **No colored primary buttons.** The primary button is always `var(--text)` (near-black). Color is reserved for semantic states only.
- **No VPN connect/disconnect UI.** This app does not control the VPN.
- **No "Open AmneziaVPN" deep-link card.** Removed from design — not the Mini App's job.
- **No hover background on rows.** Use `:active` (mobile-appropriate). `:hover` is allowed only in desktop previews.
- **No gradients on cards.** Backgrounds are flat white.
- **No more than 2 font weights in a single component.** Pick from 400/500, 500/600, or 600/700.
- **No inline `style=` overrides** except for the Beta chip neutral color variant (acceptable one-off).
