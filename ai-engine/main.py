"""
FastAPI application entry point.
Main API with health check and resume analysis endpoints.
"""

import logging
from datetime import datetime, timezone
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import settings
from dependencies import get_ai_service_dependency
from services.ai_service import AIService
from schemas import (
    ResumeAnalysisRequest,
    ResumeAnalysisResponse,
    HealthCheckResponse,
    HealthStatus,
    RoadmapRequest,  
    RoadmapResponse,
    ErrorResponse
)
from providers.base import (
    AIProviderError,
    AIProviderConnectionError,
    AIProviderAuthError,
    AIProviderRateLimitError,
    AIProviderInvalidResponseError
)

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Handles startup and shutdown events.
    """
    # Startup
    logger.info(f"Starting {settings.service_name} v{settings.service_version}")
    logger.info(f"Environment: {settings.environment}")
    logger.info(f"AI Provider: {settings.ai_provider}")
    
    # Test AI provider connection
    try:
        from dependencies import get_ai_service
        ai_service = get_ai_service()
        health = await ai_service.health_check()
        logger.info(f"AI Provider health check: {health}")
    except Exception as e:
        logger.error(f"Failed to initialize AI provider: {str(e)}")
        logger.warning("Service starting with degraded AI capabilities")
    
    yield
    
    # Shutdown
    logger.info(f"Shutting down {settings.service_name}")


# Create FastAPI app
app = FastAPI(
    title=settings.service_name.upper(),
    description="Production-grade AI microservice for resume analysis, skill gap detection, and career roadmap generation",
    version=settings.service_version,
    lifespan=lifespan,
    docs_url=f"{settings.api_v1_prefix}/docs",
    redoc_url=f"{settings.api_v1_prefix}/redoc",
    openapi_url=f"{settings.api_v1_prefix}/openapi.json"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins_list(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Exception handlers
@app.exception_handler(AIProviderAuthError)
async def ai_auth_error_handler(request, exc: AIProviderAuthError):
    """Handle AI provider authentication errors."""
    logger.error(f"AI authentication error: {exc.message}")
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={
            "error": "AIAuthenticationError",
            "message": "AI service authentication failed. Please check API key configuration.",
            "detail": {"provider": exc.provider}
        }
    )


@app.exception_handler(AIProviderRateLimitError)
async def ai_rate_limit_error_handler(request, exc: AIProviderRateLimitError):
    """Handle AI provider rate limit errors."""
    logger.warning(f"AI rate limit exceeded: {exc.message}")
    return JSONResponse(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        content={
            "error": "RateLimitExceeded",
            "message": "AI service rate limit exceeded. Please try again later.",
            "detail": {"provider": exc.provider}
        }
    )


@app.exception_handler(AIProviderConnectionError)
async def ai_connection_error_handler(request, exc: AIProviderConnectionError):
    """Handle AI provider connection errors."""
    logger.error(f"AI connection error: {exc.message}")
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={
            "error": "ServiceUnavailable",
            "message": "AI service is temporarily unavailable. Please try again later.",
            "detail": {"provider": exc.provider}
        }
    )


@app.exception_handler(AIProviderInvalidResponseError)
async def ai_invalid_response_handler(request, exc: AIProviderInvalidResponseError):
    """Handle invalid AI responses."""
    logger.error(f"Invalid AI response: {exc.message}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "InvalidAIResponse",
            "message": "AI service returned an invalid response. Please try again.",
            "detail": {"provider": exc.provider}
        }
    )


@app.exception_handler(AIProviderError)
async def ai_provider_error_handler(request, exc: AIProviderError):
    """Handle generic AI provider errors."""
    logger.error(f"AI provider error: {exc.message}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "AIProviderError",
            "message": "An error occurred while processing your request.",
            "detail": {"provider": exc.provider}
        }
    )


# Routes
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with service information."""
    return {
        "service": settings.service_name,
        "version": settings.service_version,
        "environment": settings.environment,
        "docs": f"{settings.api_v1_prefix}/docs",
        "health": "/health"
    }


@app.get("/health", response_model=HealthCheckResponse, tags=["Health"])
async def health_check(
    ai_service: AIService = Depends(get_ai_service_dependency)
):
    """
    Health check endpoint.
    Verifies service and AI provider connectivity.
    """
    try:
        # Check AI service health
        service_health = await ai_service.health_check()
        
        # Determine overall status
        if service_health.get("status") == "healthy":
            overall_status = HealthStatus.HEALTHY
        elif service_health.get("status") == "degraded":
            overall_status = HealthStatus.DEGRADED
        else:
            overall_status = HealthStatus.UNHEALTHY
        
        provider_info = service_health.get("provider", {})
        
        return HealthCheckResponse(
            status=overall_status,
            service=settings.service_name,
            version=settings.service_version,
            timestamp=datetime.now(timezone.utc).isoformat(),
            ai_provider=provider_info.get("provider", "unknown"),
            ai_provider_status=provider_info.get("status", "unknown")
        )
        
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return HealthCheckResponse(
            status=HealthStatus.UNHEALTHY,
            service=settings.service_name,
            version=settings.service_version,
            timestamp=datetime.now(timezone.utc).isoformat(),
            ai_provider=settings.ai_provider,
            ai_provider_status="error"
        )


@app.post(
    f"{settings.api_v1_prefix}/analyze-resume",
    response_model=ResumeAnalysisResponse,
    status_code=status.HTTP_200_OK,
    tags=["Resume Analysis"],
    summary="Analyze Resume",
    description="Analyze a resume and provide ATS score, skill gap analysis, and actionable recommendations"
)
async def analyze_resume(
    request: ResumeAnalysisRequest,
    ai_service: AIService = Depends(get_ai_service_dependency)
) -> ResumeAnalysisResponse:
    """
    Analyze a resume for ATS compatibility and skill gaps.
    
    **Process:**
    1. Extracts key information from resume text
    2. Calculates ATS compatibility score (0-100)
    3. Identifies skill gaps for target role
    4. Provides actionable recommendations with examples
    
    **Returns:**
    - ATS score with detailed breakdown
    - Skill gap analysis (current vs. required skills)
    - Prioritized suggestions for improvement
    """
    try:
        logger.info(f"Received resume analysis request for role: {request.target_role}")
        
        # Perform resume analysis
        result = await ai_service.analyze_resume(request)
        
        logger.info(f"Resume analysis completed successfully")
        return result
        
    except AIProviderError:
        # These are handled by exception handlers above
        raise
    except Exception as e:
        logger.error(f"Unexpected error in analyze_resume: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "InternalServerError",
                "message": "An unexpected error occurred while analyzing the resume.",
                "detail": str(e) if settings.environment == "development" else None
            }
        )
@app.post(
    f"{settings.api_v1_prefix}/generate-roadmap",
    response_model=RoadmapResponse,
    status_code=status.HTTP_200_OK,
    tags=["Career Roadmap"],
    summary="Generate Roadmap",
    description="Generate a personalized 8-week roadmap based on missing skills"
)
async def generate_roadmap(request: RoadmapRequest):
    """
    Generate personalized 8-week learning roadmap
    based on missing skills and target role
    """
    try:
        if not request.missing_skills:
            raise HTTPException(
                status_code=400,
                detail="Missing skills array is required"
            )
        
        if not request.target_role:
            raise HTTPException(
                status_code=400,
                detail="Target role is required"
            )
        
        # Generate roadmap using AI
        roadmap = await ai_service.generate_roadmap(
            missing_skills=request.missing_skills,
            target_role=request.target_role
        )
        
        return roadmap
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Roadmap generation failed: {str(e)}"
        )

# Additional endpoints placeholder
@app.get(
    f"{settings.api_v1_prefix}/providers",
    tags=["Configuration"],
    summary="List Available Providers"
)
async def list_providers():
    """
    List all available AI providers and their configurations.
    """
    from core.factory import AIProviderFactory
    
    return {
        "current_provider": settings.ai_provider,
        "available_providers": AIProviderFactory.get_available_providers(),
        "provider_models": {
            "gemini": settings.gemini_model,
            "openai": settings.openai_model,
            "claude": settings.claude_model
        }
    }


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.environment == "development",
        log_level=settings.log_level.lower()
    )