# 🤖 AI-Powered Customer Support System

Multi-agent customer support built with **Hono**, **React**, **Vercel AI SDK**, **Gemini AI**, **PostgreSQL**, and **Prisma ORM**.

---

## How It Works

```
Your message
     ↓
Router Agent (Gemini Flash — fast routing)
     ↓ classifies intent
┌────────────────────────────────────┐
│  📦 Order Agent   → DB tools       │  "Where is ORD-001?"
│  💳 Billing Agent → DB tools       │  "Check my refund"
│  💬 Support Agent → FAQ tools      │  "Return policy?"
└────────────────────────────────────┘
     ↓
Streams response back to you
     ↓
Saves to PostgreSQL via Prisma (conversation memory)
```

---

## Prerequisites

Make sure these are installed before starting:

- **Node.js v18+** — https://nodejs.org
- **PostgreSQL** — https://www.postgresql.org/download (install and start it)

---

## 🚀 Setup — 4 Steps

### Step 1 — Get a FREE Gemini API key (30 seconds)

1. Go to **https://aistudio.google.com/app/apikey**
2. Click **"Create API key"**
3. Copy the key — it starts with `AIza...`

> No credit card needed. Free tier is generous.

---

### Step 2 — Create the PostgreSQL database

Open a terminal and run:

```bash
psql -U postgres -c "CREATE DATABASE ai_support_db;"
```

If that gives a "command not found" error, try:

```bash
# macOS (Homebrew install)
/usr/local/bin/psql -U postgres -c "CREATE DATABASE ai_support_db;"

# Windows — open pgAdmin or run:
# "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -c "CREATE DATABASE ai_support_db;"
```

> **Default credentials**: The project assumes PostgreSQL user `postgres` with password `postgres` on `localhost:5432`.
> If your PostgreSQL uses different credentials, update `DATABASE_URL` in Step 3.

---

### Step 3 — Configure environment

```bash
cd apps/backend
cp .env.example .env
```

Open `apps/backend/.env` — it will look like this:

```env
GOOGLE_GENERATIVE_AI_API_KEY="AIza-your-key-here"
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ai_support_db"
PORT=3000
NODE_ENV=development
```

**Two things to update:**
1. Paste your Gemini API key
2. If your PostgreSQL password is not `postgres`, change it in `DATABASE_URL`

---

### Step 4 — Install, migrate, seed, and run

Run these commands one by one from the **project root**:

```bash
# 1. Install all dependencies
npm install

# 2. Run database migration (creates all tables)
cd apps/backend
npx prisma migrate dev --name init

# 3. Seed demo data (orders, payments, FAQs)
npm run db:seed

# 4. Go back to root and start everything
cd ../..
npm run dev
```

**Done!** Open **http://localhost:5173** 🎉

---

## Try These Prompts

| What to type | Which agent answers |
|---|---|
| `Where is my order ORD-001?` | 📦 Order Agent |
| `Track TRK-9876543210` | 📦 Order Agent |
| `Show me all my orders` | 📦 Order Agent |
| `What's my refund status for PAY-004?` | 💳 Billing Agent |
| `Show me my payment history` | 💳 Billing Agent |
| `I need my invoice for PAY-001` | 💳 Billing Agent |
| `What is your return policy?` | 💬 Support Agent |
| `How long does shipping take?` | 💬 Support Agent |
| `Do products have a warranty?` | 💬 Support Agent |

---

## Demo Data (pre-seeded)

| Type | Data |
|---|---|
| **User ID** | `user_demo` |
| **Orders** | ORD-001 (shipped), ORD-002 (delivered), ORD-003 (pending), ORD-004 (cancelled) |
| **Tracking** | TRK-9876543210 → ORD-001 |
| **Payments** | PAY-001, PAY-002, PAY-003, PAY-004 (refunded), PAY-SUB-001 |
| **FAQs** | Shipping, returns, account, product warranty |

---

## API Endpoints

```
POST   /api/chat/conversations          Create a new conversation
GET    /api/chat/conversations?userId=X List conversations
GET    /api/chat/conversations/:id      Get conversation + messages
DELETE /api/chat/conversations/:id      Delete conversation
POST   /api/chat/messages               Send message (non-streaming)
POST   /api/chat/messages/stream        Send message (streaming SSE)
GET    /api/agents                      List agents
GET    /api/agents/:type/capabilities   Get agent tools & examples
GET    /api/health                      Health check
```

---

## Project Structure

```
ai-support-system/
├── apps/
│   ├── backend/
│   │   ├── prisma/
│   │   │   ├── schema.prisma        ← PostgreSQL schema (Prisma ORM)
│   │   │   └── seed.ts              ← Demo data
│   │   └── src/
│   │       ├── controllers/
│   │       │   ├── chat.controller.ts
│   │       │   └── agents.controller.ts
│   │       ├── services/
│   │       │   ├── chat.service.ts         ← Core business logic
│   │       │   ├── agents/
│   │       │   │   ├── router.agent.ts     ← Routes queries (Gemini Flash)
│   │       │   │   ├── order.agent.ts      ← Order specialist
│   │       │   │   ├── billing.agent.ts    ← Billing specialist
│   │       │   │   └── support.agent.ts    ← Support specialist
│   │       │   └── tools/
│   │       │       ├── order.tools.ts
│   │       │       ├── billing.tools.ts
│   │       │       └── support.tools.ts
│   │       ├── middleware/
│   │       │   ├── error.middleware.ts
│   │       │   └── rateLimit.middleware.ts
│   │       └── lib/prisma.ts
│   │
│   └── frontend/
│       └── src/
│           ├── api/client.ts
│           ├── hooks/useStreamingChat.ts
│           └── components/
│               ├── ChatWindow.tsx
│               ├── ConversationList.tsx
│               ├── MessageBubble.tsx
│               ├── TypingIndicator.tsx
│               └── AgentBadge.tsx
│
└── packages/
    └── shared/src/index.ts     ← Shared types (frontend + backend)
```

---

## Running Tests

```bash
cd apps/backend
npm test
```

---

## Troubleshooting

**"GOOGLE_GENERATIVE_AI_API_KEY is missing"**
→ Make sure you created `apps/backend/.env` (copy from `.env.example`) and pasted your key.

**"Connection refused" / database errors**
→ Make sure PostgreSQL is running:
```bash
# macOS
brew services start postgresql

# Windows — open Services → start "postgresql-x64-16"
# or use pgAdmin: right-click server → Connect
```

**"database ai_support_db does not exist"**
```bash
psql -U postgres -c "CREATE DATABASE ai_support_db;"
```

**"password authentication failed"**
→ Edit `DATABASE_URL` in `apps/backend/.env`:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/ai_support_db"
```

**Port 3000 already in use**
```bash
# Mac/Linux
lsof -ti:3000 | xargs kill -9
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F
```

**Reset everything (wipe DB and re-seed)**
```bash
cd apps/backend
npm run db:reset
```

**View database visually**
```bash
cd apps/backend
npx prisma studio
# Opens at http://localhost:5555
```

---

## Architecture Decisions

**Why Multi-Agent instead of Single Agent?**
Specialized agents with focused system prompts and relevant tools perform better than one agent trying to handle everything.

**Why PostgreSQL + Prisma?**
PostgreSQL supports native JSON columns (`items`, `toolsUsed`) and arrays (`tags`) properly. Prisma provides type-safe queries, automatic migrations, and good DX.

**Why Gemini Flash for routing?**
The router only classifies intent. Fast + cheap Flash model for routing, more capable Pro model for actual agent reasoning.

**Why Controller-Service pattern?**
Controllers only handle HTTP. Services contain business logic — testable independently of the HTTP layer.

**Why Turborepo + Shared Types?**
`packages/shared` types are used by both frontend and backend. TypeScript catches mismatches at compile time.

**Why Streaming?**
Users see responses token-by-token. Tool calls are surfaced in real-time showing what the AI is doing.
