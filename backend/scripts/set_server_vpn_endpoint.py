"""Set vpn_endpoint on server(s). Usage: python set_server_vpn_endpoint.py <host> <port> [server_id].
If server_id omitted, updates all servers. Example: python set_server_vpn_endpoint.py 185.139.228.171 45790
"""
import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.models import Server


async def main() -> None:
    host = (sys.argv[1] or "").strip() or os.environ.get("VPN_DEFAULT_HOST", "").strip()
    port = (sys.argv[2] or "").strip() or "45790"
    server_id = (sys.argv[3] or "").strip() or None
    if not host:
        print("Usage: set_server_vpn_endpoint.py <host> <port> [server_id]", file=sys.stderr)
        sys.exit(1)
    try:
        port_int = int(port)
        if not (1 <= port_int <= 65535):
            raise ValueError("port out of range")
    except ValueError:
        print("Invalid port", file=sys.stderr)
        sys.exit(1)
    endpoint = f"{host}:{port_int}"

    engine = create_async_engine(settings.database_url)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        if server_id:
            r = await session.execute(select(Server).where(Server.id == server_id))
            server = r.scalar_one_or_none()
            if not server:
                print(f"Server {server_id} not found", file=sys.stderr)
                sys.exit(1)
            servers = [server]
        else:
            r = await session.execute(select(Server))
            servers = list(r.scalars().all())
        if not servers:
            print("No servers found", file=sys.stderr)
            sys.exit(0)
        for s in servers:
            s.vpn_endpoint = endpoint
        await session.commit()
        for s in servers:
            print(f"Updated {s.id}: vpn_endpoint = {s.vpn_endpoint}")


if __name__ == "__main__":
    asyncio.run(main())
