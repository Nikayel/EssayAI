# EssayEdge AI - Technical Specification

**Version:** 1.0
**Last Updated:** 2024-11-23
**Status:** Active Development (MVP → v1)

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture](#2-architecture)
3. [Data Model](#3-data-model)
4. [AI Engine Specification](#4-ai-engine-specification)
5. [API Specifications](#5-api-specifications)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [Payment Processing](#7-payment-processing)
8. [Performance Requirements](#8-performance-requirements)
9. [Security & Compliance](#9-security--compliance)
10. [Deployment Strategy](#10-deployment-strategy)
11. [Monitoring & Observability](#11-monitoring--observability)
12. [Future Enhancements](#12-future-enhancements)

---

## 1. System Overview

### 1.1 Purpose

EssayEdge AI provides AI-powered essay analysis and optional human review for college applicants, focusing on:
- Preserving student voice
- Providing structured, actionable feedback
- Transparent scoring via 7-dimension rubric
- Tiered monetization (Free → AI Lite → AI Pro → Human Review)

### 1.2 Core Principles

1. **Voice Preservation First**: Never ghostwrite. All suggestions must maintain student authenticity.
2. **Structured Feedback**: Consistent rubric scoring for transparency and progress tracking.
3. **Fast Time-to-Feedback**: <15s for Commons Check, <60s for full AI analysis.
4. **Privacy-First**: No essays used to train models without explicit opt-in.
5. **Scalable Architecture**: Serverless-first, pay-per-use AI costs.

---

## 2. Architecture

### 2.1 High-Level Architecture

```
┌──────────────────┐
│   Vercel Edge    │ ← Next.js 14 (App Router)
│    + Middleware  │   - SSR/SSG pages
│                  │   - Auth checks
└────────┬─────────┘
         │
    ┌────▼─────┐
    │  Next.js │
    │  API     │ ← Serverless Functions
    │  Routes  │   - /api/essays
    │          │   - /api/analyze
    │          │   - /api/rewrite
    │          │   - /api/stripe/*
    └────┬─────┘
         │
    ┌────▼─────────────────────┐
    │                          │
    │  External Services       │
    │  ┌──────────┐           │
    │  │ Anthropic│ ← Claude  │
    │  └──────────┘           │
    │  ┌──────────┐           │
    │  │ OpenAI   │ ← Embeddings
    │  └──────────┘           │
    │  ┌──────────┐           │
    │  │ Stripe   │ ← Payments│
    │  └──────────┘           │
    │  ┌──────────┐           │
    │  │ Supabase │ ← DB/Auth │
    │  └──────────┘           │
    └──────────────────────────┘
```

### 2.2 Tech Stack Rationale

| Component | Choice | Rationale |
|-----------|--------|-----------|
| **Frontend Framework** | Next.js 14 (App Router) | SSR, API routes, edge middleware, Vercel-optimized |
| **Language** | TypeScript | Type safety, developer experience |
| **Styling** | Tailwind CSS + Shadcn/ui | Utility-first, accessible components |
| **ORM** | Prisma | Type-safe queries, migrations, PostgreSQL support |
| **Database** | PostgreSQL (Supabase) | Relational data, JSONB for flexible storage, free tier |
| **Auth** | Supabase Auth | Email/password, row-level security, JWT |
| **AI - Analysis** | Anthropic Claude | Best-in-class reasoning, large context window |
| **AI - Embeddings** | OpenAI text-embedding-3-small | Cost-effective, high-quality embeddings |
| **Payments** | Stripe | Industry standard, comprehensive webhooks |
| **Validation** | Zod | Runtime + compile-time validation |

### 2.3 Component Breakdown

#### Frontend (Next.js App Router)
- **Pages**: `/`, `/pricing`, `/login`, `/signup`, `/dashboard`, `/essay/[id]`
- **API Routes**: `/api/essays`, `/api/analyze`, `/api/rewrite`, `/api/stripe/*`
- **Middleware**: Auth checks, session refresh
- **Components**: Shadcn/ui (Button, Card, Input, etc.) + custom (EssayEditor, AnalysisResults, ScoreCard)

#### Backend Services
- **Prisma Client**: Database abstraction
- **AI Analyzer**: Orchestrates Claude/OpenAI calls
- **Stripe Handler**: Checkout + webhook processing

---

## 3. Data Model

### 3.1 Core Entities

See `prisma/schema.prisma` for full schema. Key models:

**User**
```prisma
id: String (cuid)
email: String (unique)
role: UserRole (STUDENT | REVIEWER | ADMIN)
createdAt: DateTime
```

**Essay**
```prisma
id: String
userId: String
type: EssayType (PERSONAL_STATEMENT | WHY_US | SUPPLEMENTAL | ACTIVITY)
promptText: String
targetSchool: String?
wordLimit: Int?
versions: EssayVersion[]
```

**EssayVersion** (immutable)
```prisma
id: String
essayId: String
content: String (Text)
versionIndex: Int
toneEmbedding: Json? (number[])
analyses: AIAnalysis[]
rewrites: Rewrite[]
```

**AIAnalysis**
```prisma
id: String
versionId: String
analysisJson: Json (full AnalysisResponse)
overallScore: Float (0-100)
modelRef: String (e.g., "claude-3-5-sonnet-20241022")
commonsFlags: CommonsFlag[]
```

**Order**
```prisma
id: String
userId: String
package: Package
price: Int (cents)
status: OrderStatus (PENDING | PAID | COMPLETED | REFUNDED)
stripeSessionId: String?
```

### 3.2 Relationships

- User → Essays (1:N)
- Essay → EssayVersions (1:N)
- EssayVersion → AIAnalyses (1:N)
- EssayVersion → Rewrites (1:N)
- User → Orders (1:N)
- Order → Reviews (1:N)

### 3.3 Indexing Strategy

**Critical Indexes:**
- `User.email` (unique, auth lookups)
- `Essay.userId` (list user's essays)
- `EssayVersion.essayId` (fetch versions)
- `Order.userId + Order.status` (user orders, payment status)
- `AIAnalysis.versionId` (fetch analysis for version)

**Performance Target:** <50ms for indexed queries.

---

## 4. AI Engine Specification

### 4.1 Models Used

| Use Case | Model | Max Tokens | Temperature | Avg Latency | Cost/1M tokens |
|----------|-------|------------|-------------|-------------|----------------|
| Commons Check | claude-3-haiku-20240307 | 2048 | 0.3 | <5s | $0.25 |
| Full Analysis | claude-3-5-sonnet-20241022 | 4096 | 0.3 | <15s | $3.00 |
| Rewrites | claude-3-5-sonnet-20241022 | 4096 | 0.5 | <15s | $3.00 |
| Embeddings | text-embedding-3-small | - | - | <2s | $0.02 |

### 4.2 Prompt Engineering

**System Prompts:**
- **Analysis**: "You are a college essay coach and admissions reader. Provide structured feedback that preserves the student's voice. Return valid JSON only."
- **Rewrite**: "You improve clarity, structure, and specificity while preserving writer voice. Show paragraph-level rewrites only. No new stories."

**User Prompt Structure:**
```
Context:
- Essay type: {{type}}
- School: {{school}}
- Prompt: {{prompt_text}}
- Word limit: {{word_limit}}
- Tone sample: {{tone_sample}}

Task: Analyze the essay per JSON schema...

Essay:
{{essay_content}}
```

### 4.3 JSON Schema Validation

All AI responses validated with Zod schemas:
- `AnalysisResponseSchema`
- `RewriteResponseSchema`
- `CommonsCheckSchema`

**Error Handling:**
1. Parse JSON (handle markdown code blocks)
2. Validate with Zod
3. On error: retry up to 3 times with exponential backoff
4. Fallback parser for partial JSON

### 4.4 Scoring Algorithm

**Rubric Weights:**
- Authenticity: 20%
- Reflection: 20%
- Structure: 15%
- Specificity/Fit: 15%
- Clarity/Style: 10%
- Mechanics: 10%
- Ethics: 10%

**Calculation:**
```typescript
rawScore = Σ(dimension_score * weight)
overallScore = (rawScore / 6) * 100
```

**Example:**
```
Authenticity: 5/6 * 0.20 = 1.0
Reflection: 4/6 * 0.20 = 0.8
...
Total: 4.5
Overall: (4.5 / 6) * 100 = 75
```

### 4.5 Tone Preservation

**Process:**
1. User provides 150-250 word tone sample
2. Generate embedding: `OpenAI.embeddings.create(model: "text-embedding-3-small")`
3. Store in `Profile.toneEmbedding`
4. For each essay version:
   - Generate embedding
   - Calculate cosine similarity
   - If similarity < 0.75 → flag `tone_drift`
   - Include in analysis

**Threshold Tuning:**
- Default: 0.75
- Adjustable per user (Pro feature)

---

## 5. API Specifications

### 5.1 Essays API

**POST /api/essays**
- **Auth**: Required
- **Body**:
  ```json
  {
    "type": "PERSONAL_STATEMENT",
    "promptText": "Discuss a challenge...",
    "targetSchool": "Stanford",
    "wordLimit": 650,
    "content": "When I was twelve..."
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "essay": {
      "id": "essay_123",
      "type": "PERSONAL_STATEMENT",
      "versionId": "version_456"
    }
  }
  ```
- **Rate Limit**: 10 req/min per user

**GET /api/essays**
- **Auth**: Required
- **Response**: Array of essays with latest version + analysis

**GET /api/essays/[id]**
- **Auth**: Required (ownership check)
- **Response**: Essay with all versions, analyses, rewrites

**DELETE /api/essays/[id]**
- **Auth**: Required (ownership check)
- **Response**: `{ success: true }`

### 5.2 Analysis API

**POST /api/analyze**
- **Auth**: Required
- **Body**:
  ```json
  {
    "versionId": "version_456",
    "analysisType": "full",
    "toneSample": "optional tone sample text"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "type": "full",
    "analysisId": "analysis_789",
    "result": { /* AnalysisResponse */ }
  }
  ```
- **SLA**: <60s P95
- **Rate Limit**: 5 req/min (Commons Check unlimited for free tier)

**Package Checks:**
- `commons_check`: Free (1 per account) or any paid tier
- `full`: AI Lite, AI Pro, or Human packages only

### 5.3 Rewrite API

**POST /api/rewrite**
- **Auth**: Required
- **Package**: AI Pro or higher
- **Body**:
  ```json
  {
    "versionId": "version_456",
    "goals": ["tighten_intro", "show_specificity"],
    "toneSample": "optional"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "rewriteId": "rewrite_012",
    "result": { /* RewriteResponse */ },
    "toneComparison": { /* if toneSample provided */ }
  }
  ```

### 5.4 Stripe API

**POST /api/stripe/checkout**
- **Auth**: Required
- **Body**:
  ```json
  {
    "package": "AI_PRO_SINGLE",
    "essayId": "essay_123"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "sessionId": "cs_test_...",
    "url": "https://checkout.stripe.com/..."
  }
  ```
- **Redirect**: User to Stripe Checkout
- **Success URL**: `/dashboard?payment=success&order=order_456`
- **Cancel URL**: `/pricing?payment=cancelled`

**POST /api/webhook/stripe**
- **Auth**: Stripe signature verification
- **Events Handled**:
  - `checkout.session.completed` → Update order to PAID
  - `checkout.session.expired` → Update order to CANCELLED
  - `charge.refunded` → Create refund record, update order

---

## 6. Authentication & Authorization

### 6.1 Authentication Flow

**Supabase Auth + Next.js Middleware**

1. User signs up/logs in via Supabase Auth
2. JWT stored in httpOnly cookie
3. Middleware (`middleware.ts`) verifies session on each request
4. Protected routes redirect to `/login` if unauthenticated

**Implementation:**
```typescript
// middleware.ts
const { data: { user } } = await supabase.auth.getUser();
if (!user && isProtectedRoute) {
  return NextResponse.redirect('/login');
}
```

### 6.2 Authorization Levels

| Role | Permissions |
|------|-------------|
| **STUDENT** | Create essays, purchase packages, view own data |
| **REVIEWER** | View assigned reviews, submit feedback |
| **ADMIN** | All permissions, manage users, pricing, templates |

**Row-Level Security (Supabase):**
- Essays: `userId = auth.uid()`
- Orders: `userId = auth.uid()`
- Reviews: `reviewerId = auth.uid()` OR `order.userId = auth.uid()`

### 6.3 API Key Security

**Environment Variables:**
- `ANTHROPIC_API_KEY`: Server-side only
- `OPENAI_API_KEY`: Server-side only
- `STRIPE_SECRET_KEY`: Server-side only
- `SUPABASE_SERVICE_ROLE_KEY`: Admin operations only

**Never** expose in client-side code.

---

## 7. Payment Processing

### 7.1 Stripe Integration

**Checkout Flow:**
1. User clicks "Purchase" → `POST /api/stripe/checkout`
2. Server creates Stripe Checkout Session
3. User redirected to Stripe-hosted checkout
4. Payment processed
5. Webhook `checkout.session.completed` → Update order status
6. User redirected to success URL

**Webhook Security:**
- Verify signature: `stripe.webhooks.constructEvent(body, signature, secret)`
- Idempotency: Check if order already processed

**Refund Policy:**
- 24-hour cooling-off period: Full refund if no human work started
- SLA miss: Partial refund (prorated)
- Process: `POST /api/admin/refund` → Stripe API → Update order + create refund record

### 7.2 Pricing Configuration

Stored in `lib/stripe/config.ts`:
```typescript
export const PRICING = {
  AI_LITE: 900, // $9
  AI_PRO_SINGLE: 2900,
  HUMAN_FULL_3: 27900,
  // ...
};
```

**Dynamic Pricing:**
- Add/update in config
- No database changes needed
- Stripe products created on-demand via API

---

## 8. Performance Requirements

### 8.1 Latency Targets

| Endpoint | P50 | P95 | P99 | Notes |
|----------|-----|-----|-----|-------|
| Commons Check | <5s | <10s | <15s | Haiku is fast |
| Full Analysis | <15s | <60s | <90s | Depends on essay length |
| Essay Upload | <500ms | <1s | <2s | Database write only |
| Page Load (Dashboard) | <1s | <2s | <3s | SSR + data fetch |

### 8.2 Scalability

**Serverless Architecture:**
- Next.js API routes auto-scale on Vercel
- No fixed server costs
- Cold start: <500ms (with edge caching)

**Database:**
- Supabase free tier: 500 MB, 50 MB/s bandwidth
- Upgrade to Pro: Unlimited connections, auto-scaling
- Connection pooling via Prisma

**AI Costs:**
- Claude Sonnet: ~$0.03-0.05 per 650-word essay (analysis + rewrite)
- Embeddings: ~$0.0001 per essay
- **Target margin**: 60% on AI packages

### 8.3 Caching Strategy

**Static Pages:**
- Landing page: ISR (revalidate: 3600s)
- Pricing page: ISR (revalidate: 3600s)

**Dynamic Data:**
- No caching for user data (always fresh)
- School facts: In-memory cache (15 min TTL)

---

## 9. Security & Compliance

### 9.1 Data Protection

**Encryption:**
- At rest: Supabase default (AES-256)
- In transit: TLS 1.3
- API keys: Environment variables only

**PII Minimization:**
- No SSN, credit cards stored (Stripe handles)
- Email + name only
- Optional: Guardian email for <16 users

**Data Retention:**
- Essays: 18 months default
- User can request deletion anytime (GDPR/CCPA compliance)
- Soft delete: Mark as deleted, purge after 30 days

### 9.2 COPPA Compliance

**Age Gate:**
- Require DOB on signup
- If <13: Block
- If 13-15: Require parental consent (future feature)
- If 16+: Proceed (MVP)

**Parental Consent Flow (Future):**
1. Collect guardian email
2. Send verification link
3. Guardian approves
4. Student account activated

### 9.3 Content Moderation

**Auto-Flagging:**
- `ethics_risks` flag in AI analysis
- Keywords: hate speech, self-harm, illegal activity
- Reviewer: Manual review required before delivery

**Reviewer Guidelines:**
- No ghostwriting
- No rewriting entire sections
- Suggestions + rationale only

---

## 10. Deployment Strategy

### 10.1 Environments

| Environment | URL | Database | Stripe | Purpose |
|-------------|-----|----------|--------|---------|
| Development | localhost:3000 | Local Postgres or Supabase Dev | Test mode | Local dev |
| Staging | staging.essayedgeai.com | Supabase Staging | Test mode | QA |
| Production | essayedgeai.com | Supabase Prod | Live mode | Users |

### 10.2 CI/CD Pipeline

**GitHub Actions:**
```yaml
on: [push]
jobs:
  test:
    - npm install
    - npm run lint
    - npx prisma generate
    - npm run build
  deploy:
    - Deploy to Vercel (automatic on push to main)
```

**Database Migrations:**
- Dev: `npx prisma migrate dev`
- Prod: `npx prisma migrate deploy` (via Vercel build command)

### 10.3 Rollback Strategy

**Vercel:**
- Instant rollback to previous deployment (1-click)
- Database migrations: Manual rollback script

**Database:**
- Create migration: `npx prisma migrate dev --name rollback_xyz`
- Apply manually: `npx prisma migrate deploy`

---

## 11. Monitoring & Observability

### 11.1 Logging

**Vercel:**
- Function logs (stdout/stderr)
- Real-time logs in dashboard

**Supabase:**
- Query logs (slow queries >1s)
- Auth logs (failed logins)

**Custom Logging:**
```typescript
console.error('AI analysis failed', { versionId, error });
// Logged to Vercel Functions logs
```

### 11.2 Error Tracking

**Future: Sentry Integration**
```typescript
Sentry.captureException(error, {
  tags: { component: 'ai-analyzer' },
  user: { id: userId },
});
```

### 11.3 Metrics

**Key Metrics:**
- AI → Human conversion rate (target: 15%)
- Avg rubric lift (v0 → v1 → final)
- Time to first feedback (target: <60s)
- CSAT post-review (target: >4.5/5)
- Refund rate (target: <2%)
- Reviewer SLA compliance (target: >95%)

**Dashboard (Future):**
- Vercel Analytics for page views
- Custom admin dashboard for business metrics

---

## 12. Future Enhancements

### 12.1 v1 Features (Weeks 3-4)

1. **Dashboard UI**: Essay list, progress tracking, version comparison
2. **Essay Detail Page**: Full analysis results, score breakdowns, suggestions
3. **Diff Viewer**: Side-by-side comparison of original vs. rewrite
4. **Auth Pages**: Login/signup with email verification
5. **School-Fit Database**: Top 50 schools with facts JSON
6. **Reviewer Marketplace**: Assignment algorithm, SLA tracking

### 12.2 v2 Features (Future)

1. **Collaborative Sessions**: Share link with counselor (read-only)
2. **Multilingual Support**: Spanish, Mandarin (via Claude)
3. **Chrome Extension**: Analyze essays directly in Google Docs
4. **Recommendation Letters**: Read-only guidance (not writing)
5. **Mobile App**: React Native or PWA

### 12.3 Technical Debt

**Known Issues:**
- No rate limiting (use Vercel middleware + Upstash Redis)
- No email notifications (use Supabase Edge Functions + Resend)
- No real-time updates (use Supabase Realtime for review status)
- No A/B testing framework (add feature flags via LaunchDarkly or Vercel Edge Config)

---

## Appendix A: Example AI Response

**Full Analysis JSON:**
```json
{
  "meta": {
    "essay_type": "personal_statement",
    "word_count": 632,
    "prompt": "Discuss a challenge you overcame",
    "school": "Stanford"
  },
  "scores": {
    "authenticity": {
      "score": 5,
      "rationales": [
        "Voice feels genuine and personal",
        "Specific details unique to the applicant"
      ]
    },
    "reflection": {
      "score": 4,
      "rationales": [
        "Shows growth mindset",
        "Could deepen insight into what was learned"
      ]
    },
    // ... other dimensions
  },
  "commons_check": {
    "about_applicant": {
      "flag": true,
      "evidence": ["I learned...", "My journey..."]
    },
    "buzzwords_cliches": {
      "flag": true,
      "phrases": ["passion", "journey"]
    },
    // ... other flags
  },
  "suggestions": {
    "top5": [
      {
        "issue": "Intro is too generic",
        "why_it_matters": "Admissions readers need a hook in the first sentence",
        "example_edit": "Instead of 'I've always loved science,' try 'The microscope slides were smudged, but I could still see...'"
      },
      // ... 4 more
    ],
    "outline_fix": [
      "Move the climax (moment of realization) earlier in the narrative",
      "Add a concrete example of how this experience changed your approach to teamwork"
    ],
    "sentence_level": [
      {
        "from": "I was very nervous about presenting",
        "to": "My hands shook as I clicked to the first slide"
      }
    ]
  },
  "overall": {
    "score_100": 78,
    "summary": "Strong voice and narrative structure. To improve: deepen reflection, add specificity, reduce clichés.",
    "next_actions_checklist": [
      "Replace clichés ('passion,' 'journey') with concrete details",
      "Tighten intro (start with action or vivid scene)",
      "Add 1-2 sentences showing how this experience connects to Stanford's collaborative culture"
    ]
  }
}
```

---

**End of Technical Specification**
