# API Architecture Snapshot

**Audit Date:** 2025-02-21  
**Scope:** VPN Suite Admin API (FastAPI control plane)

---

## 1. Stack

| Component | Technology |
|-----------|------------|
| **Runtime** | Python 3.12 |
| **Framework** | FastAPI |
| **Database** | PostgreSQL (asyncpg) — [backend/app/core/database.py](../backend/app/core/database.py) |
| **Cache** | Redis — rate limits, idempotency, refresh blocklist — [backend/app/core/redis_client.py](../backend/app/core/redis_client.py) |
| **External deps** | Outline (Shadowbox), optional Prometheus, optional Loki |
| **Deployment** | Docker Compose — [docker-compose.yml](../../docker-compose.yml) |
| **Reverse proxy** | Caddy (80/443 HTTP, 8443 mTLS for agent) |
| **Config** | Pydantic Settings, env vars, `.env` — [backend/app/core/config.py](../backend/app/core/config.py) |

---

## 2. Endpoint Inventory

| Method | Path | Handler | Auth |
|--------|------|---------|------|
| **Auth** |
| POST | /api/v1/auth/login | auth.login | none |
| POST | /api/v1/auth/logout | auth.logout | none |
| POST | /api/v1/auth/refresh | auth.refresh | Bearer (refresh) |
| POST | /api/v1/auth/totp/setup | auth.totp_setup | get_current_admin |
| POST | /api/v1/auth/totp/disable | auth.totp_disable | get_current_admin |
| **Log** |
| POST | /api/v1/log/frontend-error | log.log_frontend_error | none (rate-limited) |
| **Overview** |
| GET | /api/v1/overview | overview.get_overview | get_admin_or_bot |
| GET | /api/v1/overview/dashboard_timeseries | overview.get_dashboard_timeseries_endpoint | get_admin_or_bot |
| GET | /api/v1/overview/connection_nodes | overview.get_connection_nodes | get_admin_or_bot |
| **Audit** |
| GET | /api/v1/audit | audit.list_audit_logs | require_audit_read |
| **Cluster** |
| GET | /api/v1/cluster/topology | cluster.get_cluster_topology | PERM_CLUSTER_READ |
| GET | /api/v1/cluster/nodes | cluster.get_cluster_nodes | PERM_CLUSTER_READ |
| GET | /api/v1/cluster/health | cluster.get_cluster_health | PERM_CLUSTER_READ |
| POST | /api/v1/cluster/nodes/{id}/drain | cluster.drain_node | PERM_CLUSTER_WRITE |
| POST | /api/v1/cluster/nodes/{id}/undrain | cluster.undrain_node | PERM_CLUSTER_WRITE |
| POST | /api/v1/cluster/scan | cluster.cluster_scan | PERM_CLUSTER_WRITE |
| POST | /api/v1/cluster/resync | cluster.cluster_resync | PERM_CLUSTER_WRITE |
| **Control-plane** |
| GET | /api/v1/control-plane/topology/summary | control_plane.topology_summary | PERM_CLUSTER_READ |
| GET | /api/v1/control-plane/topology/graph | control_plane.topology_graph | PERM_CLUSTER_READ |
| POST | /api/v1/control-plane/placement/simulate | control_plane.placement_simulate | PERM_CLUSTER_WRITE |
| POST | /api/v1/control-plane/latency-probes | control_plane.ingest_probes | PERM_CLUSTER_WRITE |
| GET | /api/v1/control-plane/latency-probes | control_plane.get_latency_probes | PERM_CLUSTER_READ |
| POST | /api/v1/control-plane/rebalance/plan | control_plane.rebalance_plan | PERM_CLUSTER_WRITE |
| POST | /api/v1/control-plane/failover/evaluate | control_plane.failover_evaluate | PERM_CLUSTER_WRITE |
| GET | /api/v1/control-plane/ip-pools | control_plane.list_ip_pools | PERM_CLUSTER_READ |
| POST | /api/v1/control-plane/ip-pools | control_plane.create_ip_pool | PERM_CLUSTER_WRITE |
| PATCH | /api/v1/control-plane/ip-pools/{id} | control_plane.update_ip_pool | PERM_CLUSTER_WRITE |
| GET | /api/v1/control-plane/port-allocations | control_plane.list_port_allocations | PERM_CLUSTER_READ |
| POST | /api/v1/control-plane/port-allocations | control_plane.create_port_allocation | PERM_CLUSTER_WRITE |
| PATCH | /api/v1/control-plane/port-allocations/{id} | control_plane.update_port_allocation | PERM_CLUSTER_WRITE |
| GET | /api/v1/control-plane/throttling/policies | control_plane.get_throttling_policies | PERM_CLUSTER_READ |
| PUT | /api/v1/control-plane/throttling/policies/{id} | control_plane.upsert_throttling_policy | PERM_CLUSTER_WRITE |
| POST | /api/v1/control-plane/throttling/apply | control_plane.apply_throttling_now | PERM_CLUSTER_WRITE |
| GET | /api/v1/control-plane/metrics/business | control_plane.get_business_metrics | PERM_CLUSTER_READ |
| GET | /api/v1/control-plane/metrics/security | control_plane.get_security_metrics | PERM_CLUSTER_READ |
| GET | /api/v1/control-plane/metrics/anomaly | control_plane.get_anomaly_metrics | PERM_CLUSTER_READ |
| GET | /api/v1/control-plane/events | control_plane.get_control_plane_events | PERM_CLUSTER_READ |
| WS | /api/v1/control-plane/events/ws | control_plane.stream_control_plane_events | token (query) |
| GET | /api/v1/control-plane/automation/status | control_plane.get_automation_status | PERM_CLUSTER_READ |
| POST | /api/v1/control-plane/automation/run | control_plane.run_automation_now | PERM_CLUSTER_WRITE |
| **Peers** |
| GET | /api/v1/peers | peers.list_peers | PERM_CLUSTER_READ |
| GET | /api/v1/peers/{id} | peers.get_peer | PERM_CLUSTER_READ |
| POST | /api/v1/peers/{id}/migrate | peers.migrate_peer_endpoint | PERM_CLUSTER_WRITE |
| **WG** |
| POST | /api/v1/wg/peer | wg.create_wg_peer | PERM_CLUSTER_WRITE |
| DELETE | /api/v1/wg/peer/{pubkey} | wg.delete_wg_peer | PERM_CLUSTER_WRITE |
| **Servers** |
| POST | /api/v1/servers | servers.create_server | PERM_SERVERS_WRITE |
| GET | /api/v1/servers | servers.list_servers | get_admin_or_bot |
| PATCH | /api/v1/servers/bulk | servers.bulk_update_servers | PERM_SERVERS_WRITE |
| GET | /api/v1/servers/snapshots/summary | servers.get_servers_snapshots_summary | PERM_SERVERS_READ |
| GET | /api/v1/servers/device-counts | servers.get_server_device_counts | get_admin_or_bot |
| GET | /api/v1/servers/stream | servers_stream.servers_stream | PERM_SERVERS_READ |
| GET | /api/v1/servers/{id} | servers_crud.get_server | PERM_SERVERS_READ |
| PATCH | /api/v1/servers/{id} | servers_crud.update_server | PERM_SERVERS_WRITE |
| GET | /api/v1/servers/{id}/status | servers.get_server_status | PERM_SERVERS_READ |
| GET | /api/v1/servers/{id}/health | servers.get_server_health | PERM_SERVERS_READ |
| POST | /api/v1/servers/{id}/restart | servers.restart_server | PERM_SERVERS_WRITE |
| GET | /api/v1/servers/{id}/capabilities | servers.get_server_capabilities | PERM_SERVERS_READ |
| GET | /api/v1/servers/{id}/limits | servers.get_server_limits | PERM_SERVERS_READ |
| PATCH | /api/v1/servers/{id}/limits | servers.update_server_limits | PERM_SERVERS_WRITE |
| GET | /api/v1/servers/{id}/cert-status | servers_crud.get_server_cert_status | PERM_SERVERS_READ |
| GET | /api/v1/servers/{id}/ips | servers_crud.list_server_ips | PERM_SERVERS_READ |
| POST | /api/v1/servers/{id}/ips | servers_crud.create_server_ip | PERM_SERVERS_WRITE |
| PATCH | /api/v1/servers/{id}/ips/{ip_id} | servers_crud.update_server_ip | PERM_SERVERS_WRITE |
| DELETE | /api/v1/servers/{id}/ips/{ip_id} | servers_crud.delete_server_ip | PERM_SERVERS_WRITE |
| POST | /api/v1/servers/{id}/sync | servers_sync.trigger_server_sync | PERM_SERVERS_WRITE |
| GET | /api/v1/servers/{id}/sync/{job_id} | servers_sync.get_server_sync_job | PERM_SERVERS_READ |
| GET | /api/v1/servers/{id}/snapshot | servers_sync.get_server_last_snapshot | PERM_SERVERS_READ |
| POST | /api/v1/servers/{id}/actions | servers_actions.create_server_action | PERM_SERVERS_WRITE |
| GET | /api/v1/servers/{id}/actions | servers_actions.list_server_actions | PERM_SERVERS_READ |
| GET | /api/v1/servers/{id}/peers-sync | servers_peers.get_server_peers_sync | PERM_SERVERS_READ |
| POST | /api/v1/servers/{id}/peers | servers_peers.create_server_peer | PERM_SERVERS_WRITE |
| POST | /api/v1/servers/{id}/peers/{pid}/rotate | servers_peers.rotate_server_peer | PERM_SERVERS_WRITE |
| POST | /api/v1/servers/{id}/peers/{pid}/revoke | servers_peers.revoke_server_peer | PERM_SERVERS_WRITE |
| GET | /api/v1/servers/{id}/peers | servers_peers.get_server_peers | PERM_SERVERS_READ |
| POST | /api/v1/servers/{id}/peers/block | servers_peers.block_server_peer | PERM_SERVERS_WRITE |
| POST | /api/v1/servers/{id}/peers/reset | servers_peers.reset_server_peer | PERM_SERVERS_WRITE |
| GET | /api/v1/servers/telemetry/summary | servers_telemetry.get_servers_telemetry_summary | PERM_SERVERS_READ |
| GET | /api/v1/servers/{id}/logs | servers_telemetry.get_server_logs | PERM_SERVERS_READ |
| GET | /api/v1/servers/{id}/telemetry | servers_telemetry.get_server_telemetry | PERM_SERVERS_READ |
| **Actions** |
| GET | /api/v1/actions/{id} | actions.get_action_by_id | PERM_SERVERS_READ |
| **Admin configs** |
| GET | /api/v1/admin/configs/issued/{id}/content | admin_configs.get_issued_config_content | PERM_CLUSTER_READ |
| GET | /api/v1/admin/configs/{token}/download | admin_configs.download_config | token (path) |
| GET | /api/v1/admin/configs/{token}/qr | admin_configs.get_config_qr | token (path) |
| **Users** |
| POST | /api/v1/users | users.create_user | PERM_USERS_WRITE |
| GET | /api/v1/users | users.list_users | PERM_USERS_READ |
| GET | /api/v1/users/by-tg/{tg_id} | users.get_user_by_tg_id | get_admin_or_bot |
| GET | /api/v1/users/{id} | users.get_user | PERM_USERS_READ |
| PATCH | /api/v1/users/{id} | users.update_user | PERM_USERS_WRITE |
| GET | /api/v1/users/{id}/devices | users.list_user_devices | get_admin_or_bot |
| POST | /api/v1/users/{id}/devices/issue | users.issue_user_device | get_admin_or_bot |
| **Devices** |
| POST | /api/v1/devices/bulk-revoke | devices.bulk_revoke_devices | PERM_DEVICES_WRITE |
| GET | /api/v1/devices | devices.list_devices | PERM_CLUSTER_READ |
| POST | /api/v1/devices/{id}/revoke | devices.revoke_device | PERM_DEVICES_WRITE |
| POST | /api/v1/devices/{id}/suspend | devices.suspend_device | PERM_DEVICES_WRITE |
| PATCH | /api/v1/devices/{id}/limits | devices.update_device_limits | PERM_DEVICES_WRITE |
| POST | /api/v1/devices/{id}/resume | devices.resume_device | PERM_DEVICES_WRITE |
| POST | /api/v1/devices/{id}/reset | devices.reset_device | get_admin_or_bot |
| POST | /api/v1/devices/{id}/block | devices.block_device | PERM_DEVICES_WRITE |
| **Plans** |
| POST | /api/v1/plans | plans.create_plan | PERM_PLANS_WRITE |
| GET | /api/v1/plans | plans.list_plans | get_admin_or_bot |
| GET | /api/v1/plans/{id} | plans.get_plan | PERM_PLANS_READ |
| PATCH | /api/v1/plans/{id} | plans.update_plan | PERM_PLANS_WRITE |
| **Subscriptions** |
| POST | /api/v1/subscriptions | subscriptions.create_subscription | PERM_SUBSCRIPTIONS_WRITE |
| GET | /api/v1/subscriptions | subscriptions.list_subscriptions | PERM_SUBSCRIPTIONS_READ |
| GET | /api/v1/subscriptions/{id} | subscriptions.get_subscription | PERM_SUBSCRIPTIONS_READ |
| PATCH | /api/v1/subscriptions/{id} | subscriptions.update_subscription | PERM_SUBSCRIPTIONS_WRITE |
| **Agent** (X-Agent-Token; mTLS on 8443) |
| POST | /api/v1/agent/heartbeat | agent.agent_heartbeat | X-Agent-Token |
| GET | /api/v1/agent/desired-state | agent.agent_desired_state | X-Agent-Token |
| GET | /api/v1/agent/v1/status | agent.agent_v1_status | X-Agent-Token |
| GET | /api/v1/agent/v1/telemetry | agent.agent_v1_telemetry | X-Agent-Token |
| GET | /api/v1/agent/v1/peers | agent.agent_v1_peers | X-Agent-Token |
| POST | /api/v1/agent/v1/actions/execute | agent.agent_v1_actions_execute | X-Agent-Token |
| GET | /api/v1/agent/v1/actions/poll | agent.agent_v1_actions_poll | X-Agent-Token |
| POST | /api/v1/agent/v1/actions/report | agent.agent_v1_actions_report | X-Agent-Token |
| **Telemetry Docker** |
| GET | /api/v1/telemetry/docker/hosts | telemetry_docker.docker_hosts | PERM_TELEMETRY_READ |
| GET | /api/v1/telemetry/docker/containers | telemetry_docker.docker_containers | PERM_TELEMETRY_READ |
| GET | /api/v1/telemetry/docker/container/{id}/metrics | telemetry_docker.docker_container_metrics | PERM_TELEMETRY_READ |
| GET | /api/v1/telemetry/docker/container/{id}/logs | telemetry_docker.docker_container_logs | PERM_TELEMETRY_LOGS_READ |
| GET | /api/v1/telemetry/docker/alerts | telemetry_docker.docker_alerts | PERM_TELEMETRY_READ |
| **Payments** |
| GET | /api/v1/payments | payments.list_payments | PERM_PAYMENTS_READ |
| **Bot** (X-API-Key + _require_bot) |
| POST | /api/v1/bot/subscriptions/create-or-get | bot.create_or_get_subscription | bot |
| POST | /api/v1/bot/payments/{provider}/create-invoice | bot.create_invoice | bot |
| GET | /api/v1/bot/payments/{id}/invoice | bot.get_payment_invoice | bot |
| POST | /api/v1/bot/devices/{id}/revoke | bot.bot_revoke_device | bot |
| POST | /api/v1/bot/events | bot.bot_events | bot |
| GET | /api/v1/bot/referral/my-link | bot.referral_my_link | bot |
| POST | /api/v1/bot/referral/attach | bot.referral_attach | bot |
| POST | /api/v1/bot/promo/validate | bot.promo_validate | bot |
| GET | /api/v1/bot/referral/stats | bot.referral_stats | bot |
| **Webhooks** (no JWT) |
| POST | /webhooks/payments/{provider} | webhooks.payment_webhook | X-Telegram-Bot-Api-Secret-Token (telegram_stars only) |
| **Webapp** (initData / Bearer session) |
| POST | /api/v1/webapp/auth | webapp.webapp_auth | none |
| GET | /api/v1/webapp/me | webapp.webapp_me | Bearer session |
| GET | /api/v1/webapp/plans | webapp.webapp_list_plans | Bearer session |
| POST | /api/v1/webapp/devices/issue | webapp.webapp_issue_device | Bearer session |
| POST | /api/v1/webapp/devices/{id}/revoke | webapp.webapp_revoke_device | Bearer session |
| GET | /api/v1/webapp/referral/my-link | webapp.webapp_referral_my_link | Bearer session |
| GET | /api/v1/webapp/referral/stats | webapp.webapp_referral_stats | Bearer session |
| POST | /api/v1/webapp/promo/validate | webapp.webapp_promo_validate | Bearer session |
| POST | /api/v1/webapp/payments/create-invoice | webapp.webapp_create_invoice | Bearer session |
| **Outline** |
| GET | /api/v1/outline/status | outline.outline_status | PERM_OUTLINE_READ |
| GET | /api/v1/outline/server | outline.outline_server | PERM_OUTLINE_READ |
| GET | /api/v1/outline/metrics | outline.outline_metrics | PERM_OUTLINE_READ |
| PUT | /api/v1/outline/server/access-key-data-limit | outline.outline_set_server_data_limit | PERM_OUTLINE_WRITE |
| DELETE | /api/v1/outline/server/access-key-data-limit | outline.outline_delete_server_data_limit | PERM_OUTLINE_WRITE |
| PUT | /api/v1/outline/server/hostname-for-access-keys | outline.outline_set_hostname_for_keys | PERM_OUTLINE_WRITE |
| PUT | /api/v1/outline/server/port-for-new-access-keys | outline.outline_set_port_for_new_keys | PERM_OUTLINE_WRITE |
| GET | /api/v1/outline/keys | outline.outline_list_keys | PERM_OUTLINE_READ |
| GET | /api/v1/outline/keys/config | outline.outline_config_download | token (query) |
| GET | /api/v1/outline/keys/{id}/download-token | outline.outline_download_token | PERM_OUTLINE_READ |
| GET | /api/v1/outline/keys/{id}/qr | outline.outline_key_qr | PERM_OUTLINE_READ |
| POST | /api/v1/outline/keys | outline.outline_create_key | PERM_OUTLINE_WRITE |
| PATCH | /api/v1/outline/keys/{id} | outline.outline_rename_key | PERM_OUTLINE_WRITE |
| DELETE | /api/v1/outline/keys/{id} | outline.outline_revoke_key | PERM_OUTLINE_WRITE |
| PUT | /api/v1/outline/keys/{id}/data-limit | outline.outline_set_key_data_limit | PERM_OUTLINE_WRITE |
| DELETE | /api/v1/outline/keys/{id}/data-limit | outline.outline_delete_key_data_limit | PERM_OUTLINE_WRITE |

**Total:** ~120 endpoints across 24 router modules.

---

## 3. Data Contract Map

| Schema module | Location | Key types |
|---------------|----------|-----------|
| auth | backend/app/schemas/auth.py | LoginRequest, TokenResponse, LogoutRequest, TotpSetupResponse |
| server | backend/app/schemas/server.py | ServerOut, ServerList, ServerCreate, ServerBulkRequest |
| user | backend/app/schemas/user.py | UserOut, UserList, UserDetail |
| device | backend/app/schemas/device.py | DeviceOut, DeviceList, RevokeRequest, BlockRequest |
| payment | backend/app/schemas/payment.py | PaymentOut, PaymentList |
| plan | backend/app/schemas/plan.py | PlanOut, PlanList |
| subscription | backend/app/schemas/subscription.py | SubscriptionOut, SubscriptionList |
| audit | backend/app/schemas/audit.py | AuditLogOut, AuditLogList |
| agent | backend/app/schemas/agent.py | AgentHeartbeatIn, AgentDesiredStateOut |
| outline | backend/app/schemas/outline.py | OutlineStatusOut, OutlineKeyOut |
| control_plane | backend/app/schemas/control_plane.py | TopologySummaryOut, RebalancePlanOut, etc. |

**OpenAPI:** `openapi/openapi.yaml` — exported via `scripts/export_openapi.py`.  
**Shared types:** Frontend infers from OpenAPI; no explicit shared package.
