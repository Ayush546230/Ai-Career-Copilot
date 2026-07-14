import logging
import json
from typing import List, Dict, Any

from services.rag_service import RAGService
from providers.base import AIProviderBase
from schemas import MentorMatchRequest, MentorMatchResponse, MentorMatchResult

logger = logging.getLogger(__name__)

class MentorService:
    """Service to handle high-level Mentor matching logic."""
    
    def __init__(self, provider: AIProviderBase, rag_service: RAGService):
        self.provider = provider
        self.rag_service = rag_service

    async def match_mentors(self, request: MentorMatchRequest) -> MentorMatchResponse:
        """Find best matching mentors for a student profile using Pinecone."""
        
        query_profile = f"""
        Target Role: {request.target_role}
        Required Skills: {', '.join(request.required_skills or [])}
        Current Skills: {', '.join(request.skills)}
        Skill Gaps: {', '.join(request.missing_skills or [])}
        Interests: {', '.join(request.interests or [])}
        Resume Context: {request.resume_text[:2000]}
        """
        
        logger.info(f"Querying Pinecone for mentors matching role: {request.target_role}")
        raw_matches = await self.rag_service.query_mentors(query_profile, n_results=5)
        
        matches = []
        
        if not raw_matches or not raw_matches.get('matches'):
            logger.warning("No mentors found in Pinecone index")
            return MentorMatchResponse(matches=[])

        pinecone_matches = raw_matches['matches']
        
        mentor_summaries = []
        for match in pinecone_matches:
            m_id = match['id']
            m_metadata = match.get('metadata', {})
            m_text = m_metadata.get('text', '')
            
            mentor_summaries.append({
                "id": m_id,
                "name": m_metadata.get("name", "Unknown"),
                "expertise": m_metadata.get("skills", []),
                "bio": m_text[:500]
            })

        system_prompt = """
        You are a Mentor Matching Specialist. Evaluate the following candidates for the student.
        Return ONLY valid JSON with a 'matches' array. 
        Each item MUST have: 'mentor_id', 'match_score' (0-100), 'match_reason', and 'expertise' (list).
        """
        
        user_prompt = f"""
        Student Profile:
        Role: {request.target_role}
        Skills: {request.skills}
        
        Candidates:
        {json.dumps(mentor_summaries, indent=2)}
        """
        
        try:
            raw_evaluation = await self.provider.generate_completion(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                json_mode=True
            )
            evaluation_results = json.loads(raw_evaluation)
            
            metadata_map = {m['id']: m.get('metadata', {}) for m in pinecone_matches}
            
            for item in evaluation_results.get("matches", []):
                # Normalize keys from LLM (LLM often uses 'id' instead of 'mentor_id')
                m_id = item.get("mentor_id") or item.get("id")
                score = item.get("match_score") or item.get("score") or 0
                reason = item.get("match_reason") or item.get("reason") or "No reason provided."
                expertise = item.get("expertise") or item.get("skills") or []
                
                if m_id in metadata_map:
                    matches.append(MentorMatchResult(
                        mentor_id=str(m_id),
                        name=metadata_map[m_id].get("name", "Unknown"),
                        match_score=float(score),
                        match_reason=str(reason),
                        expertise=expertise if isinstance(expertise, list) else [expertise],
                        metadata=metadata_map[m_id]
                    ))
                
        except Exception as e:
            logger.error(f"LLM Mentor Evaluation failed: {str(e)}")
            # Fallback to pure vector results
            for match in pinecone_matches:
                m_id = match['id']
                m_metadata = match.get('metadata', {})
                score = match.get('score', 0)
                
                matches.append(MentorMatchResult(
                    mentor_id=m_id,
                    name=m_metadata.get("name", "Unknown"),
                    match_score=round(score * 100, 1),
                    match_reason="Matched based on semantic similarity of profile and skills.",
                    expertise=m_metadata.get("skills", []),
                    metadata=m_metadata
                ))

        return MentorMatchResponse(matches=matches)
