from fastapi import FastAPI, UploadFile, File, HTTPException
from pathlib import Path
import uuid
from pydantic import BaseModel

from app.schemas.meeting_summary import MeetingSummary
from app.services.openai_summary_service import summarize_transcript_with_openai
from app.services.claude_summary_service import summarize_transcript_with_claude


from dotenv import load_dotenv
load_dotenv()

app = FastAPI(title="Meeting Notes AI")

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok = True)

ALLOWED_EXTENSIONS = {".mp3", ".wav", ".m4a"}

class SummarizeRequest(BaseModel):
    transcript: str


@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):

    # Validate file name and extension
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing filename")
    
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {ext}. Allowed: {sorted(ALLOWED_EXTENSIONS)}",
        )

    saved_name = f"{uuid.uuid4().hex}{ext}"
    saved_path = UPLOAD_DIR / saved_name

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty file")
    
    saved_path.write_bytes(content)

    # Placeholder transcription for now
    transcript = "TRANSCRIPTION_PLACEHOLDER"

    return{
        "original_filename": file.filename,
        "saved_filename": saved_name,
        "transcript": transcript,
    }


@app.post("/summarize", response_model=MeetingSummary)
def summarize(req: SummarizeRequest):
    try:
        # 2 options for LLMs - choose one and comment the other
        # data = summarize_transcript_with_openai(req.transcript)
        data = summarize_transcript_with_claude(req.transcript)
        return MeetingSummary.model_validate(data)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
