import logging
import os
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import JSONResponse

from app.api.auth import router as auth_router
from app.api.chat import router as chat_router
from app.config import Settings
from app.database import close_db, init_db
from app.middleware import JwtAuthMiddleware, LoggingMiddleware, RateLimitMiddleware
from app.services.chat import ChatService
from app.services.token import TokenService

logger = logging.getLogger("flowmind")


def create_app(settings: Settings | None = None) -> FastAPI:
    if settings is None:
        settings = Settings(provider_api_key=os.getenv("PROVIDER_API_KEY", ""))

    structlog.configure(
        wrapper_class=structlog.make_filtering_bound_logger(
            getattr(logging, settings.log_level.upper(), logging.INFO)
        ),
    )

    token_service = TokenService(settings)

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        await init_db(settings)
        app.state.chat_service = ChatService(settings)
        app.state.settings = settings
        app.state.token_service = token_service
        yield
        await close_db()

    app = FastAPI(title="FLowMind Chat API", version="0.1.0", lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(LoggingMiddleware)
    app.add_middleware(
        RateLimitMiddleware,
        max_per_minute=settings.rate_limit_per_minute,
    )
    app.add_middleware(JwtAuthMiddleware, token_service=token_service)

    app.include_router(auth_router)
    app.include_router(chat_router)

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.exception(
            "unhandled exception",
            extra={
                "method": request.method,
                "path": request.url.path,
                "error": str(exc),
            },
        )
        return JSONResponse(
            status_code=500,
            content={
                "error": {
                    "message": "Internal server error",
                    "type": "internal_server_error",
                    "code": 500,
                }
            },
        )

    @app.get("/health")
    async def health():
        return {"status": "ok"}

    return app


app = create_app()
