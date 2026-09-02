import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./sentinel.db"
    HUGGINGFACE_API_KEY: str = ""
    HUGGINGFACE_MODEL: str = "HuggingFaceH4/zephyr-7b-beta"
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "qwen/qwen3.8-27b"
    MERCHANT_NAME: str = "Apex Commerce"
    DEFAULT_MODE: str = "balanced"
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_WHATSAPP_NUMBER: str = ""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()


