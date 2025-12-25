# Email Integration Guide

MDReader uses **SendGrid SMTP** for sending transactional emails.

## Quick Setup (5 minutes)

### 1. Configure Environment Variables

Add to your `backendv2/.env`:

```env
# Enable real SMTP
EMAIL_BACKEND=smtp

# SendGrid SMTP Settings
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USE_TLS=true
SMTP_USERNAME=apikey
SMTP_PASSWORD=SG.xxxxxxxxxxxxxxxx  # Your SendGrid API key

# Sender Identity
SMTP_FROM_EMAIL=no-reply@yourdomain.com
SMTP_FROM_NAME=MDReader

# Public URL for email links
APP_PUBLIC_URL=https://app.yourdomain.com
```

### 2. Verify Sender in SendGrid

1. Go to [SendGrid Dashboard](https://app.sendgrid.com/) → Settings → Sender Authentication
2. Add and verify your sender email (must match `SMTP_FROM_EMAIL`)
3. For production, verify your domain for better deliverability

### 3. Restart the Backend

```bash
cd backendv2
source venv/bin/activate
uvicorn app.main:app --reload
```

---

## Email Types

| Email Type | Trigger | Template |
|------------|---------|----------|
| **Document Invitation** | User invites someone to a document | `invitation_email()` |
| **Welcome** | User registers | `welcome_email()` |
| **Password Reset** | User requests password reset | `password_reset_email()` |
| **Workspace Invitation** | User invites someone to a workspace | `workspace_invitation_email()` |
| **Share Link** | User shares a doc link via email | `share_link_email()` |
| **Notification** | Generic notifications | `notification_email()` |

---

## Development Mode

By default, emails are **not sent** — they're printed to the console:

```env
EMAIL_BACKEND=console  # Default - prints to stdout
```

Console output example:
```
============================================================
📧 [ConsoleEmailBackend] Outgoing email
------------------------------------------------------------
To:      invitee@example.com
From:    MDReader <no-reply@mdreader.io>
Subject: You've been invited to collaborate on "My Document"
------------------------------------------------------------
You've been invited to collaborate...
============================================================
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    EmailService                         │
│  (app/services/email_service.py)                       │
├─────────────────────────────────────────────────────────┤
│  • send_invitation_email(invitation, inviter, title)    │
│  • send_welcome_email(user)                             │
│  • send_password_reset_email(email, token)              │
│  • send_workspace_invitation_email(...)                 │
│  • send_share_link_email(...)                           │
│  • send_notification_email(email, title, body)          │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  Email Backends                         │
├─────────────────────────────────────────────────────────┤
│  ConsoleEmailBackend    │  SmtpEmailBackend             │
│  (prints to stdout)     │  (real SMTP via smtplib)      │
│  EMAIL_BACKEND=console  │  EMAIL_BACKEND=smtp           │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  Email Templates                        │
│  (app/services/email_templates.py)                     │
├─────────────────────────────────────────────────────────┤
│  • base_template(content)                               │
│  • button_html(text, url, color)                        │
│  • invitation_email(inviter, doc, role, url)            │
│  • welcome_email(name, login_url)                       │
│  • password_reset_email(name, reset_url, expires)       │
│  • workspace_invitation_email(...)                      │
│  • share_link_email(...)                                │
│  • notification_email(title, body, action)              │
└─────────────────────────────────────────────────────────┘
```

---

## Code Examples

### Send a Custom Notification

```python
from app.services.email_service import email_service

await email_service.send_notification_email(
    email="user@example.com",
    title="Your export is ready",
    body="Your document has been exported successfully.",
    action_text="Download",
    action_url="https://app.mdreader.io/downloads/123",
)
```

### Send a Share Link

```python
await email_service.send_share_link_email(
    email="recipient@example.com",
    sender_name="John Doe",
    document_title="Project Roadmap",
    share_url="https://app.mdreader.io/s/abc123",
    expires_at="January 15, 2025",
    has_password=True,
    message="Here's the roadmap we discussed!",
)
```

---

## Configuration Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `EMAIL_BACKEND` | `console` | `console` or `smtp` |
| `SMTP_HOST` | `smtp.sendgrid.net` | SMTP server hostname |
| `SMTP_PORT` | `587` | SMTP port (587 for TLS) |
| `SMTP_USE_TLS` | `true` | Enable STARTTLS |
| `SMTP_USERNAME` | `apikey` | SendGrid username (always `apikey`) |
| `SMTP_PASSWORD` | - | Your SendGrid API key |
| `SMTP_FROM_EMAIL` | - | Sender email (must be verified) |
| `SMTP_FROM_NAME` | `MDReader` | Sender display name |
| `APP_PUBLIC_URL` | `http://localhost:5173` | Base URL for links in emails |

---

## Troubleshooting

### Emails not sending?

1. Check `EMAIL_BACKEND` is set to `smtp`
2. Check backend logs for errors:
   ```bash
   tail -f backendv2/logs/app.log | grep "📧"
   ```
3. Verify your SendGrid API key has "Mail Send" permissions

### Emails going to spam?

1. Verify your sender domain in SendGrid
2. Add SPF, DKIM, and DMARC DNS records
3. Use a consistent "From" address

### Timeout errors?

1. Check your firewall allows outbound connections to port 587
2. Increase timeout in `SmtpEmailBackend` if needed

---

## Testing

### Unit Test (No Network)

```python
@pytest.mark.asyncio
async def test_email_service_console():
    from app.services.email_service import EmailService, ConsoleEmailBackend
    
    service = EmailService(ConsoleEmailBackend())
    
    # Should not raise
    await service.send_notification_email(
        email="test@example.com",
        title="Test",
        body="Hello world",
    )
```

### Integration Test (Requires SendGrid)

```bash
# Set environment
export EMAIL_BACKEND=smtp
export SMTP_PASSWORD=SG.xxx

# Run test
python -c "
import asyncio
from app.services.email_service import email_service

asyncio.run(email_service.send_notification_email(
    'your-email@example.com',
    'Test from MDReader',
    'If you see this, email is working!'
))
"
```

---

## Security Considerations

- **Never commit** `SMTP_PASSWORD` to git
- Use environment variables or secrets manager
- SendGrid API keys should be scoped to "Mail Send" only
- Monitor SendGrid dashboard for unusual activity

---

## Future Improvements

- [ ] Add email queue (Redis-based) for retry logic
- [ ] Add email tracking (opens, clicks)
- [ ] Add unsubscribe handling
- [ ] Add rate limiting per user
- [ ] Add HTML preview endpoint in dev mode

