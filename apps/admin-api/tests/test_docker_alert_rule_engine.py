"""Fallback docker alert rule engine helper tests."""

from app.services.docker_alert_rule_engine import _fingerprint


def test_fingerprint_is_stable():
    a = _fingerprint("DockerContainerUnhealthy", "local", "abc123")
    b = _fingerprint("DockerContainerUnhealthy", "local", "abc123")
    assert a == b


def test_fingerprint_changes_on_rule_or_target():
    base = _fingerprint("DockerContainerUnhealthy", "local", "abc123")
    assert _fingerprint("DockerContainerHighCPUWarning", "local", "abc123") != base
    assert _fingerprint("DockerContainerUnhealthy", "host-2", "abc123") != base
    assert _fingerprint("DockerContainerUnhealthy", "local", "def456") != base
