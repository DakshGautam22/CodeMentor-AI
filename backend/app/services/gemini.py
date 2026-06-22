import os
import json
import logging
import asyncio
from typing import List, Dict, Any, AsyncGenerator
import google.generativeai as genai
from google.generativeai.types import GenerateContentResponse
from app.core.config import settings
from app.utils.token_manager import apply_sliding_window, estimate_tokens

logger = logging.getLogger("codementor.gemini")

# Initialize Gemini API
if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "YOUR_GEMINI_API_KEY_HERE":
    genai.configure(api_key=settings.GEMINI_API_KEY)
    logger.info("Gemini API configured successfully.")
else:
    logger.warning("Gemini API key is missing or not set. AI services will fail until set.")

DEFAULT_SYSTEM_PROMPT = """You are CodeMentor AI, an elite software engineering assistant and computer science tutor.
You help developers write clean, efficient, secure, and documented code.
For code generation tasks, always provide:
1. The source code (in markdown code blocks with language indicators).
2. A brief, professional explanation of the solution.
3. Time Complexity and Space Complexity analysis (using Big O notation).
4. Best practices, optimization suggestions, or potential caveats.

For debugging tasks:
1. Detect logical/syntax errors.
2. Explain the root cause.
3. Show the corrected code.
4. List best practices to avoid it.

For review tasks, give structured feedback containing scores, code smells, duplicate code detection, and refactoring guidelines.
Maintain a premium, encouraging, and highly technical tone."""

class GeminiService:
    def __init__(self, model_name: str = None):
        self.model_name = model_name or settings.GEMINI_MODEL

    def _get_model(self, system_instruction: str = None) -> genai.GenerativeModel:
        """Helper to get or initialize GenerativeModel with optional system instructions."""
        sys_prompt = system_instruction or DEFAULT_SYSTEM_PROMPT
        return genai.GenerativeModel(
            model_name=self.model_name,
            system_instruction=sys_prompt
        )

    def _format_history(self, db_messages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Formats messages from database format to Gemini's expected format:
        [
            {"role": "user", "parts": [{"text": "..."}]},
            {"role": "model", "parts": [{"text": "..."}]}
        ]
        """
        gemini_messages = []
        for msg in db_messages:
            # Map role
            role = "user"
            if msg.get("role") == "assistant":
                role = "model"
            elif msg.get("role") == "model":
                role = "model"

            content = msg.get("content", "")
            gemini_messages.append({
                "role": role,
                "parts": [{"text": content}]
            })
        return gemini_messages

    async def stream_chat(
        self, 
        history: List[Dict[str, Any]], 
        system_instruction: str = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Streams AI response token-by-token using EventSourceResponse (SSE) format.
        Applies token management sliding window prior to sending context.
        """
        # Ensure API is configured
        if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "YOUR_GEMINI_API_KEY_HERE":
            yield {"event": "error", "data": json.dumps({"detail": "Gemini API key is not configured on the backend server."})}
            return

        sys_prompt = system_instruction or DEFAULT_SYSTEM_PROMPT
        
        # Apply sliding window truncation (target max 28k tokens for Gemini context comfort)
        trimmed_history = apply_sliding_window(history, max_tokens=28000, system_prompt=sys_prompt)
        gemini_contents = self._format_history(trimmed_history)

        try:
            model = self._get_model(sys_prompt)
            # Run blocking API call in executor to keep event loop unblocked
            loop = asyncio.get_running_loop()
            
            def generate():
                return model.generate_content(gemini_contents, stream=True)

            response_stream = await loop.run_in_executor(None, generate)

            for chunk in response_stream:
                # Give control back to event loop
                await asyncio.sleep(0.01)
                
                try:
                    text_chunk = chunk.text
                    if text_chunk:
                        yield {"event": "message", "data": json.dumps({"token": text_chunk})}
                except Exception as chunk_err:
                    # Sometimes chunk.text fails for safety/finish reasons, check if parts present
                    logger.debug(f"Error reading text from chunk: {chunk_err}")
                    continue

        except asyncio.CancelledError:
            logger.info("Streaming client disconnected, cancelling generation.")
            # Standard cleanup/log on disconnection
            raise
        except Exception as e:
            logger.error(f"Error in Gemini streaming chat: {e}", exc_info=True)
            yield {"event": "error", "data": json.dumps({"detail": str(e)})}

    async def get_structured_review(self, code: str, language: str) -> Dict[str, Any]:
        """
        Generates a structured Code Review JSON report.
        """
        if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "YOUR_GEMINI_API_KEY_HERE":
            return {
                "score": 0,
                "summary": "Review failed: Gemini API key is not configured.",
                "issues": [],
                "suggestions": "Configure GEMINI_API_KEY in the environment."
            }

        prompt = f"""Review the following {language} code. You MUST return a JSON object containing the review details.
Do not wrap your response in markdown code blocks or add any other text outside the JSON.
The JSON object must have EXACTLY this structure:
{{
    "score": <integer from 0 to 100 representing code quality>,
    "summary": "<brief high level summary of code quality>",
    "issues": [
        {{
            "type": "<smell, performance, naming, duplicate, security, complexity, syntax>",
            "severity": "<high, medium, low>",
            "line": <approximate line number where the issue resides, or 0 if general>,
            "description": "<detailed description of the code smell or issue>"
        }}
    ],
    "suggestions": "<concrete actionable refactoring steps and overall guidelines>"
}}

Code to review:
```
{code}
```
"""
        try:
            model = self._get_model()
            loop = asyncio.get_running_loop()
            
            def run_api():
                # We request JSON mime type
                return model.generate_content(
                    prompt, 
                    generation_config={"response_mime_type": "application/json"}
                )

            response: GenerateContentResponse = await loop.run_in_executor(None, run_api)
            result_text = response.text.strip()
            
            # Safe JSON parsing
            return json.loads(result_text)
        except Exception as e:
            logger.error(f"Error generating structured review: {e}", exc_info=True)
            # Fallback structure
            return {
                "score": 50,
                "summary": f"Failed to parse structured review from Gemini: {str(e)}",
                "issues": [
                    {"type": "complexity", "severity": "medium", "line": 0, "description": "Review processing completed with errors."}
                ],
                "suggestions": "Please verify code content or try again."
            }

    async def run_single_prompt(self, system_instruction: str, prompt: str) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Helper for single-prompt streaming tasks like Code Generation, Explanation, etc.
        """
        # Ensure API is configured
        if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "YOUR_GEMINI_API_KEY_HERE":
            yield {"event": "error", "data": json.dumps({"detail": "Gemini API key is not configured on the backend server."})}
            return

        try:
            model = self._get_model(system_instruction)
            loop = asyncio.get_running_loop()
            
            def generate():
                return model.generate_content(prompt, stream=True)

            response_stream = await loop.run_in_executor(None, generate)

            for chunk in response_stream:
                await asyncio.sleep(0.01)
                try:
                    text_chunk = chunk.text
                    if text_chunk:
                        yield {"event": "message", "data": json.dumps({"token": text_chunk})}
                except Exception:
                    continue
        except asyncio.CancelledError:
            logger.info("Streaming client disconnected during single-prompt task.")
            raise
        except Exception as e:
            logger.error(f"Error in Gemini single prompt execution: {e}", exc_info=True)
            yield {"event": "error", "data": json.dumps({"detail": str(e)})}

gemini_service = GeminiService()
