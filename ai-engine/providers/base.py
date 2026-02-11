"""
Abstract Base Class for AI Providers.
All provider implementations must inherit from this base class.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)


class AIProviderBase(ABC):
    """
    Abstract base class for AI providers.
    Implements the Strategy pattern for vendor-agnostic AI operations.
    """
    
    def __init__(
        self,
        api_key: str,
        model: str,
        temperature: float = 0.2,
        max_tokens: int = 4000
    ):
        """
        Initialize AI provider.
        
        Args:
            api_key: API key for the provider
            model: Model identifier
            temperature: Sampling temperature (0.0-1.0)
            max_tokens: Maximum tokens in response
        """
        self.api_key = api_key
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens
        self._validate_config()
    
    def _validate_config(self) -> None:
        """Validate provider configuration."""
        if not self.api_key:
            raise ValueError(f"{self.__class__.__name__}: API key is required")
        if not self.model:
            raise ValueError(f"{self.__class__.__name__}: Model name is required")
        if not 0.0 <= self.temperature <= 1.0:
            raise ValueError(f"{self.__class__.__name__}: Temperature must be between 0.0 and 1.0")
        if self.max_tokens <= 0:
            raise ValueError(f"{self.__class__.__name__}: max_tokens must be positive")
    
    @abstractmethod
    async def generate_completion(
        self,
        system_prompt: str,
        user_prompt: str,
        json_mode: bool = True
    ) -> str:
        """
        Generate completion from the AI provider.
        
        Args:
            system_prompt: System instruction/persona
            user_prompt: User's input prompt
            json_mode: Whether to enforce JSON output
            
        Returns:
            Raw text response from the AI provider
            
        Raises:
            AIProviderError: If the API call fails
        """
        pass
    
    @abstractmethod
    async def health_check(self) -> Dict[str, Any]:
        """
        Check if the provider is accessible and healthy.
        
        Returns:
            Dictionary with health status information
            
        Example:
            {
                "status": "connected",
                "provider": "gemini",
                "model": "models/gemini-2.5-flash",
                "latency_ms": 150
            }
        """
        pass
    
    def get_provider_name(self) -> str:
        """Get the name of this provider."""
        return self.__class__.__name__.replace("Provider", "").lower()
    
    def get_model_info(self) -> Dict[str, Any]:
        """
        Get information about the current model configuration.
        
        Returns:
            Dictionary with model configuration
        """
        return {
            "provider": self.get_provider_name(),
            "model": self.model,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens
        }


class AIProviderError(Exception):
    """Base exception for AI provider errors."""
    
    def __init__(self, message: str, provider: str, original_error: Optional[Exception] = None):
        self.message = message
        self.provider = provider
        self.original_error = original_error
        super().__init__(self.message)


class AIProviderConnectionError(AIProviderError):
    """Raised when provider connection fails."""
    pass


class AIProviderAuthError(AIProviderError):
    """Raised when authentication fails."""
    pass


class AIProviderRateLimitError(AIProviderError):
    """Raised when rate limit is exceeded."""
    pass


class AIProviderInvalidResponseError(AIProviderError):
    """Raised when provider returns invalid/malformed response."""
    pass