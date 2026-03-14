# 📦 RETURNKART.IN — MASTER PROJECT STATUS
Last Updated: 2026-03-14
Current Phase: Pre-Kickoff (Phase 1 not yet started)
Overall Progress: 0 / 45 tasks complete

---

## 🎯 VISION & POSITIONING

Returnkart.in is the "CIBIL of Commerce" — an automated audit layer that tracks e-commerce orders, calculates return deadlines using AI, and protects consumer funds with zero manual data entry.

- **For Consumers:** A "Set it and Forget it" financial guardian — no return window ever missed.
- **For Brands:** Verified "Good Shopper" data + accelerated inventory recovery.
- **For 3PLs:** High-integrity logistics benchmarking data.

**Exit Goal:** Strategic acquisition by Flipkart, PhonePe, or Shiprocket.
**Compliance Foundation:** Strict DPDP Act 2023 — consent-first, purpose limitation, data minimization.

---

## 🏗️ TECH STACK & ARCHITECTURE

| Layer | Technology |
|-------|-----------|
| Frontend | React (Vite) + Tailwind CSS |
| Backend | Python (FastAPI) |
| Database | Supabase (PostgreSQL) |
| AI Engine | Google Gemini 1.5 Flash (via google-genai) |
| Primary Data Pipe | Gmail API (OAuth sync — iOS/Android) |
| Secondary Data Pipe | Android Notification Listener (Bharat mobile-first) |
| Orchestration | Replit + Claude Desktop (via MCP) |

> **Framework decision locked (2026-03-14):** Vite over Next.js. Lighter process footprint on Replit, no Node server competing with Python backend for PORT.

---

## 🎨 DESIGN SYSTEM — "Premium Vault" Aesthetic

| Element | Spec |
|---------|------|
| Background | Pitch Black `#0A0A0A` |
| Cards/Containers | Dark Charcoal `#1A1A1A` + subtle rounded corners |
| Primary Accent | Premium Gold `#D4AF37` (buttons, highlights, urgent borders) |
| Typography | Inter / Roboto — White `#FFFFFF` primary, Gray `#A0A0A0` secondary |

---

## 📁 APPROVED FOLDER STRUCTURE
*Locked by Lead Staff Engineer review — 2026-03-14*

```
returnkart/                          ← Replit monorepo root
├── .env                             🔒 SECRET — never commit
├── .env.example                     ← committed template
├── .gitignore
├── .replit                          ← run = starts both processes
├── replit.nix
├── MASTER_PROJECT_STATUS.md
│
├── backend/                         ← Python API + AI Engine
│   ├── main.py                      ← FastAPI entry · reads PORT from env
│   ├── requirements.txt
│   ├── config.py                    ← central secret loader (all os.getenv here)
│   ├── api/
│   │   ├── __init__.py
│   │   ├── auth.py                  ← Gmail OAuth routes
│   │   ├── orders.py                ← CRUD for orders table
│   │   └── health.py                ← GET /health
│   ├── services/
│   │   ├── __init__.py
│   │   ├── gmail_service.py         ← fetch + parse emails (orchestrator)
│   │   ├── gemini_service.py        ← Gemini 1.5 Flash · RAG
│   │   ├── supabase_service.py      ← all DB reads/writes · upsert logic
│   │   └── return_calculator.py     ← deadline engine · pure function
│   ├── models/
│   │   ├── __init__.py
│   │   └── order.py                 ← Pydantic: Order, ReturnPolicy, DPDPFields
│   └── data/
│       ├── knowledge_base.json      ← RAG policy store (AI source of truth)
│       └── return_policies.json     ← extended policy detail
│
├── frontend/                        ← React + Tailwind
│   ├── package.json
│   ├── vite.config.js               ← proxy /api/* → backend
│   ├── tailwind.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx                  ← router + context providers
│       ├── styles/
│       │   ├── globals.css
│       │   └── tokens.css           ← CSS vars: gold, black palette
│       ├── lib/
│       │   ├── supabaseClient.js    ← ANON key only (safe for browser)
│       │   ├── api.js               ← fetch wrapper → /api/*
│       │   └── formatters.js        ← INR · IST dates · countdown
│       ├── context/
│       │   ├── AuthContext.jsx      ← Google OAuth state · DPDP consent_ts
│       │   └── OrderContext.jsx
│       ├── hooks/
│       │   ├── useOrders.js
│       │   ├── useAuth.js
│       │   └── useCountdown.js      ← live deadline timers
│       ├── components/
│       │   ├── ui/                  ← design system primitives
│       │   │   ├── Button.jsx
│       │   │   ├── Card.jsx
│       │   │   ├── Badge.jsx
│       │   │   └── CountdownRing.jsx
│       │   ├── layout/
│       │   │   ├── Header.jsx
│       │   │   └── BottomNav.jsx
│       │   └── features/            ← one folder per screen
│       │       ├── onboarding/OnboardingFlow.jsx
│       │       ├── dashboard/Dashboard.jsx
│       │       ├── dashboard/OrderCard.jsx
│       │       ├── dashboard/UrgentCarousel.jsx
│       │       ├── order/OrderDetailModal.jsx
│       │       └── settings/SettingsVault.jsx
│       └── pages/                   ← thin route wrappers only
│           ├── Onboarding.jsx
│           ├── Dashboard.jsx
│           └── Settings.jsx
│
├── scripts/                         ← dev tools · never in production
│   ├── test_supabase.py             ← Phase 1 Task #11
│   ├── test_gemini.py
│   └── seed_knowledge_base.py
│
└── docs/
    ├── supabase_schema.sql          ← run in Supabase dashboard
    └── api_spec.md
```

### Critical Architectural Decisions

1. **Vite proxy pattern**: React calls `/api/*` (proxied to Python backend) for writes. Reads come directly from Supabase using the ANON key. The service key (admin-level) never touches the browser.
2. **`knowledge_base.json` lives in `backend/data/`** — not the root. Python process owns it. Never served as a public asset.
3. **`config.py` is the only file that calls `os.getenv()`** — all other modules import constants from config. One place to fix if a key rotates.
4. **`backend/main.py` reads PORT from environment** — `os.environ.get("PORT", 8000)`. Hardcoding PORT causes Replit deployment crashes.

---

## 🔢 PHASE 1 EXECUTION SEQUENCE
*File creation order — each file is a dependency for all files below it*

| # | File | Reason |
|---|------|--------|
| 1 | `.env` + `.env.example` + `.gitignore` | Security layer first. Secrets locked before any code is written. |
| 2 | `backend/config.py` | Central secret loader. All modules import from here. |
| 3 | `backend/data/knowledge_base.json` | RAG brain defined before AI service is written. |
| 4 | `backend/models/order.py` | Data contracts agreed before DB or AI code exists. |
| 5 | `docs/supabase_schema.sql` | Schema reviewed and run in Supabase before any writes. |
| 6 | `scripts/test_supabase.py` | DB connection verified before building on top of it. |
| 7 | `backend/services/supabase_service.py` | DB layer. All other services call this — never raw queries. |
| 8 | `backend/services/gemini_service.py` | AI engine. Reads knowledge_base.json, returns structured JSON. |
| 9 | `backend/services/return_calculator.py` | Pure function. Testable with no DB or API dependencies. |
| 10 | `backend/services/gmail_service.py` | Orchestrator. Calls Gemini + Supabase — built after both. |
| 11 | `backend/api/auth.py` + `orders.py` + `health.py` | HTTP endpoints. Thin wrappers — all logic beneath them. |
| 12 | `backend/main.py` | Entry point is always last. All dependencies already exist. |
| 13 | `frontend/src/styles/tokens.css` | Design tokens before any component is built. |
| 14 | `frontend/src/lib/supabaseClient.js` + `api.js` | One data access pattern enforced. |
| 15 | `frontend/src/context/AuthContext.jsx` | Auth state wraps all screens — built before screens. |
| 16 | `frontend/src/components/ui/*` | Primitives before features — no copy-paste styling. |
| 17–20 | Feature screens (onboarding → dashboard → order → settings) | In user-journey order. |

---

## 🗄️ SUPABASE DATABASE SCHEMA

### Table: orders
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary Key |
| order_id | text | UNIQUE — prevents duplicates |
| brand | text | Amazon, Myntra, Flipkart, Meesho, Ajio |
| item_name | text | |
| price | decimal | |
| order_date | date | |
| return_deadline | date | AI-calculated |
| created_at | timestamp with time zone | |
| consent_timestamp | timestamp | Required for DPDP compliance |

### DPDP Compliance Fields (all user tables)
- `consent_timestamp` — When user agreed to terms
- `purpose_id` — Links data to "Return Tracking" or "Logistics Benchmarking"
- `data_expiry_date` — Auto-set to 24 months (Storage Limitation rule)
- `anonymization_status` — Boolean: scrubbed for B2B reporting

### Data Buckets (Privacy by Design)
- **Bucket A — Personal (Identity Layer):** Name, Phone, Email, Pincode, OAuth Tokens, Consent Log. Encrypted. Explicit consent required.
- **Bucket B — Transactional (Reminder Layer):** Order ID, Brand, SKU, Price, Return Window, Evidence Locker. User-facing value.
- **Bucket C — Operational (Monetization Layer):** Refund latency, Ghost flags, Courier integrity, Brand performance, Regional trends. Anonymized for B2B sale.

---

## 🤖 AI / RAG KNOWLEDGE BASE

### Return Policy Reference (knowledge_base.json)
| Brand | Category | Window | Notes |
|-------|----------|--------|-------|
| Amazon India | Fashion | 10 days | |
| Amazon India | Electronics | 7 days | Replacement only |
| Myntra | Fashion Standard | 14 days | |
| Myntra | Fashion Premium | 30 days | No returns on lingerie/fragrances |
| Flipkart | Fashion | 10 days | |
| Flipkart | Electronics | 7 days | Replacement only — video/technician required |
| Meesho | Fashion | 7 days | Continuous unboxing video required for disputes |
| Ajio | Fashion | 15 days | |
| Ajio | Electronics | 7 days | |

### AI Output Format (Structured JSON)
The AI reads invoices and outputs:
- `order_context`: order_id, brand, total_amount, currency
- `return_logic`: policy_window, expiry_date, is_replacement_only
- `logistics_benchmark`: delivery_pincode, courier_partner, actual_delivery_date

---

## 💰 REVENUE ROADMAP

| Year | Phase | Primary Revenue | Key Goal |
|------|-------|----------------|----------|
| Year 1 | Pilot | Audit Fees (Brand Verification) | 100K Users / 20 Pilot Brands |
| Year 2 | Validation | SaaS Subscriptions (Logistics Dashboards) | 500K Users / 3PL Benchmarking |
| Year 3 | Infrastructure | Trust API Fees (Usage-based) | 2M Users / "CIBIL of Returns" |
| Year 4 | Data Alpha | Institutional Data Licenses | 5M Users / Market Oracle |

---

## ✅ ACTIVE SPRINT TRACKER

Status Key: `[ ]` Not Started | `[~]` In Progress | `[x]` Done | `[!]` Blocked

### PHASE 1: FOUNDATION SETUP (Weeks 1-4) — 0/16 Done

| # | Wk | Task | Owner | Priority | Status |
|---|----|----|-------|----------|--------|
| 1 | 1 | Register returnkart.in domain + hosting setup | Founder | Critical | [ ] |
| 2 | 1 | Create Google Cloud project, enable Gmail API, OAuth consent | Founder | Critical | [ ] |
| 3 | 1 | Set up Supabase project + get API keys | Dev | Critical | [ ] |
| 4 | 1 | Create .env file (GEMINI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET) | Dev | Critical | [ ] |
| 5 | 1 | Set up private GitHub repo with .gitignore | Dev | High | [ ] |
| 6 | 2 | Design + implement full Supabase schema (4 core tables) | Dev | Critical | [ ] |
| 7 | 2 | Add DPDP compliance metadata fields to all tables | Dev | High | [ ] |
| 8 | 2 | Configure Row-Level Security policies | Dev | High | [ ] |
| 9 | 2 | Verify Supabase timestamps are IST (not UTC/US) | Dev | Critical | [ ] |
| 10 | 3 | Build Gmail OAuth authentication flow | Dev | Critical | [ ] |
| 11 | 3 | Write test_supabase.py to verify backend connection | Dev | Critical | [ ] |
| 12 | 3 | Execute CREATE TABLE orders SQL in Supabase dashboard | Dev | Critical | [ ] |
| 13 | 3 | Create email fetching script (Amazon, Myntra, Flipkart, Meesho, Ajio) | Dev | Critical | [ ] |
| 14 | 4 | Implement extract_order_data function (Gemini + RAG knowledge_base.json) | Dev | Critical | [ ] |
| 15 | 4 | Write Supabase upsert logic (no order_id duplicates) | Dev | Critical | [ ] |
| 16 | 4 | CHECKPOINT: Gmail sync working, orders saving to Supabase | Both | Critical | [ ] |

### PHASE 2: PRODUCT BUILD (Weeks 5-12) — 0/10 Done

| # | Wk | Task | Owner | Priority | Status |
|---|----|----|-------|----------|--------|
| 17 | 5-6 | Build Screen 1: Zero-Touch Onboarding (Black/Gold UI, Google Sync, DPDP badge) | Dev | Critical | [ ] |
| 18 | 5-6 | Build Screen 2: Main Dashboard (Protected amount, urgent carousel, countdown timers) | Dev | Critical | [ ] |
| 19 | 7-8 | Build Screen 3: Order Detail Modal (Receipt, RAG policy, Mark as Kept / Returned) | Dev | Critical | [ ] |
| 20 | 7-8 | Build Screen 4: Settings Vault (Revoke Gmail, consent timestamp, Delete All Data) | Dev | High | [ ] |
| 21 | 8 | Return Countdown — Money at Risk dashboard with color-coded urgency | Dev | Critical | [ ] |
| 22 | 9 | Evidence Locker — Secure photo/video storage for dispute resolution | Dev | High | [ ] |
| 23 | 10 | Ghost-Buster Flagging — One-tap Customer Not Home reporting + location verify | Dev | High | [ ] |
| 24 | 11 | Good Shopper Rewards — Auto-coupon issuance when return window expires | Dev | Medium | [ ] |
| 25 | 11-12 | Implement DPDP consent flow with timestamped logging | Dev | Critical | [ ] |
| 26 | 12 | CHECKPOINT: Feature-complete app ready for beta | Both | Critical | [ ] |

### PHASE 3: LAUNCH & GROWTH (Weeks 13-24) — 0/9 Done

| # | Wk | Task | Owner | Priority | Status |
|---|----|----|-------|----------|--------|
| 27 | 13-14 | Create brand identity (logo, colors, social templates) | Founder | High | [ ] |
| 28 | 13-14 | Build content strategy around Consumer Protection angle | Founder | High | [ ] |
| 29 | 15-16 | Launch closed beta with 100-200 users | Founder | Critical | [ ] |
| 30 | 16-17 | Iterate UI/UX based on beta feedback | Dev | High | [ ] |
| 31 | 17-18 | SEO + App Store Optimization | Founder | Medium | [ ] |
| 32 | 18-20 | Contact pilot brands for audit fee partnerships | Founder | High | [ ] |
| 33 | 20-22 | Reach 10K-50K users via Consumer Protection marketing | Founder | Critical | [ ] |
| 34 | 22-24 | Launch Good Shopper brand reward program | Both | High | [ ] |
| 35 | 24 | CHECKPOINT: 10K-50K users acquired | Both | Critical | [ ] |

### PHASE 4: MONETIZATION (Weeks 25-48) — 0/10 Done

| # | Wk | Task | Owner | Priority | Status |
|---|----|----|-------|----------|--------|
| 36 | 25-28 | Launch B2B brand audit dashboard (anonymized data) | Dev | High | [ ] |
| 37 | 28-30 | Sign first 20 pilot brand partnerships | Founder | Critical | [ ] |
| 38 | 30-32 | Build 3PL Benchmarking SaaS dashboard | Dev | High | [ ] |
| 39 | 32 | CHECKPOINT: 20 pilot brand partnerships secured | Both | Critical | [ ] |
| 40 | 33-36 | Launch Switching Matrix analytics (cross-platform return-to-buy data) | Dev | High | [ ] |
| 41 | 36-40 | Develop institutional data licensing packages | Founder | High | [ ] |
| 42 | 40-44 | Pitch CIBIL of Returns Trust API to ecosystem players | Founder | Critical | [ ] |
| 43 | 41-44 | Build Trust API (usage-based pricing) | Dev | High | [ ] |
| 44 | 45-48 | Begin institutional data licensing conversations | Founder | High | [ ] |
| 45 | 48 | CHECKPOINT: 100K users, 20 brands, revenue validated | Both | Critical | [ ] |

---

## 🔑 KEY MILESTONES

| Target Week | Milestone | Status |
|-------------|-----------|--------|
| Week 4 | Gmail sync working, orders saving to Supabase | [ ] Not Started |
| Week 12 | Feature-complete app ready for beta | [ ] Not Started |
| Week 16 | Closed beta launched (100+ users) | [ ] Not Started |
| Week 24 | 10K-50K users acquired | [ ] Not Started |
| Week 32 | 20 pilot brand partnerships secured | [ ] Not Started |
| Week 48 | SaaS + Trust API revenue validated | [ ] Not Started |

---

## 🔮 FUTURE BACKLOG (Do Not Build Yet)

- Android Notification Listener Service (background scraping for Bharat users)
- AI Escalation Email Engine (drafting legal dispute emails automatically)
- B2B Analytics Dashboard (anonymized logistics metrics for 3PLs)
- Cross-Platform Switching Matrix (tracks return-on-A then buy-on-B behaviour)

---

## 📋 WEEKLY LOG

| Week # | Date Range | Tasks Planned | Tasks Completed | Blockers | Key Decisions | Next Week Focus |
|--------|-----------|--------------|----------------|----------|---------------|-----------------|
| 1 | | | | | Vite selected over Next.js. Monorepo structure locked. | Begin Phase 1 file scaffold. |

---

*This is the single source of truth for Returnkart.in. Update the Sprint Tracker and Weekly Log every week.*
