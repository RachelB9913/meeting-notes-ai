import json
import os
from typing import Any, Dict

from anthropic import Anthropic
from anthropic import (
    RateLimitError,
    AuthenticationError,
    APIConnectionError,
    BadRequestError,
    InternalServerError,
)

from app.prompts.meeting_summary_prompt import SYSTEM_PROMPT_BASIC as SYSTEM_PROMPT


DEFAULT_MODEL = os.getenv("CLAUDE_MODEL", "claude-sonnet-4-5-20250929")


def summarize_transcript_with_claude(transcript: str) -> Dict[str, Any]:
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise RuntimeError("ANTHROPIC_API_KEY is missing. Set it in backend/.env")

    client = Anthropic(api_key=api_key)

    tools = [
        {
            "name": "record_meeting_summary",
            "description": "Return a structured meeting summary extracted from the transcript.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "meeting_summary": {"type": "string"},
                    "participants": {
                        "type": "array",
                        "items": {"type": "string"},
                    },
                    "decisions": {
                        "type": "array",
                        "items": {"type": "string"},
                    },
                    "action_items": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "properties": {
                                "task": {"type": "string"},
                                "owner": {"type": ["string", "null"]},
                                "due_date": {"type": ["string", "null"]},
                                "priority": {
                                    "type": ["string", "null"],
                                    "enum": ["low", "medium", "high", None],
                                },
                            },
                            "required": ["task"],
                            "additionalProperties": False,
                        },
                    },
                },
                "required": ["meeting_summary", "participants", "decisions", "action_items"],
                "additionalProperties": False,
            },
        }
    ]

    try:
        message = client.messages.create(
            model=DEFAULT_MODEL,
            max_tokens=900,
            system=SYSTEM_PROMPT,
            tools=tools,
            tool_choice={"type": "tool", "name": "record_meeting_summary"},
            messages=[
                {"role": "user", "content": f"Transcript:\n{transcript}"},
            ],
            extra_headers={"anthropic-beta": "structured-outputs-2025-11-13"},
        )

        tool_block = next(
            (block for block in message.content if block.type == "tool_use"),
            None,
        )

        if not tool_block:
            raise RuntimeError("Claude did not return structured tool output.")

        return tool_block.input
        

    except RateLimitError as e:
        raise RuntimeError("Claude API rate limit/quota exceeded. Please check billing configuration.") from e
    except AuthenticationError as e:
        raise RuntimeError("Claude authentication failed. Please verify the API key.") from e
    except APIConnectionError as e:
        raise RuntimeError("Failed to connect to Claude. Please check your network connection.") from e
    except (BadRequestError, InternalServerError) as e:
        raise RuntimeError("Claude request failed. Please try again or adjust the prompt/input.") from e
    except json.JSONDecodeError as e:
        raise RuntimeError("Model output was not valid JSON. Please refine the prompt or add retries.") from e
