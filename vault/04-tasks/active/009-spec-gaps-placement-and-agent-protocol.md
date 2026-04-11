---
status: todo
agent: cursor
files:
  - vault/04-tasks/active/009-spec-gaps-placement-and-agent-protocol.md
  - vault/01-specs/vpn-suite-tech-spec-updated.md
  - docs/specs/placement-failover-spec.md
  - docs/specs/agent-protocol-spec.md
  - vault/07-docs/specs/placement-failover-spec.md
  - vault/07-docs/specs/agent-protocol-spec.md
depends: []
---

## Goal

Close **§20.3–4** of [[01-specs/vpn-suite-tech-spec-updated]]: **placement/scheduling** (scoring, drain, failover, constraints) and **agent protocol** (heartbeat + desired-state schemas, action execute/report, telemetry contract, versioning). Cross-check with code only as references (link to routers/services), not full code change.

## Context

- Tech spec §8–9, §11, §18.4 inform breadth; stay honest about **beta** vs **target** (§19.2).

## Acceptance criteria

1. **`docs/specs/placement-failover-spec.md`** and **`docs/specs/agent-protocol-spec.md`** extended with explicit subsections for each bullet in §20.3–4; unknowns called out as open questions.
2. **`vault/07-docs/specs/`** mirrors match `docs/`.
3. Journal + **`task_done`**.

## Constraints

- No node-agent or API behavior change in this task (spec-only).

## Prompt (copy-paste to agent)

`task_next` → read files → update docs → sync vault mirror → journal → `task_done`.
