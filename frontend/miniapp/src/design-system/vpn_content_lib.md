# VPN Suite · Content Library Prompt

> **Source of truth:** This document is the **canonical spec for scrollable page content only** — everything inside `.page`. Implementations (React components, CSS in `content-library.css` / `miniapp.css`) must align with the class names, token usage, and constraints defined here. The rest of the design system (tokens, theme, shell, primitives) lives in `frontend/miniapp/src/design-system/` and is loaded first; see `styles/index.css` for CSS order.
>
> **Scope:** Topbar, bottom nav, shell boilerplate, token `:root`, CSS reset, animation keyframes, and JS utilities live in the **main design system**, which must be loaded first. Font aliases `--ui` and `--mono` are defined there (miniapp-primitives-aliases.css), before content-library.css.
>
> **How to use:** Pick a page from Section 1 to understand composition intent, then assemble from the component library in Sections 2–12. Every component is self-contained — HTML + CSS + variants + state rules in one block.

---

## 0 · Page Composition Model

Every page follows this exact structure inside `.page`:

```
[Page Header]         — always first. Title + optional right-side badge.
[Hero Block]          — one per page. The dominant card for this page's primary purpose.
[Section Divider]     — labels a group of cards below it.
  [Content Cards]     — 1–N cards per section.
[Section Divider]
  [Content Cards]
...
```

`.page` handles gap (`8px`) and padding. Never add margin to the top or bottom of cards — let the flex gap do it.

**Stagger rule:** Each element in the page gets a `fadeup` entrance animation. Delays increment by `+0.04s` per element in visual order, starting at `0s` for the Page Header. The first card after the header gets `0.04s`, first section divider `0.08s`, etc. Use `animation: fadeup .4s <delay> cubic-bezier(.22,1,.36,1) both`.

---

## 1 · Page Map

Five main pages in the app (with bottom nav). Onboarding is a full-screen flow before the user reaches the app. Hero block and section structure per page below.

### Onboarding (`/onboarding`)

Pre-app flow (no nav). 3 outcome-based steps: (1) **Install AmneziaVPN** — body: download the app for your device, tap store below; store badges (App Store, Google Play). (2) **Get your config** — body: subscribe if needed → Devices → Issue device → one-time config (copy or .conf); in AmneziaVPN: Add configuration → Import file or paste; store config carefully, may appear once. Diagram: This app: Plan → Devices → Issue device → Copy/download .conf → AmneziaVPN: Add configuration → Import file or paste. CTAs: Choose plan, Go to Devices. (3) **Confirm connected** — body: once VPN connected, confirm here. CTA: I'm connected. No QR in miniapp; use import file or paste only.

### Home (`/`)
**Nav active:** Home  
**Hero:** Connection Status Card (state-driven: inactive / connecting / connected)  
**Sections:**
- *(no section label)* — Connection data grid + button row
- Quick Access — Operation rows: Connection Details, Change Server, Settings, Support

### Devices (`/devices`)
**Nav active:** Devices  
**Hero:** Device count summary (N active / N total, health bar)  
**Sections:**
- Active Devices — List rows (one per device: name, last seen, status dot, remove action)
- Add Device — Single operation row CTA

### Plan (`/plan`)
**Nav active:** Plan  
**Hero:** Active Plan Card (plan name, price, expiry bar, data cells, Renew + Manage actions)  
**Sections:**
- Available Plans — Billing toggle + Tier cards (Basic / Pro / Team)
- Usage — Progress bar rows (device slots, data, uptime)
- Billing History — Transaction list rows + see-all footer

### Support (`/support`)
**Nav active:** Support  
**Hero:** Status card showing last known connection issue (or "All clear" green state)  
**Sections:**
- Quick Help — Operation rows (FAQ, Connection Issues, Report a Bug, Contact)
- Diagnostics — Metric tile strip (ping, packet loss, DNS response)
- Recent Tickets — List rows

### Account (`/account`)
**Nav active:** Account  
**Hero:** Account summary card (avatar initial, username, email, member-since)  
**Sections:**
- Profile — Form fields (display name, email, password change)
- Preferences — Toggle rows (notifications, auto-connect, kill switch)
- Session — Operation rows (export config, revoke sessions, sign out)

---

## 2 · Page Header

First element on every page. Title on left, optional badge or action on right.

```html
<div class="page-hd">
  <div class="page-title">Devices <span>&amp; Access</span></div>
  <!-- optional right slot — choose one: -->
  <div class="page-hd-badge g">
    <div class="pulse" style="width:5px;height:5px;"></div>
    3 Online
  </div>
  <!-- OR: -->
  <button class="page-hd-btn">+ Add</button>
</div>
```

```css
.page-hd {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 2px; margin-bottom: 4px;
  animation: fadeup .4s cubic-bezier(.22,1,.36,1) both;
}
.page-title {
  font: 700 22px var(--ui); color: var(--tx-pri); line-height: 1;
}
.page-title span { color: var(--tx-mut); font-weight: 400; }

/* Badge variants — class sets semantic color */
.page-hd-badge {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 12px; border-radius: 22px;
  font: 600 9px var(--mono); letter-spacing: .12em; text-transform: uppercase;
}
.page-hd-badge.g { color: var(--green); background: var(--green-d); border: 1px solid var(--green-b); }
.page-hd-badge.b { color: var(--blue);  background: var(--blue-d);  border: 1px solid var(--blue-b);  }
.page-hd-badge.a { color: var(--amber); background: var(--amber-d); border: 1px solid var(--amber-b); }
.page-hd-badge.r { color: var(--red);   background: var(--red-d);   border: 1px solid var(--red-b);   }

/* Small action button in header right slot */
.page-hd-btn {
  height: 34px; padding: 0 14px; border-radius: 9px;
  background: var(--blue-d); border: 1px solid var(--blue-b); color: var(--blue);
  font: 600 11px var(--mono); letter-spacing: .08em; cursor: pointer;
  transition: background .14s;
}
.page-hd-btn:active { background: rgba(74,168,255,.16); }
```

---

## 3 · Hero Cards

One per page. Largest card on screen. Carries ambient glow + colored left edge accent.

### 3a · Connection Status Hero (Home page)

State-driven. All visual elements must update together when state changes — see the full state table.

```html
<div class="conn-card" id="connCard">
  <div class="card-glow" id="cardGlow"></div>
  <div class="card-body">

    <!-- Header row: status dot + title + notification bell -->
    <div class="card-header">
      <div class="status-dot" id="statusDot"></div>
      <div class="card-title-block">
        <div class="card-title" id="cardTitle">Connection inactive</div>
        <div class="card-hint" id="cardHint">Your traffic is not encrypted</div>
      </div>
      <div class="card-actions-row">
        <div class="icon-btn" style="position:relative;" onclick="ripple(event,this)">
          <svg fill="none" viewBox="0 0 18 18" stroke="currentColor" stroke-width="1.6">
            <path d="M9 2a4.5 4.5 0 0 1 4.5 4.5V9l1.5 2.5H3L4.5 9V6.5A4.5 4.5 0 0 1 9 2z"/>
            <path d="M7.5 14a1.5 1.5 0 0 0 3 0"/>
          </svg>
          <div class="notif-badge" id="notifBadge">3</div>
        </div>
        <div class="icon-btn" onclick="ripple(event,this)">
          <svg fill="none" viewBox="0 0 18 18" stroke="currentColor" stroke-width="1.6">
            <circle cx="9" cy="5" r="1.2" fill="currentColor"/>
            <circle cx="9" cy="9" r="1.2" fill="currentColor"/>
            <circle cx="9" cy="13" r="1.2" fill="currentColor"/>
          </svg>
        </div>
      </div>
    </div>

    <!-- Data grid. Config-centric: mini-app cannot control VPN connection. Current IP cell hidden when no public_ip. -->
    <div class="data-grid" style="margin-top:14px;">
      <div class="data-cell"><div class="dc-key">Server preset</div><div class="dc-val teal" id="dcServer">Fastest available</div></div>
      <div class="data-cell"><div class="dc-key">Server latency</div><div class="dc-val mut" id="dcLatency">--</div></div>
      <div class="data-cell wide"><div class="dc-key">Current IP</div><div class="dc-val ip" id="dcIp">212.58.121.102</div></div>
      <div class="data-cell"><div class="dc-key">Device last active</div><div class="dc-val mut" id="dcDuration">--</div></div>
      <div class="data-cell"><div class="dc-key">Account traffic (7 days)</div><div class="dc-val mut" id="dcTraffic">--</div></div>
      <div class="data-cell"><div class="dc-key">Protocol</div><div class="dc-val mut" id="dcProto">--</div></div>
    </div>

    <!-- Button row -->
    <div class="btn-row" style="margin-top:12px;">
      <button class="btn-primary" id="connectBtn" onclick="handleConnect()">Add device</button>
      <button class="btn-secondary" onclick="ripple(event,this)">Change Server</button>
    </div>

  </div>
</div>
```

```css
.conn-card {
  background: var(--s1); border: 1px solid var(--bd-def);
  border-radius: var(--r-lg); position: relative; overflow: hidden;
  animation: fadeup .4s .04s cubic-bezier(.22,1,.36,1) both;
}
/* Left edge accent — set color via JS when state changes */
.conn-card::before {
  content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
  border-radius: var(--r-lg) 0 0 var(--r-lg);
  background: var(--red); transition: background .5s;
}
.conn-card.s-connected::before  { background: var(--green); }
.conn-card.s-connecting::before { background: var(--amber); }

/* Ambient glow */
.card-glow {
  position: absolute; top: -100px; left: 50%; transform: translateX(-50%);
  width: 360px; height: 220px; pointer-events: none;
  transition: background .55s;
}
.card-glow.g-red   { background: radial-gradient(ellipse, rgba(232,88,88,.12) 0%, transparent 65%); }
.card-glow.g-amber { background: radial-gradient(ellipse, rgba(240,164,40,.10) 0%, transparent 65%); }
.card-glow.g-green { background: radial-gradient(ellipse, var(--green-glow) 0%, transparent 65%); }

.card-body { position: relative; padding: 18px 16px 16px 20px; }

.card-header {
  display: flex; align-items: flex-start; gap: 12px;
}
.card-title-block { flex: 1; min-width: 0; }
.card-title { font: 600 17px var(--ui); color: var(--tx-pri); line-height: 1.2; }
.card-hint  { font: 400 12px var(--ui); color: var(--tx-sec); margin-top: 3px; }
.card-actions-row { display: flex; gap: 6px; flex-shrink: 0; }
```

**Connection state table (config-centric: mini-app cannot control VPN; these reflect config/account status):**

| Element | `inactive` | `connecting` | `connected` |
|---|---|---|---|
| `.conn-card` class | *(none)* | `s-connecting` | `s-connected` |
| `.card-glow` class | `g-red` | `g-amber` | `g-green` |
| `.status-dot` class | *(none)* | `connecting` | `online` |
| `.card-title` text | `"Config inactive"` | `"Config pending"` | `"Configuration active"` |
| `.card-hint` text | `"Set up config on a device"` | `"Add device to get config"` | `"Last synced with device"` |
| `#connectBtn` class | `btn-primary` | `btn-primary warning` | *(no button)* |
| `#connectBtn` label | `"Add device"` | `"Finish setup"` | — |
| `#dcLatency` | `"--"` · `mut` | `"Testing servers…"` · `mut` | `"24ms"` · `green` |
| `#dcProto` | `"--"` · `mut` | `"AmneziaWG"` · `teal` | `"AmneziaWG"` · `teal` |
| `#dcDuration` (Device last active) | `"--"` · `mut` | `"--"` · `mut` | time ago · `teal` |
| `#dcTraffic` (Account traffic 7d) | `"--"` · `mut` | `"--"` · `mut` | accumulating · `green` |

---

### 3b · Active Plan Hero (Plan page)

```html
<div class="plan-hero">
  <div class="plan-hero-glow"></div>
  <div class="plan-hero-body">
    <div class="card-eyebrow">Current Subscription</div>
    <div class="plan-hero-header">
      <div class="plan-hero-name">
        Pro — Annual
        <span>AmneziaWG · amnezia-awg</span>
      </div>
      <div class="plan-hero-price">
        $4<sub>.99</sub>
        <div class="plan-hero-period">/ month</div>
      </div>
    </div>
    <!-- Expiry bar -->
    <div class="expiry-row">
      <div class="expiry-meta">
        <div class="expiry-lbl">Valid until</div>
        <div class="expiry-val" id="expiryVal">4 Feb 2126</div>
      </div>
      <div class="bar-track"><div class="bar-fill" id="expiryFill"></div></div>
    </div>
    <!-- Data cells -->
    <div class="data-grid three" style="margin-top:12px;">
      <div class="data-cell"><div class="dc-key">Plan ID</div><div class="dc-val teal" style="font-size:10px;cursor:pointer;" onclick="copyText(this,'32da14cc···')">32da14cc···</div></div>
      <div class="data-cell"><div class="dc-key">Devices</div><div class="dc-val amber">1 / 1</div></div>
      <div class="data-cell"><div class="dc-key">Protocol</div><div class="dc-val teal">AWG</div></div>
    </div>
    <!-- Actions -->
    <div class="btn-row-auto" style="margin-top:14px;">
      <button class="btn-primary success" onclick="ripple(event,this)">Renew Plan</button>
      <button class="btn-secondary" onclick="ripple(event,this)">Manage</button>
    </div>
  </div>
</div>
```

```css
.plan-hero {
  background: var(--s1); border: 1px solid var(--bd-def);
  border-radius: var(--r-lg); position: relative; overflow: hidden;
  animation: fadeup .4s .04s cubic-bezier(.22,1,.36,1) both;
}
.plan-hero::before {
  content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
  border-radius: var(--r-lg) 0 0 var(--r-lg); background: var(--green);
}
/* Expiry state — swap class when nearing expiry */
.plan-hero.expiring::before { background: var(--amber); }
.plan-hero.expired::before  { background: var(--red);   }

.plan-hero-glow {
  position: absolute; top: -80px; right: -60px;
  width: 280px; height: 200px; pointer-events: none;
  background: radial-gradient(ellipse, var(--green-glow) 0%, transparent 60%);
  transition: background .55s;
}
.plan-hero.expiring .plan-hero-glow { background: radial-gradient(ellipse, rgba(240,164,40,.10) 0%, transparent 60%); }
.plan-hero.expired  .plan-hero-glow { background: radial-gradient(ellipse, rgba(232,88,88,.12) 0%, transparent 60%); }

.plan-hero-body { position: relative; padding: 20px 18px 18px 22px; }

.plan-hero-header {
  display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px;
}
.plan-hero-name { font: 700 24px var(--ui); color: var(--tx-pri); line-height: 1.1; }
.plan-hero-name span { display: block; font: 400 13px var(--ui); color: var(--tx-sec); margin-top: 3px; }
.plan-hero-price {
  font: 700 26px var(--mono); color: var(--tx-pri); letter-spacing: -.02em; line-height: 1; text-align: right;
}
.plan-hero-price sub  { font: 400 12px var(--mono); color: var(--tx-sec); vertical-align: baseline; }
.plan-hero-period     { font: 400 10px var(--mono); color: var(--tx-mut); margin-top: 3px; }
```

---

### 3c · Account Summary Hero (Account page)

```html
<div class="acct-hero">
  <div class="acct-hero-body">
    <div class="acct-avatar">A</div>
    <div class="acct-info">
      <div class="acct-name">Alexander</div>
      <div class="acct-email">alex@example.com</div>
      <div class="acct-since">Member since Feb 2023</div>
    </div>
    <div class="acct-status">
      <div class="page-hd-badge g">Pro</div>
    </div>
  </div>
</div>
```

```css
.acct-hero {
  background: var(--s1); border: 1px solid var(--bd-def);
  border-radius: var(--r-lg); overflow: hidden;
  animation: fadeup .4s .04s cubic-bezier(.22,1,.36,1) both;
}
.acct-hero::before {
  content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
  border-radius: var(--r-lg) 0 0 var(--r-lg); background: var(--blue);
}
.acct-hero { position: relative; }
.acct-hero-body { display: flex; align-items: center; gap: 14px; padding: 20px 18px 20px 22px; }

.acct-avatar {
  width: 52px; height: 52px; border-radius: 16px; flex-shrink: 0;
  background: var(--blue-d); border: 1px solid var(--blue-b);
  display: flex; align-items: center; justify-content: center;
  font: 700 22px var(--mono); color: var(--blue);
}
.acct-info { flex: 1; min-width: 0; }
.acct-name  { font: 600 18px var(--ui); color: var(--tx-pri); }
.acct-email { font: 400 12px var(--mono); color: var(--tx-sec); margin-top: 2px; letter-spacing: .01em; }
.acct-since { font: 400 10px var(--mono); color: var(--tx-mut); margin-top: 3px; letter-spacing: .02em; }
.acct-status { flex-shrink: 0; }
```

---

### 3d · Generic Summary Hero

Use when the page's hero doesn't match a specific type above.

```html
<div class="summary-hero e-b">
  <div class="summary-hero-glow g-blue"></div>
  <div class="summary-hero-body">
    <div class="card-eyebrow">Support Status</div>
    <div class="summary-hero-title">All Systems Operational</div>
    <div class="summary-hero-sub">No active incidents · Last checked 2 min ago</div>
    <div class="metrics" style="margin-top:16px;">
      <!-- metric tiles go here — see Section 7 -->
    </div>
  </div>
</div>
```

```css
.summary-hero {
  background: var(--s1); border: 1px solid var(--bd-def);
  border-radius: var(--r-lg); position: relative; overflow: hidden;
  animation: fadeup .4s .04s cubic-bezier(.22,1,.36,1) both;
}
.summary-hero::before {
  content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
  border-radius: var(--r-lg) 0 0 var(--r-lg);
}
.summary-hero.e-g::before { background: var(--green); }
.summary-hero.e-b::before { background: var(--blue);  }
.summary-hero.e-a::before { background: var(--amber); }
.summary-hero.e-r::before { background: var(--red);   }

.summary-hero-glow {
  position: absolute; top: -80px; right: -40px;
  width: 260px; height: 180px; pointer-events: none;
}
.summary-hero-glow.g-green { background: radial-gradient(ellipse, var(--green-glow) 0%, transparent 60%); }
.summary-hero-glow.g-blue  { background: radial-gradient(ellipse, rgba(74,168,255,.10) 0%, transparent 60%); }
.summary-hero-glow.g-amber { background: radial-gradient(ellipse, rgba(240,164,40,.10) 0%, transparent 60%); }
.summary-hero-glow.g-red   { background: radial-gradient(ellipse, rgba(232,88,88,.12) 0%, transparent 60%); }

.summary-hero-body { position: relative; padding: 20px 18px 20px 22px; }
.summary-hero-title { font: 700 22px var(--ui); color: var(--tx-pri); margin-top: 10px; line-height: 1.2; }
.summary-hero-sub   { font: 400 13px var(--ui); color: var(--tx-sec); margin-top: 4px; }
```

---

## 4 · Section Divider

Labels a group of cards that follow. Always between the previous card and the next group.

```html
<div class="shead">
  <div class="shead-lbl">Active Devices</div>
  <div class="shead-rule"></div>
  <!-- optional count: -->
  <div class="shead-count">3 online</div>
</div>
```

```css
.shead {
  display: flex; align-items: center; gap: 10px;
  animation: fadeup .4s cubic-bezier(.22,1,.36,1) both;
}
.shead-lbl {
  font: 600 9px var(--mono); letter-spacing: .16em; text-transform: uppercase;
  color: var(--tx-mut); white-space: nowrap;
}
.shead-rule  { flex: 1; height: 1px; background: var(--bd-sub); }
.shead-count {
  font: 600 9px var(--mono); padding: 4px 10px; border-radius: 6px;
  background: var(--s2); border: 1px solid var(--bd-hi); color: var(--tx-sec);
}
```

---

## 5 · Data Cell Grid

Inset key/value grid. Lives inside cards. Used wherever compact data display is needed.

```html
<!-- 2-column (default) -->
<div class="data-grid">
  <div class="data-cell">
    <div class="dc-key">Server</div>
    <div class="dc-val teal">amnezia-awg</div>
  </div>
  <div class="data-cell">
    <div class="dc-key">Latency</div>
    <div class="dc-val mut">--</div>
  </div>
</div>

<!-- Full-width: class="data-grid wide" -->
<!-- 3-column:  class="data-grid three" -->
```

```css
.data-grid       { display: grid; grid-template-columns: 1fr 1fr;     gap: 4px; }
.data-grid.wide  { grid-template-columns: 1fr; }
.data-grid.three { grid-template-columns: 1fr 1fr 1fr; }

.data-cell {
  background: var(--s2); border: 1px solid var(--bd-sub);
  border-radius: var(--r-xs); padding: 11px 13px;
  display: flex; flex-direction: column; gap: 5px; min-height: 62px;
}
.dc-key { font: 600 8px var(--mono); letter-spacing: .12em; text-transform: uppercase; color: var(--tx-mut); }
.dc-val {
  font: 600 15px var(--mono); color: var(--tx-pri);
  letter-spacing: -.01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.dc-val.teal  { color: var(--teal); }
.dc-val.green { color: var(--green); }
.dc-val.amber { color: var(--amber); }
.dc-val.red   { color: var(--red); }
.dc-val.mut   { color: var(--tx-mut); letter-spacing: .04em; }  /* empty/null state */
.dc-val.ip    { font-size: 17px; letter-spacing: -.02em; }      /* IP addresses */
```

---

## 6 · Operation Row

Full-width tappable list item. Icon + title + description + chevron. Used for navigation, CTAs, and settings links.

```html
<div class="op e-b" onclick="ripple(event,this)" role="button" tabindex="0">
  <div class="op-ico b">
    <svg fill="none" viewBox="0 0 20 20" stroke="currentColor" stroke-width="1.6">
      <!-- 20×20 icon -->
    </svg>
  </div>
  <div class="op-body">
    <div class="op-name">Connection Details</div>
    <div class="op-desc">View logs and session info</div>
  </div>
  <div class="op-chev">
    <svg fill="none" viewBox="0 0 14 14" stroke="currentColor" stroke-width="2">
      <path d="M5 2l4 5-4 5"/>
    </svg>
  </div>
</div>
```

```css
.ops { display: flex; flex-direction: column; gap: 4px; }

.op {
  display: flex; align-items: center; gap: 14px;
  padding: 15px 16px 15px 18px;
  background: var(--s1); border: 1px solid var(--bd-def);
  border-radius: var(--r-md); position: relative; overflow: hidden;
  cursor: pointer; min-height: 70px;
  transition: background .12s, border-color .12s;
}
.op::before {
  content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
  border-radius: var(--r-md) 0 0 var(--r-md);
}
.op.e-g::before { background: var(--green); }
.op.e-b::before { background: var(--blue);  }
.op.e-a::before { background: var(--amber); }
.op.e-r::before { background: var(--red);   }
.op:active { background: var(--s2); border-color: var(--bd-hi); }

.op-ico {
  width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; border: 1px solid;
}
.op-ico.g { background: var(--green-d); border-color: var(--green-b); color: var(--green); }
.op-ico.b { background: var(--blue-d);  border-color: var(--blue-b);  color: var(--blue);  }
.op-ico.a { background: var(--amber-d); border-color: var(--amber-b); color: var(--amber); }
.op-ico.r { background: var(--red-d);   border-color: var(--red-b);   color: var(--red);   }
.op-ico svg { width: 20px; height: 20px; }

.op-body { flex: 1; min-width: 0; }
.op-name { font: 600 16px var(--ui); color: var(--tx-pri); margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.op-desc { font: 400 13px var(--ui); color: var(--tx-sec); }

.op-chev {
  width: 28px; height: 28px; border-radius: 8px; flex-shrink: 0;
  background: var(--s2); border: 1px solid var(--bd-sub);
  display: flex; align-items: center; justify-content: center; color: var(--tx-mut);
}
.op-chev svg { width: 13px; height: 13px; }
.op:active .op-chev { background: var(--s3); color: var(--tx-sec); }
```

**Stagger entrance for a list of operation rows:**

```css
/* Set per-item in HTML via inline style or JS */
.op:nth-child(1) { animation: fadeup .4s .00s cubic-bezier(.22,1,.36,1) both; }
.op:nth-child(2) { animation: fadeup .4s .04s cubic-bezier(.22,1,.36,1) both; }
.op:nth-child(3) { animation: fadeup .4s .08s cubic-bezier(.22,1,.36,1) both; }
.op:nth-child(4) { animation: fadeup .4s .12s cubic-bezier(.22,1,.36,1) both; }
```

---

## 7 · Metric Tile Strip

Three-up KPI display. Used in heroes and standalone cards.

```html
<div class="metrics">
  <div class="m-tile">
    <div class="m-key">Uptime</div>
    <div class="m-val g">99.8<span class="m-unit">%</span></div>
    <div class="m-sub">Last 30 days</div>
  </div>
  <div class="m-tile">
    <div class="m-key">Latency</div>
    <div class="m-val b">24<span class="m-unit">ms</span></div>
    <div class="m-sub">avg this session</div>
  </div>
  <div class="m-tile">
    <div class="m-key">Traffic</div>
    <div class="m-val w">2.4<span class="m-unit">GB</span></div>
    <div class="m-sub">this cycle</div>
  </div>
</div>
```

```css
.metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3px; }

.m-tile {
  background: var(--s1); border: 1px solid var(--bd-def);
  border-radius: var(--r-md); padding: 16px 14px;
  display: flex; flex-direction: column; gap: 5px;
}
/* When inside a card (hero body), use --s2 background */
.card-body .m-tile,
.summary-hero-body .m-tile { background: var(--s2); border-color: var(--bd-sub); }

.m-key  { font: 600 8px var(--mono); letter-spacing: .13em; text-transform: uppercase; color: var(--tx-mut); }
.m-val  { font: 700 21px var(--mono); letter-spacing: -.02em; line-height: 1; }
.m-val.g { color: var(--green); }
.m-val.b { color: var(--blue);  }
.m-val.a { color: var(--amber); }
.m-val.r { color: var(--red);   }
.m-val.w { color: var(--tx-pri); }
.m-unit { font: 400 11px var(--mono); color: var(--tx-mut); }
.m-sub  { font: 400 9px var(--mono); color: var(--tx-mut); letter-spacing: .03em; }
```

---

## 8 · Progress Bar

Named bar track with animated fill. Used in hero cards and usage sections.

```html
<div class="expiry-row">
  <div class="expiry-meta">
    <div class="expiry-lbl">Valid until</div>
    <div class="expiry-val">4 Feb 2126</div>
  </div>
  <div class="bar-track">
    <div class="bar-fill ok" id="someFill"></div>
  </div>
</div>
```

```css
.expiry-row  { display: flex; flex-direction: column; gap: 0; margin-bottom: 14px; }
.expiry-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.expiry-lbl  { font: 600 9px var(--mono); letter-spacing: .10em; text-transform: uppercase; color: var(--tx-mut); }
.expiry-val  { font: 500 11px var(--mono); color: var(--green); }

.bar-track { height: 4px; background: var(--s4); border-radius: 3px; overflow: hidden; }
.bar-fill  {
  height: 100%; border-radius: 3px;
  transition: width 1.4s cubic-bezier(.22,1,.36,1); width: 0;
}
.bar-fill.ok   { background: var(--green); }
.bar-fill.warn { background: var(--amber); }
.bar-fill.crit { background: var(--red);   }
.bar-fill.info { background: var(--blue);  }
```

**Color rules:**

| Fill % | Class | Meaning |
|---|---|---|
| 0–79% | `ok` | healthy |
| 80–99% | `warn` | approaching limit |
| 100% | `crit` | at limit or overdue |
| any | `info` | informational (e.g. progress on setup) |

**Always animate on load with delay:**

```js
window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('someFill').style.width = '72%';
  }, 380);
});
```

---

## 9 · List Row

Generic list item. Used for devices, tickets, transactions, settings lines. More compact than an Operation Row.

```html
<!-- Device list row -->
<div class="list-row" onclick="ripple(event,this)">
  <div class="lr-ico b">
    <svg fill="none" viewBox="0 0 18 18" stroke="currentColor" stroke-width="1.6"><!-- icon --></svg>
  </div>
  <div class="lr-body">
    <div class="lr-title">iPhone 14 Pro</div>
    <div class="lr-sub">Last seen · 2 min ago</div>
  </div>
  <div class="lr-right">
    <div class="status-dot online"></div>
  </div>
</div>

<!-- Transaction list row -->
<div class="list-row">
  <div class="lr-ico g"><!-- card icon --></div>
  <div class="lr-body">
    <div class="lr-title">Pro — Annual</div>
    <div class="lr-sub lr-mono">04 Feb 2025 · #INV-2025-001</div>
  </div>
  <div class="lr-right lr-right-col">
    <div class="lr-amount">$59.88</div>
    <div class="status-chip paid">Paid</div>
  </div>
</div>
```

```css
/* Container — wrap rows in .list-card -->
.list-card {
  background: var(--s1); border: 1px solid var(--bd-def);
  border-radius: var(--r-lg); overflow: hidden;
}
.list-card-title {
  font: 600 11px var(--mono); letter-spacing: .12em; text-transform: uppercase;
  color: var(--tx-sec); padding: 16px 18px 12px;
}

.list-row {
  display: flex; align-items: center; gap: 12px;
  padding: 13px 16px; cursor: pointer; position: relative; overflow: hidden;
  border-top: 1px solid var(--bd-sub);
  transition: background .12s;
}
.list-row:first-of-type { border-top: none; }
.list-row:active { background: var(--s2); }

.lr-ico {
  width: 38px; height: 38px; border-radius: 11px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; border: 1px solid;
}
.lr-ico svg { width: 16px; height: 16px; }
.lr-ico.g { background: var(--green-d); border-color: var(--green-b); color: var(--green); }
.lr-ico.b { background: var(--blue-d);  border-color: var(--blue-b);  color: var(--blue);  }
.lr-ico.a { background: var(--amber-d); border-color: var(--amber-b); color: var(--amber); }
.lr-ico.r { background: var(--red-d);   border-color: var(--red-b);   color: var(--red);   }
.lr-ico.n { background: var(--s2);      border-color: var(--bd-sub);  color: var(--tx-mut);}

.lr-body   { flex: 1; min-width: 0; }
.lr-title  { font: 600 15px var(--ui); color: var(--tx-pri); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lr-sub    { font: 400 12px var(--ui); color: var(--tx-sec); margin-top: 2px; }
.lr-mono   { font: 400 11px var(--mono); letter-spacing: .02em; }  /* for IDs, dates */

.lr-right      { flex-shrink: 0; display: flex; align-items: center; gap: 8px; }
.lr-right-col  { flex-direction: column; align-items: flex-end; gap: 3px; }
.lr-amount     { font: 600 14px var(--mono); color: var(--tx-pri); letter-spacing: -.01em; }
```

---

## 10 · Status Chip

Inline badge. Used in list rows, card headers, and page headers.

```html
<div class="status-chip paid">Paid</div>
<div class="status-chip pend">Pending</div>
<div class="status-chip active">Active</div>
<div class="status-chip offline">Offline</div>
```

```css
.status-chip {
  display: inline-flex; align-items: center;
  font: 600 8px var(--mono); letter-spacing: .10em; text-transform: uppercase;
  padding: 3px 7px; border-radius: 5px; border: 1px solid; white-space: nowrap;
}
.status-chip.active  { color: var(--green); background: var(--green-d); border-color: var(--green-b); }
.status-chip.paid    { color: var(--green); background: var(--green-d); border-color: var(--green-b); }
.status-chip.info    { color: var(--blue);  background: var(--blue-d);  border-color: var(--blue-b);  }
.status-chip.pend    { color: var(--amber); background: var(--amber-d); border-color: var(--amber-b); }
.status-chip.offline { color: var(--red);   background: var(--red-d);   border-color: var(--red-b);   }
```

---

## 11 · Buttons

### Primary

```html
<button class="btn-primary" onclick="ripple(event,this)">Connect</button>
<button class="btn-primary danger">Disconnect</button>
<button class="btn-primary warning">Connecting…</button>
<button class="btn-primary success">Renew Plan</button>
```

```css
.btn-primary {
  height: 58px; border-radius: var(--r-md);
  background: var(--blue-d); border: 1px solid var(--blue-b); color: var(--blue);
  font: 700 14px var(--ui);
  display: flex; align-items: center; justify-content: center; gap: 9px;
  cursor: pointer; width: 100%;
  transition: background .15s, transform .1s;
}
.btn-primary:active      { background: rgba(74,168,255,.16); transform: scale(.98); }
.btn-primary.danger      { background: var(--red-d);   border-color: var(--red-b);   color: var(--red);   }
.btn-primary.danger:active  { background: rgba(232,88,88,.16); transform: scale(.98); }
.btn-primary.warning     { background: var(--amber-d); border-color: var(--amber-b); color: var(--amber); }
.btn-primary.warning:active { background: rgba(240,164,40,.16); transform: scale(.98); }
.btn-primary.success     { background: var(--green-d); border-color: var(--green-b); color: var(--green); }
.btn-primary.success:active { background: rgba(46,216,122,.14); transform: scale(.98); }
.btn-primary svg { width: 18px; height: 18px; flex-shrink: 0; }
```

### Secondary

```html
<button class="btn-secondary" onclick="ripple(event,this)">Change Server</button>
```

```css
.btn-secondary {
  height: 58px; border-radius: var(--r-md);
  background: var(--s2); border: 1px solid var(--bd-def); color: var(--tx-sec);
  font: 600 14px var(--ui);
  display: flex; align-items: center; justify-content: center; gap: 9px;
  cursor: pointer; transition: background .15s, transform .1s;
}
.btn-secondary:active { background: var(--s3); transform: scale(.98); }
.btn-secondary svg { width: 16px; height: 16px; flex-shrink: 0; }
```

### Button Row Layouts

```html
<!-- 2-column equal split -->
<div class="btn-row">
  <button class="btn-primary">Connect</button>
  <button class="btn-secondary">Change Server</button>
</div>

<!-- 1fr + auto (wide primary + compact secondary) -->
<div class="btn-row-auto">
  <button class="btn-primary success">Renew Plan</button>
  <button class="btn-secondary" style="width:auto;padding:0 18px;">Manage</button>
</div>
```

```css
.btn-row      { display: grid; grid-template-columns: 1fr 1fr;  gap: 8px; }
.btn-row-auto { display: grid; grid-template-columns: 1fr auto; gap: 8px; }
```

---

## 12 · Form & Settings Widgets

Used on Account and Support pages for editable fields and toggle settings.

### Form Field

```html
<div class="field-group">
  <div class="field-label">Display Name</div>
  <div class="field-wrap">
    <input class="field-input" type="text" value="Alexander" placeholder="Your name">
    <div class="field-action">
      <svg fill="none" viewBox="0 0 16 16" stroke="currentColor" stroke-width="1.6">
        <path d="M11 2.5l2.5 2.5L5 13.5H2.5V11L11 2.5z"/>
      </svg>
    </div>
  </div>
</div>
```

```css
.field-group  { display: flex; flex-direction: column; gap: 7px; }
.field-label  { font: 600 9px var(--mono); letter-spacing: .12em; text-transform: uppercase; color: var(--tx-mut); padding: 0 2px; }
.field-wrap   { display: flex; align-items: center; position: relative; }
.field-input  {
  flex: 1; height: 52px; padding: 0 48px 0 14px;
  background: var(--s2); border: 1px solid var(--bd-def);
  border-radius: var(--r-md); color: var(--tx-pri);
  font: 400 15px var(--ui); outline: none;
  transition: border-color .14s;
}
.field-input:focus  { border-color: var(--bd-hi); }
.field-input::placeholder { color: var(--tx-mut); }
.field-action {
  position: absolute; right: 0; top: 0; bottom: 0; width: 48px;
  display: flex; align-items: center; justify-content: center;
  color: var(--tx-sec); cursor: pointer;
}
.field-action svg { width: 15px; height: 15px; }
.field-action:active { color: var(--blue); }
```

### Settings Card (fields grouped inside a card)

```html
<div class="settings-card">
  <div class="field-group"><!-- field --></div>
  <div class="settings-divider"></div>
  <div class="field-group"><!-- field --></div>
</div>
```

```css
.settings-card {
  background: var(--s1); border: 1px solid var(--bd-def);
  border-radius: var(--r-lg); padding: 18px;
  display: flex; flex-direction: column; gap: 14px;
}
.settings-divider { height: 1px; background: var(--bd-sub); }
```

### Toggle Row

```html
<div class="toggle-setting">
  <div class="ts-body">
    <div class="ts-name">Auto-Connect</div>
    <div class="ts-desc">Connect automatically on untrusted networks</div>
  </div>
  <div class="ts-toggle on" onclick="toggleSetting(this)" role="switch" aria-checked="true">
    <div class="ts-knob"></div>
  </div>
</div>
```

```css
.toggle-setting {
  display: flex; align-items: center; gap: 14px;
  padding: 15px 16px; min-height: 64px;
  background: var(--s1); border: 1px solid var(--bd-def);
  border-radius: var(--r-md);
}
.ts-body { flex: 1; min-width: 0; }
.ts-name { font: 600 15px var(--ui); color: var(--tx-pri); }
.ts-desc { font: 400 12px var(--ui); color: var(--tx-sec); margin-top: 2px; }

.ts-toggle {
  width: 44px; height: 26px; border-radius: 13px; flex-shrink: 0;
  background: var(--s3); border: 1px solid var(--bd-def); position: relative;
  cursor: pointer; transition: background .2s, border-color .2s;
}
.ts-toggle.on { background: var(--green-d); border-color: var(--green-b); }
.ts-knob {
  position: absolute; top: 3px; left: 3px;
  width: 18px; height: 18px; border-radius: 50%;
  background: var(--tx-mut); transition: transform .2s, background .2s;
}
.ts-toggle.on .ts-knob { transform: translateX(18px); background: var(--green); }
```

```js
function toggleSetting(el) {
  const on = el.classList.toggle('on');
  el.setAttribute('aria-checked', on);
}
```

### Segmented Control

Used for 2–3 mutually exclusive options (e.g. billing period, view mode).

```html
<div class="seg-toggle">
  <div class="seg-btn" onclick="setSeg('monthly',this)">Monthly</div>
  <div class="seg-btn on" onclick="setSeg('annual',this)">
    Annual<span class="seg-tag">−20%</span>
  </div>
</div>
```

```css
.seg-toggle {
  display: flex; background: var(--s2); border: 1px solid var(--bd-def);
  border-radius: 10px; padding: 3px; gap: 2px;
}
.seg-btn {
  padding: 8px 14px; border-radius: 8px; cursor: pointer;
  font: 600 11px var(--mono); letter-spacing: .08em; text-transform: uppercase;
  color: var(--tx-mut); border: 1px solid transparent; user-select: none;
  transition: background .15s, color .15s, border-color .15s;
}
.seg-btn.on { background: var(--s3); color: var(--tx-pri); border-color: var(--bd-hi); }
.seg-tag    { margin-left: 5px; font-size: 8px; color: var(--green); vertical-align: middle; }
```

---

## 13 · Card Footer Link

A "see all" or "view more" row at the bottom of a list card. Tappable, full-width.

```html
<div class="card-footer-link" onclick="ripple(event,this)">
  View all transactions
  <svg fill="none" viewBox="0 0 14 14" stroke="currentColor" stroke-width="2">
    <path d="M2 7h10M8 4l3 3-3 3"/>
  </svg>
</div>
```

```css
.card-footer-link {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 14px 0; border-top: 1px solid var(--bd-sub);
  font: 600 11px var(--mono); letter-spacing: .10em; text-transform: uppercase;
  color: var(--blue); cursor: pointer;
  transition: color .12s; position: relative; overflow: hidden;
}
.card-footer-link:active { color: var(--tx-sec); }
.card-footer-link svg { width: 12px; height: 12px; }
```

---

## 14 · Eyebrow Label

Small uppercase mono label used above hero titles and card section headers.

```html
<div class="card-eyebrow">Current Subscription</div>
```

```css
.card-eyebrow {
  font: 600 9px var(--mono); letter-spacing: .15em; text-transform: uppercase;
  color: var(--tx-mut); margin-bottom: 10px;
}
```

---

## 15 · Notification Badge

Floating counter on an icon button.

```html
<div class="icon-btn" style="position:relative;">
  <!-- bell SVG -->
  <div class="notif-badge" id="notifBadge">3</div>
</div>
```

```css
.notif-badge {
  position: absolute; top: -4px; right: -4px;
  width: 16px; height: 16px; border-radius: 50%;
  background: var(--red); border: 2px solid var(--s1);
  font: 700 8px var(--mono); color: #fff;
  display: flex; align-items: center; justify-content: center;
  transition: transform .15s, opacity .15s;
}
.notif-badge.hidden { transform: scale(0); opacity: 0; }
```

---

## 16 · Tier Card (Plan comparison)

Used on the Plan page to present subscription options.

```html
<div class="tier-card" onclick="selectTier(this,'pro')" data-tier="pro">
  <!-- optional: current plan indicator -->
  <div class="tier-badge">Current plan</div>

  <div class="tier-body">
    <div class="tier-top">
      <div class="tier-info">
        <div class="tier-name">Pro</div>
        <div class="tier-desc">Power users · up to 3 devices</div>
      </div>
      <div class="tier-pricing">
        <div class="tier-price" data-monthly="5.99" data-annual="4.99">$4<sub>.99</sub></div>
        <div class="tier-orig">$5.99</div><!-- hidden on monthly -->
        <div class="tier-period">/ month, billed annually</div>
      </div>
    </div>

    <!-- Feature rows -->
    <div class="tier-features">
      <div class="feat-row">
        <div class="feat-ico yes"><!-- checkmark SVG --></div>
        <div class="feat-text"><b>3</b> connected devices</div>
        <div class="feat-val">3 slots</div>
      </div>
      <div class="feat-row">
        <div class="feat-ico no"><!-- × SVG --></div>
        <div class="feat-text" style="color:var(--tx-dim);">Admin panel</div>
      </div>
    </div>

    <button class="tier-select-btn">Select Pro</button>
  </div>
</div>
```

```css
.tier-card {
  background: var(--s1); border: 1px solid var(--bd-def);
  border-radius: var(--r-lg); position: relative; overflow: hidden;
  cursor: pointer;
  transition: border-color .15s, transform .12s;
}
.tier-card::before {
  content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
  border-radius: var(--r-lg) 0 0 var(--r-lg);
  background: var(--bd-def); transition: background .2s;
}
.tier-card.selected::before,
.tier-card.featured::before { background: var(--blue); }
.tier-card.selected,
.tier-card.featured         { border-color: var(--blue-b); }
.tier-card:active           { transform: scale(.99); }

.tier-badge {
  position: absolute; top: 14px; right: 14px;
  font: 600 8px var(--mono); letter-spacing: .12em; text-transform: uppercase;
  padding: 4px 9px; border-radius: 6px;
  background: var(--blue-d); border: 1px solid var(--blue-b); color: var(--blue);
}
.tier-body { padding: 18px 16px 16px 20px; }

.tier-top  { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 14px; }
.tier-info { flex: 1; min-width: 0; }
.tier-name { font: 600 17px var(--ui); color: var(--tx-pri); margin-bottom: 3px; }
.tier-desc { font: 400 12px var(--ui); color: var(--tx-sec); line-height: 1.4; }

.tier-pricing   { text-align: right; flex-shrink: 0; padding-left: 12px; }
.tier-price     { font: 700 22px var(--mono); color: var(--tx-pri); letter-spacing: -.02em; line-height: 1; }
.tier-price sub { font: 400 11px var(--mono); color: var(--tx-sec); vertical-align: baseline; }
.tier-orig      { font: 400 11px var(--mono); color: var(--tx-dim); text-decoration: line-through; margin-top: 2px; }
.tier-period    { font: 400 10px var(--mono); color: var(--tx-mut); text-align: right; margin-top: 2px; }

.tier-features { display: flex; flex-direction: column; gap: 2px; margin-bottom: 14px; }
.feat-row  { display: flex; align-items: center; gap: 10px; padding: 9px 11px; border-radius: var(--r-xs); background: var(--s2); border: 1px solid var(--bd-sub); }
.feat-ico  { width: 20px; height: 20px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
.feat-ico svg   { width: 14px; height: 14px; }
.feat-ico.yes   { color: var(--green); }
.feat-ico.no    { color: var(--tx-dim); }
.feat-text      { font: 400 13px var(--ui); color: var(--tx-sec); flex: 1; }
.feat-text b    { font-weight: 600; color: var(--tx-pri); }
.feat-val       { font: 600 11px var(--mono); color: var(--teal); letter-spacing: .02em; }

.tier-select-btn {
  width: 100%; height: 48px; border-radius: var(--r-md);
  background: var(--s2); border: 1px solid var(--bd-def); color: var(--tx-sec);
  font: 600 13px var(--ui);
  display: flex; align-items: center; justify-content: center; gap: 8px;
  cursor: pointer; transition: background .15s, border-color .15s, color .15s;
}
.tier-card.selected .tier-select-btn,
.tier-card.featured .tier-select-btn {
  background: var(--blue-d); border-color: var(--blue-b); color: var(--blue);
}
.tier-select-btn svg { width: 16px; height: 16px; flex-shrink: 0; }
```

---

## 17 · Shared Utilities

### Status Dot

```css
.status-dot {
  width: 14px; height: 14px; border-radius: 50%; flex-shrink: 0;
  background: var(--red); transition: background .5s, box-shadow .5s;
}
.status-dot.online     { background: var(--green); box-shadow: 0 0 12px 2px var(--green-glow); animation: pulse-ring 2.2s ease infinite; }
.status-dot.connecting { background: var(--amber); animation: connecting-pulse 1s ease infinite; }
```

### Icon Button

```css
.icon-btn {
  width: 44px; height: 44px; border-radius: 11px; flex-shrink: 0;
  background: var(--s2); border: 1px solid var(--bd-def);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: var(--tx-sec);
  transition: background .14s, color .14s;
}
.icon-btn:active { background: var(--s3); }
.icon-btn svg { width: 16px; height: 16px; }
```

### Tap-to-copy helper

```js
function copyText(el, fullText) {
  navigator.clipboard?.writeText(fullText).catch(() => {});
  const orig = el.textContent;
  el.textContent = 'copied ✓';
  el.style.color = 'var(--green)';
  setTimeout(() => { el.textContent = orig; el.style.color = ''; }, 1600);
}
```

---

## 18 · Content-Level Constraints

These complement the global hard constraints in the main system prompt.

```
✗  Data cell with --mono font replaced by --ui for any value
✗  Any .dc-val color that is not a semantic token or --tx-pri/sec/mut
✗  Status chip without all three triplet properties (color + bg + border)
✗  Tier card selected state that only updates one of: border / ::before / .tier-select-btn
✗  Billing toggle that updates price but not strikethrough and period label simultaneously
✗  Progress bar width set immediately on DOM load (must use setTimeout ≥ 380ms)
✗  Progress bar fill class mismatched with the count/label color class beside it
✗  Operation row height below 70px
✗  Toggle setting row height below 64px (it is a touch target)
✗  .tier-select-btn height below 44px
✗  List row without border-top: 1px solid var(--bd-sub) between items
✗  Card footer link missing position:relative and overflow:hidden (ripple needs it)
✗  Eyebrow label using --ui font (must be --mono, uppercase, tracked)
✗  Metric tile .m-val using --ui font (must be --mono)
✗  Hero card placed after an operation row (hero is always first content after page-hd)
✗  Section divider placed before the first card without a section label
✗  Page header missing animation: fadeup on first load
✗  Connection state change that skips any row in Section 3a state table
```