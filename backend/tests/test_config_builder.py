"""Tests for canonical config_builder: validation, normalization, profiles."""

import configparser
import io
from pathlib import Path

import pytest

from app.core.config_builder import (
    AWG_ASC_KEYS,
    ConfigProfile,
    ConfigValidationError,
    InterfaceFields,
    PeerFields,
    allocate_next_address,
    build_config,
    derive_address_from_profile,
    generate_wg_keypair,
)


def test_build_config_universal_safe_has_required_fields():
    priv, pub = generate_wg_keypair()
    cfg = build_config(
        interface=InterfaceFields(private_key=priv, address="10.8.1.2/32", dns="1.1.1.1"),
        peer=PeerFields(public_key=pub, endpoint="vpn.example.com:47604"),
        profile=ConfigProfile.universal_safe,
    )
    assert "[Interface]" in cfg
    assert "[Peer]" in cfg
    assert "PrivateKey =" in cfg
    assert "Address = 10.8.1.2/32" in cfg
    assert "DNS =" in cfg
    assert "PublicKey =" in cfg
    assert "Endpoint = vpn.example.com:47604" in cfg
    assert "AllowedIPs =" in cfg
    assert "PersistentKeepalive =" in cfg
    assert "\r" not in cfg
    assert cfg.encode("utf-8").startswith(b"[Interface]")


def test_build_config_rejects_missing_endpoint():
    priv, pub = generate_wg_keypair()
    with pytest.raises(ValueError, match="Endpoint"):
        build_config(
            interface=InterfaceFields(private_key=priv, address="10.8.1.2/32"),
            peer=PeerFields(public_key=pub, endpoint=""),
            profile=ConfigProfile.universal_safe,
        )


def test_build_config_rejects_missing_address():
    priv, pub = generate_wg_keypair()
    with pytest.raises(ValueError, match="Address"):
        build_config(
            interface=InterfaceFields(private_key=priv, address=""),
            peer=PeerFields(public_key=pub, endpoint="vpn.example.com:47604"),
            profile=ConfigProfile.universal_safe,
        )


def test_build_config_rejects_invalid_endpoint_format():
    priv, pub = generate_wg_keypair()
    with pytest.raises(ValueError, match="Endpoint"):
        build_config(
            interface=InterfaceFields(private_key=priv, address="10.8.1.2/32"),
            peer=PeerFields(public_key=pub, endpoint="no-port"),
            profile=ConfigProfile.universal_safe,
        )


def test_build_config_rejects_invalid_address_cidr():
    priv, pub = generate_wg_keypair()
    with pytest.raises(ValueError, match="Address"):
        build_config(
            interface=InterfaceFields(private_key=priv, address="10.8.1.2"),
            peer=PeerFields(public_key=pub, endpoint="vpn.example.com:47604"),
            profile=ConfigProfile.universal_safe,
        )


def test_build_config_rejects_invalid_allowed_ips():
    priv, pub = generate_wg_keypair()
    with pytest.raises(ValueError, match="AllowedIPs"):
        build_config(
            interface=InterfaceFields(private_key=priv, address="10.8.1.2/32"),
            peer=PeerFields(public_key=pub, endpoint="vpn.example.com:47604", allowed_ips=""),
            profile=ConfigProfile.universal_safe,
        )
    with pytest.raises(ValueError, match="AllowedIPs"):
        build_config(
            interface=InterfaceFields(private_key=priv, address="10.8.1.2/32"),
            peer=PeerFields(
                public_key=pub, endpoint="vpn.example.com:47604", allowed_ips="badcidr"
            ),
            profile=ConfigProfile.universal_safe,
        )


def test_build_config_rejects_invalid_base64():
    pub = "M1/n0lOh+G/r7Q3j0RkCBbPRBFeYRK+da2x9SczRPyA="
    with pytest.raises(ValueError, match="PrivateKey"):
        build_config(
            interface=InterfaceFields(private_key="***", address="10.8.1.2/32"),
            peer=PeerFields(public_key=pub, endpoint="vpn.example.com:47604"),
            profile=ConfigProfile.universal_safe,
        )
    with pytest.raises(ValueError, match="PublicKey"):
        build_config(
            interface=InterfaceFields(
                private_key="YAnz5TF+lXXJte14tji3zlMNwF4OBgO8EnZu4PpwTYU=", address="10.8.1.2/32"
            ),
            peer=PeerFields(public_key="short", endpoint="vpn.example.com:47604"),
            profile=ConfigProfile.universal_safe,
        )


def test_legacy_profile_allows_i1_string():
    priv, pub = generate_wg_keypair()
    cfg = build_config(
        interface=InterfaceFields(private_key=priv, address="10.8.1.2/32"),
        peer=PeerFields(public_key=pub, endpoint="vpn.example.com:47604"),
        profile=ConfigProfile.awg_legacy_or_basic,
        obfuscation={"I1": "<b 0x1234>", "Jc": 4},
    )
    assert "I1 = <b 0x1234>" in cfg


def test_awg_config_emits_i1_i5_uppercase():
    """I1–I5 must be emitted with correct case (I1 not i1) for AmneziaWG compatibility."""
    priv, pub = generate_wg_keypair()
    obf = {
        "Jc": 3,
        "Jmin": 64,
        "Jmax": 256,
        "S1": 10,
        "S2": 20,
        "I1": "val1",
        "I2": "val2",
        "I3": "val3",
        "I4": "val4",
        "I5": "val5",
    }
    cfg = build_config(
        interface=InterfaceFields(private_key=priv, address="10.8.1.2/32"),
        peer=PeerFields(public_key=pub, endpoint="vpn.example.com:47604"),
        profile=ConfigProfile.awg_legacy_or_basic,
        obfuscation=obf,
    )
    for key in ("I1", "I2", "I3", "I4", "I5"):
        assert f"{key} = " in cfg, f"Config must contain '{key} = ' (uppercase)"
        assert (
            f"{key.lower()} = " not in cfg
        ), f"Config must not contain lowercase '{key.lower()} = '"


def test_legacy_profile_rejects_h_keys():
    priv, pub = generate_wg_keypair()
    with pytest.raises(ValueError, match="unsupported_key"):
        build_config(
            interface=InterfaceFields(private_key=priv, address="10.8.1.2/32"),
            peer=PeerFields(public_key=pub, endpoint="vpn.example.com:47604"),
            profile=ConfigProfile.awg_legacy_or_basic,
            obfuscation={"H1": 100},
        )


def test_awg2_h_ranges_must_not_overlap():
    priv, pub = generate_wg_keypair()
    with pytest.raises(ValueError, match="overlap"):
        build_config(
            interface=InterfaceFields(private_key=priv, address="10.8.1.2/32"),
            peer=PeerFields(public_key=pub, endpoint="vpn.example.com:47604"),
            profile=ConfigProfile.awg_2_0_asc,
            obfuscation={"H1": "10-20", "H2": "15-25"},
        )


def test_build_config_awg_2_0_allows_h3():
    """awg_2_0_asc allows H3."""
    assert "H3" in AWG_ASC_KEYS
    priv, pub = generate_wg_keypair()
    cfg = build_config(
        interface=InterfaceFields(private_key=priv, address="10.8.1.2/32", dns="1.1.1.1"),
        peer=PeerFields(public_key=pub, endpoint="vpn.example.com:47604"),
        profile=ConfigProfile.awg_2_0_asc,
        obfuscation={
            "Jc": 4,
            "Jmin": 64,
            "Jmax": 1024,
            "S1": 15,
            "S2": 20,
            "H1": 1020325451,
            "H2": 2147483647,
            "H3": 111,
            "H4": 2147483640,
        },
    )
    assert "H3 = 111" in cfg
    assert "Jc = 4" in cfg
    assert "H1 = 1020325451" in cfg


def test_build_config_rejects_unsupported_obfuscation_key():
    priv, pub = generate_wg_keypair()
    with pytest.raises(ValueError, match="unsupported_key"):
        build_config(
            interface=InterfaceFields(private_key=priv, address="10.8.1.2/32"),
            peer=PeerFields(public_key=pub, endpoint="vpn.example.com:47604"),
            profile=ConfigProfile.awg_legacy_or_basic,
            obfuscation={"H1": 1},
        )


def test_build_config_omits_zero_obfuscation_values():
    priv, pub = generate_wg_keypair()
    cfg = build_config(
        interface=InterfaceFields(private_key=priv, address="10.8.1.2/32"),
        peer=PeerFields(public_key=pub, endpoint="vpn.example.com:47604"),
        profile=ConfigProfile.awg_legacy_or_basic,
        obfuscation={"S1": 0, "S2": 0, "H1": 0, "Jc": 0},
    )
    assert "S1 =" not in cfg
    assert "S2 =" not in cfg
    assert "H1 =" not in cfg
    assert "Jc =" not in cfg


def test_build_config_rejects_obfuscation_in_wireguard_universal():
    priv, pub = generate_wg_keypair()
    with pytest.raises(ValueError, match="obfuscation"):
        build_config(
            interface=InterfaceFields(private_key=priv, address="10.8.1.2/32"),
            peer=PeerFields(public_key=pub, endpoint="vpn.example.com:47604"),
            profile=ConfigProfile.wireguard_universal,
            obfuscation={"Jc": 4},
        )


def test_build_config_rejects_jmin_gt_jmax():
    priv, pub = generate_wg_keypair()
    with pytest.raises(ConfigValidationError, match="Jmin|Jmax"):
        build_config(
            interface=InterfaceFields(private_key=priv, address="10.8.1.2/32"),
            peer=PeerFields(public_key=pub, endpoint="vpn.example.com:47604"),
            profile=ConfigProfile.awg_legacy_or_basic,
            obfuscation={"Jmin": 100, "Jmax": 50},
        )


def test_build_config_rejects_s1_plus_56_equals_s2():
    priv, pub = generate_wg_keypair()
    with pytest.raises(ConfigValidationError, match="S1|S2"):
        build_config(
            interface=InterfaceFields(private_key=priv, address="10.8.1.2/32"),
            peer=PeerFields(public_key=pub, endpoint="vpn.example.com:47604"),
            profile=ConfigProfile.awg_legacy_or_basic,
            obfuscation={"S1": 10, "S2": 66},
        )


def test_derive_address_from_profile():
    assert derive_address_from_profile(None) == "10.8.1.2/32"
    assert (
        derive_address_from_profile({"subnet_address": "10.9.0.0", "subnet_cidr": 24})
        == "10.9.0.2/24"
    )


def test_allocate_next_address():
    assert allocate_next_address("10.8.0", set()) == "10.8.0.2/32"
    assert allocate_next_address("10.8.0", {2}) == "10.8.0.3/32"
    assert allocate_next_address("10.8.0", {2, 3, 4}) == "10.8.0.5/32"
    with pytest.raises(ValueError, match="No free address"):
        allocate_next_address("10.8.0", set(range(2, 255)))


def test_output_is_lf_only():
    priv, pub = generate_wg_keypair()
    cfg = build_config(
        interface=InterfaceFields(private_key=priv, address="10.8.1.2/32"),
        peer=PeerFields(public_key=pub, endpoint="vpn.example.com:47604"),
        profile=ConfigProfile.universal_safe,
    )
    assert "\r" not in cfg
    assert "\n" in cfg


# Fixed keys for deterministic golden tests (standard WG test keys)
_GOLDEN_PRIV = "YAnz5TF+lXXJte14tji3zlMNwF4OBgO8EnZu4PpwTYU="
_GOLDEN_PUB = "M1/n0lOh+G/r7Q3j0RkCBbPRBFeYRK+da2x9SczRPyA="

_OBF_AWG = {
    "Jc": 4,
    "Jmin": 64,
    "Jmax": 1024,
    "S1": 15,
    "S2": 20,
    "H1": 1020325451,
    "H2": 2147483647,
    "H4": 2147483640,
}
_OBF_MOBILE = {
    "Jc": 2,
    "Jmin": 64,
    "Jmax": 512,
    "S1": 15,
    "S2": 20,
    "H1": 1020325451,
    "H2": 2147483647,
    "H4": 2147483640,
}


def test_golden_universal_safe():
    cfg = build_config(
        interface=InterfaceFields(private_key=_GOLDEN_PRIV, address="10.8.1.2/32", dns="1.1.1.1"),
        peer=PeerFields(public_key=_GOLDEN_PUB, endpoint="vpn.example.com:47604"),
        profile=ConfigProfile.universal_safe,
    )
    golden = (Path(__file__).parent / "fixtures" / "golden" / "universal_safe.conf").read_text()
    assert cfg == golden


def test_golden_awg_safe():
    cfg = build_config(
        interface=InterfaceFields(private_key=_GOLDEN_PRIV, address="10.8.1.2/32", dns="1.1.1.1"),
        peer=PeerFields(public_key=_GOLDEN_PUB, endpoint="vpn.example.com:47604"),
        profile=ConfigProfile.awg_2_0_asc,
        obfuscation=_OBF_AWG,
    )
    golden = (Path(__file__).parent / "fixtures" / "golden" / "awg_safe.conf").read_text()
    assert cfg == golden


def test_golden_mobile_optimized():
    cfg = build_config(
        interface=InterfaceFields(private_key=_GOLDEN_PRIV, address="10.8.1.2/32", dns="1.1.1.1"),
        peer=PeerFields(public_key=_GOLDEN_PUB, endpoint="vpn.example.com:47604"),
        profile=ConfigProfile.mobile_optimized,
        obfuscation=_OBF_MOBILE,
    )
    golden = (Path(__file__).parent / "fixtures" / "golden" / "mobile_optimized.conf").read_text()
    assert cfg == golden


def test_awg_keys_only_in_interface_section():
    priv, pub = generate_wg_keypair()
    cfg = build_config(
        interface=InterfaceFields(private_key=priv, address="10.8.1.2/32"),
        peer=PeerFields(public_key=pub, endpoint="vpn.example.com:47604"),
        profile=ConfigProfile.awg_2_0_asc,
        obfuscation={"Jc": 4, "S1": 15, "S2": 20},
    )
    assert cfg.index("Jc = 4") < cfg.index("[Peer]")


# Reference-like obfuscation (H1-H4 match amnezia-awg default when AWG_H* unset)
_OBF_REFERENCE = {
    "Jc": 3,
    "Jmin": 10,
    "Jmax": 50,
    "S1": 213,
    "S2": 237,
    "H1": 10,
    "H2": 20,
    "H3": 30,
    "H4": 40,
}


def test_awg_config_format_matches_reference_structure():
    """AWG config has [Interface] then [Peer]; no comment lines; AmneziaWG keys in Interface."""
    cfg = build_config(
        interface=InterfaceFields(private_key=_GOLDEN_PRIV, address="10.8.1.17/32", dns="1.1.1.1"),
        peer=PeerFields(
            public_key=_GOLDEN_PUB,
            endpoint="185.139.228.171:47604",
            preshared_key="YAnz5TF+lXXJte14tji3zlMNwF4OBgO8EnZu4PpwTYU=",
        ),
        profile=ConfigProfile.awg_2_0_asc,
        obfuscation=_OBF_REFERENCE,
    )
    lines = [ln.strip() for ln in cfg.splitlines() if ln.strip()]
    sections = [ln for ln in lines if ln.startswith("[") and ln.endswith("]")]
    assert sections == ["[Interface]", "[Peer]"]
    assert not any(ln.startswith("#") or ln.startswith(";") for ln in lines)
    interface_start = lines.index("[Interface]")
    peer_start = lines.index("[Peer]")
    interface_lines = lines[interface_start + 1 : peer_start]
    peer_lines = lines[peer_start + 1 :]
    interface_keys = {ln.split("=", 1)[0].strip() for ln in interface_lines if "=" in ln}
    peer_keys = {ln.split("=", 1)[0].strip() for ln in peer_lines if "=" in ln}
    for key in ("Jc", "Jmin", "Jmax", "S1", "S2", "H1", "H2", "H3", "H4"):
        assert key in interface_keys, f"AmneziaWG key {key} must be in [Interface]"
    for key in ("PublicKey", "Endpoint", "AllowedIPs", "PersistentKeepalive", "PresharedKey"):
        assert key in peer_keys, f"Peer key {key} must be in [Peer]"


def test_build_config_parses_as_ini_section_order():
    """Built config parses as INI; sections are [Interface] then [Peer]; required keys present."""
    cfg = build_config(
        interface=InterfaceFields(private_key=_GOLDEN_PRIV, address="10.8.1.2/32", dns="1.1.1.1"),
        peer=PeerFields(public_key=_GOLDEN_PUB, endpoint="vpn.example.com:47604"),
        profile=ConfigProfile.awg_2_0_asc,
        obfuscation=_OBF_REFERENCE,
    )
    parser = configparser.ConfigParser()
    parser.read_file(io.StringIO(cfg))
    assert list(parser.keys()) == ["DEFAULT", "Interface", "Peer"]
    assert parser.has_section("Interface")
    assert parser.has_section("Peer")
    for key in (
        "PrivateKey",
        "Address",
        "DNS",
        "Jc",
        "Jmin",
        "Jmax",
        "S1",
        "S2",
        "H1",
        "H2",
        "H3",
        "H4",
    ):
        assert parser.has_option("Interface", key), f"Interface must have {key}"
    for key in ("PublicKey", "Endpoint", "AllowedIPs", "PersistentKeepalive"):
        assert parser.has_option("Peer", key), f"Peer must have {key}"


# Contract: config output MUST NOT contain comments, timestamps, or year/date headers
_NO_DATE_PATTERNS = ("2024", "2025", "2026", "Generated", "generated_at", "Created:")


@pytest.mark.parametrize(
    "profile,obfuscation",
    [
        (ConfigProfile.universal_safe, None),
        (ConfigProfile.awg_2_0_asc, _OBF_AWG),
    ],
)
def test_build_config_contains_no_year_or_date(profile, obfuscation):
    kwargs = dict(
        interface=InterfaceFields(private_key=_GOLDEN_PRIV, address="10.8.1.2/32", dns="1.1.1.1"),
        peer=PeerFields(public_key=_GOLDEN_PUB, endpoint="vpn.example.com:47604"),
        profile=profile,
    )
    if obfuscation is not None:
        kwargs["obfuscation"] = obfuscation
    cfg = build_config(**kwargs)
    for pat in _NO_DATE_PATTERNS:
        assert pat not in cfg, f"Config must not contain {pat!r}"
    assert not any(
        line.strip().startswith("#") or line.strip().startswith(";") for line in cfg.splitlines()
    )
