# Current API Surface (Code + Runtime Config)

This table is generated from FastAPI routes, bot/node-agent HTTP handlers, and reverse-proxy routing. It reflects *code truth*; docs differences are flagged.

**Legend:** `UNDOCUMENTED` = in code but not in canonical OpenAPI (`docs/api/openapi.yaml`). `STALE` = in OpenAPI but not in code.

| Service | Method | Path | Auth Required | Request Type | Response Type | File Location |
|---|---|---|---|---|---|---|
| admin-api | GET | `/api/telemetry/docker/alerts` | JWT (admin) | — | AlertItemListOut | `backend/app/api/v1/telemetry_docker.py` |
| admin-api | GET | `/api/telemetry/docker/container/{container_id}/logs` | JWT (admin) | — | ContainerLogLineListOut | `backend/app/api/v1/telemetry_docker.py` |
| admin-api | GET | `/api/telemetry/docker/container/{container_id}/metrics` | JWT (admin) | — | ContainerMetricsTimeseries | `backend/app/api/v1/telemetry_docker.py` |
| admin-api | GET | `/api/telemetry/docker/containers` | JWT (admin) | — | ContainerSummaryListOut | `backend/app/api/v1/telemetry_docker.py` |
| admin-api | GET | `/api/telemetry/docker/hosts` | JWT (admin) | — | HostSummaryListOut | `backend/app/api/v1/telemetry_docker.py` |
| admin-api | GET | `/api/v1/_debug/metrics-targets` | JWT (admin) | — | raw JSON | `backend/app/api/v1/overview.py` |
| admin-api | GET | `/api/v1/actions/{action_id}` | JWT (admin) | — | ActionOut | `backend/app/api/v1/actions.py` |
| admin-api | GET | `/api/v1/admin/configs/issued/{issued_config_id}/content` | JWT (admin) | — | raw JSON | `backend/app/api/v1/admin_configs.py` |
| admin-api | GET | `/api/v1/admin/configs/{token}/download` | None | — | raw JSON | `backend/app/api/v1/admin_configs.py` |
| admin-api | GET | `/api/v1/admin/configs/{token}/qr` | None | — | raw JSON | `backend/app/api/v1/admin_configs.py` |
| admin-api | GET | `/api/v1/agent/desired-state` | mTLS + X-Agent-Token | — | AgentDesiredStateOut | `backend/app/api/v1/agent.py` |
| admin-api | POST | `/api/v1/agent/heartbeat` | mTLS + X-Agent-Token | AgentHeartbeatIn | AgentAckOut | `backend/app/api/v1/agent.py` |
| admin-api | POST | `/api/v1/agent/v1/actions/execute` | mTLS + X-Agent-Token | AgentV1ActionExecuteIn | raw JSON | `backend/app/api/v1/agent.py` |
| admin-api | GET | `/api/v1/agent/v1/actions/poll` | mTLS + X-Agent-Token | — | AgentV1ActionPollOut | `backend/app/api/v1/agent.py` |
| admin-api | POST | `/api/v1/agent/v1/actions/report` | mTLS + X-Agent-Token | AgentV1ActionReportIn | raw JSON | `backend/app/api/v1/agent.py` |
| admin-api | GET | `/api/v1/agent/v1/peers` | mTLS + X-Agent-Token | — | list | `backend/app/api/v1/agent.py` |
| admin-api | GET | `/api/v1/agent/v1/status` | mTLS + X-Agent-Token | — | AgentV1StatusOut | `backend/app/api/v1/agent.py` |
| admin-api | GET | `/api/v1/agent/v1/telemetry` | mTLS + X-Agent-Token | — | AgentV1TelemetryOut | `backend/app/api/v1/agent.py` |
| admin-api | GET | `/api/v1/analytics/metrics/kpis` | JWT (admin) | — | MetricsKpisOut | `backend/app/api/v1/analytics.py` |
| admin-api | GET | `/api/v1/analytics/telemetry/services` | JWT (admin) | — | TelemetryServicesOut | `backend/app/api/v1/analytics.py` |
| admin-api | GET | `/api/v1/audit` | JWT (admin) | — | AuditLogList | `backend/app/api/v1/audit.py` |
| admin-api | POST | `/api/v1/auth/login` | None | LoginRequest | TokenResponse | `backend/app/api/v1/auth.py` |
| admin-api | POST | `/api/v1/auth/logout` | Refresh token in body | LogoutRequest | raw JSON | `backend/app/api/v1/auth.py` |
| admin-api | POST | `/api/v1/auth/refresh` | Bearer refresh token | — | TokenResponse | `backend/app/api/v1/auth.py` |
| admin-api | POST | `/api/v1/auth/totp/disable` | JWT (admin) | — | raw JSON | `backend/app/api/v1/auth.py` |
| admin-api | POST | `/api/v1/auth/totp/setup` | JWT (admin) | — | TotpSetupResponse | `backend/app/api/v1/auth.py` |
| admin-api | POST | `/api/v1/bot/devices/{device_id}/revoke` | JWT (admin) or X-API-Key (bot) or WebApp session | BotRevokeDeviceRequest | raw JSON | `backend/app/api/v1/bot.py` |
| admin-api | POST | `/api/v1/bot/events` | JWT (admin) or X-API-Key (bot) or WebApp session | BotEventRequest | raw JSON | `backend/app/api/v1/bot.py` |
| admin-api | GET | `/api/v1/bot/payments/{payment_id}/invoice` | JWT (admin) or X-API-Key (bot) or WebApp session | — | CreateInvoiceResponse | `backend/app/api/v1/bot.py` |
| admin-api | POST | `/api/v1/bot/payments/{provider}/create-invoice` | JWT (admin) or X-API-Key (bot) or WebApp session | CreateInvoiceRequest | CreateInvoiceResponse | `backend/app/api/v1/bot.py` |
| admin-api | POST | `/api/v1/bot/promo/validate` | JWT (admin) or X-API-Key (bot) or WebApp session | PromoValidateRequest | raw JSON | `backend/app/api/v1/bot.py` |
| admin-api | POST | `/api/v1/bot/referral/attach` | JWT (admin) or X-API-Key (bot) or WebApp session | ReferralAttachRequest | raw JSON | `backend/app/api/v1/bot.py` |
| admin-api | GET | `/api/v1/bot/referral/my-link` | JWT (admin) or X-API-Key (bot) or WebApp session | — | raw JSON | `backend/app/api/v1/bot.py` |
| admin-api | GET | `/api/v1/bot/referral/stats` | JWT (admin) or X-API-Key (bot) or WebApp session | — | raw JSON | `backend/app/api/v1/bot.py` |
| admin-api | POST | `/api/v1/bot/subscriptions/create-or-get` | JWT (admin) or X-API-Key (bot) or WebApp session | CreateOrGetSubscriptionRequest | CreateOrGetSubscriptionResponse | `backend/app/api/v1/bot.py` |
| admin-api | GET | `/api/v1/cluster/health` | JWT (admin) | — | raw JSON | `backend/app/api/v1/cluster.py` |
| admin-api | GET | `/api/v1/cluster/nodes` | JWT (admin) | — | raw JSON | `backend/app/api/v1/cluster.py` |
| admin-api | POST | `/api/v1/cluster/nodes/{node_id}/drain` | JWT (admin) | app.api.v1.cluster.DrainBody | None | raw JSON | `backend/app/api/v1/cluster.py` |
| admin-api | POST | `/api/v1/cluster/nodes/{node_id}/undrain` | JWT (admin) | — | raw JSON | `backend/app/api/v1/cluster.py` |
| admin-api | POST | `/api/v1/cluster/resync` | JWT (admin) | app.api.v1.cluster.ResyncBody | None | raw JSON | `backend/app/api/v1/cluster.py` |
| admin-api | POST | `/api/v1/cluster/scan` | JWT (admin) | — | raw JSON | `backend/app/api/v1/cluster.py` |
| admin-api | GET | `/api/v1/cluster/topology` | JWT (admin) | — | raw JSON | `backend/app/api/v1/cluster.py` |
| admin-api | POST | `/api/v1/control-plane/automation/run` | JWT (admin) | app.schemas.control_plane.AutomationRunRequest | None | AutomationRunOut | `backend/app/api/v1/control_plane.py` |
| admin-api | GET | `/api/v1/control-plane/automation/status` | JWT (admin) | — | AutomationStatusOut | `backend/app/api/v1/control_plane.py` |
| admin-api | GET | `/api/v1/control-plane/events` | JWT (admin) | — | ControlPlaneEventListOut | `backend/app/api/v1/control_plane.py` |
| admin-api | POST | `/api/v1/control-plane/failover/evaluate` | JWT (admin) | — | FailoverEvaluateOut | `backend/app/api/v1/control_plane.py` |
| admin-api | GET | `/api/v1/control-plane/ip-pools` | JWT (admin) | — | IpPoolListOut | `backend/app/api/v1/control_plane.py` |
| admin-api | POST | `/api/v1/control-plane/ip-pools` | JWT (admin) | IpPoolCreate | IpPoolOut | `backend/app/api/v1/control_plane.py` |
| admin-api | PATCH | `/api/v1/control-plane/ip-pools/{pool_id}` | JWT (admin) | IpPoolUpdate | IpPoolOut | `backend/app/api/v1/control_plane.py` |
| admin-api | GET | `/api/v1/control-plane/latency-probes` | JWT (admin) | — | LatencyProbeListOut | `backend/app/api/v1/control_plane.py` |
| admin-api | POST | `/api/v1/control-plane/latency-probes` | JWT (admin) | LatencyProbeBatchIn | LatencyProbeIngestOut | `backend/app/api/v1/control_plane.py` |
| admin-api | GET | `/api/v1/control-plane/metrics/anomaly` | JWT (admin) | — | AnomalyMetricsOut | `backend/app/api/v1/control_plane.py` |
| admin-api | GET | `/api/v1/control-plane/metrics/business` | JWT (admin) | — | BusinessMetricsOut | `backend/app/api/v1/control_plane.py` |
| admin-api | GET | `/api/v1/control-plane/metrics/security` | JWT (admin) | — | SecurityMetricsOut | `backend/app/api/v1/control_plane.py` |
| admin-api | POST | `/api/v1/control-plane/placement/simulate` | JWT (admin) | PlacementSimulateRequest | PlacementSimulationOut | `backend/app/api/v1/control_plane.py` |
| admin-api | GET | `/api/v1/control-plane/port-allocations` | JWT (admin) | — | PortAllocationListOut | `backend/app/api/v1/control_plane.py` |
| admin-api | POST | `/api/v1/control-plane/port-allocations` | JWT (admin) | PortAllocationCreate | PortAllocationOut | `backend/app/api/v1/control_plane.py` |
| admin-api | PATCH | `/api/v1/control-plane/port-allocations/{allocation_id}` | JWT (admin) | PortAllocationUpdate | PortAllocationOut | `backend/app/api/v1/control_plane.py` |
| admin-api | POST | `/api/v1/control-plane/rebalance/plan` | JWT (admin) | RebalancePlanRequest | RebalancePlanOut | `backend/app/api/v1/control_plane.py` |
| admin-api | POST | `/api/v1/control-plane/throttling/apply` | JWT (admin) | app.schemas.control_plane.ThrottlingApplyRequest | None | ThrottlingApplyOut | `backend/app/api/v1/control_plane.py` |
| admin-api | GET | `/api/v1/control-plane/throttling/policies` | JWT (admin) | — | PlanBandwidthPolicyListOut | `backend/app/api/v1/control_plane.py` |
| admin-api | PUT | `/api/v1/control-plane/throttling/policies/{plan_id}` | JWT (admin) | PlanBandwidthPolicyUpsert | PlanBandwidthPolicyOut | `backend/app/api/v1/control_plane.py` |
| admin-api | GET | `/api/v1/control-plane/topology/graph` | JWT (admin) | — | TopologyGraphOut | `backend/app/api/v1/control_plane.py` |
| admin-api | GET | `/api/v1/control-plane/topology/summary` | JWT (admin) | — | TopologySummaryOut | `backend/app/api/v1/control_plane.py` |
| admin-api | GET | `/api/v1/dashboard/operator` | JWT (admin) | — | raw JSON | `backend/app/api/v1/dashboard.py` |
| admin-api | GET | `/api/v1/devices` | JWT (admin) | — | DeviceList | `backend/app/api/v1/devices.py` |
| admin-api | POST | `/api/v1/devices/bulk-revoke` | JWT (admin) | BulkRevokeRequest | BulkRevokeOut | `backend/app/api/v1/devices.py` |
| admin-api | POST | `/api/v1/devices/{device_id}/block` | JWT (admin) | BlockRequest | raw JSON | `backend/app/api/v1/devices.py` |
| admin-api | PATCH | `/api/v1/devices/{device_id}/limits` | JWT (admin) | DeviceLimitUpdate | DeviceOut | `backend/app/api/v1/devices.py` |
| admin-api | POST | `/api/v1/devices/{device_id}/reset` | JWT (admin) or X-API-Key (bot) or WebApp session | app.schemas.device.ResetRequest | None | raw JSON | `backend/app/api/v1/devices.py` |
| admin-api | POST | `/api/v1/devices/{device_id}/resume` | JWT (admin) | — | DeviceOut | `backend/app/api/v1/devices.py` |
| admin-api | POST | `/api/v1/devices/{device_id}/revoke` | JWT (admin) | RevokeRequest | DeviceOut | `backend/app/api/v1/devices.py` |
| admin-api | POST | `/api/v1/devices/{device_id}/suspend` | JWT (admin) | — | DeviceOut | `backend/app/api/v1/devices.py` |
| admin-api | POST | `/api/v1/log/frontend-error` | None | FrontendErrorIn | raw JSON | `backend/app/api/v1/log.py` |
| admin-api | GET | `/api/v1/overview` | JWT (admin) or X-API-Key (bot) or WebApp session | — | OverviewStats | `backend/app/api/v1/overview.py` |
| admin-api | GET | `/api/v1/overview/connection_nodes` | JWT (admin) or X-API-Key (bot) or WebApp session | — | ConnectionNodesOut | `backend/app/api/v1/overview.py` |
| admin-api | GET | `/api/v1/overview/dashboard_timeseries` | JWT (admin) or X-API-Key (bot) or WebApp session | — | DashboardTimeseriesOut | `backend/app/api/v1/overview.py` |
| admin-api | GET | `/api/v1/overview/health-snapshot` | JWT (admin) | — | HealthSnapshotOut | `backend/app/api/v1/overview.py` |
| admin-api | GET | `/api/v1/overview/operator` | JWT (admin) | — | raw JSON | `backend/app/api/v1/overview.py` |
| admin-api | GET | `/api/v1/overview/telemetry` | JWT (admin) or X-API-Key (bot) or WebApp session | — | DashboardTimeseriesOut | `backend/app/api/v1/overview.py` |
| admin-api | GET | `/api/v1/payments` | JWT (admin) | — | PaymentList | `backend/app/api/v1/payments.py` |
| admin-api | GET | `/api/v1/peers` | JWT (admin) | — | PeerListOut | `backend/app/api/v1/peers.py` |
| admin-api | GET | `/api/v1/peers/{peer_id}` | JWT (admin) | — | PeerListItemOut | `backend/app/api/v1/peers.py` |
| admin-api | POST | `/api/v1/peers/{peer_id}/migrate` | JWT (admin) | MigrateBody | raw JSON | `backend/app/api/v1/peers.py` |
| admin-api | GET | `/api/v1/plans` | JWT (admin) or X-API-Key (bot) or WebApp session | — | PlanList | `backend/app/api/v1/plans.py` |
| admin-api | POST | `/api/v1/plans` | JWT (admin) | PlanCreate | PlanOut | `backend/app/api/v1/plans.py` |
| admin-api | GET | `/api/v1/plans/{plan_id}` | JWT (admin) | — | PlanOut | `backend/app/api/v1/plans.py` |
| admin-api | PATCH | `/api/v1/plans/{plan_id}` | JWT (admin) | PlanUpdate | PlanOut | `backend/app/api/v1/plans.py` |
| admin-api | GET | `/api/v1/servers` | JWT (admin) or X-API-Key (bot) or WebApp session | — | ServerList | `backend/app/api/v1/servers.py` |
| admin-api | POST | `/api/v1/servers` | JWT (admin) | ServerCreate | ServerOut | `backend/app/api/v1/servers.py` |
| admin-api | PATCH | `/api/v1/servers/bulk` | JWT (admin) | ServerBulkRequest | raw JSON | `backend/app/api/v1/servers.py` |
| admin-api | GET | `/api/v1/servers/device-counts` | JWT (admin) or X-API-Key (bot) or WebApp session | — | ServerDeviceCountsOut | `backend/app/api/v1/servers.py` |
| admin-api | GET | `/api/v1/servers/snapshots/summary` | JWT (admin) | — | ServersSnapshotSummaryOut | `backend/app/api/v1/servers.py` |
| admin-api | GET | `/api/v1/servers/stream` | JWT (admin) | — | raw JSON | `backend/app/api/v1/servers_stream.py` |
| admin-api | GET | `/api/v1/servers/telemetry/summary` | JWT (admin) | — | ServersTelemetrySummaryOut | `backend/app/api/v1/servers_telemetry.py` |
| admin-api | DELETE | `/api/v1/servers/{server_id}` | JWT (admin) | — | raw JSON | `backend/app/api/v1/servers_crud.py` |
| admin-api | GET | `/api/v1/servers/{server_id}` | JWT (admin) | — | ServerOut | `backend/app/api/v1/servers_crud.py` |
| admin-api | PATCH | `/api/v1/servers/{server_id}` | JWT (admin) | ServerUpdate | ServerOut | `backend/app/api/v1/servers_crud.py` |
| admin-api | GET | `/api/v1/servers/{server_id}/actions` | JWT (admin) | — | ActionListOut | `backend/app/api/v1/servers_actions.py` |
| admin-api | POST | `/api/v1/servers/{server_id}/actions` | JWT (admin) | ActionCreate | ActionCreateOut | `backend/app/api/v1/servers_actions.py` |
| admin-api | GET | `/api/v1/servers/{server_id}/capabilities` | JWT (admin) | — | ServerCapabilitiesOut | `backend/app/api/v1/servers.py` |
| admin-api | GET | `/api/v1/servers/{server_id}/cert-status` | JWT (admin) | — | ServerCertStatusOut | `backend/app/api/v1/servers_crud.py` |
| admin-api | GET | `/api/v1/servers/{server_id}/health` | JWT (admin) | — | ServerHealthOut | `backend/app/api/v1/servers.py` |
| admin-api | GET | `/api/v1/servers/{server_id}/ips` | JWT (admin) | — | ServerIpListOut | `backend/app/api/v1/servers_crud.py` |
| admin-api | POST | `/api/v1/servers/{server_id}/ips` | JWT (admin) | ServerIpCreate | ServerIpOut | `backend/app/api/v1/servers_crud.py` |
| admin-api | DELETE | `/api/v1/servers/{server_id}/ips/{ip_id}` | JWT (admin) | — | raw JSON | `backend/app/api/v1/servers_crud.py` |
| admin-api | PATCH | `/api/v1/servers/{server_id}/ips/{ip_id}` | JWT (admin) | ServerIpUpdate | ServerIpOut | `backend/app/api/v1/servers_crud.py` |
| admin-api | GET | `/api/v1/servers/{server_id}/limits` | JWT (admin) | — | ServerLimitsOut | `backend/app/api/v1/servers.py` |
| admin-api | PATCH | `/api/v1/servers/{server_id}/limits` | JWT (admin) | ServerLimitsUpdate | ServerLimitsOut | `backend/app/api/v1/servers.py` |
| admin-api | GET | `/api/v1/servers/{server_id}/logs` | JWT (admin) | — | ServerLogsOut | `backend/app/api/v1/servers_telemetry.py` |
| admin-api | GET | `/api/v1/servers/{server_id}/peers` | JWT (admin) | — | ServerPeersOut | `backend/app/api/v1/servers_peers.py` |
| admin-api | POST | `/api/v1/servers/{server_id}/peers` | JWT (admin) | AdminIssuePeerRequest | AdminIssuePeerResponse | `backend/app/api/v1/servers_peers.py` |
| admin-api | GET | `/api/v1/servers/{server_id}/peers-sync` | JWT (admin) | — | raw JSON | `backend/app/api/v1/servers_peers.py` |
| admin-api | POST | `/api/v1/servers/{server_id}/peers/block` | JWT (admin) | BlockPeerRequest | raw JSON | `backend/app/api/v1/servers_peers.py` |
| admin-api | POST | `/api/v1/servers/{server_id}/peers/reset` | JWT (admin) | ResetPeerRequest | raw JSON | `backend/app/api/v1/servers_peers.py` |
| admin-api | POST | `/api/v1/servers/{server_id}/peers/{peer_id}/revoke` | JWT (admin) | — | AdminRevokePeerResponse | `backend/app/api/v1/servers_peers.py` |
| admin-api | POST | `/api/v1/servers/{server_id}/peers/{peer_id}/rotate` | JWT (admin) | — | AdminRotatePeerResponse | `backend/app/api/v1/servers_peers.py` |
| admin-api | POST | `/api/v1/servers/{server_id}/restart` | JWT (admin) | RestartRequest | raw JSON | `backend/app/api/v1/servers.py` |
| admin-api | GET | `/api/v1/servers/{server_id}/snapshot` | JWT (admin) | — | raw JSON | `backend/app/api/v1/servers_sync.py` |
| admin-api | GET | `/api/v1/servers/{server_id}/status` | JWT (admin) | — | ServerStatusOut | `backend/app/api/v1/servers.py` |
| admin-api | POST | `/api/v1/servers/{server_id}/sync` | JWT (admin) | ServerSyncRequest | ServerSyncResponse | `backend/app/api/v1/servers_sync.py` |
| admin-api | GET | `/api/v1/servers/{server_id}/sync/{job_id}` | JWT (admin) | — | ServerSyncJobStatus | `backend/app/api/v1/servers_sync.py` |
| admin-api | GET | `/api/v1/servers/{server_id}/telemetry` | JWT (admin) | — | ServerTelemetryOut | `backend/app/api/v1/servers_telemetry.py` |
| admin-api | GET | `/api/v1/subscriptions` | JWT (admin) | — | SubscriptionList | `backend/app/api/v1/subscriptions.py` |
| admin-api | POST | `/api/v1/subscriptions` | JWT (admin) | SubscriptionCreate | SubscriptionOut | `backend/app/api/v1/subscriptions.py` |
| admin-api | GET | `/api/v1/subscriptions/{subscription_id}` | JWT (admin) | — | SubscriptionOut | `backend/app/api/v1/subscriptions.py` |
| admin-api | PATCH | `/api/v1/subscriptions/{subscription_id}` | JWT (admin) | SubscriptionUpdate | SubscriptionOut | `backend/app/api/v1/subscriptions.py` |
| admin-api | GET | `/api/v1/telemetry/docker/alerts` | JWT (admin) | — | AlertItemListOut | `backend/app/api/v1/telemetry_docker.py` |
| admin-api | GET | `/api/v1/telemetry/docker/container/{container_id}/logs` | JWT (admin) | — | ContainerLogLineListOut | `backend/app/api/v1/telemetry_docker.py` |
| admin-api | GET | `/api/v1/telemetry/docker/container/{container_id}/metrics` | JWT (admin) | — | ContainerMetricsTimeseries | `backend/app/api/v1/telemetry_docker.py` |
| admin-api | GET | `/api/v1/telemetry/docker/containers` | JWT (admin) | — | ContainerSummaryListOut | `backend/app/api/v1/telemetry_docker.py` |
| admin-api | GET | `/api/v1/telemetry/docker/hosts` | JWT (admin) | — | HostSummaryListOut | `backend/app/api/v1/telemetry_docker.py` |
| admin-api | GET | `/api/v1/users` | JWT (admin) | — | UserList | `backend/app/api/v1/users.py` |
| admin-api | POST | `/api/v1/users` | JWT (admin) | UserCreate | UserOut | `backend/app/api/v1/users.py` |
| admin-api | GET | `/api/v1/users/by-tg/{tg_id}` | JWT (admin) or X-API-Key (bot) or WebApp session | — | UserDetail | `backend/app/api/v1/users.py` |
| admin-api | GET | `/api/v1/users/{user_id}` | JWT (admin) | — | UserDetail | `backend/app/api/v1/users.py` |
| admin-api | PATCH | `/api/v1/users/{user_id}` | JWT (admin) | UserUpdate | UserOut | `backend/app/api/v1/users.py` |
| admin-api | GET | `/api/v1/users/{user_id}/devices` | JWT (admin) or X-API-Key (bot) or WebApp session | — | DeviceList | `backend/app/api/v1/users.py` |
| admin-api | POST | `/api/v1/users/{user_id}/devices/issue` | JWT (admin) or X-API-Key (bot) or WebApp session | IssueRequest | IssueResponse | `backend/app/api/v1/users.py` |
| admin-api | POST | `/api/v1/webapp/auth` | None (initData) | WebAppAuthRequest | raw JSON | `backend/app/api/v1/webapp.py` |
| admin-api | POST | `/api/v1/webapp/devices/issue` | WebApp Bearer session (JWT type=webapp) | — | WebAppIssueDeviceResponse | `backend/app/api/v1/webapp.py` |
| admin-api | POST | `/api/v1/webapp/devices/{device_id}/revoke` | WebApp Bearer session (JWT type=webapp) | — | raw JSON | `backend/app/api/v1/webapp.py` |
| admin-api | GET | `/api/v1/webapp/me` | WebApp Bearer session (JWT type=webapp) | — | raw JSON | `backend/app/api/v1/webapp.py` |
| admin-api | POST | `/api/v1/webapp/payments/create-invoice` | WebApp Bearer session (JWT type=webapp) | CreateInvoiceWebAppBody | raw JSON | `backend/app/api/v1/webapp.py` |
| admin-api | GET | `/api/v1/webapp/plans` | WebApp Bearer session (JWT type=webapp) | — | raw JSON | `backend/app/api/v1/webapp.py` |
| admin-api | POST | `/api/v1/webapp/promo/validate` | WebApp Bearer session (JWT type=webapp) | PromoValidateBody | raw JSON | `backend/app/api/v1/webapp.py` |
| admin-api | GET | `/api/v1/webapp/referral/my-link` | WebApp Bearer session (JWT type=webapp) | — | raw JSON | `backend/app/api/v1/webapp.py` |
| admin-api | GET | `/api/v1/webapp/referral/stats` | WebApp Bearer session (JWT type=webapp) | — | raw JSON | `backend/app/api/v1/webapp.py` |
| admin-api | POST | `/api/v1/wg/peer` | JWT (admin) | WgPeerCreateBody | IssueResponse | `backend/app/api/v1/wg.py` |
| admin-api | DELETE | `/api/v1/wg/peer/{pubkey}` | JWT (admin) | — | raw JSON | `backend/app/api/v1/wg.py` |
| admin-api | GET | `/health` | None | — | raw JSON | `backend/app/main.py` |
| admin-api | GET | `/health/ready` | None | — | raw JSON | `backend/app/main.py` |
| admin-api | GET | `/metrics` | None | — | raw JSON | `backend/app/main.py` |
| admin-api | POST | `/webhooks/payments/{provider}` | Webhook secret (provider-specific) | — | raw JSON | `backend/app/api/v1/webhooks.py` |
| node-agent | GET | `/healthz` | None (local HTTP) | — | text/plain | `node-agent/agent.py` |
| node-agent | GET | `/metrics` | None (local HTTP) | — | Prometheus text | `node-agent/agent.py` |
| telegram-vpn-bot | GET | `/healthz` | None (local HTTP) | — | text/plain | `bot/main.py` |
| telegram-vpn-bot | GET | `/metrics` | None (local HTTP) | — | Prometheus text | `bot/main.py` |

## gRPC (Spec-Only)

From `proto/node_agent.proto` (no server implementation found in code):

| Service | RPC | Request | Response |
|---|---|---|---|
| ControlPlaneAgent | Heartbeat | Heartbeat | Ack |
| ControlPlaneAgent | GetDesiredState | DesiredStateRequest | DesiredState |
| ControlPlaneAgent | PushStats | Stats | Ack |
| ControlPlaneAgent | RotateKeys | RotateKeysRequest | Ack |

## Non-HTTP Network Exposure

- `amnezia-awg2` exposes UDP WireGuard/AmneziaWG port only (compose: `${AWG_PUBLIC_UDP_PORT:-45790}/udp`).
- `AmneziaVPN` is a desktop client installation; no server endpoints or listeners detected.
