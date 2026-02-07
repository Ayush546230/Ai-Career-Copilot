"""
Pydantic models for request/response validation.
All API endpoints must use these schemas for strict type checking.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, validator
from enum import Enum


class SkillProficiency(str, Enum):
    """Skill proficiency levels."""
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class SkillPriority(str, Enum):
    """Priority levels for skill development."""
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class SuggestionCategory(str, Enum):
    """Categories for resume suggestions."""
    FORMATTING = "formatting"
    CONTENT = "content"
    KEYWORDS = "keywords"
    EXPERIENCE = "experience"
    EDUCATION = "education"


class SuggestionPriority(str, Enum):
    """Priority levels for suggestions."""
    CRITICAL = "critical"
    IMPORTANT = "important"
    OPTIONAL = "optional"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


# Request Models
class ResumeAnalysisRequest(BaseModel):
    """Request schema for resume analysis."""
    resume_text: str = Field(..., min_length=100, max_length=50000, description="Raw text extracted from resume")
    target_role: str = Field(..., min_length=2, max_length=200, description="Target job role (e.g., 'Senior Software Engineer')")
    
    @validator('resume_text')
    def validate_resume_text(cls, v: str) -> str:
        """Ensure resume text is not empty or whitespace only."""
        if not v.strip():
            raise ValueError("Resume text cannot be empty")
        return v.strip()
    
    @validator('target_role')
    def validate_target_role(cls, v: str) -> str:
        """Ensure target role is properly formatted."""
        return v.strip()

    class Config:
        json_schema_extra = {
            "example": {
                "resume_text": "John Doe\nSoftware Engineer\n\nExperience:\n- Developed REST APIs using Python and FastAPI\n- Built microservices architecture...",
                "target_role": "Senior Backend Engineer"
            }
        }


# Response Models
class ATSScoreBreakdown(BaseModel):
    """Detailed breakdown of ATS score components."""
    formatting: int = Field(..., ge=0, le=100, description="Score for resume formatting (0-100)")
    keywords: int = Field(..., ge=0, le=100, description="Score for keyword optimization (0-100)")
    experience: int = Field(..., ge=0, le=100, description="Score for experience relevance (0-100)")
    education: int = Field(..., ge=0, le=100, description="Score for education section (0-100)")
    skills: int = Field(..., ge=0, le=100, description="Score for skills section (0-100)")


class ATSScore(BaseModel):
    """ATS score with detailed breakdown."""
    overall: int = Field(..., ge=0, le=100, description="Overall ATS compatibility score (0-100)")
    breakdown: ATSScoreBreakdown


class SkillToImprove(BaseModel):
    """Skill that needs improvement."""
    skill: str = Field(..., description="Name of the skill")
    current_level: SkillProficiency = Field(..., description="Current proficiency level")
    target_level: SkillProficiency = Field(..., description="Target proficiency level")
    priority: SkillPriority = Field(..., description="Priority for learning this skill")


class SkillGapAnalysis(BaseModel):
    """Analysis of skill gaps for target role."""
    current_skills: List[str] = Field(..., description="Skills found in the resume")
    required_skills: List[str] = Field(..., description="Skills required for target role")
    missing_skills: List[str] = Field(..., description="Critical skills missing from resume")
    skills_to_improve: List[SkillToImprove] = Field(..., description="Skills that need improvement")


class ResumeSuggestion(BaseModel):
    """Actionable suggestion for resume improvement."""
    category: SuggestionCategory = Field(..., description="Category of the suggestion")
    priority: SuggestionPriority = Field(..., description="Priority level")
    issue: str = Field(..., description="Identified issue")
    recommendation: str = Field(..., description="Specific recommendation")
    example_before: str = Field(..., description="Example of current format")
    example_after: str = Field(..., description="Example of improved format")


class ResumeAnalysisResponse(BaseModel):
    """Complete response for resume analysis."""
    ats_score: ATSScore
    skill_gap_analysis: SkillGapAnalysis
    suggestions: List[ResumeSuggestion] = Field(..., min_items=1)
    analyzed_at: str = Field(..., description="ISO 8601 timestamp of analysis")
    model_version: str = Field(..., description="AI model version used")

    class Config:
        json_schema_extra = {
            "example": {
                "ats_score": {
                    "overall": 78,
                    "breakdown": {
                        "formatting": 85,
                        "keywords": 72,
                        "experience": 80,
                        "education": 90,
                        "skills": 65
                    }
                },
                "skill_gap_analysis": {
                    "current_skills": ["Python", "FastAPI", "PostgreSQL"],
                    "required_skills": ["Python", "FastAPI", "PostgreSQL", "Docker", "Kubernetes", "AWS"],
                    "missing_skills": ["Docker", "Kubernetes", "AWS"],
                    "skills_to_improve": [
                        {
                            "skill": "System Design",
                            "current_level": "beginner",
                            "target_level": "intermediate",
                            "priority": "high"
                        }
                    ]
                },
                "suggestions": [
                    {
                        "category": "keywords",
                        "priority": "critical",
                        "issue": "Missing cloud platform keywords",
                        "recommendation": "Add specific cloud technologies you've worked with",
                        "example_before": "Worked on cloud infrastructure",
                        "example_after": "Architected and deployed microservices on AWS using ECS, managing 10+ containerized applications"
                    }
                ],
                "analyzed_at": "2024-02-05T10:30:00Z",
                "model_version": "models/gemini-2.5-flash"
            }
        }


# Health Check Models
class HealthStatus(str, Enum):
    """Service health status."""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    UNHEALTHY = "unhealthy"


class HealthCheckResponse(BaseModel):
    """Health check response."""
    status: HealthStatus
    service: str
    version: str
    timestamp: str
    ai_provider: str
    ai_provider_status: str

    class Config:
        json_schema_extra = {
            "example": {
                "status": "healthy",
                "service": "ai-engine",
                "version": "1.0.0",
                "timestamp": "2024-02-05T10:30:00Z",
                "ai_provider": "gemini",
                "ai_provider_status": "connected"
            }
        }


# Error Models
class ErrorResponse(BaseModel):
    """Standard error response."""
    error: str = Field(..., description="Error type")
    message: str = Field(..., description="Human-readable error message")
    detail: Optional[Dict[str, Any]] = Field(None, description="Additional error details")

    class Config:
        json_schema_extra = {
            "example": {
                "error": "ValidationError",
                "message": "Invalid resume text format",
                "detail": {
                    "field": "resume_text",
                    "issue": "Text is too short"
                }
            }
        }