"""Application config from environment.
All secrets (SECRET_KEY, ADMIN_PASSWORD, POSTGRES_PASSWORD) must be set via env in production;
defaults are for local dev only. Do not log or expose secret_key/admin_password.
"""

import logging
import os

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_DEFAULT_SECRET_KEY = "change-me-in-production-min-32-chars"
_DEFAULT_ADMIN_PASSWORD = "change-me"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/vpn_admin"
    redis_url: str = "redis://localhost:6379/0"
    # Must override in production (e.g. openssl rand -base64 32); never log
    secret_key: str = _DEFAULT_SECRET_KEY
    jwt_algorithm: str = "HS256"
    access_token_expire_seconds: int = 900  # 15 min
    refresh_token_expire_seconds: int = 604_800  # 7 days
    port: int = 8000
    admin_email: str = "admin@localhost"
    admin_password: str = _DEFAULT_ADMIN_PASSWORD
    login_rate_limit: int = 10
    login_rate_window_seconds: int = 900
    # When True, reject login with 503 if Redis is down (fail-closed). Default False = fail-open.
    login_rate_limit_fail_closed: bool = False
    # When True, reject refresh when Redis blocklist check fails (fail-closed). Default False = fail-open.
    refresh_blocklist_fail_closed: bool = False
    # Global API rate limit (per IP): requests per window; 0 = disabled
    api_rate_limit_per_minute: int = 600
    api_rate_limit_window_seconds: int = 60
    # Comma-separated IPs/CIDRs to exempt from API rate limit. Use "private" for localhost + private ranges.
    api_rate_limit_exempt_ips: str = "127.0.0.1,::1"
    ban_confirm_token: str = "confirm_ban"
    idempotency_ttl_seconds: int = 86400  # 24h
    revoke_confirm_token: str = "confirm_revoke"
    # CORS: comma-separated origins (e.g. https://vpn.vega.llc); empty = no CORS; never * in prod
    cors_allow_origins: str = ""
    # Logging: JSON format with request_id when True (prod-friendly)
    log_json: bool = True
    # Log level: DEBUG, INFO, WARN, ERROR. Empty = INFO for production, DEBUG for development.
    log_level: str = ""
    # Slow request threshold (ms): log api.request.slow when duration exceeds. 0 = disabled.
    slow_request_threshold_ms: float = 2000.0
    # Node health-check: timeout (sec), interval between checks (sec), N consecutive fails → is_active=false
    node_health_timeout_seconds: float = 10.0
    node_health_interval_seconds: int = 60
    node_health_fail_count_disable: int = 3
    # Node gateway: retries and circuit breaker
    node_retry_count: int = 3
    node_retry_backoff_seconds: float = 1.0
    node_circuit_fail_threshold: int = 5
    node_circuit_open_seconds: float = 60.0
    # Set False only for dev/self-signed node certs (insecure)
    node_verify_ssl: bool = True
    restart_confirm_token: str = "confirm_restart"
    block_confirm_token: str = "confirm_block"
    cleanup_db_confirm_token: str = "confirm_cleanup_db"
    delete_user_confirm_token: str = "confirm_delete_user"
    # Dangerous settings controls (.env read/write) for admin UI. Keep disabled in production by default.
    app_env_editor_enabled: bool = False
    # Admin frontend telemetry ingest controls.
    admin_telemetry_events_enabled: bool = True
    admin_telemetry_sample_rate: float = 1.0
    # Telegram Stars webhook: secret for X-Telegram-Bot-Api-Secret-Token (empty = skip verify in dev)
    telegram_stars_webhook_secret: str = ""
    # WebApp payment provider: telegram_stars | platega
    webapp_payment_provider: str = "telegram_stars"
    # Platega gateway credentials/config
    platega_base_url: str = "https://app.platega.io/"
    platega_merchant_id: str = ""
    platega_secret: str = ""
    platega_payment_method: int = 2
    platega_currency: str = "RUB"
    platega_timeout_seconds: float = 15.0
    platega_return_url: str = ""
    platega_failed_url: str = ""
    # Bot API: X-API-Key for /users/by-tg/{tg_id}, issue, reset (empty = only JWT)
    bot_api_key: str = ""
    # Telegram Bot token (for WebApp initData validation; empty = skip)
    telegram_bot_token: str = ""
    # Telegram Bot @username without @ (for referral links). Set TELEGRAM_BOT_USERNAME or VITE_TELEGRAM_BOT_USERNAME.
    telegram_bot_username: str = ""
    # Admin News broadcasts (Redis-queued). Messages per second limit (global).
    news_broadcast_qps: float = 20.0
    # WebApp session: JWT lifetime (seconds) for miniapp Bearer token.
    webapp_session_expire_seconds: int = 3600
    # S8-4: background limits check → auto-block when traffic exceeds server limit (interval sec; 0 = disabled)
    limits_check_interval_seconds: int = 300
    limits_auto_block_enabled: bool = True
    node_telemetry_interval_seconds: int = 10
    node_telemetry_cache_ttl_seconds: int = 60
    node_telemetry_concurrency: int = 10  # 0 = sequential; >0 = max concurrent polls per cycle
    node_telemetry_interval_idle_seconds: int = (
        0  # when > 0 and no recent snapshot read, use this interval (e.g. 60)
    )
    # Empty = disabled (no Prometheus calls). Set when using monitoring profile (e.g. http://prometheus:9090).
    telemetry_prometheus_url: str = ""
    telemetry_loki_url: str = ""
    # OTLP traces endpoint (e.g. http://otel-collector:4317). Empty = tracing disabled.
    otel_traces_endpoint: str = ""
    # JSON array [{\"host_id\":\"local\",\"name\":\"Local\",\"base_url\":\"unix:///var/run/docker.sock\"}]
    docker_telemetry_hosts_json: str = ""
    docker_telemetry_cache_ttl_seconds: int = 10
    docker_telemetry_stats_concurrency: int = 8
    docker_telemetry_request_timeout_seconds: float = 8.0
    docker_telemetry_retry_count: int = 2
    docker_telemetry_circuit_fail_threshold: int = 5
    docker_telemetry_circuit_open_seconds: float = 60.0
    docker_telemetry_metrics_max_range_seconds: int = 7 * 24 * 3600
    docker_telemetry_metrics_min_step_seconds: int = 5
    docker_telemetry_metrics_max_step_seconds: int = 300
    docker_logs_max_tail: int = 2000
    # Fallback alert rule engine (used when Prometheus alerts are unavailable)
    docker_alert_eval_interval_seconds: int = 15
    docker_alert_resolved_ttl_seconds: int = 86400
    docker_alert_restart_loop_threshold: int = 3
    docker_alert_high_cpu_warning_pct: float = 85.0
    docker_alert_high_cpu_critical_pct: float = 95.0
    docker_alert_high_mem_warning_pct: float = 90.0
    docker_alert_high_mem_critical_pct: float = 97.0
    docker_alert_disk_pressure_pct: float = 85.0
    # Live observability (SSE + Redis hot state)
    live_obs_enabled: bool = False
    live_obs_agg_interval_seconds: float = 1.0
    live_obs_sse_max_connections: int = 2000
    live_obs_max_event_bytes: int = 64_000
    # Bot: rate limit on issue device per user (0 = disabled)
    issue_rate_limit_per_minute: int = 5
    issue_rate_window_seconds: int = 60
    # Anti-abuse: max config issues per user per 24h (0 = disabled)
    config_regen_daily_cap: int = 0
    # Referral: bonus days for referrer when referee pays first time
    referral_reward_bonus_days: int = 7
    # Trial: duration in hours; plan id optional (else first plan with price_amount <= 0)
    trial_duration_hours: int = 24
    trial_plan_id: str = ""
    retention_discount_percent: int = 20
    # Grace window hours when subscription expires (24, 48, 72); 0 = disabled
    grace_window_hours: int = 24
    # Set ENVIRONMENT=production to enforce non-default secrets at startup
    environment: str = "development"
    # mock = issue profile does not call node.
    # real = provision peer via runtime adapter (docker exec wg).
    # agent = control-plane is DB-only; node-agent reconciles peers from desired state.
    node_mode: str = "mock"  # env NODE_MODE; allowed: mock | real | agent
    # When True (default): if add_peer fails in NODE_MODE=real, keep device with PENDING_APPLY and return config.
    # User gets config; node-agent or manual sync can add peer later. When False: fail entire issuance.
    issue_fallback_on_peer_failure: bool = True  # env ISSUE_FALLBACK_ON_PEER_FAILURE
    # Control-plane: topology cache and reconciliation
    topology_cache_ttl_seconds: int = 30
    reconciliation_interval_seconds: int = 60
    reconciliation_read_only: bool = False
    reconciliation_remove_orphans: bool = (
        False  # When False, do not remove peers missing from DB (log ORPHAN only)
    )
    handshake_quality_gate_minutes: int = (
        5  # Mark NO_HANDSHAKE/ERROR if no handshake within X min after apply
    )
    node_discovery: str = "docker"  # docker | agent
    node_scan_interval_seconds: int = 300  # 0 = no periodic scan
    # Control-plane automation loop (failover/rebalance planner)
    control_plane_automation_enabled: bool = True
    control_plane_automation_interval_seconds: int = 120
    control_plane_rebalance_high_watermark: float = 0.85
    control_plane_rebalance_target_watermark: float = 0.65
    control_plane_rebalance_max_moves_per_node: int = 250
    control_plane_rebalance_execute_enabled: bool = False
    control_plane_rebalance_batch_size: int = 25
    control_plane_rebalance_max_executions_per_cycle: int = 100
    control_plane_rebalance_stop_on_error: bool = True
    control_plane_rebalance_rollback_on_error: bool = True
    control_plane_enterprise_plan_keywords: str = "enterprise,business,dedicated"
    control_plane_rebalance_qos_idle_handshake_seconds: int = 300
    control_plane_rebalance_qos_hot_traffic_bytes: int = 10485760
    control_plane_throttling_enabled: bool = False
    control_plane_throttling_dry_run: bool = False
    control_plane_probe_fresh_seconds: int = 300
    control_plane_geo_region_affinity_bonus: float = 0.05
    control_plane_events_ws_poll_seconds: int = 2
    control_plane_events_ws_initial_limit: int = 20
    control_plane_unhealthy_health_threshold: float = 0.5
    # Server snapshot auto-sync (AmneziaWG): interval (0=disabled), concurrency, backoff
    server_sync_interval_seconds: int = 60
    server_sync_min_interval_seconds: int = 15  # floor for per-server interval (always-on)
    server_sync_max_concurrent: int = 5
    server_sync_backoff_max_seconds: int = 900
    server_sync_skip_draining: bool = True
    # Load balancer weights (capacity, health, load); optional
    load_balancer_weight_capacity: float = 0.4
    load_balancer_weight_health: float = 0.3
    load_balancer_weight_load: float = 0.1
    load_balancer_weight_latency: float = 0.2
    # Node-agent (pull-based) control-plane endpoints.
    # Production: enforce mTLS at the reverse-proxy (Caddy/Envoy) and keep token as defense-in-depth.
    agent_shared_token: str = ""  # X-Agent-Token; empty disables /api/v1/agent/*
    agent_heartbeat_ttl_seconds: int = 120  # Redis TTL for latest heartbeat payload
    # VPN endpoint fallback: when node reports only private IP, use this host + node listen_port.
    # Set to PUBLIC_DOMAIN or your VPN server hostname (e.g. vpn.example.com) so Issue Config can derive endpoint.
    vpn_default_host: str = ""
    # Comma-separated container name prefixes for VPN discovery (e.g. amnezia-awg, amnezia-wg)
    docker_vpn_container_prefixes: str = "amnezia-awg,amnezia-wg"

    @model_validator(mode="after")
    def fill_telegram_bot_username_from_vite(self) -> "Settings":
        """Use VITE_TELEGRAM_BOT_USERNAME when TELEGRAM_BOT_USERNAME is unset (e.g. non-Docker dev)."""
        if not (self.telegram_bot_username or "").strip():
            vite = (os.environ.get("VITE_TELEGRAM_BOT_USERNAME") or "").strip()
            if vite:
                object.__setattr__(self, "telegram_bot_username", vite)
        return self

    @model_validator(mode="after")
    def check_node_mode(self) -> "Settings":
        if self.node_mode not in ("mock", "real", "agent"):
            raise ValueError(
                f"NODE_MODE must be 'mock', 'real' or 'agent', got: {self.node_mode!r}"
            )
        return self

    @model_validator(mode="after")
    def check_webapp_payment_provider(self) -> "Settings":
        provider = (self.webapp_payment_provider or "").strip().lower()
        if provider not in {"telegram_stars", "platega"}:
            raise ValueError(
                "WEBAPP_PAYMENT_PROVIDER must be 'telegram_stars' or 'platega'"
            )
        object.__setattr__(self, "webapp_payment_provider", provider)
        return self

    @model_validator(mode="after")
    def warn_default_admin_password_in_production(self) -> "Settings":
        if self.environment == "production" and self.admin_password == _DEFAULT_ADMIN_PASSWORD:
            logging.getLogger(__name__).warning(
                "Admin password is default; set ADMIN_PASSWORD in production."
            )
        return self

    @model_validator(mode="after")
    def check_node_discovery(self) -> "Settings":
        if self.node_discovery not in ("docker", "agent"):
            raise ValueError(
                f"NODE_DISCOVERY must be 'docker' or 'agent', got: {self.node_discovery!r}"
            )
        return self

    @model_validator(mode="after")
    def check_control_plane_thresholds(self) -> "Settings":
        if not 0.5 <= self.control_plane_rebalance_high_watermark <= 0.99:
            raise ValueError("CONTROL_PLANE_REBALANCE_HIGH_WATERMARK must be within [0.5, 0.99]")
        if not 0.2 <= self.control_plane_rebalance_target_watermark <= 0.9:
            raise ValueError("CONTROL_PLANE_REBALANCE_TARGET_WATERMARK must be within [0.2, 0.9]")
        if (
            self.control_plane_rebalance_target_watermark
            >= self.control_plane_rebalance_high_watermark
        ):
            raise ValueError(
                "CONTROL_PLANE_REBALANCE_TARGET_WATERMARK must be lower than HIGH_WATERMARK"
            )
        if self.control_plane_rebalance_batch_size <= 0:
            raise ValueError("CONTROL_PLANE_REBALANCE_BATCH_SIZE must be > 0")
        if self.control_plane_rebalance_max_executions_per_cycle <= 0:
            raise ValueError("CONTROL_PLANE_REBALANCE_MAX_EXECUTIONS_PER_CYCLE must be > 0")
        if self.control_plane_rebalance_qos_idle_handshake_seconds <= 0:
            raise ValueError("CONTROL_PLANE_REBALANCE_QOS_IDLE_HANDSHAKE_SECONDS must be > 0")
        if self.control_plane_rebalance_qos_hot_traffic_bytes <= 0:
            raise ValueError("CONTROL_PLANE_REBALANCE_QOS_HOT_TRAFFIC_BYTES must be > 0")
        if self.control_plane_probe_fresh_seconds <= 0:
            raise ValueError("CONTROL_PLANE_PROBE_FRESH_SECONDS must be > 0")
        if not 0.0 <= self.control_plane_geo_region_affinity_bonus <= 1.0:
            raise ValueError("CONTROL_PLANE_GEO_REGION_AFFINITY_BONUS must be within [0, 1]")
        if self.control_plane_events_ws_poll_seconds <= 0:
            raise ValueError("CONTROL_PLANE_EVENTS_WS_POLL_SECONDS must be > 0")
        if not 1 <= self.control_plane_events_ws_initial_limit <= 200:
            raise ValueError("CONTROL_PLANE_EVENTS_WS_INITIAL_LIMIT must be within [1, 200]")
        if not 0.0 <= self.control_plane_unhealthy_health_threshold <= 1.0:
            raise ValueError("CONTROL_PLANE_UNHEALTHY_HEALTH_THRESHOLD must be within [0, 1]")
        if self.server_sync_interval_seconds < 0:
            raise ValueError("SERVER_SYNC_INTERVAL_SECONDS must be >= 0 (0=disabled)")
        if self.server_sync_max_concurrent < 1:
            raise ValueError("SERVER_SYNC_MAX_CONCURRENT must be >= 1")
        if self.server_sync_backoff_max_seconds < 60:
            raise ValueError("SERVER_SYNC_BACKOFF_MAX_SECONDS must be >= 60")
        if not 0.0 <= self.admin_telemetry_sample_rate <= 1.0:
            raise ValueError("ADMIN_TELEMETRY_SAMPLE_RATE must be within [0, 1]")
        return self

    def validate_production_secrets(self) -> None:
        """Raise if ENVIRONMENT=production but secret_key, admin_password or ban_confirm_token are still defaults."""
        if self.environment.lower() != "production":
            return
        if (
            (not self.secret_key)
            or self.secret_key == _DEFAULT_SECRET_KEY
            or len(self.secret_key) < 32
        ):
            raise ValueError(
                "Refusing to start: ENVIRONMENT=production but SECRET_KEY is still the default. "
                "Set SECRET_KEY in .env (e.g. openssl rand -base64 32)."
            )
        if (
            (not self.admin_password)
            or self.admin_password == _DEFAULT_ADMIN_PASSWORD
            or len(self.admin_password) < 12
        ):
            raise ValueError(
                "Refusing to start: ENVIRONMENT=production but ADMIN_PASSWORD is still the default. "
                "Set ADMIN_PASSWORD in .env."
            )
        # Security: ban action requires a confirm token; default is known (P0)
        if (
            (not self.ban_confirm_token)
            or self.ban_confirm_token == "confirm_ban"
            or len(self.ban_confirm_token) < 16
        ):
            raise ValueError(
                "Refusing to start: ENVIRONMENT=production but BAN_CONFIRM_TOKEN is still the default. "
                "Set BAN_CONFIRM_TOKEN in .env (e.g. random string)."
            )
        if (
            (not self.block_confirm_token)
            or self.block_confirm_token == "confirm_block"
            or len(self.block_confirm_token) < 16
        ):
            raise ValueError(
                "Refusing to start: ENVIRONMENT=production but BLOCK_CONFIRM_TOKEN is still the default. "
                "Set BLOCK_CONFIRM_TOKEN in .env."
            )
        if (
            (not self.restart_confirm_token)
            or self.restart_confirm_token == "confirm_restart"
            or len(self.restart_confirm_token) < 16
        ):
            raise ValueError(
                "Refusing to start: ENVIRONMENT=production but RESTART_CONFIRM_TOKEN is still the default. "
                "Set RESTART_CONFIRM_TOKEN in .env."
            )
        if (
            (not self.revoke_confirm_token)
            or self.revoke_confirm_token == "confirm_revoke"
            or len(self.revoke_confirm_token) < 16
        ):
            raise ValueError(
                "Refusing to start: ENVIRONMENT=production but REVOKE_CONFIRM_TOKEN is still the default. "
                "Set REVOKE_CONFIRM_TOKEN in .env."
            )
        if (
            (not self.cleanup_db_confirm_token)
            or self.cleanup_db_confirm_token == "confirm_cleanup_db"
            or len(self.cleanup_db_confirm_token) < 16
        ):
            raise ValueError(
                "Refusing to start: ENVIRONMENT=production but CLEANUP_DB_CONFIRM_TOKEN is still the default. "
                "Set CLEANUP_DB_CONFIRM_TOKEN in .env."
            )
        if (
            (not self.delete_user_confirm_token)
            or self.delete_user_confirm_token == "confirm_delete_user"
            or len(self.delete_user_confirm_token) < 16
        ):
            raise ValueError(
                "Refusing to start: ENVIRONMENT=production but DELETE_USER_CONFIRM_TOKEN is still the default. "
                "Set DELETE_USER_CONFIRM_TOKEN in .env."
            )
        if self.node_discovery == "agent" or self.node_mode == "agent":
            if not self.agent_shared_token or len(self.agent_shared_token) < 32:
                raise ValueError(
                    "Refusing to start: NODE_DISCOVERY=agent/NODE_MODE=agent requires AGENT_SHARED_TOKEN (>=32 chars)."
                )
        if self.node_discovery != "agent":
            raise ValueError(
                "Production requires NODE_DISCOVERY=agent. "
                "Do not use NODE_DISCOVERY=docker in production; only node-agent may mutate peers."
            )


settings = Settings()
