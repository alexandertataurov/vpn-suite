# Specs Index

Design and architecture specifications for VPN Suite.

---

## Core Specs

| Spec | Purpose |
|------|---------|
| [as-built-architecture.md](as-built-architecture.md) | Current repo-aligned control-plane, execution-plane, trust boundaries, and loops |
| [target-architecture.md](target-architecture.md) | Target-state evolution for multi-node/operator-grade architecture |
| [ultra-spec-control-plane.md](ultra-spec-control-plane.md) | Control-plane architecture, endpoints, node modes |
| [action-orchestration-spec.md](action-orchestration-spec.md) | Action lifecycle, retries, compensation, operator visibility |
| [reconciliation-spec.md](reconciliation-spec.md) | Desired-state convergence, drift, and precedence rules |
| [agent-protocol-spec.md](agent-protocol-spec.md) | Versioned node-agent HTTP contract and runtime boundary |
| [placement-failover-spec.md](placement-failover-spec.md) | Placement inputs, drain semantics, and bounded failover scope |
| [config-delivery-spec.md](config-delivery-spec.md) | One-time token, QR, and issuance-state delivery contract |
| [config-generation-contract.md](config-generation-contract.md) | WireGuard/AmneziaWG config builder, profiles, validation |
| [telemetry-spec.md](telemetry-spec.md) | Metric → source → refresh → UI mapping |

---

## Operator Dashboard

| Spec | Purpose |
|------|---------|
| [operator-dashboard-spec.md](operator-dashboard-spec.md) | Bloomberg-style dashboard, metrics inventory, PromQL, layout |
| [operator-ui-spec.md](operator-ui-spec.md) | Top bar, sidebar, UX patterns, tokens, refinement plan |
