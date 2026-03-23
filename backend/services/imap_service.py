"""
RETURNKART.IN — IMAP EMAIL SERVICE

Covers Yahoo Mail, Rediffmail, iCloud Mail, Zoho, and any standard IMAP provider.
Uses Python's built-in imaplib — no extra packages needed.

IMPORTANT — App Passwords:
  Yahoo:    security.yahoo.com → Manage app passwords
  iCloud:   appleid.apple.com  → App-Specific Passwords
  Rediff:   No app password — uses regular password (Rediff allows IMAP directly)
  Zoho:     mail.zoho.in → Settings → IMAP Access → Generate app password

User flow:
  1. User enters their email + app password in the ReturnKart app
  2. We call POST /api/email/imap/connect to validate + store credentials
  3. On sync, we IMAP-search for ecommerce order emails
  4. Each email body is sent to Gemini for extraction → saved to Supabase

All credentials are stored encrypted in Supabase (service key + RLS).
"""
import imaplib
import email
import email.header
import ssl
from datetime import datetime, timezone, timedelta
from typing import Optional

from backend.services.supabase_service import get_email_token, upsert_order
from backend.models.order import OrderCreate

IST = timezone(timedelta(hours=5, minutes=30))

# ─────────────────────────────────────────────
# PROVIDER REGISTRY
# Add new providers here — imap_host and port only.
# ─────────────────────────────────────────────
IMAPCONFIG = {
    "yahoo":    {"imap_host": "imap.mail.yahoo.com",        "port": 993},
    "ymail":    {"imap_host": "imap.mail.yahoo.com",        "port": 993},
    "rediff":   {"imap_host": "imap.rediffmail.com",        "port": 993},
    "rediffmail":{"imap_host": "imap.rediffmail.com",       "port": 993},
    "icloud":   {"imap_host": "imap.mail.me.com",           "port": 993},
    "me":       {"imap_host": "imap.mail.me.com",           "port": 993},
    "zoho":     {"imap_host": "imap.zoho.in",               "port": 993},
    "aol":      {"imap_host": "imap.aol.com",               "port": 993},
    "outlook":  {"imap_host": "imap-mail.outlook.com",      "port": 993},  # IMAP fallback
    "hotmail":  {"imap_host": "imap-mail.outlook.com",      "port": 993},
    "live":     {"imap_host": "imap-mail.outlook.com",      "port": 993},
}


def _detect_provider(email_address: str) -> str:
    """Auto-detect provider slug from email domain."""
    domain = email_address.split("@")[-1].lower()
    slug = domain.split(".")[0]  # e.g. 'yahoo' from 'yahoo.com'
    return slug


def _get_imap_config(provider_or_email: str) -> dict:
    """
    Returns {imap_host, port} for a given provider slug or email address.
    Falls back to a custom host if provider unknown (user can override).
    """
    # Try as slug first, then auto-detect from email
    slug = provider_or_email if "@" not in provider_or_email else _detect_provider(provider_or_email)
    return IMAPCONFIG.get(slug, {"imap_host": None, "port": 993})


def validate_imap_credentials(imap_host: str, email_address: str, app_password: str) -> bool:
    """
    Test that IMAP credentials are valid by attempting a login.
    Returns True on success, raises ValueError with a user-friendly message on failure.
    """
    context = ssl.create_default_context()
    try:
        with imaplib.IMAP4_SSL(imap_host, 993, ssl_context=context) as imap:
            imap.login(email_address, app_password)
            return True
    except imaplib.IMAP4.error as e:
        raise ValueError(f"Login failed — check your app password: {e}")
    except Exception as e:
        raise ValueError(f"Could not connect to {imap_host}: {e}")


def _decode_header_value(raw_value: str) -> str:
    """Decode MIME-encoded email headers (handles UTF-8, Base64, etc.)"""
    parts = email.header.decode_header(raw_value)
    decoded = []
    for part, charset in parts:
        if isinstance(part, bytes):
            decoded.append(part.decode(charset or "utf-8", errors="ignore"))
        else:
            decoded.append(str(part))
    return " ".join(decoded)


def _extract_body(msg: email.message.Message) -> str:
    """Extract plain text body from an email.message.Message object."""
    body = ""
    if msg.is_multipart():
        for part in msg.walk():
            content_type = part.get_content_type()
            disposition = str(part.get("Content-Disposition", ""))
            if content_type == "text/plain" and "attachment" not in disposition:
                charset = part.get_content_charset() or "utf-8"
                body = part.get_payload(decode=True).decode(charset, errors="ignore")
                break
        if not body:
            # Fallback to HTML if no plain text part found
            for part in msg.walk():
                if part.get_content_type() == "text/html":
                    charset = part.get_content_charset() or "utf-8"
                    body = part.get_payload(decode=True).decode(charset, errors="ignore")
                    break
    else:
        charset = msg.get_content_charset() or "utf-8"
        body = msg.get_payload(decode=True).decode(charset, errors="ignore")
    return body[:8000]  # Trim to avoid Gemini token limits


# IMAP search terms — same ecommerce senders, adapted for IMAP syntax
IMAP_SEARCH_QUERIES = [
    '(OR FROM "amazon.in" FROM "amazon") SUBJECT "order"',
    '(OR FROM "flipkart.com" FROM "flipkart") SUBJECT "order"',
    'FROM "myntra.com" SUBJECT "order"',
    'FROM "meesho.com" SUBJECT "order"',
    'FROM "ajio.com" SUBJECT "order"',
    'FROM "nykaa.com" SUBJECT "order"',
    'FROM "jiomart.com" SUBJECT "order"',
    '(OR FROM "tatacliq" FROM "croma") SUBJECT "order"',
]


async def sync_imap_orders(
    user_id: str,
    imap_host: str,
    email_address: str,
    app_password: str,
    max_emails: int = 50,
) -> dict:
    """
    Main IMAP sync function.
    Connects to the mail server, searches for ecommerce emails,
    extracts order data via Gemini, and saves to Supabase.
    """
    # Lazy import to avoid circular dependency
    from backend.services.gemini_service import extract_order_from_email

    context = ssl.create_default_context()
    synced = 0
    new_orders = 0
    errors = 0

    try:
        with imaplib.IMAP4_SSL(imap_host, 993, ssl_context=context) as imap:
            imap.login(email_address, app_password)
            imap.select("INBOX")

            all_uids = set()

            for query in IMAP_SEARCH_QUERIES:
                try:
                    _, data = imap.uid("search", None, query)
                    uids = data[0].split() if data and data[0] else []
                    all_uids.update(uids[-10:])  # Last 10 per query to stay within max_emails
                except Exception:
                    continue  # Some servers reject certain SEARCH syntax — skip gracefully

            for uid in list(all_uids)[:max_emails]:
                try:
                    _, msg_data = imap.uid("fetch", uid, "(RFC822)")
                    raw_email = msg_data[0][1]
                    msg = email.message_from_bytes(raw_email)

                    subject = _decode_header_value(msg.get("Subject", ""))
                    sender  = _decode_header_value(msg.get("From", ""))
                    date_str = msg.get("Date", "")
                    body = _extract_body(msg)

                    # Detect platform from sender domain
                    platform = "amazon"
                    sender_lower = sender.lower()
                    for brand in ["flipkart", "myntra", "meesho", "ajio", "nykaa", "jiomart"]:
                        if brand in sender_lower:
                            platform = brand
                            break

                    email_text = f"Subject: {subject}\nFrom: {sender}\nDate: {date_str}\n\n{body}"
                    extracted = await extract_order_from_email(email_text, platform)

                    if extracted and extracted.order_id:
                        order = OrderCreate(
                            user_id=user_id,
                            order_id=extracted.order_id,
                            brand=extracted.brand or platform.title(),
                            item_name=extracted.item_name or "Unknown item",
                            price=extracted.total_amount or 0.0,
                            order_date=datetime.strptime(extracted.order_date, "%Y-%m-%d").date()
                                if extracted.order_date else datetime.now(IST).date(),
                            category=extracted.category,
                            courier_partner=extracted.courier_partner,
                            delivery_pincode=extracted.delivery_pincode,
                            purpose_id="return_tracking",
                            consent_timestamp=datetime.now(IST),
                        )
                        await upsert_order(order)
                        new_orders += 1

                    synced += 1

                except Exception as e:
                    print(f"[IMAP] Error processing email UID {uid}: {e}")
                    errors += 1

    except imaplib.IMAP4.error as e:
        return {"error": f"IMAP login failed: {e}", "synced": 0, "new_orders": 0}
    except Exception as e:
        return {"error": f"IMAP sync error: {e}", "synced": 0, "new_orders": 0}

    return {"synced": synced, "new_orders": new_orders, "errors": errors}
