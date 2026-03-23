"""
RETURNKART.IN — WHATSAPP EXTRACTION SERVICE

Two ingestion channels:
  1. Android NotificationListenerService  → short notification text
  2. Meta WhatsApp Business API webhook   → forwarded message text (iOS + Android)

Both call extract_order_from_whatsapp() which runs Gemini extraction
then upserts to Supabase — identical pipeline to gmail_service.
"""
import json
import re
from typing import Optional

import google.generativeai as genai

from backend.config import GEMINI_API_KEY
from backend.models.order import AIOrderContext
from backend.services.supabase_service import upsert_order

genai.configure(api_key=GEMINI_API_KEY)
_model = genai.GenerativeModel("gemini-1.5-flash")

# Known ecommerce WhatsApp sender names / number patterns
# Used to filter noise from the notification stream
ECOMMERCE_SENDERS = {
    "amazon",
    "amazon india",
    "flipkart",
    "myntra",
    "meesho",
    "ajio",
    "nykaa",
    "snapdeal",
    "tata cliq",
    "jiomart",
}

# WhatsApp Business numbers used by Indian ecommerce platforms (known)
# Add more as discovered
KNOWN_ECOMMERCE_WABIZ_NUMBERS = {
    "+918069067777",   # Amazon India
    "+918010100999",   # Flipkart (example — verify)
}


def is_ecommerce_notification(sender: str, text: str) -> bool:
    """
    Heuristic filter — returns True if this notification looks like
    an ecommerce order/delivery/return message.
    Prevents noise (OTPs, promo chats) from hitting Gemini.
    """
    sender_lower = sender.lower().strip()
    if any(brand in sender_lower for brand in ECOMMERCE_SENDERS):
        return True
    if sender in KNOWN_ECOMMERCE_WABIZ_NUMBERS:
        return True

    # Keyword scan on text as fallback
    keywords = [
        "order", "delivered", "return", "refund", "shipment",
        "dispatch", "out for delivery", "expected delivery",
        "return window", "exchange", "replacement",
    ]
    text_lower = text.lower()
    return sum(1 for kw in keywords if kw in text_lower) >= 2


def _build_whatsapp_prompt(message_text: str) -> str:
    """
    Gemini prompt tuned for WhatsApp messages.
    WhatsApp notifications are SHORT (1-3 lines), informal, often
    mix Hindi/English — very different from full email invoices.
    """
    return f"""You are an AI assistant for ReturnKart.in, an Indian e-commerce return tracker.

Extract order information from the WhatsApp message below.
These messages are SHORT and informal — extract whatever is present.
Return ONLY valid JSON. No markdown, no explanation, no code fences.

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
  "message_type": "order_placed | shipped | delivered | return_reminder | refund_processed | other",
  "confidence": 0.0 to 1.0
}}

Rules:
- Dates MUST be YYYY-MM-DD format. If only "return by Jan 15" → infer year as current year.
- total_amount is a number, no rupee symbol
- message_type is the most important field — always try to determine it
- confidence: 0.9+ if order_id found, 0.5 if only brand + message_type found
- NEVER invent data. null is better than a guess.

WhatsApp message:
{message_text}

JSON:"""


async def extract_order_from_whatsapp(
    message_text: str,
    user_id: str,
    sender: str = "unknown",
    source_channel: str = "whatsapp_notification",  # or "whatsapp_business_api"
) -> Optional[dict]:
    """
    Core extraction pipeline.
    1. Run Gemini on the message text
    2. Upsert result to Supabase orders table
    Returns the upserted order dict or None on failure.
    """
    if not message_text or not message_text.strip():
        return None

    try:
        prompt = _build_whatsapp_prompt(message_text)
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

        # Only save if Gemini found something meaningful
        if data.get("confidence", 0) < 0.3:
            print(f"[WhatsApp] Low confidence ({data.get('confidence')}) — skipping upsert")
            return None

        # Merge metadata before upsert
        data["user_id"] = user_id
        data["source"] = source_channel
        data["raw_text"] = message_text[:1000]  # Store snippet for debugging
        data["sender"] = sender

        order = await upsert_order(data)
        return order

    except json.JSONDecodeError as e:
        print(f"[WhatsApp] Gemini JSON parse error: {e}")
        return None
    except Exception as e:
        print(f"[WhatsApp] Extraction error: {e}")
        return None
