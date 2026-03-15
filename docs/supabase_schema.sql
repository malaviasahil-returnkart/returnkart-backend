-- ============================================================
-- RETURNKART.IN — SUPABASE DATABASE SCHEMA
-- ============================================================
-- Instructions:
--   1. Go to your Supabase project dashboard
--   2. Click "SQL Editor" in the left sidebar
--   3. Paste this entire file and click "Run"
--   4. Then run: python scripts/test_supabase.py
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: orders
-- The core entity. One row per order tracked.
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
    id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id             TEXT NOT NULL,                -- Platform order ID (e.g. 402-1234567-8901234)
    brand                TEXT NOT NULL,                -- Amazon, Myntra, Flipkart, Meesho, Ajio
    item_name            TEXT NOT NULL,
    price                DECIMAL(10, 2) NOT NULL,
    order_date           DATE NOT NULL,
    return_deadline      DATE,                         -- AI-calculated
    category             TEXT,
    courier_partner      TEXT,
    delivery_pincode     TEXT,
    is_replacement_only  BOOLEAN DEFAULT FALSE,
    status               TEXT DEFAULT 'active'         -- active | kept | returned | expired
                         CHECK (status IN ('active', 'kept', 'returned', 'expired')),

    -- DPDP Act 2023 Compliance Fields
    consent_timestamp    TIMESTAMPTZ,                  -- When user granted data consent
    purpose_id           TEXT DEFAULT 'return_tracking', -- return_tracking | logistics_benchmarking
    data_expiry_date     DATE,                         -- Auto-set to +24 months
    anonymization_status BOOLEAN DEFAULT FALSE,        -- TRUE = scrubbed for B2B reporting

    created_at           TIMESTAMPTZ DEFAULT NOW(),

    -- Prevent duplicate orders per user
    UNIQUE(user_id, order_id)
);

-- ============================================================
-- TABLE: user_consents
-- DPDP Act 2023 — immutable audit log of all consent events.
-- ============================================================
CREATE TABLE IF NOT EXISTS user_consents (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    purpose_id       TEXT NOT NULL,                    -- What data is being collected for
    consented        BOOLEAN NOT NULL,                 -- TRUE = granted, FALSE = revoked
    consent_text     TEXT,                             -- The exact text shown to user
    ip_address       TEXT,                             -- For audit purposes
    user_agent       TEXT,
    created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: gmail_tokens
-- Stores encrypted Gmail OAuth tokens per user.
-- ============================================================
CREATE TABLE IF NOT EXISTS gmail_tokens (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    access_token     TEXT NOT NULL,
    refresh_token    TEXT,
    token_expiry     TIMESTAMPTZ,
    scope            TEXT,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: evidence_locker
-- Stores unboxing photos/videos for dispute resolution.
-- ============================================================
CREATE TABLE IF NOT EXISTS evidence_locker (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id         UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_url         TEXT NOT NULL,                    -- Supabase Storage URL
    file_type        TEXT NOT NULL,                    -- image | video
    file_size_bytes  INTEGER,
    uploaded_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Users can only see and modify their own data.
-- ============================================================
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE gmail_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_locker ENABLE ROW LEVEL SECURITY;

-- Orders: users see only their own
CREATE POLICY "Users can view own orders"
    ON orders FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders"
    ON orders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders"
    ON orders FOR UPDATE
    USING (auth.uid() = user_id);

-- Consents: users see only their own consent log
CREATE POLICY "Users can view own consents"
    ON user_consents FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own consents"
    ON user_consents FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Gmail tokens: strict — users can only see/modify their own token
CREATE POLICY "Users can manage own gmail token"
    ON gmail_tokens FOR ALL
    USING (auth.uid() = user_id);

-- Evidence: users see only their own
CREATE POLICY "Users can manage own evidence"
    ON evidence_locker FOR ALL
    USING (auth.uid() = user_id);

-- ============================================================
-- INDEXES for query performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_return_deadline ON orders(return_deadline);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_brand ON orders(brand);

-- ============================================================
-- IST TIMEZONE VERIFICATION
-- Run this after setup to confirm timestamps are correct.
-- ============================================================
-- SELECT NOW() AT TIME ZONE 'Asia/Kolkata' AS ist_time;
