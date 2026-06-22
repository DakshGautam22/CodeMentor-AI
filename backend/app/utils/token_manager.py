import logging
from typing import List, Dict, Any

logger = logging.getLogger("codementor.token_manager")

# In typical code/text mixes, 1 token is roughly 3 to 4 characters.
# We will use 3.5 characters per token as a safe, conservative approximation.
CHARS_PER_TOKEN = 3.5

def estimate_tokens(text: str) -> int:
    """Estimate token count based on character length."""
    if not text:
        return 0
    return int(len(text) / CHARS_PER_TOKEN)

def truncate_code_content(code: str, max_tokens: int = 15000) -> str:
    """
    Truncate code content to fit within a token limit.
    Preserves the top and bottom of the file, replacing the middle with a notice.
    """
    estimated = estimate_tokens(code)
    if estimated <= max_tokens:
        return code

    max_chars = int(max_tokens * CHARS_PER_TOKEN)
    keep_chars = max_chars - 100
    top_fraction = int(keep_chars * 0.6)  # Keep 60% from the start
    bottom_fraction = int(keep_chars * 0.4)  # Keep 40% from the end

    logger.warning(f"Truncating code file. Original size: {estimated} tokens. Target: {max_tokens} tokens.")
    
    truncated = (
        code[:top_fraction]
        + "\n\n// ... [Code truncated to preserve conversation context] ...\n\n"
        + code[-bottom_fraction:]
    )
    return truncated

def apply_sliding_window(
    messages: List[Dict[str, Any]], 
    max_tokens: int = 30000, 
    system_prompt: str = ""
) -> List[Dict[str, Any]]:
    """
    Truncates older messages from a multi-turn conversation history to keep the total
    estimated tokens under the max_tokens limit.
    Always preserves:
    - The system prompt tokens
    - The most recent user prompt
    - As many preceding messages as fit in the sliding window.
    """
    sys_tokens = estimate_tokens(system_prompt)
    if sys_tokens >= max_tokens:
        # If the system prompt itself is too large (rare), truncate it or raise error
        logger.error("System prompt exceeds max token limit")
        return [messages[-1]] if messages else []

    allowed_chat_tokens = max_tokens - sys_tokens
    accumulated_tokens = 0
    selected_messages = []

    # Iterate backwards from the most recent message to oldest
    for msg in reversed(messages):
        msg_content = msg.get("content", "")
        msg_tokens = estimate_tokens(msg_content)
        
        # Always include the last message (the new user request) even if it's large
        if len(selected_messages) == 0:
            accumulated_tokens += msg_tokens
            selected_messages.insert(0, msg)
            continue
            
        if accumulated_tokens + msg_tokens <= allowed_chat_tokens:
            accumulated_tokens += msg_tokens
            selected_messages.insert(0, msg)
        else:
            logger.info(f"Sliding window truncated older message. Saved {len(selected_messages)} of {len(messages)} messages.")
            break

    return selected_messages
