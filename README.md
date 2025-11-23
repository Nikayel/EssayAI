# EssayEdge AI

> Transform college application essays through structured AI scoring and optional human review. Preserve student voice while delivering actionable feedback.

## 🎯 Project Overview

**EssayEdge AI** is a full-stack SaaS platform that helps students improve their college application essays using:
- **AI-powered analysis** (Claude Sonnet & Haiku)
- **7-dimension rubric scoring** (authenticity, reflection, structure, specificity, clarity, mechanics, ethics)
- **Voice preservation** through tone embeddings and comparison
- **Optional human review** from vetted editors
- **Version tracking** to monitor progress across drafts

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Shadcn/ui components
- Zustand (state management, if needed)

**Backend:**
- Next.js API Routes (serverless)
- Prisma ORM
- PostgreSQL (via Supabase)

**AI/ML:**
- Anthropic Claude (Sonnet for analysis, Haiku for fast checks)
- OpenAI (embeddings for tone comparison)
- Structured JSON validation with Zod

**Payments:**
- Stripe Checkout + Webhooks

**Auth:**
- Supabase Auth (email/password)

**Hosting:**
- Vercel (recommended)
- Supabase for database + storage

## 📁 Project Structure

```
├── app/
│   ├── api/
│   │   ├── essays/          # Essay CRUD
│   │   ├── analyze/         # AI analysis endpoint
│   │   ├── rewrite/         # Rewrite suggestions
│   │   ├── stripe/          # Payment checkout
│   │   └── webhook/         # Stripe webhooks
│   ├── dashboard/           # Student dashboard
│   ├── essay/[id]/          # Essay detail page
│   ├── pricing/             # Pricing page
│   ├── login/               # Auth pages
│   ├── signup/
│   └── page.tsx             # Landing page
├── components/
│   ├── ui/                  # Shadcn components
│   ├── essay/               # Essay-specific components
│   ├── dashboard/           # Dashboard components
│   └── landing/             # Landing page components
├── lib/
│   ├── ai/
│   │   ├── analyzer.ts      # Main AI scoring engine
│   │   ├── clients.ts       # AI client setup
│   │   └── prompts.ts       # Prompt templates
│   ├── supabase/            # Supabase client config
│   ├── stripe/              # Stripe config
│   ├── validations/         # Zod schemas
│   └── prisma.ts            # Prisma client
├── prisma/
│   └── schema.prisma        # Database schema
├── types/
│   └── ai.ts                # TypeScript types
└── .env.example             # Environment variables template
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL database (Supabase recommended)
- Anthropic API key
- OpenAI API key
- Stripe account

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd tic-tac-toe
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```

   Fill in your actual values:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # AI APIs
   ANTHROPIC_API_KEY=your_anthropic_key
   OPENAI_API_KEY=your_openai_key

   # Stripe
   STRIPE_SECRET_KEY=your_stripe_secret
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_public
   STRIPE_WEBHOOK_SECRET=your_webhook_secret

   # Database
   DATABASE_URL=your_postgres_connection_string

   # App
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Set up Supabase:**
   - Create a Supabase project
   - Copy the connection string to `DATABASE_URL`
   - The Prisma schema will handle table creation

5. **Initialize the database:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

6. **Run the development server:**
   ```bash
   npm run dev
   ```

7. **Open the app:**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Setting Up Stripe Webhooks (Local Development)

1. Install Stripe CLI:
   ```bash
   brew install stripe/stripe-cli/stripe
   ```

2. Forward webhooks to local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhook/stripe
   ```

3. Copy the webhook signing secret to `.env.local`

## 🎨 Core Features

### AI Analysis System

**Commons Check (Free)**
- Fast pass/fail flags
- Quick improvement tips
- Uses Claude Haiku (fast & cheap)

**Full Analysis (AI Pro)**
- 7-dimension rubric scoring (0-6 scale each)
- Weighted overall score (0-100)
- Detailed rationales for each dimension
- Top 5 targeted fixes
- Outline and sentence-level suggestions
- School-fit analysis
- Tone preservation check

**Rewrite Suggestions**
- Paragraph-level rewrites
- Voice preservation notes
- Multiple goal types (intro, specificity, goals, tone, structure)

### Rubric Dimensions

1. **Authenticity/Voice** (20%) - Does it sound like the student?
2. **Reflection/Insight** (20%) - Shows growth and self-awareness?
3. **Narrative Structure** (15%) - Clear beginning, middle, end?
4. **Specificity & School Fit** (15%) - Concrete details and school alignment?
5. **Clarity & Style** (10%) - Easy to read and engaging?
6. **Mechanics** (10%) - Grammar, spelling, punctuation?
7. **Ethics/Originality** (10%) - Authentic work, no red flags?

### Pricing Tiers

| Package | Price | Features |
|---------|-------|----------|
| **Free** | $0 | 1 Commons Check (650 words max) |
| **AI Lite** | $9 | Commons Check + basic rubric + 5 fixes |
| **AI Pro (Single)** | $29 | Full rubric + rewrites + school-fit + tone check |
| **AI Pro (Monthly)** | $49/mo | Up to 6 essays per month |
| **Human Lite** | $79 | 1 professional review (48h turnaround) |
| **Human Full (1)** | $129 | 1 in-depth review with revision |
| **Human Full (3)** | $279 | 3 review rounds |
| **Human Full (5)** | $399 | 5 review rounds (complete coaching) |

## 📊 Database Schema

See `prisma/schema.prisma` for the complete schema.

**Key models:**
- `User` - Students, reviewers, admins
- `Essay` - Essay metadata (type, prompt, school, word limit)
- `EssayVersion` - Versioned essay content
- `AIAnalysis` - AI analysis results
- `CommonsFlag` - Individual flag results
- `Rewrite` - Rewrite suggestions
- `Order` - Payment records
- `Review` - Human review assignments
- `Reviewer` - Reviewer profiles

## 🔐 Security & Privacy

- All essays encrypted at rest (Supabase default)
- Essays NOT used to train models (unless opted in)
- Age gate: 16+ for MVP (avoids COPPA complexity)
- PII minimized
- Parental consent flow ready for <16 users
- Data retention: 18 months (configurable)
- Export and deletion self-serve

## 🧪 Testing

**AI Analysis Test:**
```bash
# Create a test essay via API
curl -X POST http://localhost:3000/api/essays \
  -H "Authorization: Bearer <token>" \
  -d '{
    "type": "PERSONAL_STATEMENT",
    "promptText": "Discuss a challenge...",
    "content": "When I was twelve..."
  }'

# Run analysis
curl -X POST http://localhost:3000/api/analyze \
  -H "Authorization: Bearer <token>" \
  -d '{
    "versionId": "<version_id>",
    "analysisType": "full"
  }'
```

## 📈 Deployment

### Vercel (Recommended)

1. **Connect your repo to Vercel**
2. **Add environment variables** in Vercel dashboard
3. **Deploy**

### Database Migrations

```bash
# Generate migration
npx prisma migrate dev --name your_migration_name

# Apply migrations in production
npx prisma migrate deploy
```

### Stripe Webhook Setup (Production)

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-domain.com/api/webhook/stripe`
3. Select events: `checkout.session.completed`, `checkout.session.expired`, `charge.refunded`
4. Copy signing secret to production env vars

## 🛠️ Development Workflow

1. **Create feature branch**
2. **Make changes**
3. **Test locally**
4. **Run Prisma generate** if schema changed
5. **Push and deploy**

## 📝 API Documentation

### Essays

**Create Essay**
```typescript
POST /api/essays
Body: {
  type: EssayType,
  promptText: string,
  targetSchool?: string,
  wordLimit?: number,
  content: string
}
```

**Get Essays**
```typescript
GET /api/essays
Returns: { essays: Essay[] }
```

### Analysis

**Run Analysis**
```typescript
POST /api/analyze
Body: {
  versionId: string,
  analysisType: 'commons_check' | 'full',
  toneSample?: string
}
```

### Rewrites

**Generate Rewrites**
```typescript
POST /api/rewrite
Body: {
  versionId: string,
  goals: string[],
  toneSample?: string
}
```

### Payments

**Create Checkout Session**
```typescript
POST /api/stripe/checkout
Body: {
  package: PackageType,
  essayId?: string
}
Returns: { sessionId: string, url: string }
```

## 🎯 Roadmap

### MVP (Weeks 1-2) ✅
- [x] AI scoring engine
- [x] API routes
- [x] Landing page + pricing
- [x] Basic authentication
- [x] Stripe integration
- [x] Database schema

### v1 (Weeks 3-4)
- [ ] Dashboard UI
- [ ] Essay detail page with analysis results
- [ ] Diff viewer for rewrites
- [ ] Authentication pages
- [ ] School-fit database (top 50 schools)
- [ ] Reviewer marketplace basics

### v2 (Future)
- [ ] Collaborative sessions
- [ ] Multilingual support
- [ ] Chrome extension for Google Docs
- [ ] Recommendation letter guidance
- [ ] Mobile app

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines.

## 📄 License

Proprietary. All rights reserved.

## 📧 Support

- Issues: [GitHub Issues](https://github.com/your-repo/issues)
- Email: support@essayedgeai.com

---

**Built with ❤️ for students applying to college**
