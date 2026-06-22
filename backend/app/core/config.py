import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator

class Settings(BaseSettings):
    MONGODB_URI: str = "mongodb://localhost:27017/codementor"
    JWT_SECRET_KEY: str = "9a7df64380a424cd9a3cb7ad78ffdbef3294ba7eef9f2e347de2f913d8a0c20a"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.0-flash"
    FRONTEND_URL: str = "http://localhost:5173"

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origins(self) -> List[str]:
        if not self.FRONTEND_URL:
            return ["http://localhost:5173"]
        return [origin.strip() for origin in self.FRONTEND_URL.split(",") if origin.strip()]

settings = Settings()
