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


