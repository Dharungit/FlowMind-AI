import time
import logging

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from app.services.token import TokenService

logger = logging.getLogger("flowmind")


PUBLIC_PATHS = {"/health", "/v1/auth/google", "/v1/auth/refresh"}


class JwtAuthMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, token_service: TokenService):
        super().__init__(app)
        self.token_service = token_service

    async def dispatch(self, request: Request, call_next):
        if request.method == "OPTIONS":
            return await call_next(request)

        if request.url.path in PUBLIC_PATHS:
            return await call_next(request)

        auth = request.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            logger.warning("missing auth header", extra={"path": request.url.path, "method": request.method})
            return JSONResponse(
                status_code=401,
                content={
                    "error": {
                        "message": "Missing or invalid authorization header",
                        "type": "authentication_error",
                        "code": 401,
                    }
                },
            )

        token = auth.removeprefix("Bearer ")
        try:
            payload = self.token_service.verify_access_token(token)
        except ValueError as e:
            logger.warning("token validation failed", extra={"path": request.url.path, "error": str(e)})
            return JSONResponse(
                status_code=401,
                content={
                    "error": {
                        "message": str(e),
                        "type": "authentication_error",
                        "code": 401,
                    }
                },
            )

        request.state.user_id = payload["sub"]
        return await call_next(request)


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_per_minute: int = 60):
        super().__init__(app)
        self.max_per_minute = max_per_minute
        self._requests: dict[str, list[float]] = {}

    async def dispatch(self, request: Request, call_next):
        if request.method in ("POST", "PUT", "DELETE", "PATCH"):
            client_ip = request.client.host if request.client else "unknown"
            now = time.time()
            window = now - 60
            timestamps = self._requests.setdefault(client_ip, [])
            timestamps[:] = [t for t in timestamps if t > window]
            if len(timestamps) >= self.max_per_minute:
                logger.warning("rate limit exceeded", extra={"ip": client_ip, "path": request.url.path})
                return JSONResponse(
                    status_code=429,
                    content={
                        "error": {
                            "message": "Rate limit exceeded. Try again later.",
                            "type": "rate_limit_error",
                            "code": 429,
                        }
                    },
                )
            timestamps.append(now)
        return await call_next(request)


class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.time()
        response = await call_next(request)
        duration = time.time() - start

        body = b""
        if response.status_code >= 400:
            async for chunk in response.body_iterator:
                body += chunk

            response = Response(
                content=body,
                status_code=response.status_code,
                headers=dict(response.headers),
                media_type=response.media_type,
            )

            log_fn = logger.warning if response.status_code < 500 else logger.error
            log_fn(
                "request failed",
                extra={
                    "method": request.method,
                    "path": request.url.path,
                    "status": response.status_code,
                    "duration_ms": round(duration * 1000),
                    "response_body": body.decode("utf-8", errors="replace"),
                },
            )
        else:
            logger.info(
                "request completed",
                extra={
                    "method": request.method,
                    "path": request.url.path,
                    "status": response.status_code,
                    "duration_ms": round(duration * 1000),
                },
            )

        return response
