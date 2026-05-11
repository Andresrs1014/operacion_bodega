from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_hours: int = 8

    smtp_user: str = ""
    smtp_password: str = ""
    report_recipients: str = ""

    # APP_ENV=development permite seed_dev.py; en producción no ejecutar scripts de demo.
    app_environment: str = Field(default="production", validation_alias="APP_ENV")

    # Admin inicial solo si la BD no tiene ningún usuario con rol admin activo (ver bootstrap.py).
    bootstrap_admin_cedula: str = ""
    bootstrap_admin_password: str = ""
    bootstrap_admin_nombre: str = "Administrador"

    @property
    def recipients_list(self) -> List[str]:
        return [r.strip() for r in self.report_recipients.split(",") if r.strip()]


settings = Settings()
