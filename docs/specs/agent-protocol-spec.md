# Agent Protocol Spec

Versioned contract for control-plane and node-agent interaction.

## Transport and auth

- Primary deployed transport: HTTPS.
- Auth boundary: mTLS at the reverse proxy plus `X-Agent-Token` in the API.
- Public node management APIs are out of bounds.
- Agent protocol changes must preserve mixed-version rollout safety.

## Current endpoint set

| Endpoint | Purpose |
|----------|---------|
| `POST /api/v1/agent/heartbeat` | Report node identity, runtime metadata, status, counts |
| `GET /api/v1/agent/desired-state` | Fetch desired peers and related node state |
| `GET /api/v1/agent/v1/status` | Fetch node status contract |
| `GET /api/v1/agent/v1/telemetry` | Fetch telemetry-related data |
| `GET /api/v1/agent/v1/peers` | Fetch peer list contract |
| `GET /api/v1/agent/v1/actions/poll` | Poll queued actions |
| `POST /api/v1/agent/v1/actions/execute` | Mark action execution start/progress |
| `POST /api/v1/agent/v1/actions/report` | Report action result |

## Required protocol fields

### Heartbeat

The current repo already treats the following as key heartbeat dimensions:

- `server_id`
- runtime container or node identity
- interface name
- node public key
- listen port
- peer counts and traffic totals
- health score and status
- `agent_version`
- timestamp

### Desired state

Desired state responses must identify:

- target node
- desired peers
- relevant profile/addressing material needed for reconcile
- drain/maintenance state when applicable
- protocol or schema version

### Actions

Action payloads must include:

- unique action id
- action type
- server target
- correlation or replay-safe identifier
- payload schema version

### Telemetry and peers

Telemetry and peer listing contracts must be explicit about freshness and whether they represent desired state, runtime state, or both.

## Versioning rules

- Treat the HTTP path plus payload schema version as the contract boundary.
- New optional fields may be added without breaking older agents.
- Removing or renaming fields requires a compatibility window.
- Control plane must remain tolerant of one agent version behind during rollout.
- Unsupported agent capabilities must fail closed with explicit errors, not silent downgrades.

## Runtime boundary rules

- Node mutation happens locally on the node host.
- Runtime adapters may use local `wg`/`awg` or `docker exec`, but only behind the documented adapter boundary.
- Interface names must be discovered, never assumed.
- Sensitive materials such as private keys must never be emitted to logs or metrics.

## Failure classes

Every protocol consumer should classify failures into:

- auth or trust failure
- schema or validation failure
- temporary transport failure
- node runtime failure
- unsupported capability
- stale or superseded action

These classes drive retry, timeout, and compensation behavior.
