"""
Dependency injection for FastAPI endpoints.
Provides singleton instances of services and providers.
"""

import logging
import os
from functools import lru_cache

from core.factory import AIProviderFactory
from services.ai_service import AIService
from services.interview_service import InterviewService
from services.interview_agent_service import InterviewAgentService
from services.rag_service import RAGService
from services.mentor_service import MentorService
from config import settings

logger = logging.getLogger(__name__)


@lru_cache()
def get_ai_provider():
    """
    Get or create AI provider instance (singleton).
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
    """Get or create AI service instance (singleton)."""
    provider = get_ai_provider()
    return AIService(provider=provider)


@lru_cache()
def get_interview_service():
    """Get or create Interview service instance (singleton).
    
    Uses LangChain Agent by default. Set USE_AGENT_INTERVIEW=false
    to fall back to the old prompt-based service.
    """
    use_agent = os.getenv("USE_AGENT_INTERVIEW", "true").lower() == "true"
    
    if use_agent:
        try:
            service = InterviewAgentService()
            logger.info("Using LangChain Interview Agent")
            return service
        except Exception as e:
            logger.warning(f"Failed to init agent, falling back to legacy: {str(e)}")
            provider = get_ai_provider()
            return InterviewService(provider=provider)
    else:
        logger.info("Using legacy InterviewService (USE_AGENT_INTERVIEW=false)")
        provider = get_ai_provider()
        return InterviewService(provider=provider)


@lru_cache()
def get_rag_service() -> RAGService:
    """Get or create RAG service instance (singleton)."""
    provider = get_ai_provider()
    return RAGService(provider=provider)


@lru_cache()
def get_mentor_service() -> MentorService:
    """Get or create Mentor service instance (singleton)."""
    provider = get_ai_provider()
    rag_service = get_rag_service()
    return MentorService(provider=provider, rag_service=rag_service)


# FastAPI dependencies
async def get_ai_service_dependency() -> AIService:
    return get_ai_service()

async def get_interview_service_dependency() -> InterviewService:
    return get_interview_service()

async def get_mentor_service_dependency() -> MentorService:
    return get_mentor_service()

async def get_rag_service_dependency() -> RAGService:
    return get_rag_service()