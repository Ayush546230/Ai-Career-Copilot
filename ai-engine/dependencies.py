"""
Dependency injection for FastAPI endpoints.
Provides singleton instances of services and providers.
"""

import logging
from functools import lru_cache

from core.factory import AIProviderFactory
from services.ai_service import AIService
from config import settings

logger = logging.getLogger(__name__)


@lru_cache()
def get_ai_provider():
    """
    Get or create AI provider instance (singleton).
    
    Returns:
        Configured AI provider instance
        
    Raises:
        ValueError: If provider configuration is invalid
    """
    logger.info(f"Creating AI provider: {settings.ai_provider}")
    
    try:
        provider = AIProviderFactory.create_provider(
            provider_type=settings.ai_provider,
            temperature=settings.ai_temperature,
            max_tokens=settings.ai_max_tokens
        )
        logger.info(f"AI provider created successfully: {provider.get_provider_name()}")
        return provider
    except Exception as e:
        logger.error(f"Failed to create AI provider: {str(e)}")
        raise


@lru_cache()
def get_ai_service() -> AIService:
    """
    Get or create AI service instance (singleton).
    
    Returns:
        Configured AI service instance
    """
    provider = get_ai_provider()
    service = AIService(provider=provider)
    logger.info("AI service created successfully")
    return service


# FastAPI dependency
async def get_ai_service_dependency() -> AIService:
    """
    FastAPI dependency for injecting AI service.
    
    Yields:
        AI service instance
    """
    return get_ai_service()