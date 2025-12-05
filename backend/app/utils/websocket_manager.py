"""
WebSocket Connection Manager
Handles WebSocket connections, broadcasting, and room management
"""

from typing import Dict, Set, Optional, List
from fastapi import WebSocket
import json
import uuid
import logging

logger = logging.getLogger(__name__)


class ConnectionManager:
    """
    Manages WebSocket connections and broadcasting
    
    Features:
    - Per-document rooms
    - Broadcasting to rooms
    - Presence tracking
    - Connection management
    """
    
    def __init__(self):
        # Active connections: {connection_id: WebSocket}
        self.active_connections: Dict[str, WebSocket] = {}
        
        # User connections: {user_id: Set[connection_id]}
        self.user_connections: Dict[str, Set[str]] = {}
        
        # Document rooms: {document_id: Set[connection_id]}
        self.document_rooms: Dict[str, Set[str]] = {}
        
        # Connection metadata: {connection_id: {user_id, document_id, etc}}
        self.connection_meta: Dict[str, dict] = {}
    
    async def connect(
        self,
        websocket: WebSocket,
        user_id: uuid.UUID,
        connection_id: Optional[str] = None
    ) -> str:
        """
        Accept new WebSocket connection
        
        Returns:
            connection_id
        """
        await websocket.accept()
        
        if not connection_id:
            connection_id = str(uuid.uuid4())
        
        user_id_str = str(user_id)
        
        # Store connection
        self.active_connections[connection_id] = websocket
        
        # Track user connections
        if user_id_str not in self.user_connections:
            self.user_connections[user_id_str] = set()
        self.user_connections[user_id_str].add(connection_id)
        
        # Store metadata
        self.connection_meta[connection_id] = {
            "user_id": user_id_str,
            "document_id": None
        }
        
        logger.info(f"WebSocket connected: {connection_id} (user: {user_id_str})")
        
        return connection_id
    
    def disconnect(self, connection_id: str):
        """Disconnect and cleanup"""
        if connection_id not in self.active_connections:
            return
        
        # Get metadata
        meta = self.connection_meta.get(connection_id, {})
        user_id = meta.get("user_id")
        document_id = meta.get("document_id")
        
        # Remove from active connections
        del self.active_connections[connection_id]
        
        # Remove from user connections
        if user_id and user_id in self.user_connections:
            self.user_connections[user_id].discard(connection_id)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]
        
        # Remove from document room
        if document_id and document_id in self.document_rooms:
            self.document_rooms[document_id].discard(connection_id)
            if not self.document_rooms[document_id]:
                del self.document_rooms[document_id]
        
        # Remove metadata
        if connection_id in self.connection_meta:
            del self.connection_meta[connection_id]
        
        logger.info(f"WebSocket disconnected: {connection_id}")
    
    async def join_document(self, connection_id: str, document_id: uuid.UUID):
        """Join a document room"""
        document_id_str = str(document_id)
        
        # Leave current document if any
        if connection_id in self.connection_meta:
            old_doc_id = self.connection_meta[connection_id].get("document_id")
            if old_doc_id and old_doc_id in self.document_rooms:
                self.document_rooms[old_doc_id].discard(connection_id)
        
        # Join new document room
        if document_id_str not in self.document_rooms:
            self.document_rooms[document_id_str] = set()
        self.document_rooms[document_id_str].add(connection_id)
        
        # Update metadata
        self.connection_meta[connection_id]["document_id"] = document_id_str
        
        logger.info(f"Connection {connection_id} joined document {document_id_str}")
        
        # Notify room
        await self.broadcast_to_document(
            document_id,
            {
                "type": "user_joined",
                "user_id": self.connection_meta[connection_id]["user_id"],
                "document_id": document_id_str
            },
            exclude_connection=connection_id
        )
    
    async def leave_document(self, connection_id: str):
        """Leave current document room"""
        if connection_id not in self.connection_meta:
            return
        
        document_id = self.connection_meta[connection_id].get("document_id")
        if not document_id:
            return
        
        # Remove from room
        if document_id in self.document_rooms:
            self.document_rooms[document_id].discard(connection_id)
        
        # Notify room
        await self.broadcast_to_document(
            uuid.UUID(document_id),
            {
                "type": "user_left",
                "user_id": self.connection_meta[connection_id]["user_id"],
                "document_id": document_id
            },
            exclude_connection=connection_id
        )
        
        # Clear from metadata
        self.connection_meta[connection_id]["document_id"] = None
        
        logger.info(f"Connection {connection_id} left document {document_id}")
    
    async def send_personal_message(self, connection_id: str, message: dict):
        """Send message to specific connection"""
        if connection_id in self.active_connections:
            websocket = self.active_connections[connection_id]
            await websocket.send_json(message)
    
    async def send_to_user(self, user_id: uuid.UUID, message: dict):
        """Send message to all connections of a user"""
        user_id_str = str(user_id)
        if user_id_str in self.user_connections:
            for connection_id in self.user_connections[user_id_str]:
                await self.send_personal_message(connection_id, message)
    
    async def broadcast_to_document(
        self,
        document_id: uuid.UUID,
        message: dict,
        exclude_connection: Optional[str] = None
    ):
        """Broadcast message to all users in document room"""
        document_id_str = str(document_id)
        
        if document_id_str not in self.document_rooms:
            return
        
        for connection_id in self.document_rooms[document_id_str]:
            if connection_id == exclude_connection:
                continue
            
            await self.send_personal_message(connection_id, message)
    
    def get_document_connections(self, document_id: uuid.UUID) -> List[str]:
        """Get all connections in a document room"""
        document_id_str = str(document_id)
        if document_id_str in self.document_rooms:
            return list(self.document_rooms[document_id_str])
        return []
    
    def get_document_users(self, document_id: uuid.UUID) -> Set[str]:
        """Get unique user IDs in document room"""
        connections = self.get_document_connections(document_id)
        users = set()
        for conn_id in connections:
            if conn_id in self.connection_meta:
                user_id = self.connection_meta[conn_id].get("user_id")
                if user_id:
                    users.add(user_id)
        return users
    
    def is_user_online(self, user_id: uuid.UUID) -> bool:
        """Check if user has any active connections"""
        return str(user_id) in self.user_connections


# Global WebSocket manager instance
manager = ConnectionManager()

