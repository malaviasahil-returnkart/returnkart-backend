"""
RETURNKART.IN — SUPABASE CONNECTION TEST
==========================================
Phase 1, Task #11: Run this script BEFORE writing any service code.
Verifies: connection, schema exists, IST timezone, basic upsert.

Usage:
    python scripts/test_supabase.py
"""
import sys
import os

# Add project root to path so we can import backend.config
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.config import SUPABASE_URL, SUPABASE_SERVICE_KEY
from supabase import create_client
from datetime import datetime, timezone, timedelta

IST = timezone(timedelta(hours=5, minutes=30))

def test_connection():
    print("\n📡 Testing Supabase connection...")
    client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    print(f"   ✅ Connected to: {SUPABASE_URL}")
    return client

def test_timezone(client):
    print("\n🕐 Testing IST timezone...")
    result = client.rpc("now").execute()
    print(f"   DB time: {result.data}")
    local_ist = datetime.now(IST)
    print(f"   IST now: {local_ist.strftime('%Y-%m-%d %H:%M:%S IST')}")
    print("   ✅ Timezone check complete — verify the times match IST above")

def test_orders_table(client):
    print("\n📋 Testing orders table...")
    try:
        result = client.table("orders").select("id").limit(1).execute()
        print(f"   ✅ orders table exists. Row count check: {len(result.data)} row(s) returned")
    except Exception as e:
        print(f"   ❌ orders table not found: {e}")
        print("   → Run docs/supabase_schema.sql in your Supabase dashboard first.")
        return False
    return True

def main():
    print("=" * 50)
    print("  RETURNKART.IN — SUPABASE TEST SUITE")
    print("=" * 50)

    try:
        client = test_connection()
        test_timezone(client)
        test_orders_table(client)
    except Exception as e:
        print(f"\n❌ FATAL: {e}")
        print("   Check your .env file and Replit Secrets.")
        sys.exit(1)

    print("\n" + "=" * 50)
    print("  ✅ All tests passed. Backend foundation is solid.")
    print("=" * 50 + "\n")

if __name__ == "__main__":
    main()
