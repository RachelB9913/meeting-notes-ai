from datetime import datetime, timezone
from io import BytesIO
from typing import Optional

from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse

from app.schemas.meeting_summary import MeetingSummary
from app.services.word_export_service import build_docx_from_summary, WordExportMetadata

"""
this route handles exporting meeting summaries to Word documents.
It accepts a MeetingSummary object and optional metadata, generates a .docx file,
and returns it as a downloadable response.
"""

router = APIRouter(prefix="/export", tags=["export"])

@router.post("/docx")
def export_docx(
    summary: MeetingSummary,
    original_filename: Optional[str] = Query(default=None),
    llm_provider: Optional[str] = Query(default=None),
):
    meta = WordExportMetadata(
        original_filename=original_filename,
        llm_provider=llm_provider,
        generated_at=datetime.now(timezone.utc),
    )

    docx_bytes = build_docx_from_summary(summary=summary, transcript=None, meta=meta)

    headers = {"Content-Disposition": 'attachment; filename="meeting-notes.docx"'}
    return StreamingResponse(
        BytesIO(docx_bytes),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers=headers,
    )
