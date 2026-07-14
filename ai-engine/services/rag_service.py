import logging
from pinecone import Pinecone, ServerlessSpec
from typing import List, Dict, Any, Optional
import os
import asyncio

from providers.base import AIProviderBase
from config import settings

logger = logging.getLogger(__name__)

class RAGService:
    """Service to handle Vector DB operations using Pinecone."""
    
    def __init__(self, provider: AIProviderBase):
        self.provider = provider
        
        # Initialize Pinecone client
        if not settings.pinecone_api_key:
            logger.warning("PINECONE_API_KEY is not set. RAG operations will fail.")
            self.pc = None
            self.index = None
            return

        self.pc = Pinecone(api_key=settings.pinecone_api_key)
        
        # Check if index exists, if not create it (Serverless)
        index_name = settings.pinecone_index_name
        
        try:
            # List existing indexes
            existing_indexes = [index.name for index in self.pc.list_indexes()]
            
            if index_name not in existing_indexes:
                logger.info(f"Creating new Pinecone index: {index_name}")
                self.pc.create_index(
                    name=index_name,
                    dimension=3072, # Updated to match Gemini output
                    metric='cosine',
                    spec=ServerlessSpec(
                        cloud='aws', 
                        region='us-east-1' # Default for free tier often
                    )
                )
                # Wait for index to be ready
                while not self.pc.describe_index(index_name).status['ready']:
                    import time
                    time.sleep(1)
            
            self.index = self.pc.Index(index_name)
            logger.info(f"RAGService initialized with Pinecone index: {index_name}")
            
        except Exception as e:
            logger.error(f"Failed to initialize Pinecone: {str(e)}")
            self.index = None

    async def get_embedding(self, text: str) -> List[float]:
        """Generate embedding using Gemini's gemini-embedding-001 model."""
        try:
            if hasattr(self.provider, 'client'):
                # Run the synchronous SDK call in an executor to avoid blocking
                loop = asyncio.get_event_loop()
                response = await loop.run_in_executor(
                    None,
                    lambda: self.provider.client.models.embed_content(
                        model="models/gemini-embedding-001",
                        contents=text
                    )
                )
                return response.embeddings[0].values
            else:
                logger.warning("Provider does not support direct embedding. Using dummy.")
                return [0.0] * 768
        except Exception as e:
            logger.error(f"Embedding generation failed: {str(e)}")
            raise

    async def index_mentor(self, mentor_id: str, profile_text: str, metadata: Dict[str, Any]):
        """Index a mentor profile in Pinecone."""
        if not self.index:
            logger.error("Pinecone index not initialized.")
            return

        embedding = await self.get_embedding(profile_text)
        
        # Pinecone upsert format
        # We store profile_text in metadata for retrieval
        metadata_with_text = {**metadata, "text": profile_text}
        
        self.index.upsert(
            vectors=[
                {
                    "id": mentor_id,
                    "values": embedding,
                    "metadata": metadata_with_text
                }
            ]
        )
        logger.info(f"Indexed mentor {mentor_id} in Pinecone")

    async def query_mentors(self, query_text: str, n_results: int = 3) -> Dict[str, Any]:
        """Query similar mentors based on text."""
        if not self.index:
            logger.error("Pinecone index not initialized.")
            return {"matches": []}

        query_embedding = await self.get_embedding(query_text)
        
        results = self.index.query(
            vector=query_embedding,
            top_k=n_results,
            include_metadata=True
        )
        
        # Format results to be somewhat compatible with previous ChromaDB format if needed
        # Or just return raw Pinecone results
        return results
