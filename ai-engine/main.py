"""
FastAPI application entry point.
Main API with health check, resume analysis, mock interview, and mentor matching endpoints.
"""

import logging
from datetime import datetime, timezone
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import settings
from dependencies import (
    get_ai_service_dependency, 
    get_interview_service_dependency,
    get_mentor_service_dependency,
    get_rag_service_dependency
)
from services.ai_service import AIService
from services.interview_service import InterviewService
from services.mentor_service import MentorService
from services.rag_service import RAGService
from schemas import (
    ResumeAnalysisRequest,
    ResumeAnalysisResponse,
    HealthCheckResponse,
    HealthStatus,
    RoadmapRequest,  
    RoadmapResponse,
    InterviewStartRequest,
    InterviewSession,
    InterviewChatRequest,
    InterviewChatResponse,
    InterviewReport,
    QuestionEvaluation,
    MentorMatchRequest,
    MentorMatchResponse,
    MentorIndexRequest,
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
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("ai_engine_runtime.log", mode="a")
    ]
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Handles startup and shutdown events.
    """
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
    logger.info(f"Shutting down {settings.service_name}")


# Create FastAPI app
app = FastAPI(
    title=settings.service_name.upper(),
    description="Production-grade AI microservice for career development, mock interviews, and mentor matching",
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
    logger.error(f"AI authentication error: {exc.message}")
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={
            "error": "AIAuthenticationError",
            "message": "AI service authentication failed.",
            "detail": {"provider": exc.provider}
        }
    )

@app.exception_handler(AIProviderError)
async def ai_provider_error_handler(request, exc: AIProviderError):
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
        service_health = await ai_service.health_check()
        status_code = HealthStatus.HEALTHY if service_health.get("status") == "healthy" else HealthStatus.UNHEALTHY
        
        return HealthCheckResponse(
            status=status_code,
            service=settings.service_name,
            version=settings.service_version,
            timestamp=datetime.now(timezone.utc).isoformat(),
            ai_provider=settings.ai_provider,
            ai_provider_status=service_health.get("provider", {}).get("status", "unknown")
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
    """Analyze a resume for ATS compatibility and skill gaps."""
    try:
        logger.info(f"Received resume analysis request for role: {request.target_role}")
        result = await ai_service.analyze_resume(request)
        logger.info("Resume analysis completed successfully")
        return result
    except Exception as e:
        logger.error(f"Unexpected error in analyze_resume: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "InternalServerError", "message": str(e)}
        )


@app.post(
    f"{settings.api_v1_prefix}/generate-roadmap",
    response_model=RoadmapResponse,
    status_code=status.HTTP_200_OK,
    tags=["Career Roadmap"],
    summary="Generate Learning Roadmap",
    description="Generate a personalized 8-week roadmap based on missing skills"
)
async def generate_roadmap(
    request: RoadmapRequest,  
    ai_service: AIService = Depends(get_ai_service_dependency) 
):
    """Generate personalized 8-week learning roadmap."""
    try:
        logger.info(f"Generating roadmap for role: {request.target_role}")
        roadmap = await ai_service.generate_roadmap(
            missing_skills=request.missing_skills,
            target_role=request.target_role
        )
        return roadmap
    except Exception as e:
        logger.error(f"Roadmap generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post(
    f"{settings.api_v1_prefix}/interview/start",
    response_model=InterviewSession,
    tags=["Mock Interview"],
    summary="Start Mock Interview Session",
    description="Initializes a new mock interview session and returns the first question"
)
async def start_interview(
    request: InterviewStartRequest,
    interview_service: InterviewService = Depends(get_interview_service_dependency)
):
    """Start a new AI-led interview simulation."""
    try:
        logger.info(f"Starting interview session for role: {request.target_role}")
        return await interview_service.start_interview(request)
    except Exception as e:
        logger.error(f"Failed to start interview: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to initialize interview")


@app.post(
    f"{settings.api_v1_prefix}/interview/chat",
    response_model=InterviewChatResponse,
    tags=["Mock Interview"],
    summary="Interview Chat Interaction",
    description="Processes candidate's response and returns the next interview question"
)
async def interview_chat(
    request: InterviewChatRequest,
    interview_service: InterviewService = Depends(get_interview_service_dependency)
):
    """Exchange messages with the AI interviewer."""
    try:
        return await interview_service.process_chat(request)
    except Exception as e:
        logger.error(f"Interview chat error: {str(e)}")
        raise HTTPException(status_code=500, detail="Error processing interview response")


@app.post(
    f"{settings.api_v1_prefix}/interview/end/{{session_id}}",
    response_model=InterviewReport,
    tags=["Mock Interview"],
    summary="End Interview and Generate Report",
    description="Concludes the session and generates a final performance scorecard"
)
async def end_interview(
    session_id: str,
    interview_service: InterviewService = Depends(get_interview_service_dependency)
):
    """End the interview and get structured feedback."""
    try:
        logger.info(f"Ending interview session: {session_id}")
        return await interview_service.generate_report(session_id)
    except Exception as e:
        logger.error(f"Failed to generate interview report: {str(e)}")
        raise HTTPException(status_code=500, detail="Error generating final report")


@app.post(
    f"{settings.api_v1_prefix}/mentors/match",
    response_model=MentorMatchResponse,
    tags=["Mentor Matching"],
    summary="Match Mentors",
    description="Find the most relevant mentors using RAG and semantic similarity"
)
async def match_mentors(
    request: MentorMatchRequest,
    mentor_service: MentorService = Depends(get_mentor_service_dependency)
):
    """Calculate semantic similarity between student profile and mentor database."""
    try:
        logger.info(f"Finding mentor matches for target role: {request.target_role}")
        return await mentor_service.match_mentors(request)
    except Exception as e:
        logger.error(f"Mentor matching error: {str(e)}")
        raise HTTPException(status_code=500, detail="Error finding mentor matches")


@app.post(
    f"{settings.api_v1_prefix}/rag/index-mentor",
    tags=["RAG Operations"],
    summary="Index Mentor Profile",
    description="Embeds and stores a mentor profile in the vector database"
)
async def index_mentor(
    request: MentorIndexRequest,
    rag_service: RAGService = Depends(get_rag_service_dependency)
):
    """Index a new mentor for semantic search."""
    try:
        await rag_service.index_mentor(request.mentor_id, request.profile_text, request.metadata)
        return {"status": "success", "mentor_id": request.mentor_id}
    except Exception as e:
        logger.error(f"Indexing error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to index mentor profile")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.environment == "development",
        log_level=settings.log_level.lower()
    )