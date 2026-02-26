"""Telegram VPN Bot — aiogram 3, Admin API client."""

import asyncio
import sys

from utils.logging import setup_logging, get_logger

setup_logging()

import aiohttp.http_exceptions
from aiohttp import web
from aiogram import Bot, Dispatcher
from metrics import metrics_content_type, metrics_output
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.fsm.storage.memory import MemoryStorage

from config import (
    BOT_TOKEN,
    BOT_USERNAME,
    BOT_POLLING_TIMEOUT,
    BOT_TASKS_CONCURRENCY_LIMIT,
    OTEL_TRACES_ENDPOINT,
    PORT,
    REDIS_URL,
    SUPPORT_HANDLE,
    PANEL_URL,
)
from commands import COMMANDS, register_commands
from api_client import init_api, close_api
from utils.config_validator import validate_config
from middleware.logging import LoggingMiddleware
from handlers.start import router as start_router
from handlers.tariffs import router as tariffs_router
from handlers.status import router as status_router
from handlers.devices import router as devices_router
from handlers.install import router as install_router
from handlers.help import router as help_router
from handlers.support import router as support_router
from otel_tracing import setup_otel_tracing

_log = get_logger(__name__)
TRACING_ENABLED = False


async def _ensure_redis(redis_url: str, max_attempts: int = 5):
    """Connect to Redis with retry; return Redis or None on failure."""
    from redis.asyncio import Redis

    for attempt in range(1, max_attempts + 1):
        try:
            redis = Redis.from_url(redis_url, socket_connect_timeout=5)
            await redis.ping()
            return redis
        except Exception as e:
            _log.warning("Redis connect attempt %d/%d failed: %s", attempt, max_attempts, e)
            if attempt < max_attempts:
                await asyncio.sleep(2)
    return None


async def healthz_handler(_):
    if TRACING_ENABLED:
        from opentelemetry import trace

        tracer = trace.get_tracer(__name__)
        with tracer.start_as_current_span("healthz"):
            pass
    return web.Response(text="ok", status=200)


async def metrics_handler(_):
    return web.Response(
        body=metrics_output(),
        headers={"Content-Type": metrics_content_type()},
    )


@web.middleware
async def bad_request_middleware(request, handler):
    try:
        return await handler(request)
    except aiohttp.http_exceptions.BadHttpMessage:
        return web.Response(status=400, text="Bad Request")


async def run_healthz_app(tracing_enabled: bool):
    app = web.Application(middlewares=[bad_request_middleware])
    if tracing_enabled:
        from opentelemetry.instrumentation.aiohttp_server import AioHttpServerInstrumentor

        AioHttpServerInstrumentor().instrument()
    app.router.add_get("/healthz", healthz_handler)
    app.router.add_get("/metrics", metrics_handler)
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, "0.0.0.0", PORT)
    await site.start()
    _log.info("Health server on port %s", PORT)


async def run_bot():
    validate_config()
    tracing_enabled = setup_otel_tracing(OTEL_TRACES_ENDPOINT)
    global TRACING_ENABLED
    TRACING_ENABLED = tracing_enabled
    await run_healthz_app(tracing_enabled)
    await init_api()
    try:
        bot = Bot(token=BOT_TOKEN, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
        await register_commands(bot)
        banner = (
            "═══════════════════════════════════\n"
            f"Bot: @{BOT_USERNAME}\n"
            f"API: {PANEL_URL}\n"
            f"Support: {SUPPORT_HANDLE}\n"
            f"Commands: {len(COMMANDS)} registered\n"
            "═══════════════════════════════════"
        )
        _log.info("startup", banner=banner)
        if REDIS_URL:
            from aiogram.fsm.storage.redis import RedisStorage
            redis = await _ensure_redis(REDIS_URL)
            if redis:
                storage = RedisStorage(redis=redis)
                _log.info("FSM storage: Redis (persists across restarts)")
            else:
                storage = MemoryStorage()
                _log.warning("Redis unavailable after retries; falling back to MemoryStorage")
        else:
            storage = MemoryStorage()
            _log.info("FSM storage: Memory (set REDIS_URL for persistence)")
        dp = Dispatcher(storage=storage)
        dp.update.outer_middleware(LoggingMiddleware())
        dp.include_router(start_router)
        dp.include_router(tariffs_router)
        dp.include_router(status_router)
        dp.include_router(devices_router)
        dp.include_router(install_router)
        dp.include_router(help_router)
        dp.include_router(support_router)
        await dp.start_polling(
            bot,
            polling_timeout=BOT_POLLING_TIMEOUT,
            allowed_updates=["message", "callback_query"],
            tasks_concurrency_limit=BOT_TASKS_CONCURRENCY_LIMIT,
        )
    finally:
        await close_api()


if __name__ == "__main__":
    asyncio.run(run_bot())
