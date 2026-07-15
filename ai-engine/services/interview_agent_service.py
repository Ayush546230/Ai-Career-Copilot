"""
LangChain AI Interview Agent Service.
Uses a LangGraph ReAct agent with custom tools to autonomously conduct 
technical and behavioral mock interviews.

Replaces the old manual prompt-based InterviewService with an intelligent
agent that dynamically adapts questions, difficulty, and probing strategy.
"""

import json
import logging
import uuid
from typing import Dict, Any, Optional, List
from datetime import timedelta

import redis.asyncio as aioredis

from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, ToolMessage
from langgraph.prebuilt import create_react_agent

from core.langchain_bridge import get_langchain_chat_model
from core.prompts import PromptTemplates
from services.interview_tools import get_interview_tools
from schemas import (
    InterviewStartRequest,
    InterviewChatRequest,
    InterviewChatResponse,
    InterviewReport,
    InterviewScorecard,
    QuestionEvaluation,
)
from config import settings

logger = logging.getLogger(__name__)


class InterviewAgentService:
    """
    AI Interview Agent powered by LangGraph.
    
    The agent autonomously:
    - Asks questions at the right difficulty level
    - Generates coding challenges for technical interviews
    - Probes behavioral answers using STAR method
    - Evaluates every answer silently to track performance
    - Manages session pacing and decides when to end
    """
    
    SESSION_EXPIRY = timedelta(hours=2)
    MAX_QUESTIONS = 10
    
    def __init__(self):
        # Create LangChain chat model from our existing provider config
        self.llm = get_langchain_chat_model(
            provider=settings.ai_provider,
            api_key=settings.get_api_key_for_provider(settings.ai_provider),
            model=settings.get_model_for_provider(settings.ai_provider),
            temperature=0.5,   # Slightly higher for natural conversation
            max_tokens=settings.ai_max_tokens,
        )
        
        # Interview tools
        self.tools = get_interview_tools()
        
        # Redis for session persistence
        self.redis = aioredis.from_url(settings.redis_url, decode_responses=True)
        
        # Prompt templates
        self.prompts = PromptTemplates()
        
        logger.info(
            f"InterviewAgentService initialized with provider={settings.ai_provider}, "
            f"model={settings.get_model_for_provider(settings.ai_provider)}"
        )
    
    def _create_agent(self, system_prompt: str):
        """Create a LangGraph ReAct agent with tools and the interview persona."""
        return create_react_agent(
            model=self.llm,
            tools=self.tools,
            prompt=system_prompt,
        )
    
    async def _run_agent(self, system_prompt: str, messages: list) -> Dict[str, Any]:
        """
        Run the LangGraph agent and return the final AI message + intermediate tool data.
        
        Returns:
            {
                "output": str (final agent text),
                "tool_calls": list of {tool_name, tool_output} dicts
            }
        """
        agent = self._create_agent(system_prompt)
        
        result = await agent.ainvoke({"messages": messages})
        
        # Extract final output and tool call data from the message list
        output_messages = result.get("messages", [])
        
        final_output = ""
        tool_calls_data = []
        
        for msg in output_messages:
            if isinstance(msg, AIMessage) and msg.content and not msg.tool_calls:
                # This is the final text response (no pending tool calls)
                final_output = msg.content
            elif isinstance(msg, ToolMessage):
                tool_calls_data.append({
                    "tool_name": msg.name,
                    "tool_output": msg.content,
                })
        
        return {
            "output": final_output,
            "tool_calls": tool_calls_data,
        }
    
    # ─── Session Management ──────────────────────────────────────────

    async def _get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve session from Redis."""
        data = await self.redis.get(f"interview:{session_id}")
        return json.loads(data) if data else None

    async def _save_session(self, session_id: str, data: Dict[str, Any]):
        """Persist session to Redis with expiry."""
        await self.redis.setex(
            f"interview:{session_id}",
            int(self.SESSION_EXPIRY.total_seconds()),
            json.dumps(data)
        )
    
    # ─── Public API (same interface as old InterviewService) ──────────

    async def start_interview(self, request: InterviewStartRequest) -> Dict[str, Any]:
        """
        Start a new interview session.
        The agent introduces itself and asks the first question.
        """
        session_id = str(uuid.uuid4())
        
        # Build the agent system prompt
        system_prompt = self.prompts.get_interview_agent_system_prompt(
            resume_text=request.resume_text,
            target_role=request.target_role,
            interview_type=request.interview_type.value,
        )
        
        # Initial instruction to the agent
        initial_input = (
            f"[INTERVIEW START]\n"
            f"You are beginning a {request.interview_type.value} interview for the role of {request.target_role}.\n"
            f"Introduce yourself briefly as Alex from PathForge AI, then ask your first question.\n"
            f"Use the manage_session tool with action='check_progress', question_number=1 to track the session.\n"
            f"Use the escalate_difficulty tool to determine the right level for your first question "
            f"(start at 'easy' level, topic based on the candidate's resume skills).\n"
            f"Then ask the question naturally — do NOT mention tools or scoring to the candidate."
        )
        
        try:
            result = await self._run_agent(
                system_prompt=system_prompt,
                messages=[HumanMessage(content=initial_input)],
            )
            
            agent_response = result["output"]
            
            if not agent_response:
                # Fallback: generate a simple opening
                agent_response = (
                    f"Hi! I'm Alex from PathForge AI. Welcome to your mock {request.interview_type.value} "
                    f"interview for the {request.target_role} position. Let's get started!\n\n"
                    f"Tell me about yourself and what draws you to this role."
                )
            
            # Extract tool evaluations
            evaluations = self._extract_evaluations(result["tool_calls"])
            
        except Exception as e:
            logger.error(f"Agent failed to start interview: {str(e)}")
            agent_response = (
                f"Hi! I'm Alex from PathForge AI. Welcome to your mock {request.interview_type.value} "
                f"interview for the {request.target_role} position. Let's begin!\n\n"
                f"Can you start by telling me about your background and why you're interested in this role?"
            )
            evaluations = []
        
        # Save session
        session_data = {
            "session_id": session_id,
            "target_role": request.target_role,
            "resume_text": request.resume_text[:3000],  # Cap resume storage
            "interview_type": request.interview_type.value,
            "question_number": 1,
            "scores": [],
            "evaluations": evaluations,
            "history": [
                {"role": "assistant", "content": agent_response}
            ],
        }
        await self._save_session(session_id, session_data)
        
        return {"session_id": session_id, "initial_question": agent_response}

    async def process_chat(self, request: InterviewChatRequest) -> InterviewChatResponse:
        """
        Process a candidate's response and return the next question.
        The agent evaluates the answer, decides difficulty, and asks the next question.
        """
        session_data = await self._get_session(request.session_id)
        if not session_data:
            raise Exception("Interview session expired or not found.")
        
        # Update history with candidate's response
        history = session_data["history"]
        history.append({"role": "user", "content": request.user_message})
        
        question_number = session_data.get("question_number", 1) + 1
        scores = session_data.get("scores", [])
        scores_str = ",".join(str(s) for s in scores)
        
        # Build system prompt
        system_prompt = self.prompts.get_interview_agent_system_prompt(
            resume_text=session_data["resume_text"],
            target_role=session_data["target_role"],
            interview_type=session_data["interview_type"],
        )
        
        # Convert history to LangChain messages for context
        chat_messages = self._build_chat_history(history)
        
        # Build the instruction for the agent (appended as final user message)
        interview_type = session_data["interview_type"]
        
        # Extract previously asked questions so agent doesn't repeat them
        previous_questions = []
        for msg in history:
            if msg["role"] == "assistant":
                previous_questions.append(msg["content"][:200])  # First 200 chars to keep prompt lean
        
        previously_asked_section = ""
        if previous_questions:
            questions_list = "\n".join(f"  - Q{i+1}: {q}" for i, q in enumerate(previous_questions))
            previously_asked_section = (
                f"\n\n**QUESTIONS YOU HAVE ALREADY ASKED (DO NOT REPEAT OR ASK SIMILAR ONES):**\n"
                f"{questions_list}\n"
                f"You MUST ask a COMPLETELY DIFFERENT question on a NEW topic. "
                f"Cover diverse areas — do NOT revisit topics you already explored.\n"
            )
        
        agent_instruction = (
            f"\n\n[INTERNAL INSTRUCTIONS — DO NOT SHARE WITH CANDIDATE]\n"
            f"This is question #{question_number} of the interview.\n"
            f"{previously_asked_section}"
            f"1. First, use evaluate_answer to score their response. "
            f"Question was: \"{history[-2]['content'] if len(history) >= 2 else 'introductory question'}\"\n"
            f"2. Use manage_session with action='should_end', question_number={question_number}, "
            f"current_scores='{scores_str}' to check if the interview should end.\n"
            f"3. If should_end is true, wrap up warmly.\n"
            f"4. If continuing, use escalate_difficulty to determine the next question level.\n"
        )
        
        # Add type-specific instructions
        if interview_type == "technical" and question_number >= 5 and question_number % 3 == 0:
            agent_instruction += (
                f"5. Consider using generate_code_challenge to give a coding problem.\n"
            )
        elif interview_type in ("behavioral", "hr"):
            agent_instruction += (
                f"5. If the answer was vague or lacked STAR structure, use behavioral_probe to dig deeper.\n"
            )
        
        agent_instruction += (
            f"\n**NEXT QUESTION STRATEGY:**\n"
            f"- Look at what the candidate just said. If they mentioned any specific technology, project, "
            f"or concept, ask a deeper follow-up on that.\n"
            f"- If they said 'I don't know' or gave a very short answer, acknowledge it kindly "
            f"('No worries!') and move to a completely different topic from their resume.\n"
            f"- Balance follow-ups with new topics from the resume and role requirements.\n"
            f"\nRespond ONLY as the interviewer Alex. Be natural and professional. "
            f"NEVER mention tools, scoring, or evaluation to the candidate. "
            f"Ask a FRESH question — either a follow-up on their answer or a new topic you haven't covered."
        )
        
        # The last message is the user's answer + internal instructions
        # Replace the last HumanMessage with enriched version
        if chat_messages and isinstance(chat_messages[-1], HumanMessage):
            chat_messages[-1] = HumanMessage(
                content=request.user_message + agent_instruction
            )
        
        try:
            result = await self._run_agent(
                system_prompt=system_prompt,
                messages=chat_messages,
            )
            
            agent_response = result["output"]
            
            # Extract evaluation scores from tool calls
            new_evaluations = self._extract_evaluations(result["tool_calls"])
            new_scores = [e.get("score", 0) for e in new_evaluations if "score" in e]
            
            # Check if agent decided to end
            is_ended = self._check_if_ended(result["tool_calls"], agent_response)
            
            if not agent_response:
                agent_response = "That's a great point. Could you elaborate a bit more?"
                is_ended = False
            
        except Exception as e:
            logger.error(f"Agent error during chat: {str(e)}")
            # Graceful fallback
            agent_response = (
                "That's an interesting perspective. "
                "Can you tell me more about how you've applied this in a real project?"
            )
            new_scores = []
            new_evaluations = []
            is_ended = question_number >= self.MAX_QUESTIONS
        
        # Update session
        scores.extend(new_scores)
        history.append({"role": "assistant", "content": agent_response})
        
        session_data["history"] = history
        session_data["question_number"] = question_number
        session_data["scores"] = scores
        session_data["evaluations"] = session_data.get("evaluations", []) + new_evaluations
        
        await self._save_session(request.session_id, session_data)
        
        return InterviewChatResponse(next_question=agent_response, is_ended=is_ended)

    async def generate_report(self, session_id: str) -> InterviewReport:
        """
        Generate final interview report with per-question evaluations.
        Uses accumulated evaluation data from the agent's tool calls.
        """
        try:
            session_data = await self._get_session(session_id)
            if not session_data:
                raise Exception("Session not found or expired.")
            
            transcript = "\n".join(
                [f"{m['role'].upper()}: {m['content']}" for m in session_data["history"]]
            )
            
            scores = session_data.get("scores", [])
            evaluations = session_data.get("evaluations", [])
            avg_score = round(sum(scores) / len(scores)) if scores else 50
            
            # Build enhanced report prompt with agent evaluation data
            report_prompt = self.prompts.get_interview_agent_report_prompt(
                target_role=session_data["target_role"],
                interview_type=session_data["interview_type"],
                transcript=transcript,
                evaluation_summary={
                    "average_score": avg_score,
                    "total_questions": session_data.get("question_number", 0),
                    "score_history": scores,
                    "evaluations": evaluations,
                },
            )
            
            # Use LLM directly (not agent) for report generation
            response = await self.llm.ainvoke([
                SystemMessage(content="You are a hiring manager writing a detailed interview scorecard. Return ONLY valid JSON."),
                HumanMessage(content=report_prompt),
            ])
            
            scorecard_data = json.loads(response.content)
            
            # Normalize LLM response fields
            normalized = {
                "overall_score": scorecard_data.get("overall_score") or scorecard_data.get("score") or avg_score,
                "strengths": scorecard_data.get("strengths") or [],
                "weaknesses": scorecard_data.get("weaknesses") or [],
                "feedback": scorecard_data.get("feedback") or scorecard_data.get("breakdown") or {},
                "summary": scorecard_data.get("summary") or scorecard_data.get("feedback_text") or "Interview evaluation completed.",
            }
            
            # Build per-question evaluations
            question_evaluations = []
            for i, evl in enumerate(evaluations):
                question_evaluations.append(QuestionEvaluation(
                    question_number=i + 1,
                    score=evl.get("score", 0),
                    performance=evl.get("performance", "average"),
                    feedback_notes=evl.get("feedback_notes", []),
                ))
            
            # Cleanup
            try:
                await self.redis.delete(f"interview:{session_id}")
            except Exception:
                pass
            
            return InterviewReport(
                session_id=session_id,
                scorecard=InterviewScorecard(**normalized),
                question_evaluations=question_evaluations,
            )
            
        except Exception as e:
            logger.error(f"Report generation failed: {str(e)}")
            return InterviewReport(
                session_id=session_id,
                scorecard=InterviewScorecard(
                    overall_score=0,
                    strengths=[],
                    weaknesses=[],
                    feedback="Failed to generate detailed report due to an AI error.",
                ),
                question_evaluations=[],
            )
    
    # ─── Private Helpers ─────────────────────────────────────────────

    def _build_chat_history(self, history: List[Dict]) -> list:
        """Convert our dict history to LangChain message objects."""
        messages = []
        for msg in history:
            if msg["role"] == "assistant":
                messages.append(AIMessage(content=msg["content"]))
            elif msg["role"] == "user":
                messages.append(HumanMessage(content=msg["content"]))
        return messages
    
    def _extract_evaluations(self, tool_calls: List[Dict]) -> List[Dict]:
        """Extract evaluation data from agent's tool call results."""
        evaluations = []
        for call in tool_calls:
            if call.get("tool_name") == "evaluate_answer":
                try:
                    output = call.get("tool_output", "")
                    eval_data = json.loads(output) if isinstance(output, str) else output
                    evaluations.append(eval_data)
                except (json.JSONDecodeError, TypeError):
                    pass
        return evaluations
    
    def _check_if_ended(self, tool_calls: List[Dict], agent_response: str) -> bool:
        """Check if the agent decided to end the interview."""
        # Check manage_session tool output
        for call in tool_calls:
            if call.get("tool_name") == "manage_session":
                try:
                    output = call.get("tool_output", "")
                    data = json.loads(output) if isinstance(output, str) else output
                    if data.get("should_end", False):
                        return True
                except (json.JSONDecodeError, TypeError):
                    pass
        
        # Also check if agent's response contains ending signals
        end_signals = [
            "concludes our interview",
            "that wraps up",
            "end of our interview",
            "thank you for your time",
            "interview is complete",
            "that's all the questions",
        ]
        response_lower = agent_response.lower()
        return any(signal in response_lower for signal in end_signals)
