"""
Custom LangChain Tools for the AI Interview Agent.
These tools give the agent autonomous control over the interview flow.
The agent decides WHEN and HOW to use each tool based on the conversation context.
"""

import json
import logging
from typing import Optional
from langchain_core.tools import tool

logger = logging.getLogger(__name__)

def _safe_str(val) -> str:
    """Safely convert LLM arguments to string, handling cases where the LLM mistakenly returns a list."""
    if isinstance(val, list):
        return str(val[0]) if val else ""
    return str(val)


# ═══════════════════════════════════════════════════════════════════
# Tool 1: Difficulty Escalator
# ═══════════════════════════════════════════════════════════════════

@tool
def escalate_difficulty(
    current_level: str,
    topic: str,
    candidate_performance: str,
    interview_type: str
) -> str:
    """Adjust interview question difficulty based on candidate performance.
    
    Use this tool to generate the next interview question at the right difficulty level.
    Call this after evaluating the candidate's previous answer.
    
    Args:
        current_level: Current difficulty - must be 'easy', 'medium', or 'hard'
        topic: Technical topic or skill area to ask about (e.g., 'React hooks', 'System Design', 'SQL')
        candidate_performance: Brief assessment - 'strong', 'average', or 'weak'
        interview_type: Either 'technical' or 'behavioral'
    
    Returns:
        JSON with the next difficulty level and a tailored question prompt instruction.
    """
    difficulty_map = {
        ("easy", "strong"): "medium",
        ("easy", "average"): "easy",
        ("easy", "weak"): "easy",
        ("medium", "strong"): "hard",
        ("medium", "average"): "medium",
        ("medium", "weak"): "easy",
        ("hard", "strong"): "hard",
        ("hard", "average"): "medium",
        ("hard", "weak"): "medium",
    }
    
    perf = _safe_str(candidate_performance).lower().strip()
    level = _safe_str(current_level).lower().strip()
    topic = _safe_str(topic)
    interview_type = _safe_str(interview_type)
    
    # Normalize performance to our 3 levels
    if perf not in ("strong", "average", "weak"):
        if any(w in perf for w in ["good", "excellent", "great", "solid"]):
            perf = "strong"
        elif any(w in perf for w in ["poor", "bad", "wrong", "incorrect"]):
            perf = "weak"
        else:
            perf = "average"
    
    if level not in ("easy", "medium", "hard"):
        level = "medium"
    
    next_level = difficulty_map.get((level, perf), "medium")
    
    difficulty_descriptions = {
        "easy": "Ask a foundational question that tests basic understanding. Keep it accessible.",
        "medium": "Ask a question that requires practical experience and deeper understanding. Include a scenario.",
        "hard": "Ask an advanced question that tests deep expertise, edge cases, or system-level thinking. Challenge them."
    }
    
    result = {
        "previous_level": level,
        "next_level": next_level,
        "topic": topic,
        "interview_type": interview_type,
        "instruction": difficulty_descriptions[next_level],
        "escalation_reason": f"Candidate showed {perf} performance at {level} level → moving to {next_level}"
    }
    
    return json.dumps(result)


# ═══════════════════════════════════════════════════════════════════
# Tool 2: Code Challenge Generator
# ═══════════════════════════════════════════════════════════════════

@tool
def generate_code_challenge(
    topic: str,
    difficulty: str,
    preferred_language: str = "any"
) -> str:
    """Generate a coding challenge for technical interviews.
    
    Use this tool when conducting a TECHNICAL interview and you want to test
    the candidate's coding ability. Best used after 3-4 conceptual questions.
    DO NOT use this for behavioral interviews.
    
    Args:
        topic: The technical topic for the coding challenge (e.g., 'arrays', 'trees', 'API design')
        difficulty: Difficulty level - 'easy', 'medium', or 'hard'
        preferred_language: Programming language preference, or 'any' for language-agnostic
    
    Returns:
        JSON with coding challenge structure including problem statement, constraints, and hints.
    """
    challenge_templates = {
        "easy": {
            "type": "implementation",
            "instruction": (
                "Create a straightforward coding problem that tests basic implementation skills. "
                "The problem should be solvable in 5-10 minutes and test fundamental concepts."
            ),
            "follow_ups": [
                "What is the time complexity of your solution?",
                "Can you think of any edge cases?"
            ]
        },
        "medium": {
            "type": "problem_solving",
            "instruction": (
                "Create a problem that requires algorithmic thinking and optimization. "
                "The candidate should consider trade-offs between time and space complexity."
            ),
            "follow_ups": [
                "Can you optimize this further?",
                "What data structure would be most efficient here?",
                "How would this change if the input size was 10x larger?"
            ]
        },
        "hard": {
            "type": "system_design_code",
            "instruction": (
                "Create a complex problem that combines data structures, algorithms, and design thinking. "
                "Should require the candidate to break down the problem into sub-problems."
            ),
            "follow_ups": [
                "How would you handle concurrent access?",
                "What if this needed to scale to millions of operations?",
                "Walk me through your design decisions."
            ]
        }
    }
    
    topic = _safe_str(topic)
    preferred_language = _safe_str(preferred_language)
    diff = _safe_str(difficulty).lower().strip()
    if diff not in challenge_templates:
        diff = "medium"
    
    template = challenge_templates[diff]
    
    result = {
        "topic": topic,
        "difficulty": diff,
        "language": preferred_language,
        "challenge_type": template["type"],
        "generation_instruction": template["instruction"],
        "suggested_follow_ups": template["follow_ups"],
        "format_instruction": (
            "Present the problem clearly with:\n"
            "1. Problem statement\n"
            "2. Input/Output examples\n"
            "3. Constraints\n"
            "Ask the candidate to explain their approach before coding."
        )
    }
    
    return json.dumps(result)


# ═══════════════════════════════════════════════════════════════════
# Tool 3: Behavioral Probe (STAR Method)
# ═══════════════════════════════════════════════════════════════════

@tool
def behavioral_probe(
    candidate_answer: str,
    competency: str,
    missing_star_components: str = ""
) -> str:
    """Generate a STAR-method follow-up probe for behavioral interview answers.
    
    Use this when the candidate gives a behavioral/situational answer that lacks depth.
    The STAR method evaluates: Situation, Task, Action, Result.
    Use this to dig deeper into vague or incomplete answers.
    
    Args:
        candidate_answer: The candidate's answer text to analyze
        competency: The competency being assessed (e.g., 'leadership', 'conflict resolution', 'teamwork')
        missing_star_components: Which STAR components are missing - e.g., 'action,result' or 'situation,task'
    
    Returns:
        JSON with follow-up probe question and coaching instruction.
    """
    star_probes = {
        "situation": {
            "probe": "Can you paint a more specific picture? What was the context — the team size, the timeline, and what was at stake?",
            "rationale": "Candidate didn't clearly describe the specific situation or context."
        },
        "task": {
            "probe": "What exactly was YOUR responsibility in this? What were you specifically tasked with achieving?",
            "rationale": "Candidate didn't clarify their specific role or responsibility."
        },
        "action": {
            "probe": "Walk me through the specific steps YOU took. What did you actually do, and why did you choose that approach?",
            "rationale": "Candidate was vague about their personal actions and decision-making."
        },
        "result": {
            "probe": "What was the measurable outcome? Did you hit the target? What did you learn from the experience?",
            "rationale": "Candidate didn't describe concrete results or learnings."
        }
    }
    
    candidate_answer = _safe_str(candidate_answer)
    competency = _safe_str(competency)
    
    # Parse missing components
    if isinstance(missing_star_components, list):
        components = missing_star_components
    else:
        components = _safe_str(missing_star_components).split(",")
    missing = [str(c).strip().lower() for c in components if str(c).strip()]
    
    if not missing:
        # Auto-detect what might be missing based on answer length and content
        answer_lower = candidate_answer.lower()
        if len(candidate_answer) < 100:
            missing = ["situation", "action", "result"]
        else:
            if not any(w in answer_lower for w in ["team", "project", "company", "client", "when"]):
                missing.append("situation")
            if not any(w in answer_lower for w in ["i did", "i decided", "my approach", "i implemented", "i led"]):
                missing.append("action")
            if not any(w in answer_lower for w in ["result", "outcome", "achieved", "improved", "reduced", "increased", "%"]):
                missing.append("result")
        
        if not missing:
            missing = ["action"]  # Default: dig deeper into actions
    
    # Build follow-up probes for missing components
    probes = []
    for component in missing:
        if component in star_probes:
            probes.append(star_probes[component])
    
    if not probes:
        probes = [star_probes["action"]]
    
    result = {
        "competency": competency,
        "missing_components": missing,
        "primary_probe": probes[0]["probe"],
        "probe_rationale": probes[0]["rationale"],
        "additional_probes": [p["probe"] for p in probes[1:]],
        "coaching": (
            f"The candidate's answer about {competency} needs more depth. "
            f"Missing STAR components: {', '.join(missing)}. "
            f"Ask ONE focused follow-up question — don't overwhelm them."
        )
    }
    
    return json.dumps(result)


# ═══════════════════════════════════════════════════════════════════
# Tool 4: Answer Evaluator
# ═══════════════════════════════════════════════════════════════════

@tool
def evaluate_answer(
    question_asked: str,
    candidate_answer: str,
    expected_criteria: str,
    interview_type: str
) -> str:
    """Silently evaluate a candidate's answer and score it.
    
    Use this tool after EVERY candidate response to track performance.
    The evaluation is internal — do NOT share the score with the candidate.
    Use the score to decide difficulty escalation and follow-up strategy.
    
    Args:
        question_asked: The interview question that was asked
        candidate_answer: The candidate's response
        expected_criteria: What a good answer should cover (key points, concepts, depth)
        interview_type: Either 'technical', 'behavioral', or 'hr'
    
    Returns:
        JSON with score (0-100), performance rating, and feedback notes.
    """
    question_asked = _safe_str(question_asked)
    candidate_answer = _safe_str(candidate_answer)
    expected_criteria = _safe_str(expected_criteria)
    interview_type = _safe_str(interview_type)
    
    answer = candidate_answer.strip()
    answer_len = len(answer)
    answer_lower = answer.lower()
    
    # Base scoring heuristics
    score = 50  # Start at average
    feedback_notes = []
    
    # ── Length & Depth ──────────────────────────────────────────────
    if answer_len < 20:
        score -= 25
        feedback_notes.append("Very short answer — lacks detail")
    elif answer_len < 80:
        score -= 10
        feedback_notes.append("Brief answer — could elaborate more")
    elif answer_len > 200:
        score += 10
        feedback_notes.append("Detailed response with good depth")
    elif answer_len > 500:
        score += 15
        feedback_notes.append("Comprehensive answer with thorough explanation")
    
    # ── Technical indicators ───────────────────────────────────────
    if interview_type.lower() == "technical":
        tech_indicators = [
            "complexity", "algorithm", "data structure", "optimize", "trade-off",
            "scale", "big o", "o(n)", "o(log", "time complexity", "space complexity",
            "design pattern", "architecture", "api", "database", "cache", "index",
            "hash", "tree", "graph", "queue", "stack", "linked list"
        ]
        tech_hits = sum(1 for ind in tech_indicators if ind in answer_lower)
        score += min(tech_hits * 5, 20)
        if tech_hits > 0:
            feedback_notes.append(f"Used {tech_hits} technical concepts")
        
        # Code snippets or pseudo-code
        if any(c in answer for c in ["```", "def ", "function ", "class ", "=>", "->"]):
            score += 10
            feedback_notes.append("Included code/pseudo-code examples")
    
    # ── Behavioral indicators (STAR) ───────────────────────────────
    elif interview_type.lower() in ("behavioral", "hr"):
        star_hits = 0
        if any(w in answer_lower for w in ["situation", "context", "when i was", "at my previous"]):
            star_hits += 1
        if any(w in answer_lower for w in ["responsible for", "my role", "tasked with", "assigned"]):
            star_hits += 1
        if any(w in answer_lower for w in ["i decided", "i implemented", "i led", "my approach", "i took"]):
            star_hits += 1
        if any(w in answer_lower for w in ["result", "outcome", "achieved", "improved", "success", "learned"]):
            star_hits += 1
        
        score += star_hits * 8
        if star_hits >= 3:
            feedback_notes.append(f"Strong STAR response ({star_hits}/4 components)")
        elif star_hits >= 1:
            feedback_notes.append(f"Partial STAR response ({star_hits}/4 components)")
        else:
            feedback_notes.append("No STAR structure detected")
            score -= 10
    
    # ── Specificity bonus ──────────────────────────────────────────
    if any(w in answer_lower for w in ["for example", "specifically", "in particular", "such as"]):
        score += 5
        feedback_notes.append("Provided specific examples")
    
    # ── Confidence markers ─────────────────────────────────────────
    uncertainty_markers = ["i think", "maybe", "i'm not sure", "probably", "i guess"]
    certainty_markers = ["definitely", "absolutely", "the key point is", "importantly"]
    
    uncertainty_count = sum(1 for m in uncertainty_markers if m in answer_lower)
    certainty_count = sum(1 for m in certainty_markers if m in answer_lower)
    
    if uncertainty_count > 2:
        score -= 5
        feedback_notes.append("Shows uncertainty — lacks confidence")
    if certainty_count > 0:
        score += 3
    
    # ── Clamp score ────────────────────────────────────────────────
    score = max(0, min(100, score))
    
    # ── Performance rating ─────────────────────────────────────────
    if score >= 80:
        performance = "strong"
    elif score >= 55:
        performance = "average"
    else:
        performance = "weak"
    
    result = {
        "score": score,
        "performance": performance,
        "feedback_notes": feedback_notes,
        "answer_length": answer_len,
        "instruction": (
            f"Candidate performance: {performance} (score: {score}/100). "
            f"Use this to decide next action: escalate difficulty if strong, "
            f"probe deeper if average, offer encouragement if weak."
        )
    }
    
    return json.dumps(result)


# ═══════════════════════════════════════════════════════════════════
# Tool 5: Session Manager
# ═══════════════════════════════════════════════════════════════════

@tool
def manage_session(
    action: str,
    question_number: int,
    max_questions: int = 10,
    current_scores: str = ""
) -> str:
    """Manage the interview session lifecycle and pacing.
    
    Use this tool to track where you are in the interview and decide
    whether to continue asking questions or wrap up.
    
    Args:
        action: One of 'check_progress', 'should_end', 'get_summary'
        question_number: Current question number (1-based)
        max_questions: Maximum number of questions for this interview (default 10)
        current_scores: Comma-separated scores from evaluate_answer (e.g., '75,60,80,90')
    
    Returns:
        JSON with session state, progress info, and whether to end the interview.
    """
    action = _safe_str(action).lower().strip()
    current_scores = _safe_str(current_scores)
    
    # Parse scores
    scores = []
    if current_scores:
        for s in current_scores.split(","):
            s = s.strip()
            if s.isdigit():
                scores.append(int(s))
    
    avg_score = round(sum(scores) / len(scores), 1) if scores else 0
    progress_pct = round((question_number / max_questions) * 100)
    
    # Determine if interview should end
    should_end = False
    end_reason = ""
    
    if question_number >= max_questions:
        should_end = True
        end_reason = f"Reached maximum question limit ({max_questions})"
    elif question_number >= 8 and avg_score >= 75:
        should_end = True
        end_reason = "Strong candidate — sufficient data collected after 8+ questions"
    elif question_number >= 6 and avg_score < 30:
        should_end = True
        end_reason = "Candidate struggling significantly — ending early to avoid frustration"
    
    # Pacing guidance
    if question_number <= 2:
        phase = "warmup"
        pacing = "Start with easier questions to build rapport. Keep it friendly."
    elif question_number <= 5:
        phase = "core"
        pacing = "This is the meat of the interview. Ask your toughest questions now."
    elif question_number <= 8:
        phase = "deep_dive"
        pacing = "Focus on areas where the candidate showed strength or weakness. Go deep."
    else:
        phase = "wrap_up"
        pacing = "Start wrapping up. Ask if they have any questions. Be encouraging."
    
    result = {
        "action": action,
        "question_number": question_number,
        "max_questions": max_questions,
        "progress_percent": progress_pct,
        "phase": phase,
        "pacing_instruction": pacing,
        "should_end": should_end,
        "end_reason": end_reason,
        "average_score": avg_score,
        "total_evaluations": len(scores),
        "score_trend": "improving" if len(scores) >= 3 and scores[-1] > scores[0] else 
                       "declining" if len(scores) >= 3 and scores[-1] < scores[0] else "stable"
    }
    
    return json.dumps(result)


# ═══════════════════════════════════════════════════════════════════
# Tool registry for the agent
# ═══════════════════════════════════════════════════════════════════

def get_interview_tools() -> list:
    """Return all interview tools for the LangChain agent."""
    return [
        escalate_difficulty,
        generate_code_challenge,
        behavioral_probe,
        evaluate_answer,
        manage_session,
    ]
