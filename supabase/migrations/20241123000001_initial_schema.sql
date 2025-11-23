-- EssayEdge AI - Complete Database Schema with RLS
-- Migration: Initial schema setup

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('STUDENT', 'PARENT', 'COUNSELOR', 'REVIEWER', 'ADMIN');
CREATE TYPE essay_type AS ENUM ('PERSONAL_STATEMENT', 'WHY_US', 'SUPPLEMENTAL', 'ACTIVITY', 'OTHER');
CREATE TYPE order_status AS ENUM ('PENDING', 'PAID', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REFUNDED');
CREATE TYPE review_status AS ENUM ('ASSIGNED', 'IN_PROGRESS', 'DELIVERED', 'REVISION_REQUESTED');
CREATE TYPE package_type AS ENUM ('FREE', 'AI_LITE', 'AI_PRO', 'HUMAN_LITE', 'HUMAN_FULL_1', 'HUMAN_FULL_3', 'HUMAN_FULL_5');

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    role user_role DEFAULT 'STUDENT' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    school_year INTEGER,
    dob DATE,
    guardian_email TEXT,
    regions TEXT[],
    goals TEXT,
    consent_flags JSONB,
    tone_sample TEXT,
    tone_embedding JSONB, -- Store as JSON array
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_profiles_user_id ON profiles(user_id);

-- ============================================================================
-- ESSAYS TABLE
-- ============================================================================
CREATE TABLE essays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type essay_type NOT NULL,
    prompt_text TEXT NOT NULL,
    target_school TEXT,
    word_limit INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_essays_user_id ON essays(user_id);
CREATE INDEX idx_essays_type ON essays(type);
CREATE INDEX idx_essays_updated_at ON essays(updated_at DESC);

-- ============================================================================
-- ESSAY_VERSIONS TABLE
-- ============================================================================
CREATE TABLE essay_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    essay_id UUID NOT NULL REFERENCES essays(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    version_index INTEGER NOT NULL,
    tone_embedding JSONB, -- Store as JSON array
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(essay_id, version_index)
);

CREATE INDEX idx_essay_versions_essay_id ON essay_versions(essay_id);
CREATE INDEX idx_essay_versions_created_at ON essay_versions(created_at DESC);

-- ============================================================================
-- AI_ANALYSES TABLE
-- ============================================================================
CREATE TABLE ai_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version_id UUID NOT NULL REFERENCES essay_versions(id) ON DELETE CASCADE,
    analysis_json JSONB NOT NULL,
    overall_score REAL NOT NULL,
    model_ref TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_ai_analyses_version_id ON ai_analyses(version_id);
CREATE INDEX idx_ai_analyses_created_at ON ai_analyses(created_at DESC);
CREATE INDEX idx_ai_analyses_overall_score ON ai_analyses(overall_score);

-- ============================================================================
-- COMMONS_FLAGS TABLE
-- ============================================================================
CREATE TABLE commons_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id UUID NOT NULL REFERENCES ai_analyses(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    flag BOOLEAN NOT NULL,
    evidence JSONB -- Array of evidence snippets
);

CREATE INDEX idx_commons_flags_analysis_id ON commons_flags(analysis_id);
CREATE INDEX idx_commons_flags_key ON commons_flags(key);

-- ============================================================================
-- REWRITES TABLE
-- ============================================================================
CREATE TABLE rewrites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    version_id UUID NOT NULL REFERENCES essay_versions(id) ON DELETE CASCADE,
    rewrite_json JSONB NOT NULL,
    model_ref TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_rewrites_version_id ON rewrites(version_id);
CREATE INDEX idx_rewrites_created_at ON rewrites(created_at DESC);

-- ============================================================================
-- ORDERS TABLE
-- ============================================================================
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    essay_id UUID REFERENCES essays(id) ON DELETE SET NULL,
    package package_type NOT NULL,
    price INTEGER NOT NULL, -- In cents
    status order_status DEFAULT 'PENDING' NOT NULL,
    stripe_session_id TEXT UNIQUE,
    stripe_payment_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_stripe_session_id ON orders(stripe_session_id);

-- ============================================================================
-- REVIEWS TABLE
-- ============================================================================
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    version_id UUID NOT NULL REFERENCES essay_versions(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status review_status DEFAULT 'ASSIGNED' NOT NULL,
    due_at TIMESTAMPTZ NOT NULL,
    delivered_at TIMESTAMPTZ,
    assets_ref TEXT, -- S3/Supabase Storage reference
    summary_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_reviews_order_id ON reviews(order_id);
CREATE INDEX idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX idx_reviews_status ON reviews(status);
CREATE INDEX idx_reviews_due_at ON reviews(due_at);

-- ============================================================================
-- REVIEW_COMMENTS TABLE
-- ============================================================================
CREATE TABLE review_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    location_ref TEXT, -- Paragraph or line reference
    comment_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_review_comments_review_id ON review_comments(review_id);

-- ============================================================================
-- MESSAGES TABLE
-- ============================================================================
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    attachment_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_messages_order_id ON messages(order_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- ============================================================================
-- REVIEWERS TABLE
-- ============================================================================
CREATE TABLE reviewers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    credentials TEXT,
    rating REAL,
    capacity INTEGER DEFAULT 5 NOT NULL,
    specialties TEXT[],
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_reviewers_user_id ON reviewers(user_id);
CREATE INDEX idx_reviewers_is_active ON reviewers(is_active);

-- ============================================================================
-- SCHOOLS TABLE
-- ============================================================================
CREATE TABLE schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    facts_json JSONB, -- Programs, values, mission, etc.
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_schools_name ON schools(name);

-- ============================================================================
-- PROMPT_TEMPLATES TABLE
-- ============================================================================
CREATE TABLE prompt_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    system_text TEXT NOT NULL,
    user_template TEXT NOT NULL,
    schema_ref TEXT,
    version INTEGER DEFAULT 1 NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_prompt_templates_name ON prompt_templates(name);
CREATE INDEX idx_prompt_templates_is_active ON prompt_templates(is_active);

-- ============================================================================
-- REFUNDS TABLE
-- ============================================================================
CREATE TABLE refunds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID UNIQUE NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- In cents
    reason TEXT,
    stripe_refund_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_refunds_order_id ON refunds(order_id);

-- ============================================================================
-- AUDIT_LOGS TABLE
-- ============================================================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- ============================================================================
-- AUTO-UPDATE TIMESTAMPS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_essays_updated_at BEFORE UPDATE ON essays FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_reviewers_updated_at BEFORE UPDATE ON reviewers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON schools FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_prompt_templates_updated_at BEFORE UPDATE ON prompt_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at();
