# RAG Implementation Checklist

Quick reference for implementing the RAG system. See `RAG_ARCHITECTURE_PLAN.md` for full details.

---

## Phase 1: Database Setup (Days 1-3)

### Enable pgvector
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Create Tables
- [ ] `example_essays` - Successful essay examples
- [ ] `feedback_patterns` - Common issues with solutions
- [ ] `school_insights` - AO quotes, tips, what works
- [ ] `analysis_history` - Store analyses for feedback loop

### Create Indexes
- [ ] IVFFlat indexes on all embedding columns
- [ ] Composite indexes on (school_id, essay_type)

---

## Phase 2: Embedding Pipeline (Days 3-5)

### Create `/lib/rag/embeddings.ts`
```typescript
// Functions needed:
generateEmbedding(text: string): Promise<number[]>
batchGenerateEmbeddings(texts: string[]): Promise<number[][]>
```

### Create `/lib/rag/retrieval.ts`
```typescript
// Functions needed:
retrieveSimilarEssays(embedding, schoolId, essayType, limit): Promise<ExampleEssay[]>
retrieveFeedbackPatterns(embedding, essayType, limit): Promise<FeedbackPattern[]>
retrieveSchoolInsights(schoolId, essayType, limit): Promise<SchoolInsight[]>
```

### Create `/lib/rag/context-builder.ts`
```typescript
// Build enhanced prompt with retrieved context
buildEnhancedPrompt(essay, profile, retrievedContext): string
```

---

## Phase 3: Data Population (Days 5-10)

### Example Essays (Target: 500)
- [ ] Curate 10-20 essays per school per type
- [ ] Anonymize all PII
- [ ] Tag with themes and techniques
- [ ] Generate embeddings
- [ ] Insert into `example_essays`

### Feedback Patterns (Target: 100)
- [ ] Create common patterns from `lib/ai/prompts.ts` commons check
- [ ] Add example before/after for each
- [ ] Generate embeddings
- [ ] Insert into `feedback_patterns`

### School Insights (Target: 200)
- [ ] Extract from `lib/data/ivy-league.ts`
- [ ] Add AO quotes (research needed)
- [ ] Add student tips
- [ ] Generate embeddings
- [ ] Insert into `school_insights`

---

## Phase 4: Integration (Days 10-14)

### Modify Analysis Flow

**File**: `/lib/ai/analyzer.ts`

```typescript
// Before: Direct Claude call
const analysis = await callClaude(buildPrompt(essay));

// After: RAG-enhanced
const embedding = await generateEmbedding(essay);
const context = await retrieveAllContext(embedding, schoolId, essayType);
const enhancedPrompt = buildEnhancedPrompt(essay, profile, context);
const analysis = await callClaude(enhancedPrompt);
const enhanced = enrichWithBenchmarks(analysis, context);
```

### Update Files
- [ ] `/lib/ai/analyzer.ts` - Add retrieval before analysis
- [ ] `/lib/ai/ivy-analyzer.ts` - Add retrieval before analysis
- [ ] `/lib/ai/prompts.ts` - New template with RAG context section
- [ ] `/lib/ai/ivy-prompts.ts` - New template with RAG context section

### Add Profile Data to Prompts
Currently NOT passed to AI (fix this):
- [ ] `profile.spike` - Main narrative
- [ ] `profile.topActivities` - Key achievements
- [ ] `profile.biggestWorry` - Prioritize related feedback

---

## Phase 5: New API Endpoints (Days 14-16)

### Create `/app/api/rag/` directory

- [ ] `POST /api/rag/embeddings` - Generate embeddings
- [ ] `GET /api/rag/examples` - Retrieve similar essays
- [ ] `GET /api/rag/patterns` - Find matching patterns
- [ ] `GET /api/rag/insights` - Get school insights

---

## Phase 6: Feedback Loop (Days 16-18)

### Store Every Analysis
```typescript
// After analysis completes
await prisma.analysisHistory.create({
  data: {
    essayVersionId: version.id,
    userId: user.id,
    schoolId,
    essayType,
    overallScore: analysis.overall.score_100,
    dimensionScores: analysis.scores,
    issuesIdentified: extractIssues(analysis),
    suggestionsGiven: analysis.suggestions,
    essayEmbedding: embedding,
    previousVersionScore: getPreviousScore(version),
    scoreDelta: calculateDelta(...)
  }
});
```

### Update Pattern Frequencies
```typescript
// When pattern matches an issue
await prisma.feedbackPattern.update({
  where: { id: pattern.id },
  data: {
    frequency: { increment: 1 },
    // If student improved after addressing: update success rate
  }
});
```

---

## Testing Checklist

- [ ] Embedding generation works (< 200ms)
- [ ] Vector search returns relevant results
- [ ] Retrieved context improves analysis quality
- [ ] Profile data (spike, activities) appears in prompts
- [ ] Analysis history is being stored
- [ ] No PII in example essays

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Embedding generation | < 200ms |
| Total retrieval (3 indexes) | < 500ms |
| Full analysis with RAG | < 45s |
| Cost per analysis | < $0.15 |

---

## Files to Create

```
lib/
├── rag/
│   ├── embeddings.ts      # Embedding generation
│   ├── retrieval.ts       # Vector search functions
│   ├── context-builder.ts # Prompt enhancement
│   └── feedback-loop.ts   # Store and learn from analyses

app/api/rag/
├── embeddings/route.ts
├── examples/route.ts
├── patterns/route.ts
└── insights/route.ts
```

---

## Quick Wins (Can Do Immediately)

1. **Pass profile data to prompts** - Just add spike/activities to existing prompts
2. **Store analysis history** - Already have the data, just need the table
3. **Create feedback patterns from commons check** - Already have the patterns defined

---

## Dependencies to Add

```bash
npm install @supabase/supabase-js  # Already have
# pgvector is a Postgres extension, no npm package needed
```

---

## Environment Variables Needed

```env
# Already have
OPENAI_API_KEY=...

# For pgvector (Supabase handles this)
DATABASE_URL=...
```
