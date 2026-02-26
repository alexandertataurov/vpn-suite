"""Tests for AmneziaWG config: keypair generation and client config build."""

import re

import pytest

from app.core.amnezia_config import (
    build_amnezia_client_config,
    build_wg_obfuscated_config,
    generate_h_params,
    generate_wg_keypair,
    get_obfuscation_params,
)


def test_generate_h_params_csprng():
    """H1–H4 are distinct, non-zero, in uint32 range (CSPRNG)."""
    H1, H2, H3, H4 = generate_h_params()
    for h in (H1, H2, H3, H4):
        assert isinstance(h, int) and 1 <= h <= 0xFFFFFFFF
    assert len({H1, H2, H3, H4}) == 4
    # Second call gives different values (with overwhelming probability)
    H1b, H2b, H3b, H4b = generate_h_params()
    assert (H1, H2, H3, H4) != (H1b, H2b, H3b, H4b)


def test_generate_wg_keypair_returns_base64_32_bytes():
    """WireGuard keys are 32 bytes -> 44 char base64 with padding."""
    priv, pub = generate_wg_keypair()
    assert isinstance(priv, str) and isinstance(pub, str)
    assert len(priv) == 44 and len(pub) == 44
    assert re.match(r"^[A-Za-z0-9+/]+=*$", priv)
    assert re.match(r"^[A-Za-z0-9+/]+=*$", pub)
    # Second call gives different keys
    priv2, pub2 = generate_wg_keypair()
    assert (priv, pub) != (priv2, pub2)


def test_get_obfuscation_params_defaults():
    params = get_obfuscation_params(None)
    assert params["Jc"] == 3 and params["Jmin"] == 10 and params["Jmax"] == 50
    assert params["S1"] == 213 and params["S2"] == 237
    assert (params["H1"], params["H2"], params["H3"], params["H4"]) == (10, 20, 30, 40)


def test_get_obfuscation_params_rejects_s1_plus_56_equals_s2():
    """Kernel rejects S1+56=S2."""
    with pytest.raises(ValueError, match="S1\\+56 ≠ S2"):
        get_obfuscation_params({"amnezia_s1": 10, "amnezia_s2": 66})  # 10+56=66
    with pytest.raises(ValueError, match="S1\\+56 ≠ S2"):
        get_obfuscation_params({"amnezia_s1": 15, "amnezia_s2": 71})  # 15+56=71
    params = get_obfuscation_params({"amnezia_s1": 15, "amnezia_s2": 56})
    assert params["S1"] == 15 and params["S2"] == 56  # 15+56=71≠56 ok


def test_get_obfuscation_params_from_profile():
    params = get_obfuscation_params(
        {
            "amnezia_jc": 8,
            "amnezia_s1": 32,
            "amnezia_h1": 100,
        }
    )
    assert params["Jc"] == 8
    assert params["S1"] == 32
    assert params["H1"] == 100
    assert params["Jmin"] == 10  # default


def test_build_amnezia_client_config_has_interface_and_peer():
    config = build_amnezia_client_config(
        server_public_key="xTIBA5rboUvnH4htodjb6e697QjLERt1NAB4mZqp8Dg=",
        client_private_key_b64="yAnz5TF+lXXJte14tji3zlMNq+hd2rYUIgJBgB3fBmk=",
        endpoint="vpn.example.com:47604",
        obfuscation=None,
    )
    assert "[Interface]" in config
    assert "PrivateKey =" in config
    assert "[Peer]" in config
    assert "PublicKey =" in config
    assert "Endpoint = vpn.example.com:47604" in config
    assert "AllowedIPs =" in config
    assert "PersistentKeepalive =" in config


def test_build_amnezia_client_config_includes_obfuscation():
    """H1-H4=0 are omitted (kernel range 5-2147483647; 0 invalid per Error 900 avoidance)."""
    config = build_amnezia_client_config(
        server_public_key="xTIBA5rboUvnH4htodjb6e697QjLERt1NAB4mZqp8Dg=",
        client_private_key_b64="yAnz5TF+lXXJte14tji3zlMNq+hd2rYUIgJBgB3fBmk=",
        endpoint="vpn.example.com:47604",
        obfuscation={
            "Jc": 4,
            "Jmin": 64,
            "Jmax": 1024,
            "S1": 0,
            "S2": 0,
            "H1": 0,
            "H2": 0,
            "H4": 0,
        },
    )
    assert "Jc = 4" in config
    assert "Jmin = 64" in config
    assert "Jmax = 1024" in config
    assert "S1 = 0" not in config
    assert "S2 = 0" not in config
    assert "H1 = 0" not in config
    assert "H2 = 0" not in config


def test_build_amnezia_client_config_includes_mtu_when_set():
    config = build_amnezia_client_config(
        server_public_key="xTIBA5rboUvnH4htodjb6e697QjLERt1NAB4mZqp8Dg=",
        client_private_key_b64="yAnz5TF+lXXJte14tji3zlMNq+hd2rYUIgJBgB3fBmk=",
        endpoint="vpn.example.com:47604",
        obfuscation=None,
        mtu=1420,
    )
    assert "[Interface]" in config
    assert "MTU = 1420" in config
    assert config.index("MTU = 1420") < config.index("[Peer]")


def test_build_amnezia_client_config_omits_mtu_when_none_or_zero():
    sk = "xTIBA5rboUvnH4htodjb6e697QjLERt1NAB4mZqp8Dg="
    ck = "yAnz5TF+lXXJte14tji3zlMNq+hd2rYUIgJBgB3fBmk="
    ep = "vpn.example.com:47604"
    config_no = build_amnezia_client_config(
        server_public_key=sk,
        client_private_key_b64=ck,
        endpoint=ep,
        mtu=None,
    )
    config_zero = build_amnezia_client_config(
        server_public_key=sk,
        client_private_key_b64=ck,
        endpoint=ep,
        mtu=0,
    )
    assert "MTU =" not in config_no
    assert "MTU =" not in config_zero


def test_build_config_rejects_invalid_key_length():
    """Invalid key length raises ValueError (Error 900 avoidance)."""
    valid = "xTIBA5rboUvnH4htodjb6e697QjLERt1NAB4mZqp8Dg="
    ep = "vpn.example.com:47604"
    with pytest.raises(ValueError, match="length.*invalid"):
        build_amnezia_client_config(
            server_public_key=valid,
            client_private_key_b64="short",
            endpoint=ep,
        )
    with pytest.raises(ValueError, match="length.*invalid"):
        build_amnezia_client_config(
            server_public_key="x",
            client_private_key_b64=valid,
            endpoint=ep,
        )


def test_build_config_requires_endpoint():
    """Missing endpoint raises ValueError (Error 900 avoidance)."""
    sk = "xTIBA5rboUvnH4htodjb6e697QjLERt1NAB4mZqp8Dg="
    ck = "yAnz5TF+lXXJte14tji3zlMNq+hd2rYUIgJBgB3fBmk="
    with pytest.raises(ValueError, match="Endpoint.*required"):
        build_amnezia_client_config(
            server_public_key=sk,
            client_private_key_b64=ck,
            endpoint=None,
        )
    with pytest.raises(ValueError, match="Endpoint.*required"):
        build_amnezia_client_config(
            server_public_key=sk,
            client_private_key_b64=ck,
            endpoint="",
        )


# Contract: config output MUST NOT contain comments, timestamps, or year/date headers
_NO_DATE_PATTERNS = ("2024", "2025", "2026", "Generated", "generated_at", "Created:")


def test_amnezia_config_contains_no_year_or_date():
    server_pub = "xTIBA5rboUvnH4htodjb6e697QjLERt1NAB4mZqp8Dg="
    client_priv = "yAnz5TF+lXXJte14tji3zlMNq+hd2rYUIgJBgB3fBmk="
    endpoint = "vpn.example.com:47604"
    obf = get_obfuscation_params(None)
    config_awg = build_amnezia_client_config(
        server_public_key=server_pub,
        client_private_key_b64=client_priv,
        endpoint=endpoint,
        obfuscation=obf,
    )
    config_wg_obf = build_wg_obfuscated_config(
        server_public_key=server_pub,
        client_private_key_b64=client_priv,
        endpoint=endpoint,
        obfuscation=obf,
    )
    for cfg in (config_awg, config_wg_obf):
        for pat in _NO_DATE_PATTERNS:
            assert pat not in cfg, f"Config must not contain {pat!r}"
        assert not any(
            line.strip().startswith("#") or line.strip().startswith(";")
            for line in cfg.splitlines()
        )
