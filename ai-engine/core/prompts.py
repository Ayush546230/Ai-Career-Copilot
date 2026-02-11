"""
Centralized prompt templates for AI operations.
Uses Chain of Thought reasoning and System Persona techniques.
All prompts must return valid JSON matching our Pydantic schemas.
"""

from typing import Dict


class PromptTemplates:
    """Centralized prompt templates for AI operations."""
    
    SYSTEM_PERSONA = """You are an expert ATS (Applicant Tracking System) analyzer and career coach with 15+ years of experience in technical recruiting and resume optimization. You have deep knowledge of:
- Modern ATS algorithms and keyword matching
- Industry-specific requirements across tech roles
- Best practices for resume formatting and content structure
- Skill gap analysis and career progression paths

Your analysis is data-driven, actionable, and tailored to help candidates succeed in their job search."""

    RESUME_ANALYSIS_PROMPT = """Analyze the following resume for a candidate targeting the role of "{target_role}".

**Resume Text:**
{resume_text}

**Target Role:** {target_role}

**Your Task:**
Perform a comprehensive ATS analysis using the following step-by-step approach:

1. **ATS Score Calculation (0-100):**
   - Analyze formatting quality (clear sections, consistent fonts, no tables/columns that break ATS parsing)
   - Evaluate keyword optimization (presence of role-specific technical terms and skills)
   - Assess experience relevance (alignment with target role requirements)
   - Review education section (completeness and relevance)
   - Examine skills section (technical skills vs. role requirements)
   
   Provide an overall score and breakdown for each component.

2. **Skill Gap Analysis:**
   - Extract all technical skills mentioned in the resume
   - Identify skills typically required for "{target_role}"
   - Determine critical missing skills
   - Identify skills present but needing improvement (with current and target proficiency levels)
   
3. **Actionable Recommendations:**
   - Provide 3-5 specific, actionable suggestions
   - Prioritize by impact (critical, important, optional)
   - Include concrete before/after examples
   - Cover categories: formatting, keywords, content, experience, education

**Critical Instructions:**
- Return ONLY valid JSON matching this exact structure (no markdown, no extra text)
- Be specific and data-driven in your analysis
- Ensure all scores are integers between 0-100
- Use only these skill proficiency levels: "beginner", "intermediate", "advanced"
- Use only these priorities: "high", "medium", "low" for skills and "critical", "important", "optional" for suggestions
- Use only these categories: "formatting", "content", "keywords", "experience", "education"

**Expected JSON Structure:**
{{
  "ats_score": {{
    "overall": <integer 0-100>,
    "breakdown": {{
      "formatting": <integer 0-100>,
      "keywords": <integer 0-100>,
      "experience": <integer 0-100>,
      "education": <integer 0-100>,
      "skills": <integer 0-100>
    }}
  }},
  "skill_gap_analysis": {{
    "current_skills": ["skill1", "skill2", ...],
    "required_skills": ["skill1", "skill2", "skill3", ...],
    "missing_skills": ["skill3", ...],
    "skills_to_improve": [
      {{
        "skill": "skill_name",
        "current_level": "beginner|intermediate|advanced",
        "target_level": "beginner|intermediate|advanced",
        "priority": "high|medium|low"
      }}
    ]
  }},
  "suggestions": [
    {{
      "category": "formatting|content|keywords|experience|education",
      "priority": "critical|important|optional",
      "issue": "Description of the issue",
      "recommendation": "Specific recommendation",
      "example_before": "Current example from resume",
      "example_after": "Improved example"
    }}
  ]
}}

Return only the JSON object, nothing else."""

 # ===== NEW: Roadmap System Prompt =====
    ROADMAP_SYSTEM_PROMPT = """You are an expert learning path designer and career mentor. 
Your role is to create personalized, actionable 8-week learning roadmaps for professionals 
looking to acquire new skills for their target roles.

Guidelines:
- Create EXACTLY 8 weekly milestones
- Each milestone should be achievable within one week
- Include 3-5 specific, actionable tasks per milestone
- Tasks should be ordered from foundational to advanced
- Include mix of learning resources (courses, projects, practice)
- Be realistic about time commitments
- Focus on practical, hands-on learning

Return ONLY valid JSON, no additional text."""

    def get_roadmap_generation_prompt(
        self,
        missing_skills: list,
        target_role: str
    ) -> str:
        """Generate prompt for roadmap creation"""
        
        skills_list = ", ".join(missing_skills)
        
        return f"""Create a personalized 8-week learning roadmap for someone targeting the role of "{target_role}".

Missing Skills to Learn: {skills_list}

Requirements:
1. Create EXACTLY 8 weekly milestones (Week 1 through Week 8)
2. Each milestone must have:
   - title: Clear, motivating title for the week
   - description: Brief overview of what will be learned
   - tasks: Array of 3-5 specific tasks with descriptions

3. Progression:
   - Week 1-2: Foundations and basics
   - Week 3-4: Intermediate concepts and small projects
   - Week 5-6: Advanced topics and integration
   - Week 7-8: Real-world projects and portfolio building

4. Each task should specify:
   - What to learn/do
   - Recommended resource type (course, tutorial, project, practice)
   - Estimated time commitment

Return this EXACT JSON structure:
{{
  "milestones": [
    {{
      "title": "Week 1: Foundation in [Skill]",
      "description": "Build foundational understanding of core concepts",
      "tasks": [
        {{
          "description": "Complete Introduction to [Skill] course on Coursera (5 hours)"
        }},
        {{
          "description": "Practice basic concepts with 10 coding challenges"
        }},
        {{
          "description": "Read official documentation overview"
        }}
      ]
    }},
    // ... 7 more milestones for weeks 2-8
  ]
}}

Focus on: {skills_list}
Target Role: {target_role}

Generate the roadmap now:"""

    SKILL_GAP_ANALYSIS_PROMPT = """Analyze the skill gap for a candidate targeting the role of "{target_role}".

**Current Skills (from resume):**
{current_skills}

**Target Role:** {target_role}

Identify:
1. Skills required for this role
2. Missing critical skills
3. Skills that need improvement (with proficiency levels)

Return valid JSON with this structure:
{{
  "current_skills": [...],
  "required_skills": [...],
  "missing_skills": [...],
  "skills_to_improve": [
    {{
      "skill": "name",
      "current_level": "beginner|intermediate|advanced",
      "target_level": "beginner|intermediate|advanced",
      "priority": "high|medium|low"
    }}
  ]
}}"""

    @staticmethod
    def get_resume_analysis_prompt(resume_text: str, target_role: str) -> str:
        """
        Generate the complete resume analysis prompt.
        
        Args:
            resume_text: Raw text from the resume
            target_role: Target job role
            
        Returns:
            Formatted prompt string
        """
        return PromptTemplates.RESUME_ANALYSIS_PROMPT.format(
            resume_text=resume_text,
            target_role=target_role
        )
    
    @staticmethod
    def get_system_messages(provider: str) -> Dict[str, str]:
        """
        Get provider-specific system messages.
        
        Args:
            provider: AI provider name (gemini, openai, claude)
            
        Returns:
            Dictionary with system message configuration
        """
        return {
            "role": "system",
            "content": PromptTemplates.SYSTEM_PERSONA
        }
    
    @staticmethod
    def get_skill_gap_prompt(current_skills: list, target_role: str) -> str:
        """
        Generate skill gap analysis prompt.
        
        Args:
            current_skills: List of current skills from resume
            target_role: Target job role
            
        Returns:
            Formatted prompt string
        """
        skills_text = ", ".join(current_skills) if current_skills else "None identified"
        return PromptTemplates.SKILL_GAP_ANALYSIS_PROMPT.format(
            current_skills=skills_text,
            target_role=target_role
        )


# JSON Schema for response validation (can be used with some providers)
RESUME_ANALYSIS_JSON_SCHEMA = {
    "type": "object",
    "required": ["ats_score", "skill_gap_analysis", "suggestions"],
    "properties": {
        "ats_score": {
            "type": "object",
            "required": ["overall", "breakdown"],
            "properties": {
                "overall": {"type": "integer", "minimum": 0, "maximum": 100},
                "breakdown": {
                    "type": "object",
                    "required": ["formatting", "keywords", "experience", "education", "skills"],
                    "properties": {
                        "formatting": {"type": "integer", "minimum": 0, "maximum": 100},
                        "keywords": {"type": "integer", "minimum": 0, "maximum": 100},
                        "experience": {"type": "integer", "minimum": 0, "maximum": 100},
                        "education": {"type": "integer", "minimum": 0, "maximum": 100},
                        "skills": {"type": "integer", "minimum": 0, "maximum": 100}
                    }
                }
            }
        },
        "skill_gap_analysis": {
            "type": "object",
            "required": ["current_skills", "required_skills", "missing_skills", "skills_to_improve"],
            "properties": {
                "current_skills": {"type": "array", "items": {"type": "string"}},
                "required_skills": {"type": "array", "items": {"type": "string"}},
                "missing_skills": {"type": "array", "items": {"type": "string"}},
                "skills_to_improve": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "required": ["skill", "current_level", "target_level", "priority"],
                        "properties": {
                            "skill": {"type": "string"},
                            "current_level": {"type": "string", "enum": ["beginner", "intermediate", "advanced"]},
                            "target_level": {"type": "string", "enum": ["beginner", "intermediate", "advanced"]},
                            "priority": {"type": "string", "enum": ["high", "medium", "low"]}
                        }
                    }
                }
            }
        },
        "suggestions": {
            "type": "array",
            "minItems": 1,
            "items": {
                "type": "object",
                "required": ["category", "priority", "issue", "recommendation", "example_before", "example_after"],
                "properties": {
                    "category": {"type": "string", "enum": ["formatting", "content", "keywords", "experience", "education"]},
                    "priority": {"type": "string", "enum": ["critical", "important", "optional"]},
                    "issue": {"type": "string"},
                    "recommendation": {"type": "string"},
                    "example_before": {"type": "string"},
                    "example_after": {"type": "string"}
                }
            }
        }
    }
}