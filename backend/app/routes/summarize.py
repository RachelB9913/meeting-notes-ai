from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.schemas.meeting_summary import MeetingSummary
from app.services.openai_summary_service import summarize_transcript_with_openai
from app.services.claude_summary_service import summarize_transcript_with_claude

router = APIRouter()


class SummarizeRequest(BaseModel):
    transcript: str

@router.post("/summarize", response_model=MeetingSummary)
def summarize(req: SummarizeRequest):
    try:
        # 2 options for LLMs - choose one and comment the other
        # data = summarize_transcript_with_openai(req.transcript)
        data = summarize_transcript_with_claude(req.transcript)
        return MeetingSummary.model_validate(data)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
