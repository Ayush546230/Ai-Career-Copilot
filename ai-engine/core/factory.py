"""
Factory for creating AI provider instances.
Implements the Factory pattern for vendor-agnostic AI operations.
"""

import os
import logging
from typing import Optional
from enum import Enum

from providers.base import AIProviderBase
from providers.gemini import GeminiProvider
from providers.openai import OpenAIProvider
from providers.claude import ClaudeProvider

logger = logging.getLogger(__name__)


class AIProviderType(str, Enum):
    """Supported AI provider types."""
    GEMINI = "gemini"
    OPENAI = "openai"
    CLAUDE = "claude"


class AIProviderFactory:
    """
    Factory class for creating AI provider instances.
    Handles provider selection based on environment configuration.
    """
    
    # Default model configurations for each provider
    DEFAULT_MODELS = {
        AIProviderType.GEMINI: "models/gemini-2.5-flash",
        AIProviderType.OPENAI: "gpt-4-turbo-preview",
        AIProviderType.CLAUDE: "claude-3-sonnet-20240229"
    }
    
    @staticmethod
    def create_provider(
        provider_type: Optional[str] = None,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None
    ) -> AIProviderBase:
        """
        Create an AI provider instance based on configuration.
        
        Args:
            provider_type: Type of provider (gemini, openai, claude).
                          If None, uses AI_PROVIDER env var
            api_key: API key for the provider.
                    If None, uses provider-specific env var
            model: Model name. If None, uses provider-specific env var or default
            temperature: Sampling temperature. If None, uses AI_TEMPERATURE env var
            max_tokens: Max output tokens. If None, uses AI_MAX_TOKENS env var
            
        Returns:
            Configured AI provider instance
            
        Raises:
            ValueError: If provider type is invalid or configuration is missing
            
        Example:
            # Using environment variables
            provider = AIProviderFactory.create_provider()
            
            # Explicit configuration
            provider = AIProviderFactory.create_provider(
                provider_type="gemini",
                api_key="your-api-key",
                model="models/gemini-2.5-flash"
            )
        """
        # Determine provider type
        if provider_type is None:
            provider_type = os.getenv("AI_PROVIDER", "gemini").lower()
        else:
            provider_type = provider_type.lower()
        
        # Validate provider type
        try:
            provider_enum = AIProviderType(provider_type)
        except ValueError:
            valid_providers = [p.value for p in AIProviderType]
            raise ValueError(
                f"Invalid AI provider: {provider_type}. "
                f"Must be one of: {', '.join(valid_providers)}"
            )
        
        # Get common configuration
        temperature = temperature if temperature is not None else float(os.getenv("AI_TEMPERATURE", "0.2"))
        max_tokens = max_tokens if max_tokens is not None else int(os.getenv("AI_MAX_TOKENS", "8192"))
        
        # Create provider instance
        if provider_enum == AIProviderType.GEMINI:
            return AIProviderFactory._create_gemini_provider(
                api_key, model, temperature, max_tokens
            )
        elif provider_enum == AIProviderType.OPENAI:
            return AIProviderFactory._create_openai_provider(
                api_key, model, temperature, max_tokens
            )
        elif provider_enum == AIProviderType.CLAUDE:
            return AIProviderFactory._create_claude_provider(
                api_key, model, temperature, max_tokens
            )
        else:
            # This should never happen due to enum validation above
            raise ValueError(f"Unsupported provider type: {provider_type}")
    
    @staticmethod
    def _create_gemini_provider(
        api_key: Optional[str],
        model: Optional[str],
        temperature: float,
        max_tokens: int
    ) -> GeminiProvider:
        """Create Gemini provider instance."""
        api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError(
                "Gemini API key not found. "
                "Set GEMINI_API_KEY environment variable or pass api_key parameter"
            )
        
        model = model or os.getenv("GEMINI_MODEL") or AIProviderFactory.DEFAULT_MODELS[AIProviderType.GEMINI]
        
        logger.info(f"Creating Gemini provider with model: {model}")
        return GeminiProvider(
            api_key=api_key,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens
        )
    
    @staticmethod
    def _create_openai_provider(
        api_key: Optional[str],
        model: Optional[str],
        temperature: float,
        max_tokens: int
    ) -> OpenAIProvider:
        """Create OpenAI provider instance."""
        api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError(
                "OpenAI API key not found. "
                "Set OPENAI_API_KEY environment variable or pass api_key parameter"
            )
        
        model = model or os.getenv("OPENAI_MODEL") or AIProviderFactory.DEFAULT_MODELS[AIProviderType.OPENAI]
        
        logger.info(f"Creating OpenAI provider with model: {model}")
        return OpenAIProvider(
            api_key=api_key,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens
        )
    
    @staticmethod
    def _create_claude_provider(
        api_key: Optional[str],
        model: Optional[str],
        temperature: float,
        max_tokens: int
    ) -> ClaudeProvider:
        """Create Claude provider instance."""
        api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError(
                "Anthropic API key not found. "
                "Set ANTHROPIC_API_KEY environment variable or pass api_key parameter"
            )
        
        model = model or os.getenv("CLAUDE_MODEL") or AIProviderFactory.DEFAULT_MODELS[AIProviderType.CLAUDE]
        
        logger.info(f"Creating Claude provider with model: {model}")
        return ClaudeProvider(
            api_key=api_key,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens
        )
    
    @staticmethod
    def get_available_providers() -> list[str]:
        """
        Get list of available provider types.
        
        Returns:
            List of provider type strings
        """
        return [p.value for p in AIProviderType]
    
    @staticmethod
    def get_default_model(provider_type: str) -> str:
        """
        Get default model for a provider type.
        
        Args:
            provider_type: Provider type string
            
        Returns:
            Default model name
            
        Raises:
            ValueError: If provider type is invalid
        """
        try:
            provider_enum = AIProviderType(provider_type.lower())
            return AIProviderFactory.DEFAULT_MODELS[provider_enum]
        except ValueError:
            valid_providers = [p.value for p in AIProviderType]
            raise ValueError(
                f"Invalid provider type: {provider_type}. "
                f"Must be one of: {', '.join(valid_providers)}"
            )