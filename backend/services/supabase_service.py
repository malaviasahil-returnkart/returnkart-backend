"""
RETURNKART.IN — SUPABASE SERVICE
Central DB layer. All Supabase reads/writes go through here.

PERFORMANCE:
  - Client is cached at module level (one connection, not one per call)
  - bulk_upsert_orders() inserts all orders in a single DB round trip
  - get_existing_order_ids() lets callers skip AI on already-known orders
"""
from datetime import datetime, date, timezone, timedelta
from typing import Optional
from supabase import create_client, Client

from backend.config import SUPABASE_URL, SUPABASE_SERVICE_KEY
from backend.models.order import OrderCreate

IST = timezone(timedelta(hours=5, minutes=30))

# ── Cached client — created once, reused forever ─────────────────────────
_client: Optional[Client] = None

def get_client() -> Client:
    global _client
    if _client is None:
        _client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    return _client


# ─────────────────────────────────────────────
# GMAIL TOKENS
# ─────────────────────────────────────────────

async def save_gmail_token(
    user_id: str,
    access_token: str,
    refresh_token: Optional[str],
    token_expiry: Optional[datetime],
    scope: str,
) -> dict:
    client = get_client()
    data = {
        "user_id": user_id,
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_expiry": token_expiry.isoformat() if token_expiry else None,
        "scope": scope,
        "updated_at": datetime.now(IST).isoformat(),
    }
    result = client.table("gmail_tokens").upsert(data, on_conflict="user_id").execute()
    return result.data[0] if result.data else {}


async def get_gmail_token(user_id: str) -> Optional[dict]:
    client = get_client()
    result = (
        client.table("gmail_tokens")
        .select("*")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    return result.data[0] if result.data else None


async def delete_gmail_token(user_id: str) -> None:
    get_client().table("gmail_tokens").delete().eq("user_id", user_id).execute()


# ─────────────────────────────────────────────
# EMAIL TOKENS (Yahoo, Outlook, Rediff, iCloud…)
# ─────────────────────────────────────────────

async def save_email_token(
    user_id: str,
    provider: str,
    access_token: str,
    refresh_token: Optional[str],
    token_expiry: Optional[datetime],
    email_address: str,
    imap_host: Optional[str] = None,
    provider_label: Optional[str] = None,
) -> dict:
    client = get_client()
    data = {
        "user_id": user_id,
        "provider": provider,
        "provider_label": provider_label or provider.title(),
        "email_address": email_address,
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_expiry": token_expiry.isoformat() if token_expiry else None,
        "imap_host": imap_host,
        "updated_at": datetime.now(IST).isoformat(),
    }
    result = (
        client.table("email_tokens")
        .upsert(data, on_conflict="user_id,provider")
        .execute()
    )
    return result.data[0] if result.data else {}


async def get_email_token(user_id: str, provider: str) -> Optional[dict]:
    result = (
        get_client().table("email_tokens")
        .select("*")
        .eq("user_id", user_id)
        .eq("provider", provider)
        .limit(1)
        .execute()
    )
    return result.data[0] if result.data else None


async def get_all_email_tokens(user_id: str) -> list:
    result = (
        get_client().table("email_tokens")
        .select("provider, provider_label, email_address, last_synced_at")
        .eq("user_id", user_id)
        .execute()
    )
    return result.data or []


async def delete_email_token(user_id: str, provider: str) -> None:
    get_client().table("email_tokens").delete().eq("user_id", user_id).eq("provider", provider).execute()


# ─────────────────────────────────────────────
# ORDERS
# ─────────────────────────────────────────────

def _order_to_dict(order: OrderCreate) -> dict:
    """Convert an OrderCreate to a Supabase-safe dict."""
    data = order.model_dump()
    for key, val in data.items():
        if isinstance(val, (date, datetime)):
            data[key] = val.isoformat()
    return data


async def upsert_order(order: OrderCreate) -> dict:
    """Single order upsert. Prefer bulk_upsert_orders() for batches."""
    client = get_client()
    result = (
        client.table("orders")
        .upsert(_order_to_dict(order), on_conflict="user_id,order_id")
        .execute()
    )
    return result.data[0] if result.data else {}


async def bulk_upsert_orders(orders: list[OrderCreate]) -> int:
    """
    Insert/update a batch of orders in ONE Supabase round trip.
    Returns the number of rows upserted.
    This is the key performance win — replaces N individual upserts.
    """
    if not orders:
        return 0
    client = get_client()
    rows = [_order_to_dict(o) for o in orders]
    result = (
        client.table("orders")
        .upsert(rows, on_conflict="user_id,order_id")
        .execute()
    )
    return len(result.data) if result.data else 0


async def get_existing_order_ids(user_id: str) -> set[str]:
    """
    Return the set of order_ids already stored for this user.
    Used to skip Gemini extraction on emails we've already processed.
    """
    result = (
        get_client().table("orders")
        .select("order_id")
        .eq("user_id", user_id)
        .execute()
    )
    return {row["order_id"] for row in (result.data or [])}


async def get_orders_by_user(user_id: str, status: Optional[str] = None) -> list:
    client = get_client()
    query = (
        client.table("orders")
        .select("*")
        .eq("user_id", user_id)
        .order("return_deadline", desc=False)
    )
    if status:
        query = query.eq("status", status)
    return query.execute().data or []


async def update_order_status(order_id: str, user_id: str, status: str) -> dict:
    result = (
        get_client().table("orders")
        .update({"status": status})
        .eq("id", order_id)
        .eq("user_id", user_id)
        .execute()
    )
    return result.data[0] if result.data else {}


async def get_expiring_soon(user_id: str, days: int = 3) -> list:
    today  = date.today()
    cutoff = date.today().replace(day=today.day + days)
    result = (
        get_client().table("orders")
        .select("*")
        .eq("user_id", user_id)
        .eq("status", "active")
        .lte("return_deadline", cutoff.isoformat())
        .gte("return_deadline", today.isoformat())
        .execute()
    )
    return result.data or []


# ─────────────────────────────────────────────
# CONSENT (DPDP ACT 2023)
# ─────────────────────────────────────────────

async def log_consent(
    user_id: str,
    purpose_id: str,
    consented: bool,
    consent_text: str,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
) -> dict:
    data = {
        "user_id": user_id,
        "purpose_id": purpose_id,
        "consented": consented,
        "consent_text": consent_text,
        "ip_address": ip_address,
        "user_agent": user_agent,
    }
    result = get_client().table("user_consents").insert(data).execute()
    return result.data[0] if result.data else {}
