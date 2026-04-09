"""Async wrapper over Docker Engine API for telemetry use-cases."""

from __future__ import annotations

import asyncio
import json
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any

try:
    import docker
except ModuleNotFoundError:  # pragma: no cover - optional dependency in some test environments
    docker = None

from app.core.config import settings


@dataclass(frozen=True)
class DockerHostDefinition:
    host_id: str
    name: str
    base_url: str
    endpoint_kind: str


def _infer_endpoint_kind(base_url: str) -> str:
    value = (base_url or "").lower()
    if value.startswith("ssh://"):
        return "ssh"
    if value.startswith("tcp://") or value.startswith("http://") or value.startswith("https://"):
        return "tcp"
    return "unix"


def _default_hosts() -> list[DockerHostDefinition]:
    return [
        DockerHostDefinition(
            host_id="local",
            name="Local Docker Host",
            base_url="unix:///var/run/docker.sock",
            endpoint_kind="unix",
        )
    ]


def _default_hosts_for_env() -> list[DockerHostDefinition]:
    """Return default docker hosts for the current environment.

    In development, we default to the local docker socket for convenience.
    In production, we *do not* implicitly trust /var/run/docker.sock; the operator
    must configure DOCKER_TELEMETRY_HOSTS_JSON explicitly or set it to [] to
    disable docker telemetry.
    """
    if settings.environment.lower() == "production":
        return []
    return _default_hosts()


def parse_docker_hosts_config(raw: str | None) -> list[DockerHostDefinition]:
    # Explicit opt-out: set DOCKER_TELEMETRY_HOSTS_JSON='[]' to disable docker telemetry.
    # In development, empty/missing/invalid config defaults to the local docker socket
    # for convenience. In production, empty/missing/invalid config *disables* docker
    # telemetry to avoid implicitly trusting /var/run/docker.sock.
    if raw is None:
        return _default_hosts_for_env()
    if not str(raw).strip():
        return _default_hosts_for_env()
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        return _default_hosts_for_env()
    if not isinstance(data, list):
        return _default_hosts_for_env()
    if not data:
        # Explicit disable.
        return []
    out: list[DockerHostDefinition] = []
    for item in data:
        if not isinstance(item, dict):
            continue
        host_id = str(item.get("host_id") or "").strip() or f"host-{len(out) + 1}"
        base_url = str(item.get("base_url") or "").strip()
        if not base_url:
            continue
        name = str(item.get("name") or host_id)
        endpoint_kind = str(item.get("endpoint_kind") or _infer_endpoint_kind(base_url))
        out.append(
            DockerHostDefinition(
                host_id=host_id,
                name=name,
                base_url=base_url,
                endpoint_kind=endpoint_kind,
            )
        )
    if out:
        return out
    return _default_hosts_for_env()


def parse_docker_timestamp(value: str | None) -> datetime | None:
    if not value:
        return None
    raw = value.strip()
    if not raw:
        return None
    if raw.endswith("Z"):
        raw = raw[:-1] + "+00:00"
    if "." in raw:
        head, dot, tail = raw.partition(".")
        frac, plus, rest = tail.partition("+")
        if plus:
            frac = frac[:6]
            raw = f"{head}{dot}{frac}+{rest}"
        else:
            frac, minus, rest2 = tail.partition("-")
            if minus:
                frac = frac[:6]
                raw = f"{head}{dot}{frac}-{rest2}"
            else:
                raw = f"{head}{dot}{frac[:6]}"
    try:
        dt = datetime.fromisoformat(raw)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)
    except ValueError:
        return None


class DockerEngineClient:
    def __init__(self) -> None:
        self._hosts = {
            h.host_id: h for h in parse_docker_hosts_config(settings.docker_telemetry_hosts_json)
        }
        self._clients: dict[str, docker.DockerClient] = {}
        self._api_clients: dict[str, docker.APIClient] = {}
        self._lock = asyncio.Lock()

    def hosts(self) -> list[DockerHostDefinition]:
        return list(self._hosts.values())

    def host(self, host_id: str) -> DockerHostDefinition:
        host = self._hosts.get(host_id)
        if host is None:
            raise KeyError(f"Unknown docker host: {host_id}")
        return host

    async def _get_clients(self, host_id: str) -> tuple[docker.DockerClient, docker.APIClient]:
        async with self._lock:
            sdk = self._clients.get(host_id)
            api = self._api_clients.get(host_id)
            if sdk is not None and api is not None:
                return sdk, api
            if docker is None:
                raise RuntimeError("docker SDK is not installed")
            host = self.host(host_id)
            timeout = float(settings.docker_telemetry_request_timeout_seconds)
            sdk = docker.DockerClient(base_url=host.base_url, timeout=timeout)
            api = docker.APIClient(base_url=host.base_url, timeout=timeout)
            self._clients[host_id] = sdk
            self._api_clients[host_id] = api
            return sdk, api

    async def ping(self, host_id: str) -> bool:
        sdk, _ = await self._get_clients(host_id)
        try:
            return bool(await asyncio.to_thread(sdk.ping))
        except Exception:
            return False

    async def list_containers(
        self, host_id: str, *, all_containers: bool = True
    ) -> list[dict[str, Any]]:
        _, api = await self._get_clients(host_id)
        rows = await asyncio.to_thread(api.containers, all=all_containers)
        return rows if isinstance(rows, list) else []

    async def inspect_container(self, host_id: str, container_id: str) -> dict[str, Any]:
        _, api = await self._get_clients(host_id)
        out = await asyncio.to_thread(api.inspect_container, container_id)
        return out if isinstance(out, dict) else {}

    async def container_stats(self, host_id: str, container_id: str) -> dict[str, Any]:
        _, api = await self._get_clients(host_id)
        out = await asyncio.to_thread(api.stats, container_id, stream=False)
        return out if isinstance(out, dict) else {}

    async def container_logs(
        self,
        host_id: str,
        container_id: str,
        *,
        tail: int,
        since: int | None,
        stream: str,
    ) -> list[tuple[datetime, str]]:
        _, api = await self._get_clients(host_id)
        kwargs: dict[str, Any] = {
            "container": container_id,
            "timestamps": True,
            "tail": tail,
            "stdout": stream == "stdout",
            "stderr": stream == "stderr",
        }
        if since is not None:
            kwargs["since"] = since

        raw = await asyncio.to_thread(api.logs, **kwargs)
        if not isinstance(raw, bytes | bytearray):
            return []
        out: list[tuple[datetime, str]] = []
        for line in raw.decode("utf-8", errors="replace").splitlines():
            if not line.strip():
                continue
            ts_part, sep, msg = line.partition(" ")
            if not sep:
                continue
            ts = parse_docker_timestamp(ts_part)
            if ts is None:
                continue
            out.append((ts, msg))
        return out

    async def start_container(self, host_id: str, container_id: str) -> None:
        sdk, _ = await self._get_clients(host_id)

        def _op() -> None:
            container = sdk.containers.get(container_id)
            container.start()

        await asyncio.to_thread(_op)

    async def stop_container(self, host_id: str, container_id: str) -> None:
        sdk, _ = await self._get_clients(host_id)

        def _op() -> None:
            container = sdk.containers.get(container_id)
            container.stop()

        await asyncio.to_thread(_op)

    async def restart_container(self, host_id: str, container_id: str) -> None:
        sdk, _ = await self._get_clients(host_id)

        def _op() -> None:
            container = sdk.containers.get(container_id)
            container.restart()

        await asyncio.to_thread(_op)
