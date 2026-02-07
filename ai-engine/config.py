"""
Application configuration using Pydantic Settings.
Loads configuration from environment variables with validation.
"""

from typing import List
from pydantic_settings import BaseSettings
from pydantic import Field, validator
from dotenv import load_dotenv

# Forcefully load .env file
load_dotenv()


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Service Configuration
    service_name: str = Field(default="ai-engine", env="SERVICE_NAME")
    service_version: str = Field(default="1.0.0", env="SERVICE_VERSION")
    environment: str = Field(default="development", env="ENVIRONMENT")
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    
    # API Configuration
    api_v1_prefix: str = Field(default="/api/v1", env="API_V1_PREFIX")
    cors_origins: str = Field(default="http://localhost:3000", env="CORS_ORIGINS")
    
    # AI Provider Configuration
    ai_provider: str = Field(default="gemini", env="AI_PROVIDER")
    ai_temperature: float = Field(default=0.2, env="AI_TEMPERATURE")
    ai_max_tokens: int = Field(default=4000, env="AI_MAX_TOKENS")
    
    # API Keys (optional - validated when provider is selected)
    gemini_api_key: str = Field(default="", env="GEMINI_API_KEY")
    openai_api_key: str = Field(default="", env="OPENAI_API_KEY")
    anthropic_api_key: str = Field(default="", env="ANTHROPIC_API_KEY")
    
    # Model Configuration
    gemini_model: str = Field(default="models/gemini-2.5-flash", env="GEMINI_MODEL")
    openai_model: str = Field(default="gpt-4-turbo-preview", env="OPENAI_MODEL")
    claude_model: str = Field(default="claude-3-sonnet-20240229", env="CLAUDE_MODEL")
    
    # Rate Limiting
    rate_limit_per_minute: int = Field(default=60, env="RATE_LIMIT_PER_MINUTE")
    
    @validator("ai_provider")
    def validate_ai_provider(cls, v: str) -> str:
        """Validate AI provider value."""
        valid_providers = ["gemini", "openai", "claude"]
        if v.lower() not in valid_providers:
            raise ValueError(
                f"Invalid AI_PROVIDER: {v}. Must be one of: {', '.join(valid_providers)}"
            )
        return v.lower()
    
    @validator("environment")
    def validate_environment(cls, v: str) -> str:
        """Validate environment value."""
        valid_envs = ["development", "staging", "production"]
        if v.lower() not in valid_envs:
            raise ValueError(
                f"Invalid ENVIRONMENT: {v}. Must be one of: {', '.join(valid_envs)}"
            )
        return v.lower()
    
    @validator("log_level")
    def validate_log_level(cls, v: str) -> str:
        """Validate log level."""
        valid_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        if v.upper() not in valid_levels:
            raise ValueError(
                f"Invalid LOG_LEVEL: {v}. Must be one of: {', '.join(valid_levels)}"
            )
        return v.upper()
    
    @validator("ai_temperature")
    def validate_temperature(cls, v: float) -> float:
        """Validate temperature range."""
        if not 0.0 <= v <= 1.0:
            raise ValueError("AI_TEMPERATURE must be between 0.0 and 1.0")
        return v
    
    @validator("ai_max_tokens")
    def validate_max_tokens(cls, v: int) -> int:
        """Validate max tokens."""
        if v <= 0:
            raise ValueError("AI_MAX_TOKENS must be positive")
        if v > 10000:
            raise ValueError("AI_MAX_TOKENS cannot exceed 10000")
        return v
    
    def get_cors_origins_list(self) -> List[str]:
        """
        Parse CORS origins into a list.
        
        Returns:
            List of allowed origins
        """
        return [origin.strip() for origin in self.cors_origins.split(",")]
    
    def get_api_key_for_provider(self, provider: str) -> str:
        """
        Get API key for specified provider.
        
        Args:
            provider: Provider name (gemini, openai, claude)
            
        Returns:
            API key string
            
        Raises:
            ValueError: If API key is not configured
        """
        provider = provider.lower()
        
        if provider == "gemini":
            if not self.gemini_api_key:
                raise ValueError("GEMINI_API_KEY not configured")
            return self.gemini_api_key
        elif provider == "openai":
            if not self.openai_api_key:
                raise ValueError("OPENAI_API_KEY not configured")
            return self.openai_api_key
        elif provider == "claude":
            if not self.anthropic_api_key:
                raise ValueError("ANTHROPIC_API_KEY not configured")
            return self.anthropic_api_key
        else:
            raise ValueError(f"Unknown provider: {provider}")
    
    def get_model_for_provider(self, provider: str) -> str:
        """
        Get model name for specified provider.
        
        Args:
            provider: Provider name (gemini, openai, claude)
            
        Returns:
            Model name string
        """
        provider = provider.lower()
        
        if provider == "gemini":
            return self.gemini_model
        elif provider == "openai":
            return self.openai_model
        elif provider == "claude":
            return self.claude_model
        else:
            raise ValueError(f"Unknown provider: {provider}")
    
    class Config:
        """Pydantic config."""
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


# Global settings instance
settings = Settings()