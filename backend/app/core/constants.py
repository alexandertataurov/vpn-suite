"""Centralized string constants for Redis keys, permissions, and API error messages.

Avoid magic strings in routers and services; import from here.
"""

# Redis key prefixes (backend cache and agent heartbeat)
REDIS_KEY_SERVERS_LIST = "servers:list:"
REDIS_KEY_SERVERS_LIST_PATTERN = "servers:list:*"
REDIS_KEY_AGENT_HB_PREFIX = "agent:hb:"
REDIS_KEY_IDEMPOTENCY_ISSUE_PREFIX = "idempotency:issue:"
REDIS_KEY_RATELIMIT_ISSUE_PREFIX = "ratelimit:issue:"
# Permission names for require_permission() (must match role.permissions in DB)
PERM_SERVERS_READ = "servers:read"
PERM_SERVERS_WRITE = "servers:write"
PERM_CLUSTER_READ = "cluster:read"
PERM_CLUSTER_WRITE = "cluster:write"
PERM_USERS_READ = "users:read"
PERM_USERS_WRITE = "users:write"
PERM_DEVICES_WRITE = "devices:write"
PERM_TELEMETRY_READ = "telemetry:read"
PERM_TELEMETRY_LOGS_READ = "telemetry:logs:read"
PERM_PAYMENTS_READ = "payments:read"
PERM_PLANS_READ = "plans:read"
PERM_PLANS_WRITE = "plans:write"
PERM_SUBSCRIPTIONS_READ = "subscriptions:read"
PERM_SUBSCRIPTIONS_WRITE = "subscriptions:write"
