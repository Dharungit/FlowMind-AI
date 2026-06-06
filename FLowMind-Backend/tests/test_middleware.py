import pytest
from starlette.testclient import TestClient

from app.config import Settings
from app.main import create_app


def test_auth_disabled_when_no_token(settings):
    app = create_app(settings)
    client = TestClient(app)
    resp = client.post(
        "/v1/chat/completions",
        json={"messages": [{"role": "user", "content": "Hi"}]},
    )
    assert resp.status_code != 401


def test_auth_enabled_rejects_missing_token(settings):
    settings.auth_token = "secret-123"
    app = create_app(settings)
    client = TestClient(app)
    resp = client.post(
        "/v1/chat/completions",
        json={"messages": [{"role": "user", "content": "Hi"}]},
    )
    assert resp.status_code == 401
    data = resp.json()
    assert data["error"]["type"] == "authentication_error"


def test_auth_enabled_accepts_valid_token(settings):
    settings.auth_token = "secret-123"
    app = create_app(settings)
    client = TestClient(app)
    resp = client.post(
        "/v1/chat/completions",
        json={"messages": [{"role": "user", "content": "Hi"}]},
        headers={"Authorization": "Bearer secret-123"},
    )
    assert resp.status_code != 401


@pytest.mark.parametrize("method,path", [
    ("get", "/health"),
])
def test_auth_skipped_for_public_endpoints(method, path, settings):
    settings.auth_token = "secret-123"
    app = create_app(settings)
    client = TestClient(app)
    resp = getattr(client, method)(path)
    assert resp.status_code != 401
