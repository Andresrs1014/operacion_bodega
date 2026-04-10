from typing import List
from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_hours: int = 8

    smtp_user: str = ""
    smtp_password: str = ""
    report_recipients: str = ""

    @property
    def recipients_list(self) -> List[str]:
        return [r.strip() for r in self.report_recipients.split(",") if r.strip()]

    class Config:
        env_file = ".env"


settings = Settings()
