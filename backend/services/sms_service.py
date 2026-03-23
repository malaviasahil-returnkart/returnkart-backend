"""
RETURNKART.IN — SMS EXTRACTION SERVICE

Called by the ReturnKart Android app after it reads SMS messages
using READ_SMS permission.

Two scan modes:
  1. BULK SCAN  — on first connect, scan last N days of inbox
  2. LIVE SCAN  — on each new SMS received (BroadcastReceiver)

DATE FIX: uses date_utils.resolve_order_date() with the Android
timestamp as fallback — never silently defaults to today.

iOS: not possible via app. iOS users should forward order SMS
to ReturnKart's WhatsApp Business number instead.
"""
import json
import re
from datetime import datetime, timezone, timedelta
from typing import Optional

import google.generativeai as genai

from backend.config import GEMINI_API_KEY
from backend.models.order import OrderCreate
from backend.services.supabase_service import upsert_order
from backend.services.date_utils import parse_epoch_ms, resolve_order_date

genai.configure(api_key=GEMINI_API_KEY)
_model = genai.GenerativeModel("gemini-1.5-flash")

IST = timezone(timedelta(hours=5, minutes=30))

ECOMMERCE_SENDER_IDS = {
    "AMAZON", "AMZNIN", "AMAZIN", "AZ-AMAZON",
    "FLPKRT", "FLIPKRT", "FK-INFO", "FKINFO",
    "MYNTRA", "MN-MYNT",
    "MEESHO", "ME-MESO",
    "AJIO", "AJ-AJIO",
    "NYKAA", "NY-NYKA",
    "JIOMART", "JM-MART",
    "TACLIQ", "CROMA",
    "SNAPDL", "SNPDEL",
    "DELHVR", "BLUDRM", "DTDC", "ECOMEX",
    "EKART", "XPRSBS", "SHADOW", "DELHVY",
}

ECOMMERCE_KEYWORDS = [
    "order", "delivered", "dispatch", "shipment", "return",
    "refund", "out for delivery", "expected delivery",
    "return window", "exchange", "replacement", "courier",
    "track", "ofd",
]


def is_ecommerce_sms(sender: str, text: str) -> bool:
    sender_upper = sender.upper().strip()
    if sender_upper in ECOMMERCE_SENDER_IDS:
        return True
    if any(brand in sender_upper for brand in ECOMMERCE_SENDER_IDS):
        return True
    text_lower = text.lower()
    hits = sum(1 for kw in ECOMMERCE_KEYWORDS if kw in text_lower)
    return hits >= 2


def _build_sms_prompt(sms_text: str, sender: str) -> str:
    return f"""You are an AI assistant for ReturnKart.in, an Indian e-commerce return tracker.

Extract order information from the SMS message below.
SMS messages are SHORT — extract whatever is present, leave the rest null.
Return ONLY valid JSON. No markdown, no explanation, no code fences.

Sender ID: {sender}

Extract this JSON structure:
{{
  "order_id": "order ID string or null",
  "brand": "Amazon India | Flipkart | Myntra | Meesho | Ajio | Nykaa | JioMart | Snapdeal | TataCliq or null",
  "item_name": "product name if mentioned or null",
  "total_amount": number or null,
  "currency": "INR",
  "order_date": "YYYY-MM-DD or null",
  "delivery_date": "YYYY-MM-DD or null",
  "return_deadline": "YYYY-MM-DD or null",
  "category": "Fashion & Apparel | Electronics | Home & Kitchen | Books | Default or null",
  "courier_partner": "courier name or null",
  "tracking_number": "tracking/AWB number or null",
  "message_type": "order_placed | shipped | out_for_delivery | delivered | return_reminder | refund_processed | other",
  "confidence": 0.0 to 1.0
}}

Rules:
- Infer brand from sender ID if not in message text (e.g. FLPKRT = Flipkart)
- Dates MUST be YYYY-MM-DD format
- total_amount is a number only, no rupee symbol
- message_type is critical — always determine it
- confidence: 0.9 if order_id found, 0.6 if only brand+type, 0.3 if very uncertain
- NEVER invent data. null is better than a guess.

SMS:
{sms_text}

JSON:"""


async def extract_order_from_sms(
    sms_text: str,
    sender: str,
    user_id: str,
    received_at: Optional[str] = None,
    received_at_epoch_ms: Optional[int] = None,
) -> Optional[dict]:
    if not sms_text or not sms_text.strip():
        return None

    # Parse the SMS timestamp as date fallback
    sms_received_date = parse_epoch_ms(received_at_epoch_ms)
    if not sms_received_date and received_at:
        try:
            sms_received_date = datetime.fromisoformat(received_at).date()
        except Exception:
            pass

    try:
        prompt = _build_sms_prompt(sms_text, sender)
        response = _model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                temperature=0.1,
                max_output_tokens=512,
            ),
        )
        raw = response.text.strip()
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)

        data = json.loads(raw)

        if data.get("confidence", 0) < 0.3:
            print(f"[SMS] Low confidence ({data.get('confidence')}) for sender={sender} — skipping")
            return None

        trackable_types = {
            "order_placed", "shipped", "out_for_delivery",
            "delivered", "return_reminder", "refund_processed",
        }
        if data.get("message_type", "other") not in trackable_types:
            return None

        order = OrderCreate(
            user_id=user_id,
            order_id=data.get("order_id") or f"sms_{sender}_{hash(sms_text) % 10**8}",
            brand=data.get("brand") or sender,
            item_name=data.get("item_name") or "Unknown item",
            price=data.get("total_amount") or 0.0,
            # FIX: use SMS timestamp as fallback, never silently today
            order_date=resolve_order_date(
                gemini_date=data.get("order_date"),
                fallback_date=sms_received_date,
                context=f"sms {sender}",
            ),
            category=data.get("category") or "Default",
            courier_partner=data.get("courier_partner"),
            delivery_pincode=None,
            purpose_id="return_tracking",
            consent_timestamp=datetime.now(IST),
            source="sms",
        )
        saved = await upsert_order(order)
        return saved

    except json.JSONDecodeError as e:
        print(f"[SMS] Gemini JSON parse error: {e}")
        return None
    except Exception as e:
        print(f"[SMS] Extraction error: {e}")
        return None


async def process_sms_batch(messages: list[dict], user_id: str) -> dict:
    total = len(messages)
    filtered = 0
    extracted = 0
    errors = 0

    for msg in messages:
        sender   = msg.get("sender", "UNKNOWN")
        text     = msg.get("text", "")
        received_at = msg.get("received_at")

        if not is_ecommerce_sms(sender, text):
            filtered += 1
            continue

        try:
            result = await extract_order_from_sms(
                sms_text=text,
                sender=sender,
                user_id=user_id,
                received_at=received_at,
            )
            if result:
                extracted += 1
        except Exception as e:
            print(f"[SMS batch] Error on sender={sender}: {e}")
            errors += 1

    return {
        "total": total,
        "filtered_out": filtered,
        "extracted": extracted,
        "errors": errors,
        "processed": total - filtered,
    }
