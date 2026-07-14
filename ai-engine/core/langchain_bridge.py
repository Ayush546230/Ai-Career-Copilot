"""
LangChain Chat Model Bridge.
Maps our existing AI provider configuration to LangChain ChatModel instances.
This keeps the Factory pattern intact while enabling LangChain agent features.
"""

import logging
from typing import Optional

from langchain_core.language_models.chat_models import BaseChatModel

logger = logging.getLogger(__name__)


def get_langchain_chat_model(
    provider: str,
    api_key: str,
    model: str,
    temperature: float = 0.4,
    max_tokens: int = 4096
) -> BaseChatModel:
    """
    Create a LangChain ChatModel from our provider configuration.
    
    Args:
        provider: Provider name (gemini, openai, claude)
        api_key: API key for the provider
        model: Model identifier string
        temperature: Sampling temperature (slightly higher for interviews — more natural)
        max_tokens: Maximum output tokens
        
    Returns:
        LangChain BaseChatModel instance
        
    Raises:
        ValueError: If provider is unsupported
    """
    provider = provider.lower()
    
    if provider == "gemini":
        from langchain_google_genai import ChatGoogleGenerativeAI
        
        logger.info(f"Creating LangChain Gemini model: {model}")
        return ChatGoogleGenerativeAI(
            model=model.replace("models/", ""),  # LangChain expects "gemini-2.5-flash" not "models/gemini-2.5-flash"
            google_api_key=api_key,
            temperature=temperature,
            max_output_tokens=max_tokens,
        )
    
    elif provider == "openai":
        from langchain_openai import ChatOpenAI
        
        logger.info(f"Creating LangChain OpenAI model: {model}")
        return ChatOpenAI(
            model=model,
            api_key=api_key,
            temperature=temperature,
            max_tokens=max_tokens,
        )
    
    elif provider == "claude":
        from langchain_anthropic import ChatAnthropic
        
        logger.info(f"Creating LangChain Claude model: {model}")
        return ChatAnthropic(
            model=model,
            api_key=api_key,
            temperature=temperature,
            max_tokens=max_tokens,
        )
    
    else:
        raise ValueError(
            f"Unsupported provider for LangChain bridge: {provider}. "
            f"Must be one of: gemini, openai, claude"
        )
