import os
from openai import OpenAI, RateLimitError

def transcribe_with_whisper(file_path: str) -> str:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is missing. Set it in backend/.env")

    client = OpenAI(api_key=api_key)

    try:
        with open(file_path, "rb") as f:
            result = client.audio.transcriptions.create(
                model="whisper-1",
                file=f,
            )
        return result.text
    
    except RateLimitError as e:
        raise RuntimeError(
            "OpenAI API quota exceeded. Please check billing configuration."
        ) from e
