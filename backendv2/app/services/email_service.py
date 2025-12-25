"""
Email Service
=============

Single place for all outbound email sending.

Design goals:
- No hard dependency on real SMTP in development/tests
- Pluggable backends (console vs SMTP) via settings
- Async-friendly (non-blocking FastAPI handlers)
- Professional HTML templates for all email types
"""

from __future__ import annotations

import logging
from email.message import EmailMessage
from email.utils import formataddr
from typing import Optional, Protocol, TYPE_CHECKING
import asyncio
import smtplib

from app.config import settings
from app.services.email_templates import (
    invitation_email,
    welcome_email,
    password_reset_email,
    workspace_invitation_email,
    share_link_email,
    notification_email,
)

if TYPE_CHECKING:
    from app.models.invitation import Invitation
    from app.models.user import User

logger = logging.getLogger(__name__)


class EmailBackend(Protocol):
    """Protocol for email backends."""

    async def send(self, message: EmailMessage) -> None:  # pragma: no cover - protocol
        ...


class ConsoleEmailBackend:
    """
    Development/test backend.

    Simply prints email contents to stdout / logs.
    Never touches the network.
    """

    async def send(self, message: EmailMessage) -> None:
        print("\n" + "=" * 60)
        print("📧 [ConsoleEmailBackend] Outgoing email")
        print("-" * 60)
        print(f"To:      {message['To']}")
        print(f"From:    {message['From']}")
        print(f"Subject: {message['Subject']}")
        print("-" * 60)
        # Show plain text version for readability
        for part in message.walk():
            if part.get_content_type() == "text/plain":
                print(part.get_content())
                break
        print("=" * 60 + "\n")
        logger.info(f"📧 [Console] Email sent to {message['To']}: {message['Subject']}")


class SmtpEmailBackend:
    """
    Real SMTP backend using smtplib.

    Runs blocking I/O in a thread via asyncio.to_thread to avoid
    blocking the event loop.
    """

    def __init__(self) -> None:
        self.host = settings.SMTP_HOST
        self.port = settings.SMTP_PORT
        self.username = settings.SMTP_USERNAME or None
        self.password = settings.SMTP_PASSWORD or None
        self.use_tls = settings.SMTP_USE_TLS

    def _send_blocking(self, message: EmailMessage) -> None:
        """Blocking SMTP send, executed in thread pool."""
        server = None
        try:
            logger.info(f"📧 [SMTP] Connecting to {self.host}:{self.port}...")
            server = smtplib.SMTP(self.host, self.port, timeout=30)
            server.set_debuglevel(0)  # Set to 1 for debug output
            
            server.ehlo()
            
            if self.use_tls:
                server.starttls()
                server.ehlo()
            
            if self.username and self.password:
                logger.info(f"📧 [SMTP] Logging in as {self.username}...")
                server.login(self.username, self.password)
            
            logger.info(f"📧 [SMTP] Sending email to {message['To']}...")
            server.send_message(message)
            logger.info(f"📧 [SMTP] ✅ Email sent to {message['To']}: {message['Subject']}")
            
        except smtplib.SMTPAuthenticationError as e:
            logger.error(f"📧 [SMTP] ❌ Authentication failed: {e}")
            raise
        except smtplib.SMTPException as e:
            logger.error(f"📧 [SMTP] ❌ SMTP error: {e}")
            raise
        except Exception as e:
            logger.error(f"📧 [SMTP] ❌ Failed to send email to {message['To']}: {e}")
            raise
        finally:
            if server:
                try:
                    server.quit()
                except Exception:
                    pass  # Ignore quit errors

    async def send(self, message: EmailMessage) -> None:
        await asyncio.to_thread(self._send_blocking, message)


def _build_backend() -> EmailBackend:
    backend = (settings.EMAIL_BACKEND or "console").lower()
    if backend == "smtp":
        logger.info(f"📧 Email backend: SMTP ({settings.SMTP_HOST}:{settings.SMTP_PORT})")
        return SmtpEmailBackend()
    # Default: console (safe for dev/tests)
    logger.info("📧 Email backend: Console (emails logged, not sent)")
    return ConsoleEmailBackend()


_backend: EmailBackend | None = None


def get_email_backend() -> EmailBackend:
    global _backend
    if _backend is None:
        _backend = _build_backend()
    return _backend


class EmailService:
    """
    High-level email operations.
    
    All public methods are async and non-blocking.
    """

    def __init__(self, backend: EmailBackend) -> None:
        self.backend = backend

    def _build_message(
        self,
        to: str,
        subject: str,
        html_body: str,
        text_body: str | None = None,
    ) -> EmailMessage:
        """Build an email message with proper headers."""
        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = formataddr((settings.SMTP_FROM_NAME, settings.SMTP_FROM_EMAIL))
        msg["To"] = to

        # Plain text (fallback) + HTML alternative
        plain = text_body or html_body
        msg.set_content(plain)
        if html_body:
            msg.add_alternative(html_body, subtype="html")

        return msg

    async def send_email(
        self,
        to: str,
        subject: str,
        html_body: str,
        text_body: str | None = None,
    ) -> None:
        """Send a generic email."""
        msg = self._build_message(to, subject, html_body, text_body)
        await self.backend.send(msg)

    # =========================================================================
    # Document Invitation
    # =========================================================================

    async def send_invitation_email(
        self,
        invitation: "Invitation",
        inviter_name: str = "Someone",
        document_title: str = "Untitled Document",
    ) -> None:
        """
        Send a document invitation email.
        
        Args:
            invitation: The Invitation model instance
            inviter_name: Name of the person who sent the invite
            document_title: Title of the document being shared
        """
        # Build accept URL
        accept_base = getattr(settings, "APP_PUBLIC_URL", "").rstrip("/")
        if accept_base:
            accept_url = f"{accept_base}/invite/{invitation.token}"
        else:
            accept_url = f"http://localhost:5173/invite/{invitation.token}"

        html, text = invitation_email(
            inviter_name=inviter_name,
            document_title=document_title,
            role=invitation.role,
            accept_url=accept_url,
            message=invitation.message,
        )

        await self.send_email(
            to=invitation.email,
            subject=f"You've been invited to collaborate on \"{document_title}\"",
            html_body=html,
            text_body=text,
        )

    # =========================================================================
    # Welcome Email (Registration)
    # =========================================================================

    async def send_welcome_email(
        self,
        user: "User",
    ) -> None:
        """
        Send welcome email after user registration.
        
        Args:
            user: The newly registered User model instance
        """
        login_url = f"{settings.APP_PUBLIC_URL.rstrip('/')}/login"
        
        user_name = user.full_name or user.email.split("@")[0]
        
        html, text = welcome_email(
            user_name=user_name,
            login_url=login_url,
        )

        await self.send_email(
            to=user.email,
            subject="Welcome to MDReader! 🎉",
            html_body=html,
            text_body=text,
        )

    # =========================================================================
    # Password Reset
    # =========================================================================

    async def send_password_reset_email(
        self,
        email: str,
        user_name: str,
        reset_token: str,
        expires_in_minutes: int = 60,
    ) -> None:
        """
        Send password reset email.
        
        Args:
            email: User's email address
            user_name: User's display name
            reset_token: The password reset token
            expires_in_minutes: How long the token is valid
        """
        reset_url = f"{settings.APP_PUBLIC_URL.rstrip('/')}/reset-password?token={reset_token}"
        
        html, text = password_reset_email(
            user_name=user_name,
            reset_url=reset_url,
            expires_in_minutes=expires_in_minutes,
        )

        await self.send_email(
            to=email,
            subject="Reset your MDReader password",
            html_body=html,
            text_body=text,
        )

    # =========================================================================
    # Workspace Invitation
    # =========================================================================

    async def send_workspace_invitation_email(
        self,
        email: str,
        inviter_name: str,
        workspace_name: str,
        role: str,
        accept_token: str,
        message: Optional[str] = None,
    ) -> None:
        """
        Send workspace invitation email.
        
        Args:
            email: Invitee's email address
            inviter_name: Name of the person who sent the invite
            workspace_name: Name of the workspace
            role: Role being granted
            accept_token: Token to accept the invitation
            message: Optional personal message
        """
        accept_url = f"{settings.APP_PUBLIC_URL.rstrip('/')}/workspace-invite/{accept_token}"
        
        html, text = workspace_invitation_email(
            inviter_name=inviter_name,
            workspace_name=workspace_name,
            role=role,
            accept_url=accept_url,
            message=message,
        )

        await self.send_email(
            to=email,
            subject=f"You've been invited to join \"{workspace_name}\"",
            html_body=html,
            text_body=text,
        )

    # =========================================================================
    # Share Link
    # =========================================================================

    async def send_share_link_email(
        self,
        email: str,
        sender_name: str,
        document_title: str,
        share_url: str,
        expires_at: Optional[str] = None,
        has_password: bool = False,
        message: Optional[str] = None,
    ) -> None:
        """
        Send email with a share link.
        
        Args:
            email: Recipient's email address
            sender_name: Name of the person sharing
            document_title: Title of the document
            share_url: The share link URL
            expires_at: Optional human-readable expiry string
            has_password: Whether the link is password protected
            message: Optional personal message
        """
        html, text = share_link_email(
            sender_name=sender_name,
            document_title=document_title,
            share_url=share_url,
            expires_at=expires_at,
            has_password=has_password,
            message=message,
        )

        await self.send_email(
            to=email,
            subject=f"{sender_name} shared \"{document_title}\" with you",
            html_body=html,
            text_body=text,
        )

    # =========================================================================
    # Generic Notification
    # =========================================================================

    async def send_notification_email(
        self,
        email: str,
        title: str,
        body: str,
        action_text: Optional[str] = None,
        action_url: Optional[str] = None,
    ) -> None:
        """
        Send a generic notification email.
        
        Args:
            email: Recipient's email address
            title: Email title/heading
            body: Main content
            action_text: Optional button text
            action_url: Optional button URL
        """
        html, text = notification_email(
            title=title,
            body=body,
            action_text=action_text,
            action_url=action_url,
        )

        await self.send_email(
            to=email,
            subject=title,
            html_body=html,
            text_body=text,
        )


# Singleton instance used across the app
email_service = EmailService(get_email_backend())
