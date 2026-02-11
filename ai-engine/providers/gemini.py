import logging
import time
from typing import Dict, Any
from google import genai
from google.genai import types
import asyncio

from providers.base import (
    AIProviderBase,
    AIProviderError,
    AIProviderConnectionError,
    AIProviderAuthError,
    AIProviderRateLimitError,
    AIProviderInvalidResponseError
)

logger = logging.getLogger(__name__)

class GeminiProvider(AIProviderBase):
    
    def __init__(self, api_key: str, model: str = "models/gemini-2.5-flash", temperature: float = 0.2, max_tokens: int = 8192):
        super().__init__(api_key, model, temperature, max_tokens)
        
        try:
            self.client = genai.Client(api_key=self.api_key)
            logger.info(f"Gemini client initialized with model: {self.model}")
        except Exception as e:
            logger.error(f"Failed to initialize Gemini client: {str(e)}")
            raise AIProviderAuthError("Invalid API Key or initialization failed", provider="gemini")

    async def generate_completion(self, system_prompt: str, user_prompt: str, json_mode: bool = True) -> str:
        """Async wrapper for sync API"""
        try:
            start_time = time.time()
            
            # Run sync code in executor
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: self.client.models.generate_content(
                    model=self.model,
                    contents=user_prompt,
                    config=types.GenerateContentConfig(
                        system_instruction=system_prompt,
                        temperature=self.temperature,
                        max_output_tokens=self.max_tokens,
                        response_mime_type="application/json" if json_mode else "text/plain",
                        safety_settings=[
                            types.SafetySetting(category="HARM_CATEGORY_HARASSMENT", threshold="BLOCK_NONE"),
                            types.SafetySetting(category="HARM_CATEGORY_HATE_SPEECH", threshold="BLOCK_NONE"),
                            types.SafetySetting(category="HARM_CATEGORY_DANGEROUS_CONTENT", threshold="BLOCK_NONE"),
                            types.SafetySetting(category="HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold="BLOCK_NONE"),
                        ]
                    )
                )
            )
            
            latency = (time.time() - start_time) * 1000
            logger.info(f"Gemini response received in {latency:.2f}ms")

            if not response.text:
                raise AIProviderInvalidResponseError("Empty response from Gemini", provider="gemini")
            
            return response.text

        except Exception as e:
            err = str(e).lower()
            if "401" in err or "403" in err or "key" in err:
                raise AIProviderAuthError("Gemini Authentication Failed", provider="gemini", original_error=e)
            elif "429" in err or "quota" in err:
                raise AIProviderRateLimitError("Gemini Quota Exceeded", provider="gemini", original_error=e)
            else:
                raise AIProviderError(f"Gemini Error: {str(e)}", provider="gemini", original_error=e)

    async def health_check(self) -> Dict[str, Any]:
        """Async health check"""
        try:
            start_time = time.time()
            
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                None,
                lambda: self.client.models.generate_content(
                    model=self.model,
                    contents="ping"
                )
            )
            
            return {
                "status": "healthy",
                "provider": "gemini",
                "model": self.model,
                "latency_ms": round((time.time() - start_time) * 1000, 2)
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "provider": "gemini",
                "error": str(e)
            }