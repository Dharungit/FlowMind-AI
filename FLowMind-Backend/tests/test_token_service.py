import time

import jwt
import pytest

from app.config import Settings
from app.services.token import TokenService


@pytest.fixture
def token_service():
    settings = Settings(
        _env_file=None,
        provider_api_key="test-key",
        jwt_secret="test-secret-key-for-testing",
    )
    return TokenService(settings)


def test_generate_access_token_returns_jwt(token_service):
    token = token_service.generate_access_token("user-123", "test@example.com")
    payload = jwt.decode(token, "test-secret-key-for-testing", algorithms=["HS256"])
    assert payload["sub"] == "user-123"
    assert payload["email"] == "test@example.com"


def test_generate_access_token_has_30_min_expiry(token_service):
    token = token_service.generate_access_token("user-123", "test@example.com")
    payload = jwt.decode(token, "test-secret-key-for-testing", algorithms=["HS256"])
    exp = payload["exp"]
    iat = payload["iat"]
    assert exp - iat == 30 * 60


def test_verify_valid_token(token_service):
    token = token_service.generate_access_token("user-123", "test@example.com")
    payload = token_service.verify_access_token(token)
    assert payload["sub"] == "user-123"
    assert payload["email"] == "test@example.com"


def test_verify_expired_token_raises_error(token_service):
    token = jwt.encode(
        {"sub": "user-123", "email": "test@example.com", "exp": int(time.time()) - 60, "iat": int(time.time()) - 120},
        "test-secret-key-for-testing",
        algorithm="HS256",
    )
    with pytest.raises(ValueError, match="expired"):
        token_service.verify_access_token(token)


def test_verify_tampered_token_raises_error(token_service):
    token = token_service.generate_access_token("user-123", "test@example.com")
    tampered = token + "x"
    with pytest.raises(ValueError, match="Invalid"):
        token_service.verify_access_token(tampered)


def test_generate_refresh_token_returns_string(token_service):
    token = token_service.generate_refresh_token()
    assert isinstance(token, str)
    assert len(token) > 32


def test_hash_refresh_token_returns_sha256(token_service):
    token = "my-refresh-token"
    hash_val = token_service.hash_refresh_token(token)
    assert len(hash_val) == 64
    assert all(c in "0123456789abcdef" for c in hash_val)


def test_hash_is_deterministic(token_service):
    token = "my-refresh-token"
    assert token_service.hash_refresh_token(token) == token_service.hash_refresh_token(token)
