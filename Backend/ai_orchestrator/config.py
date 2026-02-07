"""
Configuration settings for the AI Orchestrator
"""
from pydantic_settings import BaseSettings
from typing import Optional, List


class Settings(BaseSettings):
    """Application settings"""

    # Application
    APP_NAME: str = "TravelOps AI Orchestrator"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # API
    API_V1_PREFIX: str = "/api/v1"
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # CORS - Allow all origins for mobile app development
    CORS_ORIGINS: List[str] = ["*"]

    # AI Models (optional - for future integration)
    OPENAI_API_KEY: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    GROQ_API_KEY: Optional[str] = "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"

    # Groq Settings - Choose your model based on needs
    USE_GROQ_LLM: bool = True  # Enable Groq as main LLM

    # 🎯 MODEL SELECTION - Choose based on your needs:
    #
    # ⭐ RECOMMENDED: "mixtral-8x7b-32768" (CURRENT)
    #    - Speed: 1-2s | Quality: 9/10 | Cost: Medium
    #    - Perfect balance for travel planning
    #    - Best for hackathon demo and production
    #
    # ⚡ FASTEST: "llama-3.1-8b-instant"
    #    - Speed: <1s | Quality: 8/10 | Cost: Low
    #    - Use for instant suggestions, chat features
    #
    # 🧠 SMARTEST: "llama-3.1-70b-versatile"
    #    - Speed: 2-3s | Quality: 10/10 | Cost: High
    #    - Use for complex itineraries, premium features
    #
    # 🆕 NEWEST: "llama-3.3-70b-versatile"
    #    - Speed: 2-3s | Quality: 10/10 | Cost: High
    #    - Latest model with improved accuracy
    #
    GROQ_MODEL: str = "mixtral-8x7b-32768"  # ⭐ RECOMMENDED - Perfect for travel AI

    # Alternative models (uncomment to switch):
    # GROQ_MODEL: str = "llama-3.1-8b-instant"          # For maximum speed
    # GROQ_MODEL: str = "llama-3.1-70b-versatile"       # For best intelligence
    # GROQ_MODEL: str = "llama-3.3-70b-versatile"       # For latest/newest
    # GROQ_MODEL: str = "gemma2-9b-it"                  # Alternative balanced

    # Supabase (for integration with existing backend)
    SUPABASE_URL: Optional[str] = None
    SUPABASE_KEY: Optional[str] = None

    # Redis (for caching - optional)
    REDIS_URL: Optional[str] = "redis://localhost:6379"

    # Budget constraints
    MIN_BUDGET_PER_PERSON: float = 3000.0
    MAX_TRAVELERS: int = 10

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
