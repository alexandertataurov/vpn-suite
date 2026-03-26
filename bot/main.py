"""Telegram VPN Bot — bridge between backend API and miniapp frontend.

All user interaction happens in the miniapp. The bot:
- Connects: /start → Open App button (miniapp), payment relay (Telegram Stars → backend)
- Telemetry: commands, payments, API latency to Prometheus + backend events
"""

import asyncio

from utils.logging import setup_logging, get_logger

setup_logging()

import aiohttp.http_exceptions
from aiohttp import web
from aiogram import Bot, Dispatcher, Router
from metrics import metrics_content_type, metrics_output
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.fsm.storage.memory import MemoryStorage
from aiogram.types import ErrorEvent

from config import (
    BOT_TOKEN,
    BOT_USERNAME,
    BOT_POLLING_TIMEOUT,
    BOT_TASKS_CONCURRENCY_LIMIT,
    BOT_WEBHOOK_PATH,
    BOT_WEBHOOK_URL,
    MINIAPP_URL,
    OTEL_TRACES_ENDPOINT,
    PORT,
    REDIS_URL,
    SUPPORT_HANDLE,
)
from commands import COMMANDS, register_commands
from aiogram.types import MenuButtonWebApp, WebAppInfo as MenuWebAppInfo
from utils.config_validator import validate_config
from middleware.logging import LoggingMiddleware
from api_client import init_api
from handlers.donation import router as donation_router
from handlers.payment import router as payment_router
from handlers.start import router as start_router
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


def _make_app(tracing_enabled: bool, webhook_path: str = "", dp=None, bot=None):
    app = web.Application(middlewares=[bad_request_middleware])
    if tracing_enabled:
        from opentelemetry.instrumentation.aiohttp_server import AioHttpServerInstrumentor

        AioHttpServerInstrumentor().instrument()
    app.router.add_get("/healthz", healthz_handler)
    app.router.add_get("/metrics", metrics_handler)
    if webhook_path and dp is not None and bot is not None:
        from aiogram.types import Update

        async def webhook_handler(request: web.Request) -> web.Response:
            try:
                body = await request.json()
                update = Update(**body)
                await dp.feed_update(bot, update)
            except Exception as e:
                _log.warning("webhook_handler_error", error=str(e))
                return web.Response(status=500, text="Internal error")
            return web.Response(status=200)
        app.router.add_post(webhook_path, webhook_handler)
    return app


async def run_healthz_app(tracing_enabled: bool, app: web.Application | None = None):
    if app is None:
        app = _make_app(tracing_enabled)
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, "0.0.0.0", PORT)
    await site.start()
    _log.info("Health server on port %s", PORT)


async def run_bot():
    validate_config()
    await init_api()
    tracing_enabled = setup_otel_tracing(OTEL_TRACES_ENDPOINT)
    global TRACING_ENABLED
    TRACING_ENABLED = tracing_enabled
    bot = Bot(token=BOT_TOKEN, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
    await register_commands(bot)
    if MINIAPP_URL.startswith("https://"):
        try:
            result = await bot.set_chat_menu_button(
                menu_button=MenuButtonWebApp(
                    text="Open App",
                    web_app=MenuWebAppInfo(url=MINIAPP_URL),
                )
            )
            _log.info("menu_button_set", miniapp_url=MINIAPP_URL, result=result)
        except Exception as e:
            _log.error("set_chat_menu_button_failed", error=str(e), exc_info=True)
            raise
    else:
        _log.info("menu_button_skipped", reason="MINIAPP_URL must be HTTPS for Web App button")
    banner = (
        "═══════════════════════════════════\n"
        f"Bot: @{BOT_USERNAME}\n"
        f"Miniapp: {MINIAPP_URL}\n"
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

    errors_router = Router()

    @errors_router.error()
    async def global_error_handler(event: ErrorEvent) -> bool:
        _log.error(
            "handler_error",
            exception=str(event.exception),
            update_id=event.update.update_id if event.update else None,
            exc_info=True,
        )
        msg = None
        if event.update and event.update.message:
            msg = event.update.message
        elif event.update and event.update.callback_query and event.update.callback_query.message:
            msg = event.update.callback_query.message
        if msg:
            try:
                await msg.answer("Something went wrong. Please try again later.")
            except Exception:
                pass
        return True

    dp.include_router(payment_router)
    dp.include_router(start_router)
    dp.include_router(donation_router)
    dp.include_router(errors_router)
    allowed_updates = ["message", "callback_query"]
    if BOT_WEBHOOK_URL:
        await bot.set_webhook(
            f"{BOT_WEBHOOK_URL.rstrip('/')}{BOT_WEBHOOK_PATH}",
            allowed_updates=allowed_updates,
        )
        _log.info("webhook_mode", url=f"{BOT_WEBHOOK_URL}{BOT_WEBHOOK_PATH}")
        app = _make_app(tracing_enabled, webhook_path=BOT_WEBHOOK_PATH, dp=dp, bot=bot)
        await run_healthz_app(tracing_enabled, app=app)
        await asyncio.Event().wait()
    else:
        await run_healthz_app(tracing_enabled)
        await dp.start_polling(
            bot,
            polling_timeout=BOT_POLLING_TIMEOUT,
            allowed_updates=allowed_updates,
            tasks_concurrency_limit=BOT_TASKS_CONCURRENCY_LIMIT,
        )


if __name__ == "__main__":
    asyncio.run(run_bot())
