# Lumé AI-Native CRM
### Built for Xeno Engineering Assignment

A fully deployed, AI-powered CRM that helps a D2C skincare brand (Lumé) reach its shoppers intelligently — through natural language segmentation, personalized messaging, and real-time campaign analytics.

---

## Live Demo

| Service | URL |
|---|---|
| CRM App | `https://your-crm.vercel.app` |
| Channel Stub | `https://your-stub.onrender.com` |
| Health Check | `https://your-stub.onrender.com/health` |

---

## What It Does

The marketer opens a chat and types in plain English:

> *"Reach customers in Mumbai who bought serum in the last 60 days and offer them 15% off"*

The AI then:
1. Builds the customer segment automatically from the database
2. Shows the audience count (e.g. 47 customers)
3. Drafts a personalized WhatsApp message with `{{name}}` substitution
4. Shows a real message preview with an actual customer's name
5. Launches the campaign with one click
6. Stats update live as the channel stub fires delivery callbacks

---

## Features

### AI Chat (Centrepiece)
- Natural language to customer segment — no manual filter building
- AI drafts personalized messages based on the segment and offer
- Real customer name shown in message preview before launch
- Campaign performance analysis — ask "how did my last campaign do?"
- Smart segment suggestions based on data patterns
- Full chat history saved with date and time

### Customer Management
- 500 seeded customers with realistic Indian names, cities, phone numbers
- ~2000 orders across 10 skincare product categories
- Paginated table with city filter and live search
- Customer avatars with color-coded initials

### Campaign Management
- Campaign creation entirely through AI chat
- Live stats auto-refresh every 2.5 seconds while sending
- Delivered / Opened / Clicked / Failed breakdown per campaign
- Progress bars showing conversion rates

### Dashboard
- KPI cards: total customers, campaigns, delivery rate, open rate
- Engagement funnel visualization (Sent → Delivered → Opened → Clicked)
- Customers by city breakdown
- Top product categories by orders
- Recent campaigns with delivery and open rates

### Chat History
- Every AI conversation saved with full message thread
- Date and time of each session recorded
- Click any session to replay the full conversation
- Summary label for each session

### Send → Callback Loop (System Design Showcase)
- CRM calls channel stub `POST /send` for each message
- Stub simulates async delivery (1–4 second random delay)
- Stub fires callbacks back to CRM `POST /api/receipt/callback`
- Outcomes: delivered (82%), failed (18%)
- Follow-up events: opened (58% of delivered), clicked (22% of opened)
- Idempotent callback handling — duplicate events are safely ignored
- Status upgrade logic — messages only move forward, never backward
- Retry on callback failure — retries once after 5 seconds

---

## Architecture

```
┌─────────────────────────────────────┐     ┌──────────────────────────┐
│         CRM (Vercel)                │     │  Channel Stub (Render)   │
│                                     │     │                          │
│  Next.js App Router                 │     │  Express.js              │
│  ├── /app (UI pages)                │     │  ├── POST /send          │
│  │   ├── / (Dashboard)              │     │  │   └── accepts message  │
│  │   ├── /customers                 │     │  ├── simulate()          │
│  │   ├── /campaigns                 │────▶│  │   └── random delay     │
│  │   ├── /chat (AI centrepiece)     │     │  └── callback()          │
│  │   └── /history                   │     │      └── fires events    │
│  │                                  │◀────│                          │
│  ├── /app/api (API routes)          │     └──────────────────────────┘
│  │   ├── /ai/chat                   │
│  │   ├── /campaigns                 │     ┌──────────────────────────┐
│  │   ├── /customers                 │     │  Neon PostgreSQL (Free)  │
│  │   ├── /send                      │     │  ├── Customer            │
│  │   ├── /receipt/callback          │────▶│  ├── Order               │
│  │   ├── /segment/preview           │     │  ├── Campaign            │
│  │   └── /chat-sessions             │     │  ├── CampaignMessage     │
│  │                                  │     │  ├── MessageEvent        │
│  └── /lib/db.ts (Prisma client)     │     │  └── ChatSession         │
│                                     │     └──────────────────────────┘
│  AI: Groq API (Llama 3.3 70B)       │
└─────────────────────────────────────┘
```

---

## Tech Stack

### Next.js 14 (App Router)
**Where:** Entire CRM — UI pages and API routes in one project  
**Why:** Full-stack in a single repo reduces deployment complexity. App Router enables server components for fast data fetching on dashboard and customer pages without client-side loading. API routes eliminate the need for a separate backend service at this scope.

### Prisma ORM
**Where:** `xeno-crm/lib/db.ts` and all API routes  
**Why:** Type-safe database queries with zero SQL. Auto-generated TypeScript types mean every query is validated at compile time. Migration system keeps schema in sync across environments. At scale this would be replaced with a query builder like Drizzle for better performance.

### Neon PostgreSQL (Free Tier)
**Where:** Cloud-hosted database for all persistent data  
**Why:** Free serverless PostgreSQL with no expiry, no credit card. Supports connection pooling. The relational model is the right fit for this data — customers have orders, campaigns have messages, messages have events. Alternative was SQLite but that doesn't work on serverless deployments.

### Groq API (Llama 3.3 70B)
**Where:** `app/api/ai/chat/route.ts`  
**Why:** Free hosted inference API with no credit card required. Llama 3.3 70B is genuinely powerful — it handles SQL filter generation, message drafting, and campaign analysis accurately. Groq's hardware acceleration makes responses fast (under 2 seconds). The integration is abstracted behind a single file so swapping to Claude or GPT-4 is a one-line change.

### Express.js (Channel Stub)
**Where:** `channel-stub/src/index.js` — separate service  
**Why:** Kept deliberately separate from the CRM to mirror real-world architecture where channel providers (WhatsApp, SMS) are third-party services with their own delivery infrastructure. The stub simulates the full async lifecycle: accept → delay → deliver → engage. This separation is intentional — it demonstrates understanding of callback-driven architecture.

### Vercel
**Where:** Hosts the CRM Next.js app  
**Why:** Zero-config deployment from GitHub. Automatic SSL, global CDN, instant redeploys on push. Free hobby tier covers this scope. Serverless functions handle API routes with no server management.

### Render.com
**Where:** Hosts the channel stub Express service  
**Why:** Free tier for long-running Node.js services. Vercel doesn't support long-running Express servers — it's serverless only. Render supports persistent processes needed for the stub's async callback simulation. Note: free tier spins down after 15 minutes of inactivity — wake it up before demo by hitting `/health`.

### Tailwind CSS + Inline Styles
**Where:** All UI components  
**Why:** Tailwind for utility classes, inline styles for complex dynamic values (colors, widths based on percentages). This hybrid approach keeps components readable without a separate CSS file for every component.

---

## Data Model

```prisma
Customer        — 500 seeded Indian skincare customers
  id, name, email, phone, city, createdAt

Order           — ~2000 orders across 10 categories
  id, customerId, productName, category, amount, orderedAt
  categories: serum, moisturizer, sunscreen, night-cream,
              toner, mask, oil, eye-care, lip-care

Campaign        — Created via AI chat
  id, name, segmentQuery (JSON), messageTemplate,
  channel, status, audienceCount, createdAt

CampaignMessage — One row per customer per campaign
  id, campaignId, customerId, body, status, createdAt
  statuses: queued → sent → delivered → opened → clicked / failed

MessageEvent    — Immutable event log from channel stub callbacks
  id, messageId, eventType, occurredAt

ChatSession     — Saved AI conversations
  id, messages (JSON), summary, createdAt, updatedAt
```

---

## Send → Callback Loop (How It Works)

```
1. Marketer clicks Launch in AI chat
2. POST /api/campaigns → creates Campaign + CampaignMessage rows
3. POST /api/send → marks campaign "sending"
      for each message:
        → updates status to "sent"
        → POST channel-stub/send (async, non-blocking)
4. Channel stub receives message
        → waits 1–4 seconds (simulates network)
        → picks outcome: delivered (82%) or failed (18%)
        → POST /api/receipt/callback { messageId, eventType }
5. Receipt endpoint:
        → checks idempotency (skips duplicates)
        → records MessageEvent row
        → upgrades CampaignMessage status if rank is higher
6. Channel stub fires follow-up events with delays:
        → opened  (58% of delivered, after 4s)
        → clicked (22% of opened, after 9s)
7. Campaigns page auto-refreshes every 2.5s
        → reads fresh stats from DB
        → shows live delivered/opened/clicked numbers
```

---

## AI Integration (How It Works)

```
Marketer types: "Reach Mumbai customers who bought serum in 60 days"
        ↓
Groq (Llama 3.3 70B) receives:
  - System prompt with DB schema and brand context
  - Full conversation history
  - Intent detection flags (stats query? suggestion request?)
        ↓
AI responds with:
  - Conversational explanation
  - Structured segment block (JSON parsed by API)
        ↓
/api/segment/preview runs the filters against DB
        → returns customerIds + count
        ↓
/api/customers/preview fetches one real customer
        → shown in message preview card
        ↓
Marketer clicks Launch
        → /api/campaigns creates campaign
        → /api/send fires messages
        → Chat session saved to DB with timestamp
```

---

## Tradeoffs Made

| Decision | What I Did | What I'd Do At Scale |
|---|---|---|
| Job queue | Simple async setTimeout | BullMQ + Redis with retry queues |
| Auth | No auth (single user) | NextAuth with multi-tenant row-level security |
| AI provider | Groq free tier | Abstract provider, swap to Claude/GPT-4 based on cost/quality |
| Callback ordering | Best-effort rank check | Strict state machine per message |
| Channel stub | Single service, all channels | Separate stub per channel with channel-specific event models |
| DB connection | Direct Prisma connection | Connection pooling via PgBouncer at scale |
| Segment building | In-memory JS filtering | SQL WHERE clause generation for large datasets |

---

## Project Structure

```
AI-Native-CRM/
├── xeno-crm/                    # CRM application (deployed to Vercel)
│   ├── app/
│   │   ├── page.tsx             # Dashboard with KPIs and funnel
│   │   ├── customers/page.tsx   # Customer list with search and filter
│   │   ├── campaigns/page.tsx   # Campaign stats with live refresh
│   │   ├── chat/page.tsx        # AI chat interface (centrepiece)
│   │   ├── history/page.tsx     # Saved chat sessions
│   │   └── api/
│   │       ├── ai/chat/         # Groq integration + segment parsing
│   │       ├── campaigns/       # Campaign CRUD + stats aggregation
│   │       ├── customers/       # Paginated customer list + preview
│   │       ├── send/            # Campaign dispatch to channel stub
│   │       ├── receipt/callback/# Callback ingestion + idempotency
│   │       ├── segment/preview/ # Filter customers, return IDs + count
│   │       └── chat-sessions/   # Save and retrieve chat history
│   ├── components/
│   │   └── Sidebar.tsx          # Navigation with active state
│   ├── lib/
│   │   └── db.ts                # Prisma client singleton
│   └── prisma/
│       ├── schema.prisma        # Full data model
│       └── seed.ts              # 500 customers + 2000 orders
│
└── channel-stub/                # Simulated channel service (deployed to Render)
    └── src/
        └── index.js             # POST /send → simulate → POST /callback
```

---

## Setup (Local)

```bash
# 1. Clone the repo
git clone https://github.com/lakshmipravallika19145/AI-Native_CRM.git
cd AI-Native_CRM

# 2. Set up CRM
cd xeno-crm
npm install
cp .env.example .env   # fill in DATABASE_URL and GROQ_API_KEY
npx prisma db push
npx prisma db seed
npm run dev            # runs on localhost:3000

# 3. Set up channel stub (new terminal)
cd ../channel-stub
npm install
CRM_URL=http://localhost:3000 node src/index.js   # runs on localhost:4000
```

---

## Environment Variables

### xeno-crm/.env
```
DATABASE_URL=postgresql://...@neon.tech/neondb?sslmode=require
DIRECT_URL=postgresql://...@neon.tech/neondb?sslmode=require
GROQ_API_KEY=gsk_...
CHANNEL_STUB_URL=https://your-stub.onrender.com
NEXT_PUBLIC_APP_URL=https://your-crm.vercel.app
```

### channel-stub (Render environment)
```
CRM_URL=https://your-crm.vercel.app
PORT=4000
```

---

## Known Limitations

- **Render free tier** spins down after 15 minutes of inactivity. Hit `https://your-stub.onrender.com/health` once before running a demo to wake it up.
- **Segment filtering** runs in-memory JS — works fine for 1000 customers, would need SQL WHERE generation for 100k+ customers.
- **No auth** — single-user demo. Multi-tenant auth would use NextAuth + Postgres row-level security.
- **College WiFi** blocks port 5432 locally — use mobile hotspot for local development. The deployed Vercel URL works on all networks.
