"""Password hashing, JWT tokens, and config encryption for one-time download."""

import base64
import hashlib
from typing import Any

import bcrypt
from cryptography.fernet import Fernet
from jose import JWTError, jwt

from app.core.config import settings

ALG = settings.jwt_algorithm


def verify_password(plain: str, hashed: str) -> bool:
    raw = plain.encode("utf-8")[:72]
    return bcrypt.checkpw(raw, hashed.encode())


def get_password_hash(password: str) -> str:
    raw = password.encode("utf-8")[:72]
    return bcrypt.hashpw(raw, bcrypt.gensalt()).decode()


def create_access_token(sub: str) -> str:
    return str(
        jwt.encode(
            {"sub": sub, "type": "access", "exp": _exp(settings.access_token_expire_seconds)},
            settings.secret_key,
            algorithm=ALG,
        )
    )


def create_refresh_token(sub: str) -> str:
    return str(
        jwt.encode(
            {"sub": sub, "type": "refresh", "exp": _exp(settings.refresh_token_expire_seconds)},
            settings.secret_key,
            algorithm=ALG,
        )
    )


def _exp(seconds: int) -> int:
    from time import time

    return int(time()) + seconds


def decode_token(token: str) -> dict | None:
    try:
        out = jwt.decode(token, settings.secret_key, algorithms=[ALG])
        return out if isinstance(out, dict) else None
    except JWTError:
        return None


def validate_telegram_init_data(init_data: str, bot_token: str) -> dict | None:
    """Validate Telegram WebApp initData; return parsed dict (with user.id) or None.
    secret_key = HMAC_SHA256("WebAppData", bot_token); hash = HMAC_SHA256(secret_key, data_check_string).
    """
    import hashlib
    import hmac
    from urllib.parse import parse_qsl

    if not init_data or not bot_token:
        return None
    try:
        params = dict(parse_qsl(init_data))
        received_hash = params.pop("hash", None)
        if not received_hash:
            return None
        data_check = "\n".join(f"{k}={v}" for k, v in sorted(params.items()))
        secret_key = hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()
        computed = hmac.new(secret_key, data_check.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(computed, received_hash):
            return None
        import json

        user_str = params.get("user")
        if user_str:
            user: dict[str, Any] = json.loads(user_str)
            return user
        return params
    except Exception:
        return None


def create_webapp_session_token(tg_user_id: int, expire_seconds: int = 3600) -> str:
    """Short-lived JWT for WebApp API calls (Bearer)."""
    return str(
        jwt.encode(
            {"sub": str(tg_user_id), "type": "webapp", "exp": _exp(expire_seconds)},
            settings.secret_key,
            algorithm=ALG,
        )
    )


def _fernet_for_config() -> Fernet:
    """Fernet key derived from secret_key for encrypting issued configs."""
    raw = hashlib.sha256(settings.secret_key.encode()).digest()
    return Fernet(base64.urlsafe_b64encode(raw))


def encrypt_config(plain: str) -> str:
    """Encrypt config text for storage in IssuedConfig.config_encrypted."""
    return _fernet_for_config().encrypt(plain.encode()).decode()


def decrypt_config(encrypted: str) -> str:
    """Decrypt IssuedConfig.config_encrypted for one-time download."""
    return _fernet_for_config().decrypt(encrypted.encode()).decode()
