import base64
import json
import zlib

from app.core.amnezia_vpn_key import encode_amnezia_vpn_key, encode_awg_conf_vpn_key, sanitize_awg_conf


def _decode_vpn_key(key: str) -> dict:
    assert key.startswith("vpn://")
    payload = key[len("vpn://") :]
    # restore padding if needed
    padding = "=" * (-len(payload) % 4)
    raw = base64.urlsafe_b64decode(payload + padding)
    assert len(raw) > 12
    magic, total_len, plain_len = (
        int.from_bytes(raw[0:4], "big"),
        int.from_bytes(raw[4:8], "big"),
        int.from_bytes(raw[8:12], "big"),
    )
    assert magic == 0x07C00100
    # total_len is expected to be len(compressed) + 4 in the original format;
    # here we only assert it is consistent with the remaining bytes.
    assert total_len == len(raw) - 8
    assert plain_len > 0
    compressed = raw[12:]
    assert len(compressed) > 0
    data = zlib.decompress(compressed)
    assert len(data) == plain_len
    decoded = json.loads(data.decode("utf-8"))
    assert isinstance(decoded, dict)
    return decoded


def test_encode_amnezia_vpn_key_roundtrip_simple_json():
    cfg = {"type": "test", "v": 1, "name": "demo"}
    key = encode_amnezia_vpn_key(cfg)
    assert key.startswith("vpn://")
    decoded = _decode_vpn_key(key)
    assert decoded == cfg


def test_encode_awg_conf_vpn_key_wraps_conf_text():
    conf = """[Interface]
PrivateKey = PRIV
Address = 10.8.1.7/32
DNS = 1.1.1.1, 9.9.9.9
MTU = 1200
Jc = 3
Jmin = 10
Jmax = 50
S1 = 213
S2 = 237
S3 = 1
S4 = 2

[Peer]
PublicKey = PUB
PresharedKey = PSK
Endpoint = vpn.example.com:47604
AllowedIPs = 0.0.0.0/0, ::/0
PersistentKeepalive = 10
"""
    key = encode_awg_conf_vpn_key(conf)
    decoded = _decode_vpn_key(key)
    assert "containers" in decoded
    assert decoded["defaultContainer"] == "amnezia-awg"
    assert decoded["hostName"] == "vpn.example.com"
    assert decoded["dns1"] == "1.1.1.1"
    assert decoded["dns2"] == "9.9.9.9"
    containers = decoded["containers"]
    assert isinstance(containers, list) and len(containers) == 1
    cont = containers[0]
    assert cont["container"] == "amnezia-awg"
    assert "awg" in cont
    awg = cont["awg"]
    assert awg["isThirdPartyConfig"] is True
    assert awg["transport_proto"] == "udp"
    assert awg["port"] == "47604"
    assert awg["protocol_version"] == "2"
    last_config = json.loads(awg["last_config"])
    assert last_config["config"] == conf
    assert last_config["hostName"] == "vpn.example.com"
    assert last_config["port"] == 47604
    assert last_config["client_priv_key"] == "PRIV"
    assert last_config["server_pub_key"] == "PUB"
    assert last_config["psk_key"] == "PSK"
    assert last_config["client_ip"] == "10.8.1.7/32"
    assert last_config["allowed_ips"] == ["0.0.0.0/0", "::/0"]
    assert last_config["Jc"] == "3"
    assert last_config["Jmin"] == "10"
    assert last_config["Jmax"] == "50"
    assert last_config["S1"] == "213"
    assert last_config["S2"] == "237"
    assert last_config["S3"] == "1"
    assert last_config["S4"] == "2"


def test_sanitize_awg_conf_strips_bom_comments_empty_keys_and_normalizes():
    raw = (
        "\ufeff   [Interface]\r\n"
        "I1 = \r\n"
        "I2 =\r\n"
        "S3 =   \r\n"
        "Key = value   # inline comment\r\n"
        "# full line comment\r\n"
        "\r\n"
        "  [Peer]\r\n"
        "I3 = \r\n"
        "AllowedIPs = 0.0.0.0/0   ; another comment\r\n"
    )
    sanitized = sanitize_awg_conf(raw)
    # BOM removed and CRLF normalized
    assert "\r" not in sanitized
    assert not sanitized.startswith("\ufeff")
    # Section headers normalized and first non-empty is [Interface]
    assert sanitized.split("\n", 1)[0] == "[Interface]"
    assert "[Peer]" in sanitized
    # Empty KEY= lines dropped (any key), comments removed
    assert "I1 =" not in sanitized
    assert "I2 =" not in sanitized
    assert "I3 =" not in sanitized
    assert "S3 =" not in sanitized
    assert "# full line comment" not in sanitized
    assert "# inline comment" not in sanitized
    assert "; another comment" not in sanitized
    # Real values preserved, single trailing newline
    assert "Key = value" in sanitized
    assert "AllowedIPs = 0.0.0.0/0" in sanitized
    assert sanitized.endswith("\n")


def test_encode_awg_conf_vpn_key_handles_missing_dns_and_protocol_v1():
    conf = """[Interface]
PrivateKey = PRIV
Address = 10.8.1.7/32
MTU = 1200

[Peer]
PublicKey = PUB
PresharedKey = PSK
Endpoint = vpn.example.com:51820
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 15
"""
    key = encode_awg_conf_vpn_key(conf)
    decoded = _decode_vpn_key(key)
    assert decoded["dns1"] == ""
    assert decoded["dns2"] == ""
    cont = decoded["containers"][0]
    awg = cont["awg"]
    assert "protocol_version" not in awg

