import logging
import uuid
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from fastapi.responses import StreamingResponse
from io import BytesIO
from datetime import datetime, timezone
from time import time

from app.config import UPLOAD_DIR, ALLOWED_EXTENSIONS
from app.schemas.meeting_summary import MeetingSummary
from app.services.whisper_service import transcribe_with_whisper
from app.services.openai_summary_service import summarize_transcript_with_openai
from app.services.claude_summary_service import summarize_transcript_with_claude
from app.services.word_export_service import build_docx_from_summary, WordExportMetadata

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/process")

def process_audio(
    file: UploadFile = File(...),
    llm_provider: str = Query("claude", pattern="^(claude|openai)$"),
    output: str = Query("json", pattern="^(json|docx)$"),
):
    start_time = time()
    logger.info("Process started | file=%s | llm=%s | output=%s",
                file.filename, llm_provider, output)
    
    try:
        if not file.filename:
            raise HTTPException(status_code=400, detail="Missing filename")
        ext = Path(file.filename).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")

        logger.info("Saving uploaded file")
        saved_name = f"{uuid.uuid4().hex}{ext}"
        saved_path = UPLOAD_DIR / saved_name
        with saved_path.open("wb") as f:
            f.write(file.file.read())
        logger.info("Saved file as %s", saved_name)

        logger.info("Starting transcription")
        transcript = transcribe_with_whisper(str(saved_path))
        logger.info("Transcription completed (%d chars)", len(transcript))

        logger.info("Starting summarization using %s", llm_provider)
        if llm_provider == "openai":
            summary_data = summarize_transcript_with_openai(transcript)
        else:
            summary_data = summarize_transcript_with_claude(transcript)

        summary = MeetingSummary.model_validate(summary_data)
        logger.info("Summarization completed")

        if output == "docx":
            logger.info("Generating Word document")
            meta = WordExportMetadata(
                original_filename=file.filename,
                llm_provider=llm_provider,
                generated_at=datetime.now(timezone.utc),
            )
            docx_bytes = build_docx_from_summary(summary=summary, transcript=transcript, meta=meta)
            headers = {"Content-Disposition": 'attachment; filename="meeting-notes.docx"'}
            
            logger.info("Word document generated")
            elapsed = round(time() - start_time, 2)
            logger.info("Process completed successfully in %ss", elapsed)
            return StreamingResponse(
                BytesIO(docx_bytes),
                media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                headers=headers,
            )
            
        elapsed = round(time() - start_time, 2)
        logger.info("Process completed successfully in %ss", elapsed)
        return {"transcript": transcript, "summary": summary.model_dump()}

    except RuntimeError as e:
        logger.error("Process failed: %s", str(e))
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.exception("Unexpected error during process")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")
