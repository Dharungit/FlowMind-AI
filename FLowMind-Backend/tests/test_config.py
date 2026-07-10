from app.config import Settings

def test_config_defaults():
    settings = Settings(_env_file=None, provider_api_key="test-key-123")
    assert settings.provider_base_url == "https://api.deepseek.com/v1"
    assert settings.provider_api_key == "test-key-123"
    assert settings.provider_default_model == "deepseek-chat"
    assert settings.rate_limit_per_minute == 60
    assert settings.log_level == "INFO"

def test_config_custom_provider():
    settings = Settings(
        _env_file=None,
        provider_base_url="https://api.openai.com/v1",
        provider_api_key="sk-xxx",
        provider_default_model="gpt-4o",
    )
    assert settings.provider_base_url == "https://api.openai.com/v1"
    assert settings.provider_default_model == "gpt-4o"

def test_config_auth_disabled_by_default():
    settings = Settings(_env_file=None, provider_api_key="key")
    assert settings.auth_token is None
