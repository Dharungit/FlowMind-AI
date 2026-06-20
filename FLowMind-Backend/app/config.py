from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    provider_base_url: str = "https://api.deepseek.com/v1"
    provider_api_key: str
    provider_default_model: str = "deepseek-chat"
    auth_token: str | None = None
    rate_limit_per_minute: int = 60
    log_level: str = "INFO"

    database_url: str = "postgresql+asyncpg://user:password@localhost:5432/flowmind"
    google_client_id: str = ""
    jwt_secret: str = "change-me-in-production"

    openai_api_key: str = ""
    memory_similarity_threshold: float = 0.85
    memory_max_results: int = 5
    memory_max_per_user: int = 100

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}
