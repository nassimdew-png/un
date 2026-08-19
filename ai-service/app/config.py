import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "PsyPro Clinical AI Engine"
    API_V1_STR: str = "/api/v1"
    AI_PROVIDER: str = "gemini" # 'gemini' | 'openai' | 'mock'
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    ENVIRONMENT: str = "development"

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings(
    GEMINI_API_KEY=os.getenv("GEMINI_API_KEY", ""),
    OPENAI_API_KEY=os.getenv("OPENAI_API_KEY", ""),
    AI_PROVIDER=os.getenv("AI_PROVIDER", "gemini")
)
