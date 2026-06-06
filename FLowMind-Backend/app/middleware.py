import time
import logging

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

logger = logging.getLogger("flowmind")


class AuthMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, auth_token: str | None = None):
        super().__init__(app)
        self.auth_token = auth_token

    async def dispatch(self, request: Request, call_next):
        if self.auth_token and request.method in ("POST", "PUT", "DELETE", "PATCH"):
            auth = request.headers.get("Authorization", "")
            if auth != f"Bearer {self.auth_token}":
                return JSONResponse(
                    status_code=401,
                    content={
                        "error": {
                            "message": "Invalid or missing authentication token",
                            "type": "authentication_error",
                            "code": 401,
                        }
                    },
                )
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
