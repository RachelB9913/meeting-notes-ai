from __future__ import annotations

from typing import List, Optional, Literal
from pydantic import BaseModel, Field


Priority = Literal["low", "medium", "high"]


class ActionItem(BaseModel):
    task: str = Field(..., min_length=1, description="Action item description")
    owner: Optional[str] = Field(None, description="Person responsible, if mentioned")
    due_date: Optional[str] = Field(None, description="Due date as mentioned in transcript, if any")
    priority: Optional[Priority] = Field(None, description="Best-effort priority if implied")


class MeetingSummary(BaseModel):
    meeting_summary: str = Field(..., min_length=1, description="Short meeting overview")
    participants: List[str] = Field(default_factory=list)
    decisions: List[str] = Field(default_factory=list)
    action_items: List[ActionItem] = Field(default_factory=list)
