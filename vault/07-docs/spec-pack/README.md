# VPN Suite Spec Pack

Repo-ready multi-file specification set for business logic, routing, billing, devices, telemetry, admin state handling, and monetization/growth flows.

This folder consolidates the former `vpn-suite-specs/` tree inside the primary docs root.

## Included docs

- `docs/spec-pack/product/VPN-SUITE-BUSINESS-LOGIC-USERFLOWS-SPEC-V2.md`
- `docs/spec-pack/product/TELEMETRY-SCHEMA-V2.md`
- `docs/spec-pack/product/GROWTH-MONETIZATION-SPEC.md`
- `docs/spec-pack/backend/BILLING-STATE-MACHINE.md`
- `docs/spec-pack/backend/DEVICE-LIFECYCLE.md`
- `docs/spec-pack/frontend/MINIAPP-ROUTING-SPEC.md`
- `docs/spec-pack/admin/ADMIN-PANEL-STATE-MODEL.md`

## Change intent

This pack turns the product into a more explicit state-driven system:
- cleaner billing and entitlement rules,
- fewer dead-end onboarding routes,
- better retention and restore flows,
- audit-friendly immutable ledgers,
- clearer admin/operator visibility.

## Recommended implementation order

1. Billing state model and grace.
2. Mini App session routing.
3. Device lifecycle and slot replacement.
4. Telemetry v2 rollout.
5. Growth / monetization surfaces and campaigns.
6. Admin inspection and support surfaces.

## Business process docs added

```text
/docs/spec-pack/ops/BUSINESS-PROCESS-ARCHITECTURE.md
/docs/spec-pack/ops/PROCESS-MAPS-L2.md
/docs/spec-pack/growth/CRM-LIFECYCLE-AUTOMATIONS.md
/docs/spec-pack/support/SUPPORT-SAVE-PLAYBOOK.md
/docs/spec-pack/finance/REVENUE-RECONCILIATION-RULES.md
/docs/spec-pack/analytics/KPI-OPERATING-SYSTEM.md
```

These docs turn the spec pack from product logic only into a fuller operating model:
- lifecycle process architecture,
- L2 business process maps,
- CRM automations and revenue journeys,
- support + save workflows,
- finance reconciliation controls,
- KPI operating system and review cadence.
