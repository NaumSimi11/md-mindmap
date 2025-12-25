"""
Email Templates
================

Professional HTML email templates for MDReader.

Design: Clean, modern, responsive email templates that work
across all email clients (Gmail, Outlook, Apple Mail, etc.)
"""

from typing import Optional


# ============================================================================
# Base Template
# ============================================================================

def base_template(content: str, footer_text: str = "") -> str:
    """
    Base HTML email template with consistent styling.
    
    - Responsive design
    - Dark mode support
    - Works in all major email clients
    """
    return f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <title>MDReader</title>
    <!--[if mso]>
    <style type="text/css">
        table {{border-collapse: collapse;}}
        .button {{padding: 12px 24px !important;}}
    </style>
    <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f4f5;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 560px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 32px 40px 24px 40px; border-bottom: 1px solid #e4e4e7;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td>
                                        <span style="font-size: 24px; font-weight: 700; color: #18181b; letter-spacing: -0.5px;">
                                            📝 MDReader
                                        </span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 32px 40px;">
                            {content}
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px 40px 32px 40px; border-top: 1px solid #e4e4e7;">
                            <p style="margin: 0; font-size: 13px; color: #71717a; line-height: 1.6;">
                                {footer_text if footer_text else "This email was sent by MDReader. If you didn't expect this, you can safely ignore it."}
                            </p>
                        </td>
                    </tr>
                </table>
                
                <!-- Bottom text -->
                <p style="margin: 24px 0 0 0; font-size: 12px; color: #a1a1aa;">
                    © MDReader · Collaborative Markdown Editor
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
"""


def button_html(text: str, url: str, color: str = "#2563eb") -> str:
    """Generate a styled button for emails."""
    return f"""
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0;">
        <tr>
            <td style="border-radius: 8px; background-color: {color};">
                <a href="{url}" target="_blank" rel="noopener noreferrer" 
                   style="display: inline-block; padding: 14px 28px; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px;">
                    {text}
                </a>
            </td>
        </tr>
    </table>
    """


# ============================================================================
# Document Invitation Email
# ============================================================================

def invitation_email(
    inviter_name: str,
    document_title: str,
    role: str,
    accept_url: str,
    message: Optional[str] = None
) -> tuple[str, str]:
    """
    Generate invitation email content.
    
    Returns: (html_body, text_body)
    """
    role_display = role.title()
    
    message_html = ""
    message_text = ""
    if message:
        message_html = f"""
        <div style="margin: 20px 0; padding: 16px; background-color: #f4f4f5; border-radius: 8px; border-left: 4px solid #2563eb;">
            <p style="margin: 0; font-size: 14px; color: #3f3f46; font-style: italic;">
                "{message}"
            </p>
        </div>
        """
        message_text = f'\nMessage from {inviter_name}:\n"{message}"\n'
    
    content = f"""
    <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 600; color: #18181b; line-height: 1.4;">
        You've been invited to collaborate
    </h1>
    
    <p style="margin: 0 0 20px 0; font-size: 15px; color: #3f3f46; line-height: 1.6;">
        <strong>{inviter_name}</strong> has invited you to collaborate on:
    </p>
    
    <div style="margin: 20px 0; padding: 20px; background-color: #fafafa; border-radius: 8px; border: 1px solid #e4e4e7;">
        <p style="margin: 0 0 8px 0; font-size: 17px; font-weight: 600; color: #18181b;">
            📄 {document_title}
        </p>
        <p style="margin: 0; font-size: 14px; color: #71717a;">
            Your role: <span style="color: #2563eb; font-weight: 500;">{role_display}</span>
        </p>
    </div>
    
    {message_html}
    
    {button_html("Accept Invitation", accept_url)}
    
    <p style="margin: 20px 0 0 0; font-size: 13px; color: #71717a;">
        Or copy this link: <a href="{accept_url}" style="color: #2563eb; word-break: break-all;">{accept_url}</a>
    </p>
    """
    
    html = base_template(content)
    
    text = f"""You've been invited to collaborate

{inviter_name} has invited you to collaborate on "{document_title}".

Your role: {role_display}
{message_text}
To accept the invitation, open this link:
{accept_url}

If you didn't expect this email, you can safely ignore it.

---
MDReader · Collaborative Markdown Editor
"""
    
    return html, text


# ============================================================================
# Welcome Email (after registration)
# ============================================================================

def welcome_email(
    user_name: str,
    login_url: str
) -> tuple[str, str]:
    """
    Generate welcome email for new users.
    
    Returns: (html_body, text_body)
    """
    content = f"""
    <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 600; color: #18181b; line-height: 1.4;">
        Welcome to MDReader! 🎉
    </h1>
    
    <p style="margin: 0 0 20px 0; font-size: 15px; color: #3f3f46; line-height: 1.6;">
        Hi <strong>{user_name}</strong>,
    </p>
    
    <p style="margin: 0 0 20px 0; font-size: 15px; color: #3f3f46; line-height: 1.6;">
        Your account has been created successfully. You're all set to start creating and collaborating on documents.
    </p>
    
    <div style="margin: 24px 0; padding: 20px; background-color: #f0fdf4; border-radius: 8px; border: 1px solid #bbf7d0;">
        <p style="margin: 0 0 12px 0; font-size: 15px; font-weight: 600; color: #166534;">
            What you can do:
        </p>
        <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #3f3f46; line-height: 1.8;">
            <li>Create beautiful markdown documents</li>
            <li>Collaborate in real-time with your team</li>
            <li>Organize with workspaces and folders</li>
            <li>Work offline and sync when ready</li>
        </ul>
    </div>
    
    {button_html("Get Started", login_url, "#16a34a")}
    """
    
    html = base_template(content)
    
    text = f"""Welcome to MDReader! 🎉

Hi {user_name},

Your account has been created successfully. You're all set to start creating and collaborating on documents.

What you can do:
- Create beautiful markdown documents
- Collaborate in real-time with your team
- Organize with workspaces and folders
- Work offline and sync when ready

Get started: {login_url}

---
MDReader · Collaborative Markdown Editor
"""
    
    return html, text


# ============================================================================
# Password Reset Email
# ============================================================================

def password_reset_email(
    user_name: str,
    reset_url: str,
    expires_in_minutes: int = 60
) -> tuple[str, str]:
    """
    Generate password reset email.
    
    Returns: (html_body, text_body)
    """
    content = f"""
    <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 600; color: #18181b; line-height: 1.4;">
        Reset your password
    </h1>
    
    <p style="margin: 0 0 20px 0; font-size: 15px; color: #3f3f46; line-height: 1.6;">
        Hi <strong>{user_name}</strong>,
    </p>
    
    <p style="margin: 0 0 20px 0; font-size: 15px; color: #3f3f46; line-height: 1.6;">
        We received a request to reset your password. Click the button below to choose a new password:
    </p>
    
    {button_html("Reset Password", reset_url, "#dc2626")}
    
    <div style="margin: 24px 0; padding: 16px; background-color: #fef2f2; border-radius: 8px; border: 1px solid #fecaca;">
        <p style="margin: 0; font-size: 13px; color: #991b1b;">
            ⏱️ This link expires in {expires_in_minutes} minutes.
        </p>
    </div>
    
    <p style="margin: 20px 0 0 0; font-size: 13px; color: #71717a;">
        If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
    </p>
    """
    
    html = base_template(content, "This is an automated security email. Never share this link with anyone.")
    
    text = f"""Reset your password

Hi {user_name},

We received a request to reset your password. Use this link to choose a new one:

{reset_url}

⚠️ This link expires in {expires_in_minutes} minutes.

If you didn't request a password reset, you can safely ignore this email.

---
MDReader · Collaborative Markdown Editor
"""
    
    return html, text


# ============================================================================
# Workspace Invitation Email
# ============================================================================

def workspace_invitation_email(
    inviter_name: str,
    workspace_name: str,
    role: str,
    accept_url: str,
    message: Optional[str] = None
) -> tuple[str, str]:
    """
    Generate workspace invitation email.
    
    Returns: (html_body, text_body)
    """
    role_display = role.replace("_", " ").title()
    
    message_html = ""
    message_text = ""
    if message:
        message_html = f"""
        <div style="margin: 20px 0; padding: 16px; background-color: #f4f4f5; border-radius: 8px; border-left: 4px solid #8b5cf6;">
            <p style="margin: 0; font-size: 14px; color: #3f3f46; font-style: italic;">
                "{message}"
            </p>
        </div>
        """
        message_text = f'\nMessage from {inviter_name}:\n"{message}"\n'
    
    content = f"""
    <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 600; color: #18181b; line-height: 1.4;">
        You've been invited to a workspace
    </h1>
    
    <p style="margin: 0 0 20px 0; font-size: 15px; color: #3f3f46; line-height: 1.6;">
        <strong>{inviter_name}</strong> has invited you to join:
    </p>
    
    <div style="margin: 20px 0; padding: 20px; background-color: #faf5ff; border-radius: 8px; border: 1px solid #e9d5ff;">
        <p style="margin: 0 0 8px 0; font-size: 17px; font-weight: 600; color: #18181b;">
            📁 {workspace_name}
        </p>
        <p style="margin: 0; font-size: 14px; color: #71717a;">
            Your role: <span style="color: #8b5cf6; font-weight: 500;">{role_display}</span>
        </p>
    </div>
    
    {message_html}
    
    {button_html("Join Workspace", accept_url, "#8b5cf6")}
    
    <p style="margin: 20px 0 0 0; font-size: 13px; color: #71717a;">
        Or copy this link: <a href="{accept_url}" style="color: #8b5cf6; word-break: break-all;">{accept_url}</a>
    </p>
    """
    
    html = base_template(content)
    
    text = f"""You've been invited to a workspace

{inviter_name} has invited you to join "{workspace_name}".

Your role: {role_display}
{message_text}
To accept the invitation, open this link:
{accept_url}

If you didn't expect this email, you can safely ignore it.

---
MDReader · Collaborative Markdown Editor
"""
    
    return html, text


# ============================================================================
# Share Link Email (when someone shares a doc link)
# ============================================================================

def share_link_email(
    sender_name: str,
    document_title: str,
    share_url: str,
    expires_at: Optional[str] = None,
    has_password: bool = False,
    message: Optional[str] = None
) -> tuple[str, str]:
    """
    Generate share link email.
    
    Returns: (html_body, text_body)
    """
    message_html = ""
    message_text = ""
    if message:
        message_html = f"""
        <div style="margin: 20px 0; padding: 16px; background-color: #f4f4f5; border-radius: 8px; border-left: 4px solid #f59e0b;">
            <p style="margin: 0; font-size: 14px; color: #3f3f46; font-style: italic;">
                "{message}"
            </p>
        </div>
        """
        message_text = f'\nMessage from {sender_name}:\n"{message}"\n'
    
    info_items = []
    if expires_at:
        info_items.append(f"⏱️ Expires: {expires_at}")
    if has_password:
        info_items.append("🔒 Password protected")
    
    info_html = ""
    info_text = ""
    if info_items:
        info_html = f"""
        <p style="margin: 16px 0 0 0; font-size: 13px; color: #71717a;">
            {" · ".join(info_items)}
        </p>
        """
        info_text = "\n" + "\n".join(info_items) + "\n"
    
    content = f"""
    <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 600; color: #18181b; line-height: 1.4;">
        A document was shared with you
    </h1>
    
    <p style="margin: 0 0 20px 0; font-size: 15px; color: #3f3f46; line-height: 1.6;">
        <strong>{sender_name}</strong> shared a document with you:
    </p>
    
    <div style="margin: 20px 0; padding: 20px; background-color: #fffbeb; border-radius: 8px; border: 1px solid #fde68a;">
        <p style="margin: 0; font-size: 17px; font-weight: 600; color: #18181b;">
            📄 {document_title}
        </p>
        {info_html}
    </div>
    
    {message_html}
    
    {button_html("View Document", share_url, "#f59e0b")}
    """
    
    html = base_template(content)
    
    text = f"""A document was shared with you

{sender_name} shared "{document_title}" with you.
{info_text}{message_text}
View the document: {share_url}

---
MDReader · Collaborative Markdown Editor
"""
    
    return html, text


# ============================================================================
# Notification Email (generic)
# ============================================================================

def notification_email(
    title: str,
    body: str,
    action_text: Optional[str] = None,
    action_url: Optional[str] = None
) -> tuple[str, str]:
    """
    Generate a generic notification email.
    
    Returns: (html_body, text_body)
    """
    button = ""
    if action_text and action_url:
        button = button_html(action_text, action_url)
    
    # Convert newlines to <br> for HTML
    body_html = body.replace("\n", "<br>")
    
    content = f"""
    <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 600; color: #18181b; line-height: 1.4;">
        {title}
    </h1>
    
    <p style="margin: 0 0 20px 0; font-size: 15px; color: #3f3f46; line-height: 1.6;">
        {body_html}
    </p>
    
    {button}
    """
    
    html = base_template(content)
    
    text_action = f"\n{action_text}: {action_url}" if action_text and action_url else ""
    text = f"""{title}

{body}
{text_action}

---
MDReader · Collaborative Markdown Editor
"""
    
    return html, text

