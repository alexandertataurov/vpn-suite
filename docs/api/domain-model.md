# Domain model

Tables and relationships (SQLAlchemy models in `backend/app/models/`). Migrations in `backend/alembic/versions/`.

## ER (summary)

- **roles** → **admin_users** (RBAC)
- **admin_users** → **audit_logs** (actor)
- **servers** → **server_profiles**, **server_health_logs**, **devices**
- **users** → **subscriptions**, **devices**, **payments**
- **plans** → **subscriptions**
- **subscriptions** → **devices**, **payments**
- **devices** → **profile_issues**
- **payments** → **payment_events**
- **users** → **funnel_events** (optional user_id)

## Entities

| Table | Purpose |
|-------|--------|
| **roles** | RBAC: name, permissions (JSON array; `*` = all). |
| **admin_users** | Admin panel users: email, password_hash, role_id. |
| **audit_logs** | Who (admin_id), action, resource_type, resource_id, old_new (JSON), created_at. admin_id may be "bot" or "system". |
| **servers** | VPN execution nodes registry: name/container, region, api_endpoint (`docker://...` for discovered containers), public_key, status, is_active; traffic_limit_gb, speed_limit_mbps, max_connections. |
| **server_profiles** | Request templates per server: name, dns (JSON), request_params (JSON). |
| **server_health_logs** | Health-check history: server_id, status, latency_ms, handshake_ok, ts. |
| **users** | End-users: tg_id (unique), email, phone, meta (JSON), is_banned. |
| **plans** | Tariffs: name, duration_days, price_currency, price_amount. |
| **subscriptions** | user_id, plan_id, valid_from, valid_until, device_limit, status. |
| **devices** | Issued profiles: user_id, subscription_id, server_id, device_name, public_key, config_amnezia_hash, issued_at, revoked_at. |
| **profile_issues** | Per-device config issue history (version, issued_at). |
| **payments** | provider, user_id, subscription_id, status, amount, currency, external_id (unique), webhook_payload (JSON). |
| **payment_events** | payment_id, event_type, payload (JSON). |
| **funnel_events** | user_id (nullable), event_type (start/payment/issue/renewal), payload (JSON). |

## Conventions

- IDs: `String(32)` (uuid4 hex) for most; `BigInteger` auto-increment for users, audit_logs.
- Timestamps: `created_at` (DateTime timezone=True) via TimestampMixin.
- Control-plane runtime model: node metadata in DB + runtime control via `NodeRuntimeAdapter` (`docker exec ... wg ...`).
