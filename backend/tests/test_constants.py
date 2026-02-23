"""Lock canonical permission and Redis key constants (Phase 1.2 guard)."""

from app.core import constants


def test_redis_key_constants():
    assert constants.REDIS_KEY_SERVERS_LIST == "servers:list:"
    assert constants.REDIS_KEY_SERVERS_LIST_PATTERN == "servers:list:*"
    assert constants.REDIS_KEY_AGENT_HB_PREFIX == "agent:hb:"
    assert constants.REDIS_KEY_IDEMPOTENCY_ISSUE_PREFIX == "idempotency:issue:"
    assert constants.REDIS_KEY_RATELIMIT_ISSUE_PREFIX == "ratelimit:issue:"


def test_permission_constants_match_canonical():
    assert constants.PERM_SERVERS_READ == "servers:read"
    assert constants.PERM_SERVERS_WRITE == "servers:write"
    assert constants.PERM_CLUSTER_READ == "cluster:read"
    assert constants.PERM_CLUSTER_WRITE == "cluster:write"
    assert constants.PERM_USERS_READ == "users:read"
    assert constants.PERM_USERS_WRITE == "users:write"
    assert constants.PERM_DEVICES_WRITE == "devices:write"
    assert constants.PERM_TELEMETRY_READ == "telemetry:read"
    assert constants.PERM_TELEMETRY_LOGS_READ == "telemetry:logs:read"
    assert constants.PERM_PAYMENTS_READ == "payments:read"
    assert constants.PERM_PLANS_READ == "plans:read"
    assert constants.PERM_PLANS_WRITE == "plans:write"
    assert constants.PERM_SUBSCRIPTIONS_READ == "subscriptions:read"
    assert constants.PERM_SUBSCRIPTIONS_WRITE == "subscriptions:write"
