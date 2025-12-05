"""
WebSocket Router
Real-time collaboration and presence tracking
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from sqlalchemy.orm import Session
import json
import logging
import uuid

from app.database import get_db
from app.utils.websocket_manager import manager
from app.services.presence import PresenceService
from app.utils.security import verify_token

logger = logging.getLogger(__name__)

router = APIRouter(tags=["WebSocket"])


async def get_user_from_token(token: str, db: Session) -> dict:
    """Authenticate user from token"""
    try:
        payload = verify_token(token, token_type="access")
        if not payload:
            return None
        user_id = payload.get("sub")
        if not user_id:
            return None
        return {"user_id": uuid.UUID(user_id)}
    except Exception as e:
        logger.error(f"Token decode error: {e}")
        return None


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...),
    db: Session = Depends(get_db)
):
    """
    Main WebSocket endpoint for real-time collaboration
    
    Query params:
        token: JWT access token
    
    Message types:
        - join_document: Join document room
        - leave_document: Leave document room
        - cursor_move: Update cursor position
        - selection_change: Update selection
        - editing_start: Start editing
        - editing_stop: Stop editing
        - heartbeat: Keep connection alive
    """
    connection_id = None
    user_id = None
    
    try:
        # Authenticate
        user_data = await get_user_from_token(token, db)
        if not user_data:
            await websocket.close(code=1008, reason="Unauthorized")
            return
        
        user_id = user_data["user_id"]
        
        # Accept connection
        connection_id = await manager.connect(websocket, user_id)
        
        # Create session in database
        session = PresenceService.create_session(
            db, user_id, connection_id, device_type="web"
        )
        
        # Send welcome message
        await websocket.send_json({
            "type": "connected",
            "connection_id": connection_id,
            "user_id": str(user_id)
        })
        
        # Message loop
        while True:
            # Receive message
            data = await websocket.receive_json()
            message_type = data.get("type")
            
            # Update session activity
            PresenceService.update_session_activity(db, connection_id)
            
            # Handle different message types
            if message_type == "join_document":
                document_id_str = data.get("document_id")
                if document_id_str:
                    document_id = uuid.UUID(document_id_str)
                    
                    # Join document in manager
                    await manager.join_document(connection_id, document_id)
                    
                    # Create presence in database
                    PresenceService.join_document(db, document_id, user_id, session.id)
                    
                    # Get all users in document
                    presence_list = PresenceService.get_document_presence(db, document_id)
                    
                    # Send presence list to user
                    await websocket.send_json({
                        "type": "presence_list",
                        "document_id": document_id_str,
                        "users": [p.to_response() for p in presence_list]
                    })
            
            elif message_type == "leave_document":
                document_id_str = data.get("document_id")
                if document_id_str:
                    document_id = uuid.UUID(document_id_str)
                    
                    # Leave document
                    await manager.leave_document(connection_id)
                    PresenceService.leave_document(db, document_id, user_id)
            
            elif message_type == "cursor_move":
                document_id_str = data.get("document_id")
                cursor = data.get("cursor", {})
                
                if document_id_str and cursor:
                    document_id = uuid.UUID(document_id_str)
                    line = cursor.get("line")
                    column = cursor.get("column")
                    
                    if line is not None and column is not None:
                        # Update cursor in database
                        PresenceService.update_cursor(db, document_id, user_id, line, column)
                        
                        # Broadcast to document room
                        await manager.broadcast_to_document(
                            document_id,
                            {
                                "type": "cursor_move",
                                "user_id": str(user_id),
                                "cursor": cursor
                            },
                            exclude_connection=connection_id
                        )
            
            elif message_type == "selection_change":
                document_id_str = data.get("document_id")
                selection = data.get("selection")
                
                if document_id_str and selection:
                    document_id = uuid.UUID(document_id_str)
                    start = selection.get("start", {})
                    end = selection.get("end", {})
                    
                    if start and end:
                        PresenceService.update_selection(
                            db, document_id, user_id,
                            start.get("line"), start.get("column"),
                            end.get("line"), end.get("column")
                        )
                        
                        # Broadcast
                        await manager.broadcast_to_document(
                            document_id,
                            {
                                "type": "selection_change",
                                "user_id": str(user_id),
                                "selection": selection
                            },
                            exclude_connection=connection_id
                        )
            
            elif message_type == "editing_start":
                document_id_str = data.get("document_id")
                if document_id_str:
                    document_id = uuid.UUID(document_id_str)
                    PresenceService.set_editing_status(db, document_id, user_id, True)
                    
                    await manager.broadcast_to_document(
                        document_id,
                        {
                            "type": "editing_start",
                            "user_id": str(user_id)
                        },
                        exclude_connection=connection_id
                    )
            
            elif message_type == "editing_stop":
                document_id_str = data.get("document_id")
                if document_id_str:
                    document_id = uuid.UUID(document_id_str)
                    PresenceService.set_editing_status(db, document_id, user_id, False)
                    
                    await manager.broadcast_to_document(
                        document_id,
                        {
                            "type": "editing_stop",
                            "user_id": str(user_id)
                        },
                        exclude_connection=connection_id
                    )
            
            elif message_type == "heartbeat":
                # Just acknowledge
                await websocket.send_json({"type": "heartbeat_ack"})
    
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected: {connection_id}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}", exc_info=True)
    finally:
        # Cleanup
        if connection_id:
            manager.disconnect(connection_id)
            
            if user_id:
                PresenceService.deactivate_session(db, connection_id)
        
        db.close()


@router.get("/api/v1/presence/document/{document_id}")
async def get_document_presence(
    document_id: str,
    db: Session = Depends(get_db)
):
    """Get all active users in document"""
    try:
        doc_uuid = uuid.UUID(document_id)
        presence_list = PresenceService.get_document_presence(db, doc_uuid)
        
        return {
            "document_id": document_id,
            "users": [p.to_response() for p in presence_list],
            "total": len(presence_list)
        }
    except ValueError:
        return {"error": "Invalid document ID"}, 400

