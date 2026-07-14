import json
import logging
import uuid
import redis.asyncio as redis
from typing import Dict, Any, List, Optional
from datetime import timedelta

from providers.base import AIProviderBase
from core.prompts import PromptTemplates
from schemas import (
    InterviewStartRequest, 
    InterviewChatRequest, 
    InterviewChatResponse,
    InterviewReport,
    InterviewScorecard
)
from config import settings

logger = logging.getLogger(__name__)

class InterviewService:
    """Service to handle AI Mock Interview Logic with Persistent State."""
    
    SESSION_EXPIRY = timedelta(hours=2)
    
    def __init__(self, provider: AIProviderBase):
        self.provider = provider
        self.prompts = PromptTemplates()
        self.redis = redis.from_url(settings.redis_url, decode_responses=True)

    async def _get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        data = await self.redis.get(f"interview:{session_id}")
        return json.loads(data) if data else None

    async def _save_session(self, session_id: str, data: Dict[str, Any]):
        await self.redis.setex(
            f"interview:{session_id}",
            int(self.SESSION_EXPIRY.total_seconds()),
            json.dumps(data)
        )

    async def start_interview(self, request: InterviewStartRequest) -> Dict[str, Any]:
        session_id = str(uuid.uuid4())
        system_prompt = self.prompts.get_interview_system_prompt(
            resume_text=request.resume_text,
            target_role=request.target_role,
            interview_type=request.interview_type.value
        )
        
        raw_response = await self.provider.generate_completion(
            system_prompt=system_prompt,
            user_prompt="[START] Introduce yourself and ask the first question.",
            json_mode=True
        )
        
        response_data = json.loads(raw_response)
        initial_question = response_data.get("next_question", "Tell me about yourself.")
        
        session_data = {
            "session_id": session_id,
            "target_role": request.target_role,
            "resume_text": request.resume_text,
            "interview_type": request.interview_type.value,
            "history": [{"role": "assistant", "content": initial_question}]
        }
        await self._save_session(session_id, session_data)
        
        return {"session_id": session_id, "initial_question": initial_question}

    async def process_chat(self, request: InterviewChatRequest) -> InterviewChatResponse:
        session_data = await self._get_session(request.session_id)
        if not session_data:
            raise Exception("Session expired")
            
        history = session_data["history"]
        history.append({"role": "user", "content": request.user_message})
        
        system_prompt = self.prompts.get_interview_system_prompt(
            resume_text=session_data["resume_text"],
            target_role=session_data["target_role"],
            interview_type=session_data["interview_type"]
        )
        
        history_text = "\n".join([f"{m['role']}: {m['content']}" for m in history])
        user_prompt = f"Transcript:\n{history_text}\n\nAssistant: Respond in JSON."

        raw_response = await self.provider.generate_completion(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            json_mode=True
        )
        
        response_data = json.loads(raw_response)
        next_q = response_data.get("next_question", "...")
        is_ended = response_data.get("is_ended", False)
        
        history.append({"role": "assistant", "content": next_q})
        session_data["history"] = history
        await self._save_session(request.session_id, session_data)
        
        return InterviewChatResponse(next_question=next_q, is_ended=is_ended)

    async def generate_report(self, session_id: str) -> InterviewReport:
        try:
            session_data = await self._get_session(session_id)
            if not session_data:
                raise Exception("Session not found or expired")
                
            transcript = "\n".join([f"{m['role']}: {m['content']}" for m in session_data["history"]])
            report_prompt = self.prompts.get_interview_report_prompt(session_data["target_role"], transcript)
            
            raw_response = await self.provider.generate_completion(
                system_prompt="You are a hiring manager. Provide an interview scorecard in JSON.",
                user_prompt=report_prompt,
                json_mode=True
            )
            
            scorecard_data = json.loads(raw_response)
            
            # Normalize fields to handle LLM variations
            normalized_scorecard = {
                "overall_score": scorecard_data.get("overall_score") or scorecard_data.get("score") or 70,
                "strengths": scorecard_data.get("strengths") or [],
                "weaknesses": scorecard_data.get("weaknesses") or [],
                "feedback": scorecard_data.get("feedback") or scorecard_data.get("breakdown") or {},
                "summary": scorecard_data.get("summary") or scorecard_data.get("feedback_text") or "Interview evaluation completed."
            }
            
            try:
                await self.redis.delete(f"interview:{session_id}")
            except:
                pass # Non-critical if delete fails
                
            return InterviewReport(
                session_id=session_id, 
                scorecard=InterviewScorecard(**normalized_scorecard)
            )
        except Exception as e:
            logger.error(f"Critical report failure: {str(e)}")
            return InterviewReport(
                session_id=session_id,
                scorecard=InterviewScorecard(
                    overall_score=0,
                    strengths=[],
                    weaknesses=[],
                    feedback=f"Failed to generate detailed report due to an AI error. Transcript was processed but results could not be structured."
                )
            )
            
