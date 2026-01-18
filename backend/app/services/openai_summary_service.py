import json
import os
from typing import Any, Dict

from openai import OpenAI
from openai import RateLimitError, AuthenticationError, APIConnectionError

from app.prompts.meeting_summary_prompt import SYSTEM_PROMPT_BASIC as SYSTEM_PROMPT


def summarize_transcript_with_openai(transcript: str) -> Dict[str, Any]:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is missing. Set it in backend/.env")

    client = OpenAI(api_key=api_key)

    try:
        # We ask the model to output raw JSON text that we will parse.
        response = client.responses.create(
            model="gpt-4.1-mini",  # will try a few more optional models
            input=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Transcript:\n{transcript}"},
            ],
        )

        text = response.output_text
        data = json.loads(text)
        return data

    except RateLimitError as e:
        raise RuntimeError("OpenAI API quota exceeded. Please check billing configuration.") from e
    except AuthenticationError as e:
        raise RuntimeError("OpenAI authentication failed. Please verify the API key.") from e
    except APIConnectionError as e:
        raise RuntimeError("Failed to connect to OpenAI. Please check your network connection.") from e
    except json.JSONDecodeError as e:
        raise RuntimeError("Model output was not valid JSON. Please refine the prompt or add retries.") from e
