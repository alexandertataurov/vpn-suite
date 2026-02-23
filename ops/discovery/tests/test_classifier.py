from ops.discovery.fingerprint_classifier import classify_candidate


def _inspect(image="", entrypoint=None, cmd=None, ports=None, mounts=None, env=None, labels=None, network_mode="bridge", cap_add=None):
    return {
        "Config": {
            "Image": image,
            "Entrypoint": entrypoint or [],
            "Cmd": cmd or [],
            "Env": env or [],
            "Labels": labels or {},
        },
        "HostConfig": {
            "NetworkMode": network_mode,
            "CapAdd": cap_add or [],
            "PortBindings": {},
        },
        "NetworkSettings": {
            "Ports": ports or {},
        },
        "Mounts": mounts or [],
    }


def test_shadowbox_true_positive():
    insp = _inspect(
        image="quay.io/outline/shadowbox:stable",
        env=["SB_STATE_DIR=/opt/outline/persisted-state", "SB_API_PORT=25432"],
        network_mode="host",
        mounts=[{"Destination": "/opt/outline/persisted-state"}],
    )
    c = classify_candidate("local", "abc123", insp)
    assert c.type == "outline-shadowbox"
    assert c.confidence >= 0.8


def test_awg_true_positive():
    insp = _inspect(
        image="amneziavpn/amneziawg-go:latest",
        entrypoint=["/opt/amnezia/start.sh"],
        mounts=[{"Destination": "/dev/net/tun"}],
        cap_add=["NET_ADMIN"],
        ports={"51820/udp": []},
    )
    c = classify_candidate("local", "def456", insp)
    assert c.type == "awg-node"
    assert c.confidence >= 0.7


def test_random_container_false_positive():
    insp = _inspect(image="nginx:latest")
    c = classify_candidate("local", "zzz999", insp)
    assert c.type in ("unknown", "exporter", "prometheus")


def test_renamed_container_still_classifies():
    insp = _inspect(
        image="quay.io/outline/shadowbox:stable",
        env=["SB_STATE_DIR=/opt/outline/persisted-state"],
        mounts=[{"Destination": "/opt/outline/persisted-state"}],
    )
    c = classify_candidate("local", "xyz000", insp)
    assert c.type == "outline-shadowbox"
