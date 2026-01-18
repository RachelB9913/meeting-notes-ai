import uuid
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, HTTPException

from app.config import UPLOAD_DIR, ALLOWED_EXTENSIONS
from app.services.whisper_service import transcribe_with_whisper

router = APIRouter()

@router.post("/transcribe")
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

    saved_name = f"{uuid.uuid4().hex}{ext}"  # to avoid collisions and prevent relying on user-provided file names. The original filename is kept only for reference.
    saved_path = UPLOAD_DIR / saved_name

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty file")
    
    saved_path.write_bytes(content)

    try:
        transcript = transcribe_with_whisper(str(saved_path))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    return{
        "original_filename": file.filename,
        "saved_filename": saved_name,
        "transcript": transcript,
    }
