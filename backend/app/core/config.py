from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import field_validator
from decouple import config


class Settings(BaseSettings):
    # API Configuration
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "IntelliFinance"
    
    # Security
    SECRET_KEY: str = config("SECRET_KEY", default="your-secret-key-change-in-production")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    ALGORITHM: str = "HS256"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000", 
        "http://localhost:8080",
        "https://*.vercel.app",
        "https://intellifinance.vercel.app"
    ]
    ALLOWED_HOSTS: List[str] = ["localhost", "127.0.0.1", "*.vercel.app"]
    
    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v):
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    # Database
    DATABASE_URL: str = config(
        "DATABASE_URL", 
        default="sqlite:///./intellifinance.db"
    )
    
    # Redis
    REDIS_URL: str = config("REDIS_URL", default="redis://localhost:6379")
    
    # External APIs
    PLAID_CLIENT_ID: Optional[str] = config("PLAID_CLIENT_ID", default=None)
    PLAID_SECRET: Optional[str] = config("PLAID_SECRET", default=None)
    PLAID_ENV: str = config("PLAID_ENV", default="sandbox")  # sandbox, development, production
    
    # OpenAI
    OPENAI_API_KEY: Optional[str] = config("OPENAI_API_KEY", default=None)
    
    # Monitoring
    SENTRY_DSN: Optional[str] = config("SENTRY_DSN", default=None)
    
    # Email (for notifications)
    SMTP_TLS: bool = True
    SMTP_PORT: Optional[int] = None
    SMTP_HOST: Optional[str] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAILS_FROM_EMAIL: Optional[str] = None
    EMAILS_FROM_NAME: Optional[str] = None
    
    # Encryption
    ENCRYPTION_KEY: str = config("ENCRYPTION_KEY", default="your-encryption-key-32-chars-long")
    
    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings()
