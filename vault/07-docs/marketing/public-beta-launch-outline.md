# Public Beta Launch Outline — VPN Suite

Status: **Planned Public Beta**, targeting homelab / power users running their own AmneziaWG clusters.

This document turns the high-level release strategy into concrete assets and checklists.

---

## 1. Target Persona & Positioning

- **Primary persona:** technically capable homelab / small-ops operator who:
  - Already runs or wants to run AmneziaWG/WireGuard.
  - Is comfortable with Docker and basic Linux ops.
  - Wants a *single control plane* for servers, devices, telemetry, and subscriptions.

**Positioning statement:**

> **VPN Suite is a self-hosted AmneziaWG control plane with a built-in Telegram sales gateway, observability, and runbooks for serious homelab operators.**

Key talking points:

- End-to-end bundle: admin API + UI, Telegram bot, node-agent, observability.
- Amnezia-first, operator-focused (not \"yet another generic zero-trust SaaS\").
- Strong docs and runbooks for real incidents and growth.

---

## 2. Channels & Tactics

**Primary channels:**

1. **GitHub & docs**
   - High-signal `README.md` (who this is for, status: Public Beta, quickstart for Ubuntu LTS).
   - Clear links to: install guide, hardening reference, and troubleshooting.
2. **Communities**
   - Self-hosting and homelab channels (e.g. `/r/selfhosted`, `/r/homelab`) with honest \"Public Beta\" post.
   - Selected privacy / VPN forums where self-hosted stacks are welcome.
3. **Influencers**
   - 2–3 YouTube / blog creators who cover homelab VPN setups; provide them with:
     - A clean reference VM image / script.
     - A walk-through of admin UI + bot + observability.
4. **Telegram**
   - Public operator channel for announcements.
   - (Optional) Support group for Q&A and incident coordination.

---

## 3. Core Assets Checklist

### 3.1 README & Landing

- `README.md`
  - [ ] **Who this is for**: homelab / small-ops, not generic consumer VPN users.
  - [ ] **Release status**: clearly say \"Public Beta\" and current limitations.
  - [ ] Link to:
    - [[07-docs/ops/install-ubuntu-lts|docs/ops/install-ubuntu-lts.md]]
    - [[07-docs/ops/hardening-reference-ubuntu|docs/ops/hardening-reference-ubuntu.md]]
    - [[07-docs/ops/runbook|docs/ops/runbook.md]]
- Landing page (can be GitHub Pages or static site):
  - [ ] Short hero statement + 3-value bullets.
  - [ ] Screenshot(s) of admin dashboard and Telegram bot.
  - [ ] Links to install, docs, and repo.

### 3.2 Install & Ops Docs

- [ ] First-install guide (Ubuntu LTS) — done: [[07-docs/ops/install-ubuntu-lts|docs/ops/install-ubuntu-lts.md]].
- [ ] Hardening baseline (Ubuntu LTS) — done: [[07-docs/ops/hardening-reference-ubuntu|docs/ops/hardening-reference-ubuntu.md]].
- [ ] Pointer from Ops guide and docs index — done.

### 3.3 Demo Video Script (Outline)

Structure for a **5–7 minute** demo:

1. **Intro (30–45s)**
   - Problem: stitching together VPN nodes, billing, and observability.
   - What VPN Suite provides in one stack.
2. **Install & Login (1–2 min)**
   - Show `git clone`, `.env` config highlights, `./manage.sh up-core`, `./manage.sh migrate`, `./manage.sh seed`.
   - First login into Admin UI.
3. **Attach Node & Issue Device (2–3 min)**
   - Brief view of a node running node-agent (agent mode).
   - Create a test user and issue a device.
   - Download AWG config and connect from client.
4. **Telemetry & Ops (1–2 min)**
   - Overview dashboard: servers, peers, health.
   - Quick look at Grafana (Prometheus metrics).
5. **Closing (30–45s)**
   - What’s production-ready vs experimental.
   - Where to get docs, support, and how to give feedback.

### 3.4 Announcement Post (Outline)

**Title idea:**  
“Announcing VPN Suite Public Beta: AmneziaWG Control Plane for Homelab Operators”

Sections:

1. **Why we built this** — pain of DIY VPN stacks (billing, telemetry, day-2 ops).
2. **What it is** — control plane, admin UI, Telegram bot, observability.
3. **Who it’s for (and not for)** — explicit persona and exclusions.
4. **What’s ready today** — highlight MVP and stability; call out known gaps.
5. **How to get started** — link to Ubuntu LTS install, hardening, docs.
6. **How to give feedback** — GitHub issues + Telegram operator channel.

---

## 4. Community & Early Adopter Program

**Early adopters:**

- Criteria:
  - Runs at least one real VPN node with non-trivial peers.
  - Willing to file issues and share anonymized metrics or stories.
- Offer:
  - Priority on bugfixes during Beta.
  - Direct access to maintainer(s) via private Telegram or email.

**Ambassadors:**

- Trusted homelab community members who:
  - Write guides, translate docs, or produce content.
  - Help answer questions in support channels.
- Recognition:
  - Mention in `CONTRIBUTORS`, README, or website.

---

## 5. Launch Day Checklist (Public Beta)

- [ ] README, docs, and install guide up-to-date on `main` and tagged release.
- [ ] `./manage.sh verify` green on CI.
- [ ] At least one reference deployment hardened and running under light real traffic.
- [ ] Grafana dashboards confirm:
  - control plane healthy,
  - telemetry pipeline functioning,
  - alerts sane (no constant noise).
- [ ] Announcement post drafted and proofread.
- [ ] Demo video recorded and uploaded (unlisted or public).
- [ ] Support surfaces (GitHub + Telegram) ready with clear guidelines.

