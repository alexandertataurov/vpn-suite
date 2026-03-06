"""Normalize Telegram User dict from WebApp initData or Bot API into a stable requisites dict."""

_TG_BOOL_KEYS = ("is_premium", "allows_write_to_pm")


def build_tg_requisites(user: dict) -> dict:
    """Build a normalized dict of TG user requisites for User.meta["tg"].

    Only includes keys that exist and are non-None. Coerces types.
    Accepts both snake_case and camelCase input keys (WebApp / Bot API).
    """
    if not user or not isinstance(user, dict):
        return {}

    out: dict = {}

    # id
    raw_id = user.get("id")
    if raw_id is not None:
        try:
            out["id"] = int(raw_id)
        except (TypeError, ValueError):
            pass

    # string fields (support camelCase from some SDKs)
    aliases = {
        "first_name": ["first_name", "firstName"],
        "last_name": ["last_name", "lastName"],
        "username": ["username"],
        "language_code": ["language_code", "languageCode"],
        "photo_url": ["photo_url", "photoUrl"],
    }
    for out_key, in_keys in aliases.items():
        val = None
        for k in in_keys:
            if k in user and user[k] is not None:
                v = user[k]
                if isinstance(v, str):
                    val = v.strip() if v.strip() else v
                break
        if val is not None:
            out[out_key] = val

    # bool fields
    for key in _TG_BOOL_KEYS:
        camel = "".join(w if i == 0 else w.capitalize() for i, w in enumerate(key.split("_")))
        raw = user.get(key) or user.get(camel)
        if raw is not None:
            out[key] = bool(raw)

    return out
