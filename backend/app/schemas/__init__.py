"""
Schemas Package
Exports all Pydantic schemas for validation
"""

from app.schemas.user import (
    UserBase,
    UserCreate,
    UserUpdate,
    UserUpdatePassword,
    UserResponse,
    UserLogin,
    Token,
    TokenRefresh,
    TokenData,
)

from app.schemas.workspace import (
    WorkspaceRoleEnum,
    WorkspaceBase,
    WorkspaceCreate,
    WorkspaceUpdate,
    WorkspaceResponse,
    WorkspaceDetailResponse,
    WorkspaceListResponse,
    WorkspaceMemberCreate,
    WorkspaceMemberUpdate,
    WorkspaceMemberResponse,
    WorkspaceInvitation,
    WorkspaceStats,
)

from app.schemas.document import (
    DocumentBase,
    DocumentCreate,
    DocumentUpdate,
    DocumentResponse,
    DocumentDetailResponse,
    DocumentListResponse,
    DocumentVersionResponse,
    DocumentVersionListResponse,
    DocumentStats,
    DocumentSearchQuery,
)

from app.schemas.file import (
    FileUploadResponse,
    FileResponse,
    FileListResponse,
    FileStats,
    FileQuery,
)

from app.schemas.presence import (
    CursorPosition,
    SelectionRange,
    PresenceUpdate,
    PresenceResponse,
    UserPresence,
    DocumentPresenceList,
    SessionResponse,
    WSMessage,
    WSPresenceEvent,
)

__all__ = [
    # User schemas
    "UserBase",
    "UserCreate",
    "UserUpdate",
    "UserUpdatePassword",
    "UserResponse",
    "UserLogin",
    "Token",
    "TokenRefresh",
    "TokenData",
    # Workspace schemas
    "WorkspaceRoleEnum",
    "WorkspaceBase",
    "WorkspaceCreate",
    "WorkspaceUpdate",
    "WorkspaceResponse",
    "WorkspaceDetailResponse",
    "WorkspaceListResponse",
    "WorkspaceMemberCreate",
    "WorkspaceMemberUpdate",
    "WorkspaceMemberResponse",
    "WorkspaceInvitation",
    "WorkspaceStats",
    # Document schemas
    "DocumentBase",
    "DocumentCreate",
    "DocumentUpdate",
    "DocumentResponse",
    "DocumentDetailResponse",
    "DocumentListResponse",
    "DocumentVersionResponse",
    "DocumentVersionListResponse",
    "DocumentStats",
    "DocumentSearchQuery",
    # File schemas
    "FileUploadResponse",
    "FileResponse",
    "FileListResponse",
    "FileStats",
    "FileQuery",
    # Presence schemas
    "CursorPosition",
    "SelectionRange",
    "PresenceUpdate",
    "PresenceResponse",
    "UserPresence",
    "DocumentPresenceList",
    "SessionResponse",
    "WSMessage",
    "WSPresenceEvent",
]

