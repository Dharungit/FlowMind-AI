import hashlib
import secrets
from datetime import datetime, timedelta, timezone

import jwt

from app.config import Settings


class TokenService:
    def __init__(self, settings: Settings):
        self.secret = settings.jwt_secret
        self.access_token_ttl = 30
        self.refresh_token_ttl = 7

    def generate_access_token(self, user_id: str, email: str) -> str:
        now = datetime.now(timezone.utc)
        payload = {
            "sub": user_id,
            "email": email,
            "iat": now,
            "exp": now + timedelta(minutes=self.access_token_ttl),
        }
        return jwt.encode(payload, self.secret, algorithm="HS256")

    def verify_access_token(self, token: str) -> dict:
        try:
            payload = jwt.decode(token, self.secret, algorithms=["HS256"], leeway=10)
            return payload
        except jwt.ExpiredSignatureError:
            raise ValueError("Token has expired")
        except jwt.InvalidTokenError:
            raise ValueError("Invalid token")

    def generate_refresh_token(self) -> str:
        return secrets.token_urlsafe(48)

    def hash_refresh_token(self, token: str) -> str:
        return hashlib.sha256(token.encode()).hexdigest()

    def get_refresh_token_expiry(self) -> datetime:
        return datetime.now(timezone.utc) + timedelta(days=self.refresh_token_ttl)
