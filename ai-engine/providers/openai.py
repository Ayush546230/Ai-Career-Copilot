"""
OpenAI AI Provider Implementation.
"""

import json
import time
import logging
from typing import Dict, Any
from openai import AsyncOpenAI
from openai import OpenAIError, APIError, RateLimitError, AuthenticationError

from providers.base import (
    AIProviderBase,
    AIProviderError,
    AIProviderConnectionError,
    AIProviderAuthError,
    AIProviderRateLimitError,
    AIProviderInvalidResponseError
)

logger = logging.getLogger(__name__)


class OpenAIProvider(AIProviderBase):
    """OpenAI provider implementation."""
    
    def __init__(
        self,
        api_key: str,
        model: str = "gpt-4-turbo-preview",
        temperature: float = 0.2,
        max_tokens: int = 4000
    ):
        """
        Initialize OpenAI provider.
        
        Args:
            api_key: OpenAI API key
            model: OpenAI model name
            temperature: Sampling temperature
            max_tokens: Maximum output tokens
        """
        super().__init__(api_key, model, temperature, max_tokens)
        
        self.client = AsyncOpenAI(api_key=self.api_key)
        
        logger.info(f"OpenAI provider initialized with model: {self.model}")
    
    async def generate_completion(
        self,
        system_prompt: str,
        user_prompt: str,
        json_mode: bool = True
    ) -> str:
        """
        Generate completion using OpenAI.
        
        Args:
            system_prompt: System message
            user_prompt: User's prompt
            json_mode: Enable JSON mode
            
        Returns:
            JSON string response
            
        Raises:
            AIProviderError: On API errors
        """
        try:
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ]
            
            # Configure response format
            kwargs = {
                "model": self.model,
                "messages": messages,
                "temperature": self.temperature,
                "max_tokens": self.max_tokens
            }
            
            # Enable JSON mode for GPT-4 and newer models
            if json_mode and ("gpt-4" in self.model or "gpt-3.5" in self.model):
                kwargs["response_format"] = {"type": "json_object"}
            
            logger.info(f"Sending request to OpenAI ({self.model})")
            start_time = time.time()
            
            response = await self.client.chat.completions.create(**kwargs)
            
            latency = (time.time() - start_time) * 1000
            logger.info(f"OpenAI response received in {latency:.2f}ms")
            
            # Extract content
            content = response.choices[0].message.content
            
            if not content:
                raise AIProviderInvalidResponseError(
                    "OpenAI returned empty response",
                    provider="openai"
                )
            
            # Validate JSON
            try:
                json.loads(content)
            except json.JSONDecodeError as e:
                logger.error(f"Invalid JSON from OpenAI: {content[:200]}")
                raise AIProviderInvalidResponseError(
                    f"OpenAI returned invalid JSON: {str(e)}",
                    provider="openai",
                    original_error=e
                )
            
            return content
            
        except AuthenticationError as e:
            raise AIProviderAuthError(
                "Invalid or missing OpenAI API key",
                provider="openai",
                original_error=e
            )
        
        except RateLimitError as e:
            raise AIProviderRateLimitError(
                "OpenAI API rate limit exceeded",
                provider="openai",
                original_error=e
            )
        
        except APIError as e:
            if "connection" in str(e).lower():
                raise AIProviderConnectionError(
                    f"Failed to connect to OpenAI: {str(e)}",
                    provider="openai",
                    original_error=e
                )
            raise AIProviderError(
                f"OpenAI API error: {str(e)}",
                provider="openai",
                original_error=e
            )
        
        except OpenAIError as e:
            logger.error(f"OpenAI error: {str(e)}")
            raise AIProviderError(
                f"OpenAI error: {str(e)}",
                provider="openai",
                original_error=e
            )
        
        except Exception as e:
            logger.error(f"Unexpected OpenAI error: {str(e)}")
            raise AIProviderError(
                f"Unexpected error: {str(e)}",
                provider="openai",
                original_error=e
            )
    
    async def health_check(self) -> Dict[str, Any]:
        """
        Check OpenAI API health.
        
        Returns:
            Health status information
        """
        try:
            start_time = time.time()
            
            # Simple test generation
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "user", "content": "Return only this JSON: {\"status\": \"ok\"}"}
                ],
                max_tokens=50
            )
            
            latency = (time.time() - start_time) * 1000
            
            if response.choices[0].message.content:
                return {
                    "status": "connected",
                    "provider": "openai",
                    "model": self.model,
                    "latency_ms": round(latency, 2)
                }
            else:
                return {
                    "status": "degraded",
                    "provider": "openai",
                    "model": self.model,
                    "error": "Empty response from test call"
                }
                
        except Exception as e:
            logger.error(f"OpenAI health check failed: {str(e)}")
            return {
                "status": "unhealthy",
                "provider": "openai",
                "model": self.model,
                "error": str(e)
            }