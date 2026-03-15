# 📦 RETURNKART.IN — MASTER PROJECT STATUS
Last Updated: 2026-03-15
Current Phase: Phase 1 — In Progress
Overall Progress: 13 / 45 tasks complete

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

> **Framework decision locked (2026-03-14):** Vite over Next.js.

---

## 🎨 DESIGN SYSTEM — "Premium Vault" Aesthetic

| Element | Spec |
|---------|------|
| Background | Pitch Black `#0A0A0A` |
| Cards/Containers | Dark Charcoal `#1A1A1A` + subtle rounded corners |
| Primary Accent | Premium Gold `#D4AF37` (buttons, highlights, urgent borders) |
| Typography | Inter / Roboto — White `#FFFFFF` primary, Gray `#A0A0A0` secondary |

---

## 📁 FOLDER STRUCTURE — FULLY SCAFFOLDED ✅

```
returnkart/
├── .env                             🔒 SECRET — never commit
├── .env.example                     ✅
├── .gitignore                       ✅
├── .replit                          ✅
├── start.sh                         ✅ venv-aware launcher
│
├── backend/
│   ├── main.py                      ✅ FastAPI — all routes wired, server LIVE
│   ├── requirements.txt             ✅
│   ├── config.py                    ✅ central secret loader
│   ├── api/
│   │   ├── health.py                ✅ GET /api/health
│   │   ├── auth.py                  ✅ Gmail OAuth (Task #10)
│   │   └── orders.py                ✅ CRUD + sync trigger (Task #15)
│   ├── services/
│   │   ├── supabase_service.py      ✅ all DB ops (Task #15)
│   │   ├── gmail_service.py         ✅ inbox sync, 5 platforms (Task #13)
│   │   ├── gemini_service.py        ✅ RAG extraction (Task #14)
│   │   └── return_calculator.py     ✅ pure deadline engine (Task #14)
│   ├── models/
│   │   └── order.py                 ✅ Pydantic contracts
│   └── data/
│       └── knowledge_base.json      ✅ RAG policy store (5 platforms)
│
├── frontend/                        ← Phase 2
│   └── src/                         ✅ directory ready
│
├── scripts/
│   └── test_supabase.py             ✅ PASSES
│
└── docs/
    ├── supabase_schema.sql          ✅ 4 tables live
    └── api_spec.md                  ✅
```

---

## 🔑 CRITICAL ARCHITECTURAL DECISIONS

1. **Vite proxy pattern** — React calls `/api/*` for writes; Supabase ANON key for reads. Service key never in browser.
2. **`knowledge_base.json` in `backend/data/`** — Python process owns it, never served publicly.
3. **`config.py` is the only `os.getenv()` caller** — all modules import constants from here.
4. **PORT from environment** — `os.environ.get("PORT", 8000)`. Hardcoding crashes Replit deployments. DO NOT set PORT as a Replit Secret.
5. **Python venv on Replit Nix** — pip installs go into `.venv/`. Always `source .venv/bin/activate` first.

---

## 🌐 LIVE API ROUTES

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/api/health` | Health check |
| GET | `/api/auth/google` | Start Gmail OAuth |
| GET | `/api/auth/callback` | OAuth callback — save tokens |
| DELETE | `/api/auth/revoke` | DPDP: revoke Gmail access |
| GET | `/api/auth/status` | Check if Gmail connected |
| GET | `/api/orders` | List user's orders |
| GET | `/api/orders/urgent` | Orders expiring soon |
| PATCH | `/api/orders/{id}` | Update order status |
| POST | `/api/orders/sync` | Trigger Gmail sync |
| GET | `/api/docs` | Swagger UI (dev only) |

---

## 🗄️ SUPABASE DATABASE ✅ LIVE

**Project ID:** `xxfofdkttxrmbymopajo` | **Region:** AWS ap-southeast-2

| Table | Columns | RLS | Status |
|-------|---------|-----|--------|
| `orders` | 18 | ✅ 3 policies + 4 indexes | Live |
| `user_consents` | 8 | ✅ 2 policies | Live |
| `gmail_tokens` | 8 | ✅ 1 policy | Live |
| `evidence_locker` | 7 | ✅ 1 policy | Live |

**Verified 2026-03-15:** Connection ✅ · IST timezone ✅ · orders table ✅

---

## 🤖 AI / RAG KNOWLEDGE BASE

| Brand | Category | Window | Notes |
|-------|----------|--------|-------|
| Amazon India | Fashion | 10 days | |
| Amazon India | Electronics | 7 days | Replacement only |
| Myntra | Fashion Standard | 14 days | |
| Myntra | Fashion Premium | 30 days | No lingerie/fragrances |
| Flipkart | Fashion | 10 days | |
| Flipkart | Electronics | 7 days | Replacement only + video |
| Meesho | Fashion | 7 days | Unboxing video required |
| Ajio | Fashion | 15 days | |
| Ajio | Electronics | 7 days | |

---

## 💰 REVENUE ROADMAP

| Year | Phase | Primary Revenue | Key Goal |
|------|-------|----------------|----------|
| Year 1 | Pilot | Audit Fees | 100K Users / 20 Brands |
| Year 2 | Validation | SaaS Subscriptions | 500K Users / 3PL |
| Year 3 | Infrastructure | Trust API Fees | 2M Users |
| Year 4 | Data Alpha | Data Licenses | 5M Users |

---

## ✅ ACTIVE SPRINT TRACKER

Status Key: `[ ]` Not Started | `[~]` In Progress | `[x]` Done | `[!]` Blocked

### PHASE 1: FOUNDATION SETUP (Weeks 1-4) — 13/16 Done

| # | Wk | Task | Owner | Priority | Status |
|---|----|----|-------|----------|--------|
| 1 | 1 | Register returnkart.in domain + hosting setup | Founder | Critical | [ ] |
| 2 | 1 | Create Google Cloud project, enable Gmail API, OAuth consent | Founder | Critical | [x] |
| 3 | 1 | Set up Supabase project + get API keys | Dev | Critical | [x] |
| 4 | 1 | Add all 6 secrets to Replit Secrets | Dev | Critical | [x] |
| 5 | 1 | Set up GitHub repo + .gitignore | Dev | High | [x] |
| 6 | 2 | Design + implement full Supabase schema (4 core tables) | Dev | Critical | [x] |
| 7 | 2 | Add DPDP compliance metadata fields to all tables | Dev | High | [x] |
| 8 | 2 | Configure Row-Level Security policies | Dev | High | [x] |
| 9 | 2 | Verify Supabase timestamps are IST | Dev | Critical | [x] |
| 10 | 3 | Build Gmail OAuth authentication flow | Dev | Critical | [x] |
| 11 | 3 | Write test_supabase.py to verify backend connection | Dev | Critical | [x] |
| 12 | 3 | Execute CREATE TABLE SQL in Supabase | Dev | Critical | [x] |
| 13 | 3 | Create email fetching script (5 platforms) | Dev | Critical | [x] |
| 14 | 4 | Implement extract_order_data (Gemini + RAG) | Dev | Critical | [x] |
| 15 | 4 | Write Supabase upsert logic (no duplicates) | Dev | Critical | [x] |
| 16 | 4 | CHECKPOINT: Gmail sync working, orders saving to Supabase | Both | Critical | [~] |

### PHASE 2: PRODUCT BUILD (Weeks 5-12) — 0/10 Done

| # | Wk | Task | Owner | Priority | Status |
|---|----|----|-------|----------|--------|
| 17 | 5-6 | Screen 1: Zero-Touch Onboarding (Black/Gold UI, Google Sync, DPDP badge) | Dev | Critical | [ ] |
| 18 | 5-6 | Screen 2: Main Dashboard (Protected amount, urgent carousel, countdown timers) | Dev | Critical | [ ] |
| 19 | 7-8 | Screen 3: Order Detail Modal (Receipt, RAG policy, Mark as Kept/Returned) | Dev | Critical | [ ] |
| 20 | 7-8 | Screen 4: Settings Vault (Revoke Gmail, consent timestamp, Delete All Data) | Dev | High | [ ] |
| 21 | 8 | Return Countdown — Money at Risk dashboard | Dev | Critical | [ ] |
| 22 | 9 | Evidence Locker — Secure photo/video storage | Dev | High | [ ] |
| 23 | 10 | Ghost-Buster Flagging — one-tap CNH reporting | Dev | High | [ ] |
| 24 | 11 | Good Shopper Rewards — auto-coupon issuance | Dev | Medium | [ ] |
| 25 | 11-12 | DPDP consent flow with timestamped logging | Dev | Critical | [ ] |
| 26 | 12 | CHECKPOINT: Feature-complete app ready for beta | Both | Critical | [ ] |

### PHASE 3: LAUNCH & GROWTH (Weeks 13-24) — 0/9 Done

| # | Wk | Task | Owner | Priority | Status |
|---|----|----|-------|----------|--------|
| 27 | 13-14 | Brand identity (logo, colors, social templates) | Founder | High | [ ] |
| 28 | 13-14 | Content strategy around Consumer Protection angle | Founder | High | [ ] |
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
| 36 | 25-28 | Launch B2B brand audit dashboard | Dev | High | [ ] |
| 37 | 28-30 | Sign first 20 pilot brand partnerships | Founder | Critical | [ ] |
| 38 | 30-32 | Build 3PL Benchmarking SaaS dashboard | Dev | High | [ ] |
| 39 | 32 | CHECKPOINT: 20 pilot brand partnerships secured | Both | Critical | [ ] |
| 40 | 33-36 | Launch Switching Matrix analytics | Dev | High | [ ] |
| 41 | 36-40 | Develop institutional data licensing packages | Founder | High | [ ] |
| 42 | 40-44 | Pitch CIBIL of Returns Trust API | Founder | Critical | [ ] |
| 43 | 41-44 | Build Trust API (usage-based pricing) | Dev | High | [ ] |
| 44 | 45-48 | Begin institutional data licensing conversations | Founder | High | [ ] |
| 45 | 48 | CHECKPOINT: 100K users, 20 brands, revenue validated | Both | Critical | [ ] |

---

## 🔑 KEY MILESTONES

| Target Week | Milestone | Status |
|-------------|-----------|--------|
| Week 4 | Gmail sync working, orders saving to Supabase | [~] In Progress — backend live, OAuth ready, needs end-to-end test |
| Week 12 | Feature-complete app ready for beta | [ ] Not Started |
| Week 16 | Closed beta launched (100+ users) | [ ] Not Started |
| Week 24 | 10K-50K users acquired | [ ] Not Started |
| Week 32 | 20 pilot brand partnerships secured | [ ] Not Started |
| Week 48 | SaaS + Trust API revenue validated | [ ] Not Started |

---

## 🔮 FUTURE BACKLOG (Do Not Build Yet)

- Android Notification Listener Service
- AI Escalation Email Engine
- B2B Analytics Dashboard
- Cross-Platform Switching Matrix

---

## 📋 WEEKLY LOG

| Week # | Date Range | Tasks Planned | Tasks Completed | Blockers | Key Decisions | Next Week Focus |
|--------|-----------|--------------|----------------|----------|---------------|-----------------|
| 1 | 2026-03-14/15 | Full Phase 1 build | #2,3,4,5,6,7,8,9,10,11,12,13,14,15 — 13/16 tasks complete. Backend LIVE. All routes wired. Gemini+RAG+Gmail+Supabase all connected. | Task #1 (domain) still pending. Task #16 needs end-to-end OAuth test with real Gmail. | Vite confirmed. Monorepo locked. FastAPI + venv pattern locked. PORT secret removed. Old Google OAuth secret removed. | End-to-end test: connect Gmail → sync → verify orders in Supabase → Task #16 checkpoint |

---

*This is the single source of truth for Returnkart.in. Update the Sprint Tracker and Weekly Log every week.*
