# RAG Architecture Plan: Ivy League Essay Advisor

## Executive Summary

This document outlines the architecture for a Retrieval-Augmented Generation (RAG) system to enhance essay analysis, feedback personalization, and school-specific recommendations.

**Current State**: Direct Claude API calls with static school data and minimal personalization
**Target State**: RAG-enhanced analysis with dynamic example retrieval, pattern matching, and deep personalization

---

## 1. WHAT RAG IMPROVES

### Current Limitations
| Area | Current Approach | Limitation |
|------|------------------|------------|
| School Fit | Static fit signals list | No examples of what "good fit" looks like |
| Feedback | Generic suggestions | Not calibrated to successful essays |
| Personalization | Tone sample only | Spike/activities not used in analysis |
| Scoring | AI judgment only | No comparison to accepted essays |
| "Why Us" Essays | School facts only | No examples of effective school research |

### RAG-Enhanced Capabilities
| Area | RAG Enhancement | User Benefit |
|------|-----------------|--------------|
| School Fit | Retrieve similar successful essays | "Essays like yours that got into Harvard..." |
| Feedback | Pattern-matched suggestions | "Students who fixed this issue saw +15 points" |
| Personalization | Context-aware retrieval | Suggestions aligned to student's spike/narrative |
| Scoring | Benchmark comparison | "Your authenticity score is above 80% of submitted essays" |
| "Why Us" | Retrieve effective school references | "Here's how accepted students mentioned this program" |

---

## 2. ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER REQUEST                                 │
│  Essay Text + School + Type + Profile (spike, activities, tone)     │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      EMBEDDING GENERATION                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │Essay Chunks │  │ Spike/Theme │  │School+Type  │                 │
│  │  Embedding  │  │  Embedding  │  │  Embedding  │                 │
│  └─────────────┘  └─────────────┘  └─────────────┘                 │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     MULTI-INDEX RETRIEVAL                            │
│                                                                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │ EXAMPLE ESSAYS   │  │ FEEDBACK CORPUS  │  │ SCHOOL CONTEXT   │  │
│  │ INDEX            │  │ INDEX            │  │ INDEX            │  │
│  │                  │  │                  │  │                  │  │
│  │ • Successful     │  │ • Past analyses  │  │ • AO quotes      │  │
│  │   essays by      │  │ • Improvement    │  │ • Student tips   │  │
│  │   school/type    │  │   patterns       │  │ • Common mistakes│  │
│  │ • Score ranges   │  │ • Score deltas   │  │ • What works     │  │
│  │ • Themes/spikes  │  │ • Fix examples   │  │ • Program details│  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
│           │                    │                     │              │
│           ▼                    ▼                     ▼              │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              RETRIEVED CONTEXT (Top-K per index)              │  │
│  │  • 3 similar successful essays (anonymized snippets)          │  │
│  │  • 5 relevant feedback patterns                               │  │
│  │  • 3 school-specific insights                                 │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    CONTEXT ASSEMBLY                                  │
│                                                                      │
│  System Prompt + Retrieved Examples + School Data + User Profile    │
│                                                                      │
│  "You are analyzing a Harvard Personal Statement.                   │
│   Similar successful essays demonstrated: [retrieved patterns]      │
│   Student's spike is: [spike from profile]                         │
│   Student's top activities: [activities from profile]              │
│   Past essays with this issue improved by: [feedback patterns]"    │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    CLAUDE ANALYSIS                                   │
│                                                                      │
│  Model: claude-3-5-sonnet-20241022                                  │
│  Enhanced prompt with RAG context                                   │
│  Temperature: 0.3                                                   │
│  Returns: Structured analysis JSON                                  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    POST-PROCESSING                                   │
│                                                                      │
│  • Add benchmark comparisons ("Your score vs similar essays")       │
│  • Add pattern-matched suggestions                                  │
│  • Store analysis for future retrieval (feedback loop)              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. VECTOR DATABASE SETUP

### Recommended: Supabase pgvector

Since you're already using Supabase, use their built-in pgvector extension.

#### Schema Additions

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Example Essays Index
CREATE TABLE example_essays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id TEXT NOT NULL,              -- harvard, yale, etc.
  essay_type TEXT NOT NULL,             -- PERSONAL_STATEMENT, WHY_US, etc.
  prompt_id TEXT,                       -- Links to specific prompt

  -- Content (anonymized)
  content_snippet TEXT NOT NULL,        -- 200-500 word excerpt (no PII)
  full_content_hash TEXT,               -- For dedup, not stored

  -- Metadata
  outcome TEXT,                         -- ACCEPTED, WAITLIST, etc.
  score_range TEXT,                     -- 85-95, 75-84, etc.
  theme_tags TEXT[],                    -- ['overcoming-adversity', 'intellectual-curiosity']
  spike_category TEXT,                  -- 'stem-research', 'arts', 'social-impact'

  -- What made it work
  strength_notes TEXT,                  -- Why this essay succeeded
  key_techniques TEXT[],                -- ['specific-anecdote', 'circular-structure']

  -- Embedding
  embedding vector(1536),               -- OpenAI text-embedding-3-small

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Indexes
  CONSTRAINT example_essays_school_type_idx
    UNIQUE (school_id, essay_type, full_content_hash)
);

CREATE INDEX example_essays_embedding_idx
  ON example_essays
  USING ivfflat (embedding vector_cosine_ops);

CREATE INDEX example_essays_school_type_idx
  ON example_essays (school_id, essay_type);


-- Feedback Patterns Index
CREATE TABLE feedback_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Pattern identification
  issue_type TEXT NOT NULL,             -- 'generic_opening', 'weak_reflection', etc.
  essay_type TEXT,                      -- Which essay types this applies to
  school_id TEXT,                       -- School-specific patterns (optional)

  -- The pattern
  pattern_description TEXT NOT NULL,    -- "Essay opens with a question"
  example_before TEXT,                  -- Original problematic text
  example_after TEXT,                   -- Improved version

  -- Impact data
  avg_score_improvement FLOAT,          -- Average points gained after fix
  frequency INT DEFAULT 0,              -- How often we've seen this
  success_rate FLOAT,                   -- % of students who improved

  -- Embedding
  embedding vector(1536),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX feedback_patterns_embedding_idx
  ON feedback_patterns
  USING ivfflat (embedding vector_cosine_ops);


-- School Context Index (AO insights, tips, etc.)
CREATE TABLE school_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id TEXT NOT NULL,

  -- Content
  insight_type TEXT NOT NULL,           -- 'ao_quote', 'student_tip', 'common_mistake', 'what_works'
  content TEXT NOT NULL,
  source TEXT,                          -- Where this came from

  -- Applicability
  essay_types TEXT[],                   -- Which essay types this applies to
  relevance_score FLOAT DEFAULT 1.0,    -- How important (1-5)

  -- Embedding
  embedding vector(1536),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX school_insights_embedding_idx
  ON school_insights
  USING ivfflat (embedding vector_cosine_ops);

CREATE INDEX school_insights_school_idx
  ON school_insights (school_id);


-- Analysis History (for feedback loop)
CREATE TABLE analysis_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Links
  essay_version_id TEXT NOT NULL REFERENCES essay_versions(id),
  user_id TEXT NOT NULL,

  -- Essay metadata (for retrieval)
  school_id TEXT,
  essay_type TEXT NOT NULL,

  -- Scores achieved
  overall_score FLOAT NOT NULL,
  dimension_scores JSONB NOT NULL,      -- {authenticity: 5, reflection: 4, ...}

  -- What issues were found
  issues_identified TEXT[],             -- ['generic_opening', 'weak_reflection']
  suggestions_given JSONB,              -- Full suggestions array

  -- Improvement tracking
  previous_version_score FLOAT,         -- Score before revision
  score_delta FLOAT,                    -- Improvement amount

  -- Embedding of the essay
  essay_embedding vector(1536),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX analysis_history_embedding_idx
  ON analysis_history
  USING ivfflat (essay_embedding vector_cosine_ops);

CREATE INDEX analysis_history_school_type_idx
  ON analysis_history (school_id, essay_type);
```

---

## 4. WHAT TO EMBED AND STORE

### Index 1: Example Essays

**Source**: Curated collection of successful essays (with permission)

**What to Store**:
```typescript
interface ExampleEssay {
  schoolId: string;           // 'harvard'
  essayType: EssayType;       // 'PERSONAL_STATEMENT'
  promptId?: string;          // Specific prompt if applicable

  // Content (anonymized - remove names, locations, specific details)
  contentSnippet: string;     // 200-500 words, key excerpt

  // Metadata
  outcome: 'ACCEPTED' | 'WAITLIST' | 'DEFERRED';
  scoreRange: '90-100' | '80-89' | '70-79';  // Estimated quality
  themeTags: string[];        // ['immigrant-experience', 'music', 'community-service']
  spikeCategory: string;      // 'stem', 'humanities', 'arts', 'athletics', 'social-impact'

  // What made it work
  strengthNotes: string;      // "Strong opening hook, specific sensory details..."
  keyTechniques: string[];    // ['in-medias-res', 'circular-structure', 'dialogue']
}
```

**Embedding Strategy**:
- Embed the full snippet for semantic search
- Filter by school_id + essay_type before vector search
- Retrieve top 3 most similar by content

**How Many**: Start with 10-20 per school per essay type = ~500 essays

---

### Index 2: Feedback Patterns

**Source**: Aggregate from actual analyses over time

**What to Store**:
```typescript
interface FeedbackPattern {
  issueType: string;          // 'generic_opening', 'telling_not_showing'
  essayType?: EssayType;      // If type-specific
  schoolId?: string;          // If school-specific

  // The pattern
  patternDescription: string; // "Essay starts with rhetorical question"
  exampleBefore: string;      // "Have you ever wondered..."
  exampleAfter: string;       // "The beaker shattered..."

  // Impact metrics
  avgScoreImprovement: number; // +12 points average
  frequency: number;          // Seen 847 times
  successRate: number;        // 78% improved after addressing
}
```

**Embedding Strategy**:
- Embed `patternDescription + exampleBefore` for matching
- When essay has an issue, find similar patterns with solutions
- Show user: "Students who fixed this issue saw +X points"

**Bootstrap Data**: Create 50-100 common patterns manually, then grow organically

---

### Index 3: School Insights

**Source**: Research, AO interviews, student reports

**What to Store**:
```typescript
interface SchoolInsight {
  schoolId: string;
  insightType: 'ao_quote' | 'student_tip' | 'common_mistake' | 'what_works' | 'program_detail';

  content: string;            // The actual insight
  source?: string;            // "Harvard Admissions Blog 2024"

  essayTypes?: EssayType[];   // Which essays this applies to
  relevanceScore: number;     // 1-5 importance
}
```

**Example Data**:
```typescript
{
  schoolId: 'harvard',
  insightType: 'ao_quote',
  content: "We're looking for students who will take full advantage of the resources here. Tell us specifically what you'd do.",
  source: 'Harvard Admissions Officer Interview, 2023',
  essayTypes: ['WHY_US'],
  relevanceScore: 5
}

{
  schoolId: 'yale',
  insightType: 'what_works',
  content: "Successful 'Why Yale' essays mention specific seminars, not just famous professors. Show you've researched the actual curriculum.",
  essayTypes: ['WHY_US', 'SUPPLEMENTAL'],
  relevanceScore: 4
}
```

---

## 5. HOW RETRIEVAL ENHANCES ANALYSIS

### Retrieval Flow

```typescript
async function analyzeWithRAG(input: AnalysisInput): Promise<EnhancedAnalysis> {
  const { essayText, schoolId, essayType, profile } = input;

  // Step 1: Generate embeddings
  const essayEmbedding = await generateEmbedding(essayText);
  const spikeEmbedding = profile.spike
    ? await generateEmbedding(profile.spike)
    : null;

  // Step 2: Parallel retrieval from all indexes
  const [
    similarEssays,
    relevantPatterns,
    schoolInsights
  ] = await Promise.all([
    // Find similar successful essays
    retrieveSimilarEssays({
      embedding: essayEmbedding,
      schoolId,
      essayType,
      spikeCategory: profile.spikeCategory,
      limit: 3
    }),

    // Find relevant feedback patterns
    retrieveFeedbackPatterns({
      embedding: essayEmbedding,
      essayType,
      schoolId,
      limit: 5
    }),

    // Get school-specific insights
    retrieveSchoolInsights({
      schoolId,
      essayType,
      limit: 3
    })
  ]);

  // Step 3: Build enhanced prompt with retrieved context
  const enhancedPrompt = buildEnhancedPrompt({
    essayText,
    schoolId,
    essayType,
    profile,
    retrievedContext: {
      similarEssays,
      relevantPatterns,
      schoolInsights
    }
  });

  // Step 4: Call Claude with enhanced context
  const analysis = await callClaude(enhancedPrompt);

  // Step 5: Enhance response with pattern-matched data
  const enhancedAnalysis = enrichAnalysis(analysis, {
    similarEssays,
    relevantPatterns
  });

  // Step 6: Store for future retrieval (feedback loop)
  await storeAnalysisHistory({
    essayVersionId: input.versionId,
    essayEmbedding,
    analysis: enhancedAnalysis,
    schoolId,
    essayType
  });

  return enhancedAnalysis;
}
```

### Enhanced Prompt Template

```typescript
function buildEnhancedPrompt(data: PromptData): string {
  return `
You are analyzing a ${data.essayType} essay for ${data.schoolId}.

## STUDENT CONTEXT
- Main narrative/spike: ${data.profile.spike || 'Not specified'}
- Top activities: ${data.profile.topActivities?.join(', ') || 'Not specified'}
- Biggest concern: ${data.profile.biggestWorry || 'Not specified'}

## SIMILAR SUCCESSFUL ESSAYS
The following excerpts are from essays that were accepted to ${data.schoolId}:

${data.retrievedContext.similarEssays.map((essay, i) => `
### Example ${i + 1} (Score range: ${essay.scoreRange})
Theme: ${essay.themeTags.join(', ')}
Key techniques: ${essay.keyTechniques.join(', ')}

Excerpt:
"${essay.contentSnippet}"

Why it worked: ${essay.strengthNotes}
`).join('\n')}

## SCHOOL-SPECIFIC INSIGHTS
${data.retrievedContext.schoolInsights.map(insight => `
- [${insight.insightType}] ${insight.content}
  ${insight.source ? `(Source: ${insight.source})` : ''}
`).join('\n')}

## COMMON PATTERNS TO CHECK
${data.retrievedContext.relevantPatterns.map(pattern => `
- ${pattern.patternDescription}
  When fixed: avg +${pattern.avgScoreImprovement} points
`).join('\n')}

## ESSAY TO ANALYZE
${data.essayText}

## INSTRUCTIONS
1. Score the essay on the 7-dimension rubric
2. Compare to the successful examples above - what can this essay learn from them?
3. Check for the common patterns listed - does this essay have any of these issues?
4. Provide specific, actionable suggestions
5. Ensure suggestions align with the student's spike/narrative

Return your analysis in the following JSON format:
[schema here]
`;
}
```

---

## 6. PERSONALIZATION STRATEGY

### Three Layers of Personalization

#### Layer 1: Voice Consistency (EXISTING - Keep)
- Tone sample embedding comparison
- Ensures suggestions don't change student's voice
- Flag drift if similarity < 0.75

#### Layer 2: Narrative Alignment (NEW)
```typescript
// Use spike to filter and weight retrieved examples
async function retrieveSimilarEssays(params) {
  let query = supabase
    .from('example_essays')
    .select('*')
    .eq('school_id', params.schoolId)
    .eq('essay_type', params.essayType);

  // If student has a spike, prefer essays with similar themes
  if (params.spikeCategory) {
    // Boost essays with matching spike category
    query = query.order('spike_category', {
      ascending: params.spikeCategory
    });
  }

  // Vector similarity search
  const { data } = await query.rpc('match_essays', {
    query_embedding: params.embedding,
    match_threshold: 0.7,
    match_count: params.limit
  });

  return data;
}
```

#### Layer 3: Activity Integration (NEW)
```typescript
// Include activities in analysis prompt
const activityContext = profile.topActivities?.length > 0
  ? `
## STUDENT'S KEY ACTIVITIES
${profile.topActivities.map((act, i) => `${i + 1}. ${act}`).join('\n')}

When analyzing, check:
- Does the essay connect to these activities?
- Are there missed opportunities to mention relevant experiences?
- Is the spike/theme consistent with their activity profile?
`
  : '';
```

#### Layer 4: Worry-Focused Feedback (NEW)
```typescript
// Prioritize suggestions that address student's concern
function prioritizeSuggestions(suggestions, biggestWorry) {
  const worryMapping = {
    'My essay is too generic/boring': ['specificity', 'hooks', 'anecdotes'],
    "I don't know what makes me unique": ['authenticity', 'voice', 'perspective'],
    'I can\'t fit everything in the word limit': ['concision', 'focus', 'cutting'],
    "I don't sound authentic": ['voice', 'tone', 'naturalness'],
    // ... etc
  };

  const priorityTags = worryMapping[biggestWorry] || [];

  return suggestions.sort((a, b) => {
    const aMatch = priorityTags.some(tag => a.issue.includes(tag)) ? 1 : 0;
    const bMatch = priorityTags.some(tag => b.issue.includes(tag)) ? 1 : 0;
    return bMatch - aMatch; // Matching concerns come first
  });
}
```

---

## 7. IMPLEMENTATION PHASES

### Phase 1: Foundation (Week 1-2)
**Goal**: Set up vector infrastructure

- [ ] Enable pgvector in Supabase
- [ ] Create tables: `example_essays`, `feedback_patterns`, `school_insights`
- [ ] Create embedding generation utility
- [ ] Create retrieval functions
- [ ] Add `analysis_history` table for feedback loop

**Deliverables**:
- Working vector search on test data
- Embedding generation pipeline

### Phase 2: Data Population (Week 2-3)
**Goal**: Populate indexes with initial data

- [ ] Curate 10-20 example essays per school/type
- [ ] Create 50-100 feedback patterns manually
- [ ] Extract insights from Ivy school data
- [ ] Add AO quotes and student tips

**Deliverables**:
- ~500 example essays indexed
- ~100 feedback patterns
- ~200 school insights

### Phase 3: Integration (Week 3-4)
**Goal**: Connect RAG to analysis pipeline

- [ ] Modify `analyzeEssay()` to include retrieval
- [ ] Modify `analyzeIvyEssay()` to include retrieval
- [ ] Update prompts with retrieved context
- [ ] Add personalization (spike, activities, worry)

**Deliverables**:
- RAG-enhanced analysis working end-to-end
- Personalization based on profile data

### Phase 4: Feedback Loop (Week 4-5)
**Goal**: Learn from usage

- [ ] Store every analysis in `analysis_history`
- [ ] Track score improvements across versions
- [ ] Auto-update feedback pattern frequencies
- [ ] Build dashboard for pattern insights

**Deliverables**:
- Self-improving feedback patterns
- Usage analytics

### Phase 5: Optimization (Week 5-6)
**Goal**: Improve quality and performance

- [ ] A/B test RAG vs non-RAG analysis
- [ ] Tune retrieval parameters (top-k, thresholds)
- [ ] Add caching for common retrievals
- [ ] Optimize embedding generation

**Deliverables**:
- Measurable improvement in feedback quality
- Performance benchmarks

---

## 8. TECHNICAL SPECIFICATIONS

### Embedding Model
```typescript
const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;
const EMBEDDING_COST = '$0.00002 / 1K tokens';
```

### Retrieval Parameters
```typescript
const RETRIEVAL_CONFIG = {
  exampleEssays: {
    topK: 3,
    similarityThreshold: 0.70,
    filters: ['school_id', 'essay_type']
  },
  feedbackPatterns: {
    topK: 5,
    similarityThreshold: 0.65,
    filters: ['essay_type']
  },
  schoolInsights: {
    topK: 3,
    similarityThreshold: 0.60,
    filters: ['school_id']
  }
};
```

### Performance Targets
| Metric | Target |
|--------|--------|
| Embedding generation | < 200ms |
| Vector retrieval (all 3 indexes) | < 500ms |
| Total analysis time (with RAG) | < 45 seconds |
| Cost per analysis | < $0.15 |

### Caching Strategy
```typescript
// Cache frequently retrieved data
const CACHE_CONFIG = {
  schoolInsights: '24 hours',      // School data doesn't change often
  feedbackPatterns: '1 hour',      // Patterns update slowly
  exampleEssays: '24 hours',       // Essays are static
  userEmbeddings: '7 days'         // User's spike/tone don't change often
};
```

---

## 9. API CHANGES

### New Endpoints

```typescript
// POST /api/embeddings/generate
// Generate embedding for text
{
  text: string;
  type: 'essay' | 'spike' | 'pattern';
}

// GET /api/examples/similar
// Retrieve similar example essays
{
  embedding: number[];
  schoolId: string;
  essayType: string;
  limit?: number;
}

// GET /api/patterns/match
// Find matching feedback patterns
{
  embedding: number[];
  essayType: string;
  schoolId?: string;
  limit?: number;
}

// POST /api/analyze/enhanced
// Full RAG-enhanced analysis
{
  essayText: string;
  schoolId: string;
  essayType: string;
  versionId: string;
  // Profile data auto-loaded from session
}
```

### Updated Response Schema

```typescript
interface EnhancedAnalysisResponse {
  // Existing fields
  meta: { ... };
  scores: { ... };
  commons_check: { ... };
  suggestions: { ... };
  overall: { ... };

  // NEW: RAG-enhanced fields
  rag_context: {
    similar_essays_used: number;
    patterns_matched: string[];
    insights_applied: string[];
  };

  benchmarks: {
    score_percentile: number;        // "Your score is higher than 73% of essays"
    vs_accepted_avg: number;         // "+5 points above accepted average"
    improvement_potential: number;   // "Estimated +12 points with fixes"
  };

  pattern_matched_suggestions: Array<{
    issue: string;
    pattern_id: string;
    avg_improvement: number;
    success_rate: number;
    example_fix: {
      before: string;
      after: string;
    };
  }>;
}
```

---

## 10. METRICS & SUCCESS CRITERIA

### Quality Metrics
| Metric | Measurement | Target |
|--------|-------------|--------|
| Feedback relevance | User ratings (1-5) | > 4.0 |
| Score improvement | v1 → v2 delta | > +10 points avg |
| Pattern match accuracy | Manual review | > 85% |
| Example relevance | User ratings | > 4.0 |

### Usage Metrics
| Metric | Measurement |
|--------|-------------|
| Retrieval hit rate | % of analyses with relevant examples |
| Pattern match rate | % of issues matched to patterns |
| Cache hit rate | % of requests served from cache |
| Feedback loop growth | New patterns added per week |

---

## 11. RISKS & MITIGATIONS

| Risk | Mitigation |
|------|------------|
| Example essays feel generic | Curate diverse essays, tag by theme |
| Retrieval adds latency | Parallel retrieval, caching |
| Patterns become stale | Auto-update frequencies, manual review |
| Privacy concerns with examples | Anonymize all examples, never store full essays |
| Embedding costs | Batch generation, caching, only embed changes |

---

## APPENDIX A: Example Essay Schema

```typescript
// How to add a new example essay
const exampleEssay = {
  schoolId: 'harvard',
  essayType: 'PERSONAL_STATEMENT',
  promptId: 'common-app-2025-1',

  // Anonymized excerpt - no names, schools, locations
  contentSnippet: `
    The beaker shattered before I could react. Three months of research,
    scattered across the lab floor in a puddle of blue solution. My mentor
    looked at me, waiting. I could have blamed the faulty equipment, the
    cramped workspace, anything. Instead, I knelt down and started cleaning.

    "Why aren't you upset?" she asked.

    "Because I learned something," I said. "The solution crystallized on
    impact. That's not supposed to happen at room temperature. Something
    in my formula is different."

    That accident became my breakthrough...
  `,

  outcome: 'ACCEPTED',
  scoreRange: '90-100',
  themeTags: ['research', 'failure', 'resilience', 'stem'],
  spikeCategory: 'stem-research',

  strengthNotes: 'Strong in-medias-res opening, shows rather than tells, demonstrates intellectual curiosity through action',
  keyTechniques: ['in-medias-res', 'dialogue', 'specific-sensory-details', 'growth-through-failure']
};
```

---

## APPENDIX B: Feedback Pattern Schema

```typescript
// How to add a new feedback pattern
const feedbackPattern = {
  issueType: 'generic_opening',
  essayType: 'PERSONAL_STATEMENT',

  patternDescription: 'Essay opens with a rhetorical question',
  exampleBefore: 'Have you ever wondered what it feels like to fail?',
  exampleAfter: 'The beaker shattered before I could react.',

  avgScoreImprovement: 8.5,
  frequency: 342,
  successRate: 0.76
};
```

---

## APPENDIX C: School Insight Schema

```typescript
// How to add school insights
const schoolInsight = {
  schoolId: 'harvard',
  insightType: 'ao_quote',
  content: 'We want to see what you will contribute to our community, not just what you want to get from Harvard.',
  source: 'Harvard Admissions Podcast, Episode 23',
  essayTypes: ['WHY_US', 'SUPPLEMENTAL'],
  relevanceScore: 5
};
```

---

**Document Version**: 1.0
**Last Updated**: January 2026
**Author**: EssayAI Engineering Team
