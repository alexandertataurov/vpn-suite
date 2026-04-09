# Placement, Scheduling, and Failover Spec

Spec for deterministic peer placement and bounded failover evaluation.

## Scope

This document covers what the next 1-2 releases must formalize. It does not commit the platform to automatic peer migration.

## Placement inputs

Placement logic should treat the following as first-class inputs:

- node health score
- drain state
- active status
- free capacity relative to `max_connections`
- explicit plan/profile/region compatibility
- optional latency signal when available
- explicit pool/port availability where required

## Deterministic decision order

1. Exclude nodes that are disabled, unreachable, or not active.
2. Exclude nodes that violate hard constraints:
   - plan incompatibility
   - profile incompatibility
   - region policy mismatch
   - required pool or port unavailable
3. Exclude draining nodes for new placements.
4. Score remaining nodes deterministically.
5. Tie-break by stable ordering, such as node id.

## Recommended scoring shape

The exact formula can evolve, but the next-release contract should include:

- health contribution
- free-capacity contribution
- latency penalty, if signal is fresh enough
- drain penalty that effectively excludes new placements

## Drain behavior

- Draining nodes stop receiving new peers.
- Existing peers remain until explicitly reissued, revoked, or migrated by a future workflow.
- Reconcile loops continue to maintain desired state for already-assigned peers unless policy says otherwise.
- Operator surfaces must clearly display draining state.

## Failover scope for current horizon

Current release horizon supports:

- failover evaluation
- operator planning outputs
- health-based exclusion from new placement

Current release horizon does not require:

- automatic cross-node migration
- transparent client config replacement without operator/user involvement

## Future target-state note

Automatic multi-node failover belongs to a later phase after action orchestration, convergence rules, and versioned agent capabilities are stable.
