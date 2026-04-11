---
status: todo
agent: cursor
files:
  - vault/04-tasks/active/010-spec-gaps-config-delivery-and-enterprise-delta.md
  - vault/01-specs/vpn-suite-tech-spec-updated.md
  - docs/specs/config-delivery-spec.md
  - vault/07-docs/specs/config-delivery-spec.md
  - docs/specs/enterprise-hardening-delta-spec.md
  - vault/07-docs/specs/enterprise-hardening-delta-spec.md
depends: []
---

## Goal

Close **§20.5–6** of [[01-specs/vpn-suite-tech-spec-updated]]:

- **§20.5 — Config delivery:** extend **`docs/specs/config-delivery-spec.md`** with one-time token lifecycle, QR lifecycle, expiry/replay, audit (align with tech spec §10.3–10.4).
- **§20.6 — Enterprise delta:** **create** **`docs/specs/enterprise-hardening-delta-spec.md`** (new) describing what must change to move from **public beta / homelab** toward **fleet-scale commercial** posture (reference §2.3, §17.2, §13.3 gaps at high level).

## Context

- New files must exist in both **`docs/`** (repo canonical for PR review) and **`vault/07-docs/specs/`** (Obsidian mirror).
- **§21** lists “Config Delivery & Token Lifecycle” and enterprise-oriented docs as recommended next documents.

## Acceptance criteria

1. **`docs/specs/config-delivery-spec.md`** updated; mirror under **`vault/07-docs/specs/`** matches.
2. **`docs/specs/enterprise-hardening-delta-spec.md`** created with YAML frontmatter (`title`, `type: spec` or `guide`) and structured sections (gap areas: HA, policy, tenancy, SLOs, security/compliance, ops).
3. **`vault/07-docs/specs/enterprise-hardening-delta-spec.md`** identical to `docs/` copy.
4. Optional: add one line to **`docs/specs/README.md`** / vault mirror indexing the new doc (extend `files[]` if you edit those files).
5. Journal + **`task_done`**.

## Constraints

- Spec-only; no production config or infra change.

## Prompt (copy-paste to agent)

`task_next` → read tech spec + config-delivery → edit/create docs → sync `vault/07-docs/` → optional specs README → journal → `task_done`.
