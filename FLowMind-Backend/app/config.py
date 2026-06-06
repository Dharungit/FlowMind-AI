from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    provider_base_url: str = "https://api.deepseek.com/v1"
    provider_api_key: str
    provider_default_model: str = "deepseek-chat"
    auth_token: str | None = None
    rate_limit_per_minute: int = 60
    log_level: str = "INFO"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}
