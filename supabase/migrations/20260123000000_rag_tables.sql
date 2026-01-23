-- RAG System Tables Migration
-- Creates tables for example essays, feedback patterns, school insights, and analysis history

-- =============================================================================
-- EXAMPLE ESSAYS TABLE
-- Stores successful essay examples for retrieval
-- =============================================================================

CREATE TABLE IF NOT EXISTS example_essays (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  school_id TEXT NOT NULL,
  essay_type TEXT NOT NULL,
  prompt_id TEXT,

  -- Content (anonymized - no PII)
  content_snippet TEXT NOT NULL,
  content_hash TEXT UNIQUE NOT NULL,

  -- Metadata
  outcome TEXT,
  score_range TEXT,
  theme_tags TEXT[] DEFAULT '{}',
  spike_category TEXT,

  -- What made it work
  strength_notes TEXT,
  key_techniques TEXT[] DEFAULT '{}',

  -- Embedding (JSON array of floats for text-embedding-3-small)
  embedding JSONB,

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for example_essays
CREATE INDEX IF NOT EXISTS idx_example_essays_school_type ON example_essays(school_id, essay_type);
CREATE INDEX IF NOT EXISTS idx_example_essays_spike ON example_essays(spike_category);
CREATE INDEX IF NOT EXISTS idx_example_essays_active ON example_essays(is_active) WHERE is_active = true;

-- =============================================================================
-- FEEDBACK PATTERNS TABLE
-- Stores common issues with proven solutions
-- =============================================================================

CREATE TABLE IF NOT EXISTS feedback_patterns (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,

  -- Pattern identification
  issue_type TEXT NOT NULL,
  issue_category TEXT NOT NULL, -- structure, content, style, fit, voice, mechanics
  essay_type TEXT,
  school_id TEXT,

  -- The pattern
  pattern_name TEXT NOT NULL,
  description TEXT NOT NULL,
  example_before TEXT,
  example_after TEXT,
  fix_strategy TEXT,

  -- Impact data (updated via feedback loop)
  avg_score_improvement FLOAT DEFAULT 0,
  frequency INTEGER DEFAULT 0,
  success_rate FLOAT DEFAULT 0,

  -- Severity: 1-5 (5 = critical)
  severity INTEGER DEFAULT 3,

  -- Embedding for semantic matching
  embedding JSONB,

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint on pattern identification
  UNIQUE(issue_type, essay_type, school_id)
);

-- Indexes for feedback_patterns
CREATE INDEX IF NOT EXISTS idx_feedback_patterns_category ON feedback_patterns(issue_category);
CREATE INDEX IF NOT EXISTS idx_feedback_patterns_essay_type ON feedback_patterns(essay_type);
CREATE INDEX IF NOT EXISTS idx_feedback_patterns_active ON feedback_patterns(is_active) WHERE is_active = true;

-- =============================================================================
-- SCHOOL INSIGHTS TABLE
-- Stores AO quotes, tips, what works for each school
-- =============================================================================

CREATE TABLE IF NOT EXISTS school_insights (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  school_id TEXT NOT NULL,

  -- Content
  insight_type TEXT NOT NULL, -- ao_quote, student_tip, common_mistake, what_works, program_detail
  content TEXT NOT NULL,
  source TEXT,

  -- Applicability
  essay_types TEXT[] DEFAULT '{}',
  relevance_score FLOAT DEFAULT 3, -- 1-5

  -- Embedding
  embedding JSONB,

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for school_insights
CREATE INDEX IF NOT EXISTS idx_school_insights_school ON school_insights(school_id);
CREATE INDEX IF NOT EXISTS idx_school_insights_type ON school_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_school_insights_active ON school_insights(is_active) WHERE is_active = true;

-- =============================================================================
-- ANALYSIS HISTORY TABLE
-- Stores every analysis for feedback loop learning
-- =============================================================================

CREATE TABLE IF NOT EXISTS analysis_history (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,

  -- Links
  essay_version_id TEXT NOT NULL REFERENCES essay_versions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,

  -- Essay metadata
  school_id TEXT,
  essay_type TEXT NOT NULL,

  -- Scores
  overall_score FLOAT NOT NULL,
  dimension_scores JSONB NOT NULL,

  -- Issues found
  issues_identified TEXT[] DEFAULT '{}',
  patterns_matched TEXT[] DEFAULT '{}',
  suggestions_given JSONB,

  -- Improvement tracking
  previous_version_score FLOAT,
  score_delta FLOAT,

  -- Embedding of the essay
  essay_embedding JSONB,

  -- RAG context used
  rag_context_used JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for analysis_history
CREATE INDEX IF NOT EXISTS idx_analysis_history_user ON analysis_history(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_history_school_type ON analysis_history(school_id, essay_type);
CREATE INDEX IF NOT EXISTS idx_analysis_history_created ON analysis_history(created_at);
CREATE INDEX IF NOT EXISTS idx_analysis_history_version ON analysis_history(essay_version_id);

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Enable RLS
ALTER TABLE example_essays ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_history ENABLE ROW LEVEL SECURITY;

-- Example essays: read-only for authenticated users (no PII)
CREATE POLICY "Example essays are readable by authenticated users"
  ON example_essays FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Feedback patterns: read-only for authenticated users
CREATE POLICY "Feedback patterns are readable by authenticated users"
  ON feedback_patterns FOR SELECT
  TO authenticated
  USING (is_active = true);

-- School insights: read-only for authenticated users
CREATE POLICY "School insights are readable by authenticated users"
  ON school_insights FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Analysis history: users can only see their own
CREATE POLICY "Users can view their own analysis history"
  ON analysis_history FOR SELECT
  TO authenticated
  USING (user_id = auth.uid()::text);

CREATE POLICY "Users can insert their own analysis history"
  ON analysis_history FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid()::text);

-- Service role can manage all tables (for seed scripts)
CREATE POLICY "Service role can manage example_essays"
  ON example_essays FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage feedback_patterns"
  ON feedback_patterns FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage school_insights"
  ON school_insights FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage analysis_history"
  ON analysis_history FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- FUNCTIONS FOR UPDATING TIMESTAMPS
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_example_essays_updated_at ON example_essays;
CREATE TRIGGER update_example_essays_updated_at
  BEFORE UPDATE ON example_essays
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_feedback_patterns_updated_at ON feedback_patterns;
CREATE TRIGGER update_feedback_patterns_updated_at
  BEFORE UPDATE ON feedback_patterns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_school_insights_updated_at ON school_insights;
CREATE TRIGGER update_school_insights_updated_at
  BEFORE UPDATE ON school_insights
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE example_essays IS 'Successful essay examples for RAG retrieval (anonymized, no PII)';
COMMENT ON TABLE feedback_patterns IS 'Common essay issues with proven fixes and improvement metrics';
COMMENT ON TABLE school_insights IS 'School-specific insights: AO quotes, tips, common mistakes';
COMMENT ON TABLE analysis_history IS 'Analysis history for feedback loop learning and benchmarking';
