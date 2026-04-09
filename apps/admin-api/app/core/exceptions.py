"""Control-plane exceptions (spec 10.1)."""


class VPNControlPlaneError(Exception):
    """Base for control-plane errors."""

    pass


class NodeDiscoveryError(VPNControlPlaneError):
    """Node discovery failed."""

    pass


class WireGuardCommandError(VPNControlPlaneError):
    """WireGuard command execution failed."""

    def __init__(self, message: str, command: str = "", output: str = ""):
        super().__init__(message)
        self.command = command
        self.output = output


class ReconciliationError(VPNControlPlaneError):
    """Reconciliation cycle or apply failed."""

    pass


class LoadBalancerError(VPNControlPlaneError):
    """No suitable node available for placement."""

    pass


class ContainerNotFoundError(VPNControlPlaneError):
    """Container not found (Docker adapter)."""

    pass


class ContainerNotRunningError(VPNControlPlaneError):
    """Container not in running state."""

    pass
