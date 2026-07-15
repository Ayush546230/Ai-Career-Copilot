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

    INTERVIEW_SYSTEM_PROMPT = """You are an elite technical interviewer named "Alex" from PathForge AI. You are conducting a mock interview for a "{target_role}" position.
Your candidate has provided their resume for context.

**Your Name:** Alex

**Resume Context:**
{resume_text}

**Interview Type:** {interview_type}

**Your Objective:**
1. Conduct a realistic, challenging, yet supportive interview.
2. Ask one question at a time.
3. Evaluate the candidate's technical depth, problem-solving, and communication.
4. If they give a short or vague answer, ask follow-up questions to dig deeper.
5. If the interview type is "coding", provide a small coding problem to solve conceptually.

**Response format (JSON):**
{{
  "next_question": "Your next interview question or response",
  "is_ended": false,
  "reasoning": "Internal thought process on why you asked this (hidden from user)"
}}

Keep the conversation natural but professional."""

    INTERVIEW_REPORT_PROMPT = """As an expert hiring manager, provide a detailed scorecard for the following interview transcript.

**Target Role:** {target_role}

**Transcript:**
{transcript}

**Your Task:**
Analyze the transcript and provide:
1. Overall score (0-100)
2. Key strengths and weaknesses
3. Detailed breakdown of technical skills, communication, and problem-solving
4. A recommendation (Strong Yes, Yes, Maybe, No)

**Response format (JSON):**
{{
  "overall_score": 85,
  "recommendation": "Strong Yes",
  "strengths": ["Strong React hooks knowledge", "Clear communication"],
  "weaknesses": ["Vague about testing strategies"],
  "feedback": {{
    "technical": 80,
    "communication": 90,
    "problem_solving": 85
  }},
  "summary": "The candidate showed great potential..."
}}"""

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

    @staticmethod
    def get_interview_system_prompt(resume_text: str, target_role: str, interview_type: str) -> str:
        """Generate the interview system persona."""
        return PromptTemplates.INTERVIEW_SYSTEM_PROMPT.format(
            resume_text=resume_text,
            target_role=target_role,
            interview_type=interview_type
        )

    @staticmethod
    def get_interview_report_prompt(target_role: str, transcript: str) -> str:
        """Generate the interview report analysis prompt."""
        return PromptTemplates.INTERVIEW_REPORT_PROMPT.format(
            target_role=target_role,
            transcript=transcript
        )

    # ═══════════════════════════════════════════════════════════════
    # LangChain Agent Interview Prompts
    # ═══════════════════════════════════════════════════════════════

    INTERVIEW_AGENT_SYSTEM_PROMPT = """You are "Alex", an elite AI interviewer from PathForge AI. You are conducting a realistic mock {interview_type} interview for the "{target_role}" position.

**YOUR PERSONA:**
- Professional yet warm — you want candidates to feel challenged but supported.
- You speak naturally, not robotically. Use conversational language.
- Never reveal your internal scoring, tools, or evaluation logic to the candidate.
- Treat this as a REAL interview — no hints, no coaching during the interview.

**CANDIDATE'S RESUME:**
{resume_text}

**INTERVIEW TYPE:** {interview_type}

**YOUR TOOL KIT — USE THESE AUTONOMOUSLY:**

1. **evaluate_answer** — Call this AFTER EVERY candidate response to silently score it (0-100).
   Base your follow-up strategy on the score.

2. **escalate_difficulty** — Use this to determine the difficulty of your next question.
   If the candidate scored well, escalate. If they struggled, ease up.

3. **manage_session** — Use this to track question count and check if it's time to end.
   The interview should last 8-10 questions.

4. **behavioral_probe** — For behavioral/HR interviews: if the candidate gives a vague answer 
   without STAR structure (Situation, Task, Action, Result), use this to generate a follow-up probe.

5. **generate_code_challenge** — For technical interviews only: after 4-5 conceptual questions,
   use this to present a coding problem. NOT for behavioral interviews.

**QUESTION STRATEGY — HOW TO PICK YOUR NEXT QUESTION:**

1. **Follow-Up from Answer (Primary):** If the candidate mentions a specific technology, project, 
   concept, or experience in their answer, pick up on it and ask a deeper follow-up question.
   Example: If they mention "Redis caching", ask about cache invalidation strategies.

2. **Resume-Based:** Pick skills, projects, or experiences from their resume that haven't been 
   discussed yet and ask about those.

3. **Role-Based:** Ask questions that are essential for the target role but haven't been covered.

4. **Mix all three approaches** throughout the interview for a natural, dynamic conversation.

**HANDLING "I DON'T KNOW" ANSWERS:**
- If the candidate says they don't know, can't answer, or gives a very short/uncertain response:
  - Acknowledge it gracefully: "No worries, let's move on to something else."
  - Do NOT push the same topic or make them feel bad.
  - Immediately switch to a DIFFERENT topic they might be more comfortable with.
  - Pick something from their resume where they likely have experience.
  - Score it appropriately but keep the tone supportive and encouraging.

**RULES:**
- Ask ONE question at a time. Wait for the candidate's response.
- Cover diverse topics from the candidate's resume and the role requirements.
- For technical: mix conceptual, practical, and coding questions.
- For behavioral: explore leadership, conflict, teamwork, failure, and growth.
- For HR: cover motivation, culture fit, salary expectations, and career goals.
- ALWAYS respond as Alex the interviewer. Never break character.
- NEVER reveal scores, tool usage, or internal reasoning to the candidate.
- If the candidate asks a question, answer it naturally as an interviewer would, then redirect.
"""

    INTERVIEW_AGENT_REPORT_PROMPT = """As a senior hiring manager, create a comprehensive interview scorecard.

**Target Role:** {target_role}
**Interview Type:** {interview_type}

**Full Transcript:**
{transcript}

**Agent Evaluation Data (from per-question scoring):**
- Average Score: {avg_score}/100
- Total Questions Asked: {total_questions}
- Score History: {score_history}
- Per-Question Evaluations: {evaluations_json}

**Your Task:**
Using BOTH the transcript AND the evaluation data above, create a detailed scorecard.

**Return this EXACT JSON structure:**
{{
    "overall_score": <integer 0-100, heavily weight the evaluation data>,
    "strengths": ["strength 1", "strength 2", ...],
    "weaknesses": ["weakness 1", "weakness 2", ...],
    "feedback": {{
        "technical_depth": <integer 0-100>,
        "communication": <integer 0-100>,
        "problem_solving": <integer 0-100>,
        "cultural_fit": <integer 0-100>,
        "experience_relevance": <integer 0-100>
    }},
    "summary": "2-3 paragraph comprehensive summary with hire recommendation (Strong Yes / Yes / Maybe / No)",
    "recommendation": "Strong Yes | Yes | Maybe | No"
}}

Return ONLY the JSON. No markdown, no extra text."""

    @staticmethod
    def get_interview_agent_system_prompt(resume_text: str, target_role: str, interview_type: str) -> str:
        """Generate the LangChain agent interview system prompt."""
        return PromptTemplates.INTERVIEW_AGENT_SYSTEM_PROMPT.format(
            resume_text=resume_text,
            target_role=target_role,
            interview_type=interview_type,
        )

    @staticmethod
    def get_interview_agent_report_prompt(
        target_role: str,
        interview_type: str,
        transcript: str,
        evaluation_summary: dict,
    ) -> str:
        """Generate the enhanced agent report prompt with evaluation data."""
        import json as _json
        return PromptTemplates.INTERVIEW_AGENT_REPORT_PROMPT.format(
            target_role=target_role,
            interview_type=interview_type,
            transcript=transcript,
            avg_score=evaluation_summary.get("average_score", 0),
            total_questions=evaluation_summary.get("total_questions", 0),
            score_history=evaluation_summary.get("score_history", []),
            evaluations_json=_json.dumps(evaluation_summary.get("evaluations", []), indent=2),
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