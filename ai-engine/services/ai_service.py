"""
Service layer for AI operations.
Contains business logic for resume analysis and other AI tasks.
"""

import json
import time
import logging
import asyncio
from datetime import datetime, timezone
from typing import Dict, Any

from providers.base import AIProviderBase, AIProviderError, AIProviderInvalidResponseError
from core.prompts import PromptTemplates
from schemas import ResumeAnalysisRequest, ResumeAnalysisResponse
from pydantic import ValidationError
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)


class AIService:
    """Service class for AI operations."""
    
    def __init__(self, provider: AIProviderBase):
        """
        Initialize AI service with a provider.
        
        Args:
            provider: Configured AI provider instance
        """
        self.provider = provider
        self.prompts = PromptTemplates()
       
        logger.info(f"AIService initialized with provider: {self.provider.get_provider_name()}")
    
    async def analyze_resume(
        self,
        request: ResumeAnalysisRequest
    ) -> ResumeAnalysisResponse:
        """
        Analyze a resume and provide ATS score, skill gaps, and recommendations.
        
        Args:
            request: Resume analysis request with resume text and target role
            
        Returns:
            Structured resume analysis response
            
        Raises:
            AIProviderError: If AI provider call fails
            ValidationError: If response doesn't match expected schema
        """
        try:
            # Generate prompts
            system_prompt = self.prompts.SYSTEM_PERSONA
            user_prompt = self.prompts.get_resume_analysis_prompt(
                resume_text=request.resume_text,
                target_role=request.target_role
            )
            
            logger.info(
                f"Analyzing resume for role: {request.target_role} "
                f"(resume length: {len(request.resume_text)} chars)"
            )
            
            # Call AI provider
            raw_response = await self.provider.generate_completion(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                json_mode=True
            )
            
            # Parse JSON response
            try:
                response_data = json.loads(raw_response)
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse AI response as JSON: {raw_response[:200]}")
                raise AIProviderInvalidResponseError(
                    message="AI provider returned invalid JSON",
                    provider=self.provider.get_provider_name(),
                    original_error=e
                )
            
            # Add metadata
            response_data["analyzed_at"] = datetime.now(timezone.utc).isoformat()
            response_data["model_version"] = self.provider.model
            
            # Validate response against Pydantic schema
            try:
                validated_response = ResumeAnalysisResponse(**response_data)
            except ValidationError as e:
                logger.error(f"AI response validation failed: {str(e)}")
                logger.error(f"Response data: {json.dumps(response_data, indent=2)}")
                raise AIProviderInvalidResponseError(
                    message=f"AI response failed validation: {str(e)}",
                    provider=self.provider.get_provider_name(),
                    original_error=e
                )
            
            logger.info(
                f"Resume analysis completed successfully. "
                f"ATS Score: {validated_response.ats_score.overall}/100"
            )
            
            return validated_response
            
        except AIProviderError:
            raise
        except Exception as e:
            logger.error(f"Unexpected error during resume analysis: {str(e)}")
            raise AIProviderError(
                message=f"Resume analysis failed: {str(e)}",
                provider=self.provider.get_provider_name(),
                original_error=e
            )
        # ===== NEW: Generate Roadmap Method =====

    async def generate_roadmap(
        self,
        missing_skills: List[str],
        target_role: str
    ) -> Dict[str, Any]:
        """
        Generate 8-week learning roadmap based on missing skills
        """
        try:
            start_time = time.time()
            
            logger.info(f"Generating roadmap for {target_role} with {len(missing_skills)} missing skills")
            
            # 1. Get prompts
            system_prompt = self.prompts.ROADMAP_SYSTEM_PROMPT
            user_prompt = self.prompts.get_roadmap_generation_prompt(
                missing_skills=missing_skills,
                target_role=target_role
            )
            
            # 2. Call AI provider abstraction (Sahi Tareeka)
            raw_response = await self.provider.generate_completion(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                json_mode=True
            )
            
            latency = (time.time() - start_time) * 1000
            logger.info(f"Roadmap generated in {latency:.2f}ms")
            
            # 3. Parse JSON response
            roadmap_data = json.loads(raw_response)
            
            # 4. Basic validation
            if "milestones" not in roadmap_data:
                raise Exception("Invalid roadmap structure - missing milestones")
            
            return roadmap_data
            
        except Exception as e:
            logger.error(f"Roadmap generation failed: {str(e)}")
            raise Exception(f"Failed to generate roadmap: {str(e)}")
    
    async def health_check(self) -> Dict[str, Any]:
        """
        Check if the AI service and provider are healthy.
        
        Returns:
            Health check results
        """
        try:
            provider_health = await self.provider.health_check()
            
            return {
    "service": "ai-service",
    "status": "healthy" if provider_health.get("status") in ["healthy", "connected"] else "degraded",
    "provider": provider_health
}
        except Exception as e:
            logger.error(f"Health check failed: {str(e)}")
            return {
                "service": "ai-service",
                "status": "unhealthy",
                "error": str(e),
                "provider": {
                    "status": "unhealthy",
                    "provider": self.provider.get_provider_name()
                }
            }
    
    def get_service_info(self) -> Dict[str, Any]:
        """
        Get information about the current service configuration.
        
        Returns:
            Service configuration details
        """
        return {
            "service": "ai-service",
            "provider": self.provider.get_model_info()
        }