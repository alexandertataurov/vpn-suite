"""Config and production-secrets validation tests."""

import pytest

from app.core.config import (
    _DEFAULT_ADMIN_PASSWORD,
    _DEFAULT_SECRET_KEY,
    Settings,
)


def test_validate_production_secrets_accepts_development():
    """With environment=development, validation passes even with default secrets."""
    s = Settings(
        environment="development",
        secret_key=_DEFAULT_SECRET_KEY,
        admin_password=_DEFAULT_ADMIN_PASSWORD,
    )
    s.validate_production_secrets()  # no raise


def test_validate_production_secrets_raises_on_default_secret_key():
    """ENVIRONMENT=production and default SECRET_KEY → ValueError."""
    s = Settings(
        environment="production", secret_key=_DEFAULT_SECRET_KEY, admin_password="non-default"
    )
    with pytest.raises(ValueError, match="SECRET_KEY"):
        s.validate_production_secrets()


def test_validate_production_secrets_raises_on_default_admin_password():
    """ENVIRONMENT=production and default ADMIN_PASSWORD → ValueError."""
    s = Settings(
        environment="production",
        secret_key="custom-secret-key-at-least-32-characters-long",
        admin_password=_DEFAULT_ADMIN_PASSWORD,
    )
    with pytest.raises(ValueError, match="ADMIN_PASSWORD"):
        s.validate_production_secrets()


def test_validate_production_secrets_raises_on_default_ban_confirm_token():
    """ENVIRONMENT=production and default BAN_CONFIRM_TOKEN → ValueError (P0)."""
    s = Settings(
        environment="production",
        secret_key="custom-secret-key-at-least-32-characters-long",
        admin_password="custom-admin-pass",
        ban_confirm_token="confirm_ban",
    )
    with pytest.raises(ValueError, match="BAN_CONFIRM_TOKEN"):
        s.validate_production_secrets()


def test_validate_production_secrets_raises_on_default_block_confirm_token():
    """ENVIRONMENT=production and default BLOCK_CONFIRM_TOKEN → ValueError."""
    s = Settings(
        environment="production",
        secret_key="custom-secret-key-at-least-32-characters-long",
        admin_password="custom-admin-pass",
        ban_confirm_token="custom-ban-token-at-least-16",
        block_confirm_token="confirm_block",
    )
    with pytest.raises(ValueError, match="BLOCK_CONFIRM_TOKEN"):
        s.validate_production_secrets()


def test_validate_production_secrets_raises_on_default_restart_confirm_token():
    """ENVIRONMENT=production and default RESTART_CONFIRM_TOKEN → ValueError."""
    s = Settings(
        environment="production",
        secret_key="custom-secret-key-at-least-32-characters-long",
        admin_password="custom-admin-pass",
        ban_confirm_token="custom-ban-token-at-least-16",
        block_confirm_token="custom-block-token-at-least-16",
        restart_confirm_token="confirm_restart",
        revoke_confirm_token="custom-revoke-token-at-least-16",
    )
    with pytest.raises(ValueError, match="RESTART_CONFIRM_TOKEN"):
        s.validate_production_secrets()


def test_validate_production_secrets_raises_on_default_revoke_confirm_token():
    """ENVIRONMENT=production and default REVOKE_CONFIRM_TOKEN → ValueError."""
    s = Settings(
        environment="production",
        secret_key="custom-secret-key-at-least-32-characters-long",
        admin_password="custom-admin-pass",
        ban_confirm_token="custom-ban-token-at-least-16",
        block_confirm_token="custom-block-token-at-least-16",
        restart_confirm_token="custom-restart-token-at-least-16",
        revoke_confirm_token="confirm_revoke",
    )
    with pytest.raises(ValueError, match="REVOKE_CONFIRM_TOKEN"):
        s.validate_production_secrets()


def test_validate_production_secrets_passes_with_custom_secrets():
    """ENVIRONMENT=production with non-default secrets → no raise."""
    s = Settings(
        environment="production",
        secret_key="custom-secret-key-at-least-32-characters-long",
        admin_password="secure-admin-pass",
        ban_confirm_token="custom-ban-token-at-least-16",
        block_confirm_token="custom-block-token-at-least-16",
        restart_confirm_token="custom-restart-token-at-least-16",
        revoke_confirm_token="custom-revoke-token-at-least-16",
        cleanup_db_confirm_token="custom-cleanup-db-token-at-least-16",
        # Make test deterministic even when NODE_DISCOVERY/NODE_MODE are injected via env.
        node_discovery="docker",
        node_mode="mock",
    )
    s.validate_production_secrets()  # no raise
