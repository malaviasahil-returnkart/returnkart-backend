"""
RETURNKART.IN — CENTRAL CONFIGURATION
======================================
This is the ONLY file that calls os.getenv().
All other modules import constants from here.

Rule: one import path for secrets = one place to fix if a key rotates.
"""
import os
from dotenv import load_dotenv

# Load .env file (only active in local/Replit dev — Replit Secrets override in production)
load_dotenv()


def _require(key: str) -> str:
    """Get a required env variable or raise a clear error at startup."""
    value = os.getenv(key)
    if not value:
        raise EnvironmentError(
            f"Missing required environment variable: {key}\n"
            f"Add it to your .env file (dev) or Replit Secrets (production)."
        )
    return value


# --- Supabase ---
SUPABASE_URL: str = _require("SUPABASE_URL")
SUPABASE_SERVICE_KEY: str = _require("SUPABASE_SERVICE_KEY")
SUPABASE_ANON_KEY: str = _require("SUPABASE_ANON_KEY")

# --- Google OAuth ---
GOOGLE_CLIENT_ID: str = _require("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET: str = _require("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI: str = os.getenv(
    "GOOGLE_REDIRECT_URI",
    "https://return-kart-tracker.replit.app/api/auth/callback"
)

# --- Gemini AI ---
GEMINI_API_KEY: str = _require("GEMINI_API_KEY")

# --- App ---
# PORT: Replit injects this automatically. NEVER hardcode it.
# Fallback to 8000 for local dev only.
PORT: int = int(os.getenv("PORT", "8000"))
FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
ENV: str = os.getenv("ENV", "development")
IS_PRODUCTION: bool = ENV == "production"
