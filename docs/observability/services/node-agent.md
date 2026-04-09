# node-agent — Observability

**Service:** Data-plane agent (reconcile, heartbeat)  
**Path:** [`apps/node-agent/`](../../apps/node-agent)  
**Port:** 9105  

## Metrics

| Endpoint | Format | Source |
|----------|--------|--------|
| `GET /metrics` | Prometheus | [`agent.py`](../../apps/node-agent/agent.py) L777 |

**Key metrics:** Heartbeat, reconciliation, peer state (from Prometheus client in agent).

## Health

`GET /healthz` — OK when recent successful cycle (L777–806).

## Logs

Minimal stdout.

## Tracing

Not planned. Metrics-only.
