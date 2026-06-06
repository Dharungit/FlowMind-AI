import logging
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import JSONResponse

from app.api.chat import router as chat_router
from app.config import Settings
from app.middleware import AuthMiddleware, LoggingMiddleware, RateLimitMiddleware
from app.services.chat import ChatService


def create_app(settings: Settings | None = None) -> FastAPI:
    if settings is None:
        settings = Settings()

    structlog.configure(
        wrapper_class=structlog.make_filtering_bound_logger(
            getattr(logging, settings.log_level.upper(), logging.INFO)
        ),
    )

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        app.state.chat_service = ChatService(settings)
        yield

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
    app.add_middleware(AuthMiddleware, auth_token=settings.auth_token)

    app.include_router(chat_router)

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
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
