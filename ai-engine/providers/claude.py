"""
Anthropic Claude AI Provider Implementation.
"""

import json
import time
import logging
from typing import Dict, Any
from anthropic import AsyncAnthropic
from anthropic import APIError, RateLimitError, AuthenticationError

from providers.base import (
    AIProviderBase,
    AIProviderError,
    AIProviderConnectionError,
    AIProviderAuthError,
    AIProviderRateLimitError,
    AIProviderInvalidResponseError
)

logger = logging.getLogger(__name__)


class ClaudeProvider(AIProviderBase):
    """Anthropic Claude provider implementation."""
    
    def __init__(
        self,
        api_key: str,
        model: str = "claude-3-sonnet-20240229",
        temperature: float = 0.2,
        max_tokens: int = 4000
    ):
        """
        Initialize Claude provider.
        
        Args:
            api_key: Anthropic API key
            model: Claude model name
            temperature: Sampling temperature
            max_tokens: Maximum output tokens
        """
        super().__init__(api_key, model, temperature, max_tokens)
        
        self.client = AsyncAnthropic(api_key=self.api_key)
        
        logger.info(f"Claude provider initialized with model: {self.model}")
    
    async def generate_completion(
        self,
        system_prompt: str,
        user_prompt: str,
        json_mode: bool = True
    ) -> str:
        """
        Generate completion using Claude.
        
        Args:
            system_prompt: System message
            user_prompt: User's prompt
            json_mode: Request JSON output (via prompt instruction)
            
        Returns:
            JSON string response
            
        Raises:
            AIProviderError: On API errors
        """
        try:
            # Claude uses system parameter separately
            logger.info(f"Sending request to Claude ({self.model})")
            start_time = time.time()
            
            response = await self.client.messages.create(
                model=self.model,
                max_tokens=self.max_tokens,
                temperature=self.temperature,
                system=system_prompt,
                messages=[
                    {"role": "user", "content": user_prompt}
                ]
            )
            
            latency = (time.time() - start_time) * 1000
            logger.info(f"Claude response received in {latency:.2f}ms")
            
            # Extract content
            if not response.content or len(response.content) == 0:
                raise AIProviderInvalidResponseError(
                    "Claude returned empty response",
                    provider="claude"
                )
            
            content = response.content[0].text
            
            if not content:
                raise AIProviderInvalidResponseError(
                    "Claude returned empty text content",
                    provider="claude"
                )
            
            # Validate JSON
            try:
                json.loads(content)
            except json.JSONDecodeError as e:
                logger.error(f"Invalid JSON from Claude: {content[:200]}")
                raise AIProviderInvalidResponseError(
                    f"Claude returned invalid JSON: {str(e)}",
                    provider="claude",
                    original_error=e
                )
            
            return content
            
        except AuthenticationError as e:
            raise AIProviderAuthError(
                "Invalid or missing Anthropic API key",
                provider="claude",
                original_error=e
            )
        
        except RateLimitError as e:
            raise AIProviderRateLimitError(
                "Claude API rate limit exceeded",
                provider="claude",
                original_error=e
            )
        
        except APIError as e:
            if "connection" in str(e).lower():
                raise AIProviderConnectionError(
                    f"Failed to connect to Claude: {str(e)}",
                    provider="claude",
                    original_error=e
                )
            raise AIProviderError(
                f"Claude API error: {str(e)}",
                provider="claude",
                original_error=e
            )
        
        except Exception as e:
            logger.error(f"Unexpected Claude error: {str(e)}")
            raise AIProviderError(
                f"Unexpected error: {str(e)}",
                provider="claude",
                original_error=e
            )
    
    async def health_check(self) -> Dict[str, Any]:
        """
        Check Claude API health.
        
        Returns:
            Health status information
        """
        try:
            start_time = time.time()
            
            # Simple test generation
            response = await self.client.messages.create(
                model=self.model,
                max_tokens=50,
                messages=[
                    {"role": "user", "content": "Return only this JSON: {\"status\": \"ok\"}"}
                ]
            )
            
            latency = (time.time() - start_time) * 1000
            
            if response.content and len(response.content) > 0:
                return {
                    "status": "connected",
                    "provider": "claude",
                    "model": self.model,
                    "latency_ms": round(latency, 2)
                }
            else:
                return {
                    "status": "degraded",
                    "provider": "claude",
                    "model": self.model,
                    "error": "Empty response from test call"
                }
                
        except Exception as e:
            logger.error(f"Claude health check failed: {str(e)}")
            return {
                "status": "unhealthy",
                "provider": "claude",
                "model": self.model,
                "error": str(e)
            }