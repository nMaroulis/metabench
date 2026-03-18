import os
from abc import ABC, abstractmethod

from anthropic import Anthropic
from google import genai
from google.genai import types
from openai import OpenAI
from utils.logger import get_logger

logger = get_logger("llms")


class LLMClient(ABC):
    """Abstract base class for LLM clients."""

    @abstractmethod
    def get_response(self, system_prompt: str = "", user_prompt: str = "", model: str | None = None) -> str | None:
        """Get response from the LLM for the given prompt."""
        pass


class OpenAIClient(LLMClient):
    """OpenAI client using the Responses API with web search."""

    def __init__(self, api_key: str | None = None, model: str | None = None):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        self.model = model or "gpt-4o"
        self.client = OpenAI(api_key=self.api_key) if self.api_key else None

    def get_response(self, system_prompt: str = "", user_prompt: str = "", model: str | None = None) -> str | None:
        """Get response using OpenAI Responses API with web search."""
        if not self.client:
            logger.error("No OpenAI API key found.")
            return None

        try:
            response = self.client.responses.create(
                model=model or self.model,
                input=[
                    {
                        "role": "system",
                        "content": system_prompt,
                    },
                    {"role": "user", "content": user_prompt},
                ],
                tools=[{"type": "web_search"}],
            )
            return response.output_text
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            return None


class AnthropicClient(LLMClient):
    """Anthropic client for Claude models."""

    def __init__(self, api_key: str | None = None, model: str | None = None):
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        self.model = model or "claude-3-5-sonnet-20241022"
        self.client = Anthropic(api_key=self.api_key) if self.api_key else None

    def get_response(self, system_prompt: str = "", user_prompt: str = "", model: str | None = None) -> str | None:
        """Get response using Anthropic API."""
        if not self.client:
            logger.error("No Anthropic API key found.")
            return None

        try:
            response = self.client.messages.create(
                model=model or self.model,
                max_tokens=5000,
                messages=[  # type: ignore[list-item]
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
            )
            # Handle multiple response blocks safely
            content_parts = []
            for block in response.content:
                if hasattr(block, "text"):
                    content_parts.append(block.text)
            return "".join(content_parts) if content_parts else None
        except Exception as e:
            logger.error(f"Anthropic API error: {e}")
            return None


class GeminiClient(LLMClient):
    """Gemini client using the google-genai SDK with Google Search search."""

    def __init__(self, api_key: str | None = None, model: str | None = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        self.model = model or "gemini-2.5-flash"
        self.client = genai.Client(api_key=self.api_key) if self.api_key else None

    def get_response(self, system_prompt: str = "", user_prompt: str = "", model: str | None = None) -> str | None:
        """Get response using Gemini API with Google Search grounding."""
        if not self.client:
            logger.error("No Gemini API key found.")
            return None

        try:
            response = self.client.models.generate_content(
                model=model or self.model,
                contents=user_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    tools=[types.Tool(google_search=types.GoogleSearch())],
                ),
            )
            return response.text
        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            return None


def get_llm_client(provider: str = "openai", model: str | None = None) -> LLMClient:
    """LLM client factory for the given provider."""
    if provider == "openai":
        return OpenAIClient(model=model)
    elif provider == "gemini":
        return GeminiClient(model=model)
    elif provider == "anthropic":
        return AnthropicClient(model=model)
    else:
        raise ValueError(f"Unknown provider: {provider}")
