"""
RETURNKART.IN — GEMINI AI SERVICE
Task #14: Extract structured order data from invoice emails using Gemini 1.5 Flash + RAG.

PERFORMANCE: generate_content() is a synchronous blocking call.
We wrap it in asyncio.to_thread() so callers can await it and
run multiple extractions in parallel via asyncio.gather().

Input:  raw email text + platform hint
Output: AIOrderContext (order_id, brand, item_name, price, date, category)
"""
import asyncio
import json
import re
from pathlib import Path
from typing import Optional

import google.generativeai as genai

from backend.config import GEMINI_API_KEY
from backend.models.order import AIOrderContext

genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-1.5-flash")

_KB_PATH = Path(__file__).parent.parent / "data" / "knowledge_base.json"
_knowledge_base: Optional[dict] = None


def _load_knowledge_base() -> dict:
    global _knowledge_base
    if _knowledge_base is None:
        with open(_KB_PATH, "r", encoding="utf-8") as f:
            _knowledge_base = json.load(f)
    return _knowledge_base


def _get_platform_policy(platform_slug: str) -> str:
    kb = _load_knowledge_base()
    for p in kb.get("platforms", []):
        if p["brand_slug"] == platform_slug:
            lines = [f"Platform: {p['brand']}"]
            for cat in p.get("categories", []):
                lines.append(
                    f"  - {cat['category']}: {cat['return_window_days']} days "
                    f"({'replacement only' if cat['is_replacement_only'] else 'refund'})"
                )
            return "\n".join(lines)
    fb = kb.get("fallback_policy", {})
    return f"Fallback: {fb.get('return_window_days', 7)} day return window"


def _build_prompt(email_text: str, platform_slug: str, policy_snippet: str) -> str:
    return f"""You are an AI assistant for ReturnKart.in, an Indian e-commerce return tracker.

Your job: extract structured order information from the email below.
Return ONLY valid JSON. No markdown, no explanation, no code fences.

Return policy context for {platform_slug}:
{policy_snippet}

Extract this JSON structure:
{{
  "order_id": "platform order ID string or null",
  "brand": "Amazon India | Myntra | Flipkart | Meesho | Ajio or null",
  "item_name": "product name string or null",
  "total_amount": number or null,
  "currency": "INR",
  "order_date": "YYYY-MM-DD or null",
  "category": "Fashion & Apparel | Electronics | Home & Kitchen | Books | Default or null",
  "courier_partner": "courier name or null",
  "delivery_pincode": "6-digit pincode or null",
  "confidence": 0.0 to 1.0
}}

Rules:
- order_date MUST be in YYYY-MM-DD format
- total_amount MUST be a number (no currency symbols)
- If you cannot find a field, use null
- confidence: 1.0 = very sure, 0.5 = guessing, 0.0 = not found
- Only extract data explicitly present in the email — never invent data

Email:
{email_text}

JSON:"""


def _run_gemini_sync(prompt: str) -> str:
    """Pure sync call — only ever called via asyncio.to_thread."""
    response = model.generate_content(
        prompt,
        generation_config=genai.GenerationConfig(
            temperature=0.1,
            max_output_tokens=512,
        ),
    )
    return response.text.strip()


async def extract_order_from_email(
    email_text: str,
    platform_slug: str = "amazon",
) -> Optional[AIOrderContext]:
    """
    Async extraction — safe to call with asyncio.gather() for parallelism.
    Runs the blocking Gemini SDK call in a thread pool.
    """
    try:
        policy_snippet = _get_platform_policy(platform_slug)
        prompt = _build_prompt(email_text, platform_slug, policy_snippet)

        # Run blocking Gemini call in thread pool — doesn't block the event loop
        raw = await asyncio.to_thread(_run_gemini_sync, prompt)

        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)

        data = json.loads(raw)
        return AIOrderContext(**data)

    except json.JSONDecodeError as e:
        print(f"Gemini JSON parse error: {e}")
        return None
    except Exception as e:
        print(f"Gemini extraction error: {e}")
        return None
