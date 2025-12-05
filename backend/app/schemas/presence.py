"""
Presence Schemas
Pydantic models for presence and WebSocket events
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class CursorPosition(BaseModel):
    """Cursor position in document"""
    line: int
    column: int


class SelectionRange(BaseModel):
    """Selection range in document"""
    start: CursorPosition
    end: CursorPosition


class PresenceUpdate(BaseModel):
    """Update presence information"""
    document_id: str
    is_editing: Optional[bool] = None
    cursor: Optional[CursorPosition] = None
    selection: Optional[SelectionRange] = None


class PresenceResponse(BaseModel):
    """Presence response"""
    id: str
    document_id: str
    user_id: str
    is_active: bool
    is_editing: bool
    last_activity_at: datetime
    cursor: Optional[CursorPosition]
    selection: Optional[SelectionRange]
    
    class Config:
        from_attributes = True


class UserPresence(BaseModel):
    """User presence in document"""
    user_id: str
    username: Optional[str]
    full_name: Optional[str]
    is_editing: bool
    cursor: Optional[CursorPosition]
    selection: Optional[SelectionRange]
    last_activity_at: datetime


class DocumentPresenceList(BaseModel):
    """List of users present in document"""
    document_id: str
    users: List[UserPresence]
    total: int


class SessionResponse(BaseModel):
    """Session response"""
    id: str
    user_id: str
    connection_id: str
    is_active: bool
    last_seen_at: datetime
    device_type: Optional[str]
    current_workspace_id: Optional[str]
    current_document_id: Optional[str]
    
    class Config:
        from_attributes = True


class WSMessage(BaseModel):
    """WebSocket message format"""
    type: str
    data: dict


class WSPresenceEvent(BaseModel):
    """WebSocket presence event"""
    type: str  # "user_joined", "user_left", "cursor_move", "selection_change", "editing_start", "editing_stop"
    user_id: str
    document_id: str
    cursor: Optional[CursorPosition] = None
    selection: Optional[SelectionRange] = None
    timestamp: datetime = datetime.utcnow()

