"""Server-scoped AmneziaWG H1–H4: use profile/server or CSPRNG-generate and persist."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.amnezia_config import generate_h_params
from app.models import Server


async def request_params_with_server_h(
    session: AsyncSession,
    server: Server,
    request_params: dict | None,
) -> dict:
    """Return request_params with H1–H4 from profile, server, or CSPRNG-generated and persisted on server."""
    params = dict(request_params) if request_params else {}
    if all(params.get(k) is not None for k in ("amnezia_h1", "amnezia_h2", "amnezia_h3", "amnezia_h4")):
        return params
    h1 = getattr(server, "amnezia_h1", None)
    h2 = getattr(server, "amnezia_h2", None)
    h3 = getattr(server, "amnezia_h3", None)
    h4 = getattr(server, "amnezia_h4", None)
    if all(x is not None for x in (h1, h2, h3, h4)):
        params["amnezia_h1"], params["amnezia_h2"], params["amnezia_h3"], params["amnezia_h4"] = h1, h2, h3, h4
        return params
    H1, H2, H3, H4 = generate_h_params()
    server.amnezia_h1, server.amnezia_h2, server.amnezia_h3, server.amnezia_h4 = H1, H2, H3, H4
    await session.flush()
    params["amnezia_h1"], params["amnezia_h2"], params["amnezia_h3"], params["amnezia_h4"] = H1, H2, H3, H4
    return params
