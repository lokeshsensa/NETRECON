import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "NETRECON"
    PROJECT_FULL_NAME: str = "Network Reconnaissance & Security Dashboard"
    TAGLINE: str = "Discover. Analyze. Secure."
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Security / Auth
    JWT_SECRET: str = os.getenv("JWT_SECRET", "netrecon-super-secret-jwt-key-2026-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./netrecon.db")
    
    # Scanner Settings
    SCAN_TIMEOUT: int = int(os.getenv("SCAN_TIMEOUT", "600")) # 10 minutes
    MAX_CONCURRENT_SCANS: int = int(os.getenv("MAX_CONCURRENT_SCANS", "3"))
    DEFAULT_SCAN_PROFILE: str = "STANDARD"
    
    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:8000"
    ]
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
