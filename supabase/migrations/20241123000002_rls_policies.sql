-- EssayEdge AI - Row Level Security Policies
-- Migration: Complete RLS setup

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE essays ENABLE ROW LEVEL SECURITY;
ALTER TABLE essay_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE commons_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewrites ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON users FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users"
    ON users FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

-- ============================================================================
-- PROFILES TABLE POLICIES
-- ============================================================================
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = user_id);

-- ============================================================================
-- ESSAYS TABLE POLICIES
-- ============================================================================
-- Users can view their own essays
CREATE POLICY "Users can view own essays"
    ON essays FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create their own essays
CREATE POLICY "Users can create own essays"
    ON essays FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own essays
CREATE POLICY "Users can update own essays"
    ON essays FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own essays
CREATE POLICY "Users can delete own essays"
    ON essays FOR DELETE
    USING (auth.uid() = user_id);

-- Reviewers can view essays they're reviewing
CREATE POLICY "Reviewers can view assigned essays"
    ON essays FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM reviews r
            JOIN orders o ON r.order_id = o.id
            WHERE o.essay_id = essays.id
              AND r.reviewer_id = auth.uid()
        )
    );

-- ============================================================================
-- ESSAY_VERSIONS TABLE POLICIES
-- ============================================================================
-- Users can view versions of their own essays
CREATE POLICY "Users can view own essay versions"
    ON essay_versions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM essays
            WHERE id = essay_versions.essay_id
              AND user_id = auth.uid()
        )
    );

-- Users can create versions of their own essays
CREATE POLICY "Users can create own essay versions"
    ON essay_versions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM essays
            WHERE id = essay_versions.essay_id
              AND user_id = auth.uid()
        )
    );

-- Reviewers can view versions of essays they're reviewing
CREATE POLICY "Reviewers can view assigned essay versions"
    ON essay_versions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM reviews
            WHERE version_id = essay_versions.id
              AND reviewer_id = auth.uid()
        )
    );

-- ============================================================================
-- AI_ANALYSES TABLE POLICIES
-- ============================================================================
-- Users can view analyses of their own essays
CREATE POLICY "Users can view own analyses"
    ON ai_analyses FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM essay_versions ev
            JOIN essays e ON ev.essay_id = e.id
            WHERE ev.id = ai_analyses.version_id
              AND e.user_id = auth.uid()
        )
    );

-- Service role can insert analyses (backend only)
CREATE POLICY "Service role can insert analyses"
    ON ai_analyses FOR INSERT
    WITH CHECK (true); -- Backend uses service role key

-- ============================================================================
-- COMMONS_FLAGS TABLE POLICIES
-- ============================================================================
-- Users can view flags from their own analyses
CREATE POLICY "Users can view own commons flags"
    ON commons_flags FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM ai_analyses a
            JOIN essay_versions ev ON a.version_id = ev.id
            JOIN essays e ON ev.essay_id = e.id
            WHERE a.id = commons_flags.analysis_id
              AND e.user_id = auth.uid()
        )
    );

-- ============================================================================
-- REWRITES TABLE POLICIES
-- ============================================================================
-- Users can view rewrites of their own essays
CREATE POLICY "Users can view own rewrites"
    ON rewrites FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM essay_versions ev
            JOIN essays e ON ev.essay_id = e.id
            WHERE ev.id = rewrites.version_id
              AND e.user_id = auth.uid()
        )
    );

-- ============================================================================
-- ORDERS TABLE POLICIES
-- ============================================================================
-- Users can view their own orders
CREATE POLICY "Users can view own orders"
    ON orders FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create their own orders
CREATE POLICY "Users can create own orders"
    ON orders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Admins can view all orders
CREATE POLICY "Admins can view all orders"
    ON orders FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

-- Service role can update orders (webhook processing)
CREATE POLICY "Service role can update orders"
    ON orders FOR UPDATE
    WITH CHECK (true);

-- ============================================================================
-- REVIEWS TABLE POLICIES
-- ============================================================================
-- Users can view reviews of their own essays
CREATE POLICY "Users can view own reviews"
    ON reviews FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE id = reviews.order_id
              AND user_id = auth.uid()
        )
    );

-- Reviewers can view their assigned reviews
CREATE POLICY "Reviewers can view assigned reviews"
    ON reviews FOR SELECT
    USING (auth.uid() = reviewer_id);

-- Reviewers can update their assigned reviews
CREATE POLICY "Reviewers can update assigned reviews"
    ON reviews FOR UPDATE
    USING (auth.uid() = reviewer_id);

-- Admins can view all reviews
CREATE POLICY "Admins can view all reviews"
    ON reviews FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

-- Admins can update all reviews (assignments)
CREATE POLICY "Admins can update all reviews"
    ON reviews FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

-- Service role can create reviews (auto-assignment)
CREATE POLICY "Service role can create reviews"
    ON reviews FOR INSERT
    WITH CHECK (true);

-- ============================================================================
-- REVIEW_COMMENTS TABLE POLICIES
-- ============================================================================
-- Users can view comments on their own reviews
CREATE POLICY "Users can view own review comments"
    ON review_comments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM reviews r
            JOIN orders o ON r.order_id = o.id
            WHERE r.id = review_comments.review_id
              AND o.user_id = auth.uid()
        )
    );

-- Reviewers can create comments on their assigned reviews
CREATE POLICY "Reviewers can create review comments"
    ON review_comments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM reviews
            WHERE id = review_comments.review_id
              AND reviewer_id = auth.uid()
        )
    );

-- Reviewers can view comments on their assigned reviews
CREATE POLICY "Reviewers can view assigned review comments"
    ON review_comments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM reviews
            WHERE id = review_comments.review_id
              AND reviewer_id = auth.uid()
        )
    );

-- ============================================================================
-- MESSAGES TABLE POLICIES
-- ============================================================================
-- Users can view messages on their own orders
CREATE POLICY "Users can view own messages"
    ON messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE id = messages.order_id
              AND user_id = auth.uid()
        )
        OR auth.uid() = sender_id
    );

-- Users can send messages on their own orders
CREATE POLICY "Users can send messages"
    ON messages FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id
        AND EXISTS (
            SELECT 1 FROM orders
            WHERE id = messages.order_id
              AND (user_id = auth.uid() OR EXISTS (
                  SELECT 1 FROM reviews
                  WHERE order_id = messages.order_id
                    AND reviewer_id = auth.uid()
              ))
        )
    );

-- ============================================================================
-- REVIEWERS TABLE POLICIES
-- ============================================================================
-- Anyone can view active reviewers (public profiles)
CREATE POLICY "Public can view active reviewers"
    ON reviewers FOR SELECT
    USING (is_active = true);

-- Reviewers can update their own profile
CREATE POLICY "Reviewers can update own profile"
    ON reviewers FOR UPDATE
    USING (auth.uid() = user_id);

-- Admins can manage all reviewers
CREATE POLICY "Admins can manage reviewers"
    ON reviewers FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

-- ============================================================================
-- SCHOOLS TABLE POLICIES
-- ============================================================================
-- Anyone can view schools (public data)
CREATE POLICY "Public can view schools"
    ON schools FOR SELECT
    USING (true);

-- Admins can manage schools
CREATE POLICY "Admins can manage schools"
    ON schools FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

-- ============================================================================
-- PROMPT_TEMPLATES TABLE POLICIES
-- ============================================================================
-- Service role can read prompt templates
CREATE POLICY "Service can read templates"
    ON prompt_templates FOR SELECT
    USING (true);

-- Admins can manage prompt templates
CREATE POLICY "Admins can manage templates"
    ON prompt_templates FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

-- ============================================================================
-- REFUNDS TABLE POLICIES
-- ============================================================================
-- Users can view their own refunds
CREATE POLICY "Users can view own refunds"
    ON refunds FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders
            WHERE id = refunds.order_id
              AND user_id = auth.uid()
        )
    );

-- Admins can manage refunds
CREATE POLICY "Admins can manage refunds"
    ON refunds FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

-- ============================================================================
-- AUDIT_LOGS TABLE POLICIES
-- ============================================================================
-- Admins can view audit logs
CREATE POLICY "Admins can view audit logs"
    ON audit_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

-- Service role can create audit logs
CREATE POLICY "Service can create audit logs"
    ON audit_logs FOR INSERT
    WITH CHECK (true);
