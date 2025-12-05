"""
Presence Service
Business logic for presence tracking and real-time collaboration
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime, timedelta
import uuid

from app.models.presence import UserSession, DocumentPresence
from app.models.document import Document
from app.services.document import DocumentService


class PresenceService:
    """Service for presence and session management"""
    
    @staticmethod
    def create_session(
        db: Session,
        user_id: uuid.UUID,
        connection_id: str,
        user_agent: Optional[str] = None,
        ip_address: Optional[str] = None,
        device_type: Optional[str] = "web"
    ) -> UserSession:
        """Create new user session"""
        session = UserSession(
            user_id=user_id,
            connection_id=connection_id,
            user_agent=user_agent,
            ip_address=ip_address,
            device_type=device_type,
            is_active=True
        )
        
        db.add(session)
        db.commit()
        db.refresh(session)
        
        return session
    
    @staticmethod
    def get_session_by_connection(
        db: Session,
        connection_id: str
    ) -> Optional[UserSession]:
        """Get session by connection ID"""
        return db.query(UserSession).filter(
            UserSession.connection_id == connection_id,
            UserSession.is_active == True
        ).first()
    
    @staticmethod
    def update_session_activity(
        db: Session,
        connection_id: str
    ) -> Optional[UserSession]:
        """Update session last seen timestamp"""
        session = PresenceService.get_session_by_connection(db, connection_id)
        
        if session:
            session.update_last_seen()
            db.commit()
            db.refresh(session)
        
        return session
    
    @staticmethod
    def deactivate_session(
        db: Session,
        connection_id: str
    ) -> bool:
        """Deactivate session"""
        session = PresenceService.get_session_by_connection(db, connection_id)
        
        if not session:
            return False
        
        session.deactivate()
        
        # Also deactivate all document presence for this session
        db.query(DocumentPresence).filter(
            DocumentPresence.session_id == session.id,
            DocumentPresence.is_active == True
        ).update({"is_active": False})
        
        db.commit()
        
        return True
    
    @staticmethod
    def join_document(
        db: Session,
        document_id: uuid.UUID,
        user_id: uuid.UUID,
        session_id: uuid.UUID
    ) -> DocumentPresence:
        """Join document (create or update presence)"""
        # Check if already present
        presence = db.query(DocumentPresence).filter(
            DocumentPresence.document_id == document_id,
            DocumentPresence.user_id == user_id
        ).first()
        
        if presence:
            # Reactivate existing presence
            presence.is_active = True
            presence.session_id = session_id
            presence.update_activity()
        else:
            # Create new presence
            presence = DocumentPresence(
                document_id=document_id,
                user_id=user_id,
                session_id=session_id,
                is_active=True
            )
            db.add(presence)
        
        db.commit()
        db.refresh(presence)
        
        return presence
    
    @staticmethod
    def leave_document(
        db: Session,
        document_id: uuid.UUID,
        user_id: uuid.UUID
    ) -> bool:
        """Leave document (deactivate presence)"""
        presence = db.query(DocumentPresence).filter(
            DocumentPresence.document_id == document_id,
            DocumentPresence.user_id == user_id,
            DocumentPresence.is_active == True
        ).first()
        
        if not presence:
            return False
        
        presence.is_active = False
        presence.update_activity()
        
        db.commit()
        
        return True
    
    @staticmethod
    def update_cursor(
        db: Session,
        document_id: uuid.UUID,
        user_id: uuid.UUID,
        line: int,
        column: int
    ) -> Optional[DocumentPresence]:
        """Update cursor position"""
        presence = db.query(DocumentPresence).filter(
            DocumentPresence.document_id == document_id,
            DocumentPresence.user_id == user_id,
            DocumentPresence.is_active == True
        ).first()
        
        if not presence:
            return None
        
        presence.update_cursor(line, column)
        db.commit()
        db.refresh(presence)
        
        return presence
    
    @staticmethod
    def update_selection(
        db: Session,
        document_id: uuid.UUID,
        user_id: uuid.UUID,
        start_line: int,
        start_column: int,
        end_line: int,
        end_column: int
    ) -> Optional[DocumentPresence]:
        """Update selection range"""
        presence = db.query(DocumentPresence).filter(
            DocumentPresence.document_id == document_id,
            DocumentPresence.user_id == user_id,
            DocumentPresence.is_active == True
        ).first()
        
        if not presence:
            return None
        
        presence.update_selection(start_line, start_column, end_line, end_column)
        db.commit()
        db.refresh(presence)
        
        return presence
    
    @staticmethod
    def clear_selection(
        db: Session,
        document_id: uuid.UUID,
        user_id: uuid.UUID
    ) -> Optional[DocumentPresence]:
        """Clear selection"""
        presence = db.query(DocumentPresence).filter(
            DocumentPresence.document_id == document_id,
            DocumentPresence.user_id == user_id,
            DocumentPresence.is_active == True
        ).first()
        
        if not presence:
            return None
        
        presence.clear_selection()
        db.commit()
        db.refresh(presence)
        
        return presence
    
    @staticmethod
    def set_editing_status(
        db: Session,
        document_id: uuid.UUID,
        user_id: uuid.UUID,
        is_editing: bool
    ) -> Optional[DocumentPresence]:
        """Set editing status"""
        presence = db.query(DocumentPresence).filter(
            DocumentPresence.document_id == document_id,
            DocumentPresence.user_id == user_id,
            DocumentPresence.is_active == True
        ).first()
        
        if not presence:
            return None
        
        presence.is_editing = is_editing
        presence.update_activity()
        db.commit()
        db.refresh(presence)
        
        return presence
    
    @staticmethod
    def get_document_presence(
        db: Session,
        document_id: uuid.UUID
    ) -> List[DocumentPresence]:
        """Get all active users in document"""
        return db.query(DocumentPresence).filter(
            DocumentPresence.document_id == document_id,
            DocumentPresence.is_active == True
        ).all()
    
    @staticmethod
    def get_user_active_sessions(
        db: Session,
        user_id: uuid.UUID
    ) -> List[UserSession]:
        """Get all active sessions for user"""
        return db.query(UserSession).filter(
            UserSession.user_id == user_id,
            UserSession.is_active == True
        ).all()
    
    @staticmethod
    def cleanup_stale_sessions(
        db: Session,
        stale_minutes: int = 60
    ) -> int:
        """Cleanup sessions inactive for more than stale_minutes"""
        threshold = datetime.utcnow() - timedelta(minutes=stale_minutes)
        
        stale_sessions = db.query(UserSession).filter(
            UserSession.is_active == True,
            UserSession.last_seen_at < threshold
        ).all()
        
        count = 0
        for session in stale_sessions:
            session.deactivate()
            count += 1
        
        # Also cleanup associated presence
        session_ids = [s.id for s in stale_sessions]
        if session_ids:
            db.query(DocumentPresence).filter(
                DocumentPresence.session_id.in_(session_ids),
                DocumentPresence.is_active == True
            ).update({"is_active": False}, synchronize_session=False)
        
        db.commit()
        
        return count

