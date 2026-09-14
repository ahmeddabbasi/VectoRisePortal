from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT = Path(__file__).resolve().parents[2]
CREDENTIALS_DIR = ROOT / "credentials"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=str(ROOT / ".env"), extra="ignore")

    app_name: str = "Sales Operations Dashboard"
    debug: bool = True
    database_url: str = f"sqlite:///{ROOT / 'backend' / 'data' / 'dashboard.db'}"
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 480

    google_spreadsheet_id: str = "1WyXufFOy6Q37oEoyf6a5C7Yk46SzYGjDqXOhj9OKzVI"
    google_service_account_path: str = str(CREDENTIALS_DIR / "google-service-account.json")
    sync_interval_minutes: int = 15

    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    admin_email: str = "admin@vectoriseinc.dev"
    admin_password: str = "admin123"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
