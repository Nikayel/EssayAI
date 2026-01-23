# EssayAI Product Requirements Document (PRD)
## Go-to-Market Strategy & Ivy League Roadmap

**Version:** 1.0
**Date:** January 2026
**Author:** CTO Office
**Status:** Strategic Planning

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Market Research & Analysis](#2-market-research--analysis)
3. [Target Audience & Personas](#3-target-audience--personas)
4. [Competitive Analysis](#4-competitive-analysis)
5. [Product Vision & Features](#5-product-vision--features)
6. [Ivy League Roadmap](#6-ivy-league-roadmap)
7. [AI Prompt Management System](#7-ai-prompt-management-system)
8. [AI Guardrails & Safety](#8-ai-guardrails--safety)
9. [Entity Relationship Diagram (ERD)](#9-entity-relationship-diagram-erd)
10. [Tech Stack & Architecture](#10-tech-stack--architecture)
11. [Go-to-Market Strategy](#11-go-to-market-strategy)
12. [Pricing Strategy](#12-pricing-strategy)
13. [Success Metrics & KPIs](#13-success-metrics--kpis)
14. [Risk Analysis & Mitigation](#14-risk-analysis--mitigation)
15. [Appendix](#15-appendix)

---

## 1. Executive Summary

### 1.1 Product Overview

**EssayAI** is an AI-powered college application essay analysis and coaching platform designed to help students craft authentic, compelling admissions essays that stand out in the increasingly competitive college admissions landscape. Unlike generic AI writing tools, EssayAI focuses on **preserving student voice** while providing expert-level feedback at accessible price points.

### 1.2 Mission Statement

> "Democratize access to Ivy League-quality essay coaching by combining AI precision with human expertise, ensuring every student can tell their authentic story effectively."

### 1.3 Key Value Propositions

| Stakeholder | Value Proposition |
|-------------|-------------------|
| **Students** | Get expert feedback in minutes, not weeks. Affordable alternative to $50K consultants. |
| **Parents** | Peace of mind with transparent feedback. 10-100x cheaper than private consultants. |
| **School Counselors** | Scale their impact across more students. Data-driven insights. |
| **Independent Consultants** | White-label tools to enhance their practice. |

### 1.4 Current State Summary

- **Tech Stack:** Next.js 16, TypeScript, PostgreSQL (Supabase), Prisma ORM
- **AI Integration:** Claude 3.5 Sonnet (analysis), Claude 3 Haiku (fast checks), OpenAI embeddings
- **Payments:** Stripe with subscription support
- **Features Built:** AI analysis (7-dimension rubric), human review marketplace, Q&A sessions, smart upsells

---

## 2. Market Research & Analysis

### 2.1 Market Size & Opportunity

#### Total Addressable Market (TAM)

| Segment | Size | Source |
|---------|------|--------|
| Global Academic Writing Services | $2.3B by 2026 | EssayPro Global Data |
| AI Writing Tools Market | Growing at 13% CAGR (North America) | Market Research |
| US College Admissions Consulting | $2.0B+ | IBISWorld |
| International Student Market | 1.2M students in US (2024-25) | Open Doors Report |

#### Serviceable Addressable Market (SAM)

- **US High School Seniors:** ~3.7M annually (Class of 2025 was largest at 4.3M)
- **College Applicants (Common App):** Growing 4% YoY, 9% more applications
- **Average Applications per Student:** 5.38 schools (up from 5.11)
- **International Students Applying:** ~500K annually (despite 9% decline in 2025-26)

#### Serviceable Obtainable Market (SOM) - Year 1

| Target Segment | Volume | Conversion Rate | Revenue Potential |
|---------------|--------|-----------------|-------------------|
| Early Adopters (Tech-savvy students) | 50,000 | 5% | $2.5M @ $50 avg |
| Parents seeking affordable coaching | 25,000 | 8% | $1.6M @ $80 avg |
| School Counselor partnerships | 100 schools | 20% | $500K B2B |
| **Total Year 1 SOM** | | | **$4.6M ARR** |

### 2.2 Market Trends

#### Favorable Trends

1. **Cost Democratization Demand:** Elite consulting costs $50K-$750K; massive underserved middle market
2. **AI Acceptance:** 89% of students already use AI tools for homework
3. **Application Volume Growth:** 9% increase in total applications through Common App
4. **Test Score Resurgence:** 11% more students submitting test scores; essays become differentiator
5. **International Demand:** 91% of international students still plan to study in US

#### Challenging Trends

1. **Demographic Cliff:** 15% drop in US-born college-going population by 2029
2. **AI Detection Concerns:** Universities implementing detection (Turnitin, GPTZero)
3. **Admissions Skepticism:** Officers suspicious of "overly polished" applications
4. **Policy Uncertainty:** International student concerns post-2025 policy changes

### 2.3 Regulatory & Academic Integrity Landscape

#### University AI Policies (2025)

| Institution | Policy Stance |
|-------------|---------------|
| **Oxford** | Conditional use with mandatory declaration |
| **Columbia** | Prohibited unless explicitly permitted |
| **Cornell** | No detection tools; emphasizes authentic assessment |
| **Harvard** | Course-by-course discretion |

#### Detection Tool Limitations

- Accuracy below 80% for most tools
- Documented bias against non-native English speakers
- False positives causing administrative burden
- Trend toward "education over punishment" approach

**Strategic Implication:** Position EssayAI as an **analysis and coaching tool**, not a ghostwriting service. Emphasize voice preservation and authentic feedback.

---

## 3. Target Audience & Personas

### 3.1 Primary Personas

#### Persona 1: "Ambitious Alex" - The Ivy League Aspirant

```
Demographics:
- Age: 16-18 (High School Junior/Senior)
- Location: Urban/Suburban US (CA, NY, TX, FL, MA)
- Family Income: $100K-$300K
- GPA: 3.8+, SAT: 1450+

Psychographics:
- Achievement-oriented, slight perfectionist
- Uses ChatGPT for research, knows it's not enough for essays
- Active on Reddit (r/ApplyingToCollege), Discord
- Stressed about standing out among peers

Pain Points:
- "I've rewritten my essay 10 times and still don't know if it's good"
- "My counselor has 400 students, I get 15 minutes"
- "I can't afford a $10K consultant but my peers have them"

Goals:
- Get into top-20 school
- Write authentically without sounding generic
- Quick, actionable feedback

Willingness to Pay: $50-200 per essay
```

#### Persona 2: "Invested Isabel" - The Supportive Parent

```
Demographics:
- Age: 45-55
- Location: Suburban US
- Family Income: $150K-$500K
- Education: College-educated

Psychographics:
- Wants to help but doesn't want to "helicopter"
- Values expertise and credentials
- Researches extensively before purchasing
- Active on parent Facebook groups, College Confidential

Pain Points:
- "I don't know how to help without writing it for them"
- "The consultants I found cost more than a semester of tuition"
- "I can't tell if my kid's essay is actually good"

Goals:
- Give child every advantage possible
- Find trustworthy, expert guidance
- Transparency into the process

Willingness to Pay: $100-500 for premium packages
```

#### Persona 3: "Resourceful Raj" - The International Applicant

```
Demographics:
- Age: 17-19
- Location: India, China, South Korea, UK
- Family Status: Upper-middle class in home country
- English: Fluent but non-native

Psychographics:
- Highly motivated, views US education as life-changing opportunity
- Concerned about cultural fit and "sounding American"
- Limited access to US admissions expertise locally
- Price-sensitive but willing to invest in quality

Pain Points:
- "I don't understand what American schools really want"
- "My English is good but I'm not sure about idioms and tone"
- "Local consultants don't understand US admissions"

Goals:
- Overcome international applicant disadvantages
- Sound authentic while meeting US expectations
- Affordable expert guidance (currency conversion matters)

Willingness to Pay: $30-150 (PPP adjusted)
```

#### Persona 4: "Counselor Carmen" - The Overloaded Professional

```
Demographics:
- Age: 30-50
- Role: High School Counselor
- Student Load: 300-500 students
- School Type: Public/Charter

Psychographics:
- Mission-driven, wants equity for all students
- Frustrated by resource constraints
- Open to technology that amplifies impact
- Needs tools that work with existing workflows

Pain Points:
- "I have 15 minutes per student for essays"
- "My students from lower-income families can't afford consultants"
- "I need to prioritize but don't have data to do it well"

Goals:
- Scale impact across all students
- Provide equity in access to quality feedback
- Data to identify struggling students early

Willingness to Pay: $500-5,000 annual school license
```

### 3.2 Anti-Personas (Who We Don't Serve)

| Anti-Persona | Why We Avoid |
|--------------|--------------|
| Students wanting AI to write their essay | Violates academic integrity; reputational risk |
| Admissions fraud services | Illegal; destroys trust |
| Last-minute panic buyers (same-day) | Can't deliver quality; bad reviews |
| Students with no essay draft | Need baseline content to analyze |

---

## 4. Competitive Analysis

### 4.1 Competitive Landscape Matrix

```
                         HIGH PRICE
                              │
     IvyWise ($50K+)         │         Ivy Coach ($150K+)
     CollegeAdvisor ($5K+)   │
                              │
    ┌─────────────────────────┼─────────────────────────┐
    │                         │                         │
LOW │    Grammarly            │    EssayAI (Target)     │ HIGH
SPEC│    ChatGPT              │    AdmitSee             │ SPEC
    │    Copy.ai              │    CollegeVine          │
    │                         │                         │
    └─────────────────────────┼─────────────────────────┘
                              │
     QuillBot                 │         Private Tutors
     Generic AI Writers       │         ($100-300/hr)
                              │
                         LOW PRICE

SPEC = Specialization in College Admissions
```

### 4.2 Direct Competitors

#### Tier 1: Premium Human Consultants

| Competitor | Price Range | Strengths | Weaknesses |
|------------|-------------|-----------|------------|
| **IvyWise** | $14K-$50K+ | Former AOs, 20yr track record, brand prestige | Unaffordable for 99%, long commitments |
| **Ivy Coach** | $50K-$150K+ | Ultra-premium positioning, media presence | Exclusively for ultra-wealthy |
| **CollegeAdvisor** | $3K-$10K | Scale, data-driven, accessible pricing | Still expensive, variable quality |

#### Tier 2: AI-Powered Competitors

| Competitor | Price Range | Strengths | Weaknesses |
|------------|-------------|-----------|------------|
| **CollegeVine** | Free-$300 | Large community, school matching, free tools | Generic feedback, community-focused |
| **AdmitSee** | $20-$100 | Essay database, peer essays | Read-only, no AI analysis |
| **Essayflow** | $15-$50 | AI generation | Ghostwriting positioning, ethics concern |

#### Tier 3: Generic AI Writing Tools

| Competitor | Price Range | Strengths | Weaknesses |
|------------|-------------|-----------|------------|
| **Jasper** | $49-$125/mo | Powerful AI, brand voice | Not specialized for admissions |
| **Copy.ai** | $36/mo | Automation, templates | Marketing-focused, not academic |
| **ChatGPT Plus** | $20/mo | Versatile, cheap | No structure, no admissions expertise |
| **Grammarly** | $12-$30/mo | Grammar excellence | No content/strategy feedback |

### 4.3 Competitive Advantages

| Advantage | EssayAI | Premium Consultants | Generic AI |
|-----------|---------|---------------------|------------|
| **Price Accessibility** | ✅ $9-$450 | ❌ $5K-$150K | ✅ $0-$50/mo |
| **Admissions Expertise** | ✅ 7-dim rubric | ✅ Former AOs | ❌ Generic |
| **Speed** | ✅ Minutes | ❌ Days/Weeks | ✅ Seconds |
| **Voice Preservation** | ✅ Tone embedding | ⚠️ Variable | ❌ Overwrites |
| **Scalability** | ✅ Unlimited | ❌ 50-200 students | ✅ Unlimited |
| **Human + AI Hybrid** | ✅ Both options | ⚠️ Human only | ❌ AI only |
| **School-Specific Fit** | ✅ Database-driven | ✅ Experience-based | ❌ Generic |

### 4.4 Differentiation Strategy

**Primary Differentiation: "Voice-First AI Coaching"**

Unlike ghostwriting tools that replace student voice, EssayAI:
1. Analyzes existing student writing
2. Preserves authentic voice through tone embeddings
3. Provides coaching-style suggestions, not replacements
4. Flags when revisions drift from student's natural voice

**Secondary Differentiation: "Tiered Expertise Access"**

```
┌─────────────────────────────────────────────────────────────┐
│  DEEP REVIEW ($450)                                         │
│  Senior Editor + Video Call + 5 Revisions                   │
├─────────────────────────────────────────────────────────────┤
│  HUMAN FULL ($129-$399)                                     │
│  Expert Human Review + Revision Rounds                      │
├─────────────────────────────────────────────────────────────┤
│  AI PRO ($29-$49)                                           │
│  Full 7-Dimension Analysis + Rewrites + School Fit          │
├─────────────────────────────────────────────────────────────┤
│  AI LITE ($9)                                               │
│  Quick Screening + Top 5 Fixes                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Product Vision & Features

### 5.1 Core Feature Set (Currently Built)

#### AI Analysis Engine

| Feature | Description | Model | Status |
|---------|-------------|-------|--------|
| **Commons Check** | 10-flag quick screening (5 seconds) | Claude 3 Haiku | ✅ Live |
| **Full Analysis** | 7-dimension rubric scoring (0-100) | Claude 3.5 Sonnet | ✅ Live |
| **Rewrite Suggestions** | Goal-based paragraph improvements | Claude 3.5 Sonnet | ✅ Live |
| **Tone Preservation** | Cosine similarity voice matching | OpenAI Embeddings | ✅ Live |
| **School-Fit Analysis** | Keyword matching for school alignment | Claude 3 Haiku | ✅ Live |

#### Human Review Marketplace

| Feature | Description | Status |
|---------|-------------|--------|
| **Review Assignment** | Match students with qualified reviewers | ✅ Live |
| **Margin Comments** | Inline annotation and feedback | ✅ Live |
| **SLA Management** | 24-72 hour turnaround tracking | ✅ Live |
| **Q&A Sessions** | Expert messaging post-review | ✅ Live |

#### Business Operations

| Feature | Description | Status |
|---------|-------------|--------|
| **Stripe Payments** | Subscriptions and one-time purchases | ✅ Live |
| **Smart Upsells** | Contextual upgrade recommendations | ✅ Live |
| **Conversion Tracking** | Funnel analytics (view→click→purchase) | ✅ Live |
| **Email Notifications** | Transactional emails via Resend | ✅ Live |
| **PDF Export** | Essay and analysis export | ✅ Live |

### 5.2 Feature Roadmap (Prioritized)

#### Phase 1: Foundation Hardening (Q1 2026)

| Feature | Priority | Effort | Impact |
|---------|----------|--------|--------|
| AI Guardrails Implementation | P0 | Medium | High |
| Prompt Injection Protection | P0 | Medium | Critical |
| Rate Limiting & Abuse Prevention | P0 | Low | High |
| Comprehensive Logging & Audit Trail | P1 | Medium | Medium |
| GDPR/CCPA Compliance Tools | P1 | Medium | Medium |

#### Phase 2: Ivy League Features (Q2 2026)

| Feature | Priority | Effort | Impact |
|---------|----------|--------|--------|
| **School Essay Database** | P0 | High | High |
| **Supplemental Essay Support** | P0 | Medium | High |
| **"Why Us" Essay Generator** | P1 | Medium | High |
| **Application Tracker Integration** | P1 | High | Medium |
| **Successful Essay Examples** (anonymized) | P2 | Medium | Medium |

#### Phase 3: Scale & Intelligence (Q3 2026)

| Feature | Priority | Effort | Impact |
|---------|----------|--------|--------|
| **Multi-Essay Application View** | P0 | High | High |
| **Cross-Essay Consistency Check** | P1 | Medium | Medium |
| **Collaborative Editing (Parent/Counselor)** | P1 | High | Medium |
| **Mobile App (iOS/Android)** | P2 | High | Medium |
| **Counselor Dashboard (B2B)** | P1 | High | High |

#### Phase 4: Expansion (Q4 2026)

| Feature | Priority | Effort | Impact |
|---------|----------|--------|--------|
| **Graduate School Essays** | P1 | Medium | Medium |
| **Scholarship Essays** | P1 | Medium | Medium |
| **International Localization** | P2 | High | Medium |
| **White-Label API** | P2 | High | Medium |

---

## 6. Ivy League Roadmap

### 6.1 School-Specific Optimization

#### Phase 1: "Big Three" Launch (Feb 2026)

**Harvard, Yale, Princeton**

| School | Supplement Essays | Word Limits | Key Themes to Analyze |
|--------|-------------------|-------------|----------------------|
| **Harvard** | 5 short answers | 150-200 each | Intellectual curiosity, community contribution |
| **Yale** | 3 short answers + 2 essays | 125-400 | Passion, fit, intellectual engagement |
| **Princeton** | 4 short answers + 1 essay | 50-350 | Honor code, service, extracurricular depth |

**Features:**
- Pre-loaded essay prompts for 2026-27 cycle
- School-specific scoring rubrics
- Mission/values alignment checker
- Faculty/program name-drop validator

#### Phase 2: Full Ivy Coverage (Apr 2026)

**Columbia, Brown, Dartmouth, Cornell, Penn**

| School | Unique Focus |
|--------|--------------|
| **Columbia** | Core curriculum appreciation, NYC integration |
| **Brown** | Open curriculum, self-direction, interdisciplinary |
| **Dartmouth** | Community, rural campus, D-Plan |
| **Cornell** | College-specific (7 colleges), "Why Cornell?" depth |
| **Penn** | Pre-professional programs, cross-school collaboration |

#### Phase 3: Top-20 Expansion (Jul 2026)

**Stanford, MIT, Duke, Northwestern, UChicago, JHU, etc.**

- Stanford "What matters most" deep analysis
- MIT "creative/quirky" essay evaluation
- UChicago "Uncommon Essay" unconventional prompt support

### 6.2 Ivy League Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Essays analyzed for Ivy apps | 10,000 | Q4 2026 |
| User-reported acceptances | 500+ | Track via surveys |
| Net Promoter Score (Ivy users) | >60 | Quarterly survey |
| School-fit score accuracy | >85% correlation with outcomes | Post-decision tracking |

---

## 7. AI Prompt Management System

### 7.1 Prompt Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     PROMPT MANAGEMENT SYSTEM                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐        │
│  │   SYSTEM     │   │    USER      │   │   OUTPUT     │        │
│  │   PROMPTS    │   │   PROMPTS    │   │   PARSERS    │        │
│  └──────┬───────┘   └──────┬───────┘   └──────┬───────┘        │
│         │                  │                  │                 │
│         ▼                  ▼                  ▼                 │
│  ┌─────────────────────────────────────────────────────┐       │
│  │              PROMPT TEMPLATE ENGINE                  │       │
│  │  - Version control (v1, v2, v3...)                  │       │
│  │  - A/B testing support                               │       │
│  │  - Variable interpolation                            │       │
│  │  - Conditional sections                              │       │
│  └─────────────────────────────────────────────────────┘       │
│                           │                                     │
│                           ▼                                     │
│  ┌─────────────────────────────────────────────────────┐       │
│  │              PROMPT REGISTRY (Database)              │       │
│  │  - PromptTemplate model in Prisma                    │       │
│  │  - Audit logging on all changes                      │       │
│  │  - Rollback capability                               │       │
│  └─────────────────────────────────────────────────────┘       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Prompt Categories

#### Category 1: Analysis Prompts

```typescript
// Example: Full Analysis System Prompt
const FULL_ANALYSIS_SYSTEM_PROMPT = `
You are an expert college admissions counselor with 15+ years of experience
reviewing essays for top-20 universities. Your role is to provide constructive,
actionable feedback that helps students improve their essays while preserving
their authentic voice.

CRITICAL GUIDELINES:
1. NEVER write content for the student - provide guidance only
2. ALWAYS explain the "why" behind feedback
3. PRESERVE the student's voice and perspective
4. IDENTIFY strengths before addressing weaknesses
5. PROVIDE specific, actionable suggestions

OUTPUT FORMAT:
Return a JSON object matching the AnalysisSchema exactly.
`;
```

#### Category 2: Rewrite Prompts

```typescript
// Example: Voice-Preserving Rewrite Prompt
const REWRITE_PROMPT = `
You are helping a student improve a specific paragraph. The student has provided
a tone sample that represents their authentic voice.

TONE SAMPLE (Student's natural writing):
{tone_sample}

PARAGRAPH TO IMPROVE:
{paragraph}

IMPROVEMENT GOAL: {goal}

RULES:
1. Maintain vocabulary complexity matching the tone sample
2. Keep sentence length patterns similar
3. Preserve any unique phrases or expressions
4. Do NOT make it "sound better" at the cost of authenticity
5. Suggest 2-3 alternatives, ranked by voice preservation

OUTPUT: JSON with suggested rewrites and voice_match_scores
`;
```

#### Category 3: School-Fit Prompts

```typescript
// Example: School-Specific Fit Analysis
const SCHOOL_FIT_PROMPT = `
Analyze this essay for fit with {school_name}.

SCHOOL CONTEXT:
- Mission: {school_mission}
- Key Programs: {key_programs}
- Culture Keywords: {culture_keywords}
- Location Factors: {location_factors}

ESSAY:
{essay_content}

EVALUATE:
1. Mission alignment (1-5)
2. Program reference accuracy (1-5)
3. Cultural fit signals (1-5)
4. Specificity score (generic vs. tailored)
5. Missing opportunities

OUTPUT: SchoolFitSchema JSON
`;
```

### 7.3 Prompt Version Management

```typescript
interface PromptVersion {
  id: string;
  name: string;
  version: number;
  category: 'analysis' | 'rewrite' | 'school_fit' | 'commons_check';
  systemPrompt: string;
  userPromptTemplate: string;
  outputSchema: ZodSchema;
  isActive: boolean;
  abTestGroup?: 'A' | 'B' | 'control';
  performanceMetrics: {
    avgLatency: number;
    avgTokens: number;
    userSatisfaction: number;
    errorRate: number;
  };
  createdAt: Date;
  createdBy: string;
  changelog: string;
}

// Database Schema (Prisma)
model PromptTemplate {
  id              String   @id @default(cuid())
  name            String
  version         Int
  category        String
  systemPrompt    String   @db.Text
  userPrompt      String   @db.Text
  outputSchema    Json
  isActive        Boolean  @default(false)
  abTestGroup     String?
  avgLatency      Float?
  avgTokens       Float?
  userSatisfaction Float?
  errorRate       Float?
  createdAt       DateTime @default(now())
  createdBy       String
  changelog       String?  @db.Text

  @@unique([name, version])
  @@index([category, isActive])
}
```

### 7.4 Prompt A/B Testing Framework

```typescript
// A/B Test Configuration
interface PromptABTest {
  testId: string;
  promptCategory: string;
  variants: {
    control: string; // prompt_id
    treatment: string; // prompt_id
  };
  trafficSplit: number; // 0-100, percentage to treatment
  metrics: string[]; // ['user_satisfaction', 'latency', 'conversion']
  startDate: Date;
  endDate: Date;
  minimumSampleSize: number;
  status: 'draft' | 'running' | 'completed' | 'stopped';
}

// Usage in API
async function selectPrompt(category: string, userId: string): Promise<PromptTemplate> {
  const activeTest = await getActiveTest(category);

  if (activeTest) {
    const variant = hashUserId(userId) % 100 < activeTest.trafficSplit
      ? 'treatment'
      : 'control';

    await logTestAssignment(activeTest.testId, userId, variant);
    return getPromptById(activeTest.variants[variant]);
  }

  return getActivePrompt(category);
}
```

---

## 8. AI Guardrails & Safety

### 8.1 Three-Layer Guardrail Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    GUARDRAILS ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  USER INPUT                                                      │
│      │                                                           │
│      ▼                                                           │
│  ┌─────────────────────────────────────────────┐                │
│  │         LAYER 1: INPUT GUARDRAILS           │                │
│  │  ┌─────────────┐  ┌─────────────────────┐  │                │
│  │  │ Prompt      │  │ Content             │  │                │
│  │  │ Injection   │  │ Validation          │  │                │
│  │  │ Detection   │  │ (length, format)    │  │                │
│  │  └─────────────┘  └─────────────────────┘  │                │
│  │  ┌─────────────┐  ┌─────────────────────┐  │                │
│  │  │ PII         │  │ Toxicity            │  │                │
│  │  │ Detection   │  │ Screening           │  │                │
│  │  └─────────────┘  └─────────────────────┘  │                │
│  └─────────────────────────────────────────────┘                │
│                          │                                       │
│                          ▼                                       │
│  ┌─────────────────────────────────────────────┐                │
│  │       LAYER 2: PROCESSING GUARDRAILS        │                │
│  │  ┌─────────────┐  ┌─────────────────────┐  │                │
│  │  │ Rate        │  │ Token Budget        │  │                │
│  │  │ Limiting    │  │ Enforcement         │  │                │
│  │  └─────────────┘  └─────────────────────┘  │                │
│  │  ┌─────────────┐  ┌─────────────────────┐  │                │
│  │  │ Context     │  │ Model               │  │                │
│  │  │ Isolation   │  │ Selection           │  │                │
│  │  └─────────────┘  └─────────────────────┘  │                │
│  └─────────────────────────────────────────────┘                │
│                          │                                       │
│                          ▼                                       │
│                     [LLM CALL]                                   │
│                          │                                       │
│                          ▼                                       │
│  ┌─────────────────────────────────────────────┐                │
│  │         LAYER 3: OUTPUT GUARDRAILS          │                │
│  │  ┌─────────────┐  ┌─────────────────────┐  │                │
│  │  │ Schema      │  │ Content Safety      │  │                │
│  │  │ Validation  │  │ Check               │  │                │
│  │  └─────────────┘  └─────────────────────┘  │                │
│  │  ┌─────────────┐  ┌─────────────────────┐  │                │
│  │  │ PII         │  │ Ghostwriting        │  │                │
│  │  │ Scrubbing   │  │ Detection           │  │                │
│  │  └─────────────┘  └─────────────────────┘  │                │
│  └─────────────────────────────────────────────┘                │
│                          │                                       │
│                          ▼                                       │
│                    SAFE RESPONSE                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 Input Guardrails Implementation

#### 8.2.1 Prompt Injection Detection

```typescript
// Prompt Injection Patterns to Detect
const INJECTION_PATTERNS = [
  // Direct instruction override attempts
  /ignore (all )?(previous|prior|above) (instructions|prompts)/i,
  /disregard (your|the) (instructions|guidelines|rules)/i,
  /forget (everything|what) (you were|you've been) told/i,

  // Role manipulation
  /you are now (a|an|the)/i,
  /pretend (you are|to be|you're)/i,
  /act as (if|though)/i,
  /roleplay as/i,

  // System prompt extraction
  /what (are|is) your (system |initial )?(prompt|instructions)/i,
  /repeat (your|the) (system |initial )?(prompt|instructions)/i,
  /show me your (prompt|instructions|guidelines)/i,

  // Jailbreak patterns
  /DAN|Do Anything Now/i,
  /evil mode|unrestricted mode/i,
  /bypass (your|the) (filter|restrictions|safety)/i,

  // Output manipulation
  /output (only |just )?(the following|this|exactly)/i,
  /respond with (only |just )?["'`]/i,
];

async function detectPromptInjection(input: string): Promise<{
  isInjection: boolean;
  confidence: number;
  patterns: string[];
}> {
  const detectedPatterns: string[] = [];

  // Pattern matching
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      detectedPatterns.push(pattern.source);
    }
  }

  // ML-based detection (secondary check)
  const mlScore = await classifyWithMLModel(input);

  return {
    isInjection: detectedPatterns.length > 0 || mlScore > 0.85,
    confidence: Math.max(
      detectedPatterns.length > 0 ? 0.9 : 0,
      mlScore
    ),
    patterns: detectedPatterns,
  };
}
```

#### 8.2.2 Content Validation

```typescript
interface ContentValidation {
  minLength: number;
  maxLength: number;
  minWordCount: number;
  maxWordCount: number;
  allowedCharacterSets: RegExp[];
  blockedPhrases: string[];
}

const ESSAY_VALIDATION: ContentValidation = {
  minLength: 100,
  maxLength: 10000,
  minWordCount: 20,
  maxWordCount: 1500,
  allowedCharacterSets: [
    /[\p{L}\p{N}\p{P}\p{Z}]/gu, // Letters, numbers, punctuation, spaces
  ],
  blockedPhrases: [
    // Placeholder text
    'lorem ipsum',
    'insert text here',
    '[your name]',
    // Test content
    'this is a test',
    'testing 123',
  ],
};

function validateEssayContent(essay: string): ValidationResult {
  const errors: string[] = [];
  const wordCount = essay.split(/\s+/).filter(Boolean).length;

  if (essay.length < ESSAY_VALIDATION.minLength) {
    errors.push(`Essay too short (minimum ${ESSAY_VALIDATION.minLength} characters)`);
  }
  if (essay.length > ESSAY_VALIDATION.maxLength) {
    errors.push(`Essay too long (maximum ${ESSAY_VALIDATION.maxLength} characters)`);
  }
  if (wordCount < ESSAY_VALIDATION.minWordCount) {
    errors.push(`Essay needs at least ${ESSAY_VALIDATION.minWordCount} words`);
  }

  for (const phrase of ESSAY_VALIDATION.blockedPhrases) {
    if (essay.toLowerCase().includes(phrase)) {
      errors.push(`Essay contains placeholder text: "${phrase}"`);
    }
  }

  return { valid: errors.length === 0, errors };
}
```

#### 8.2.3 PII Detection

```typescript
const PII_PATTERNS = {
  ssn: /\b\d{3}-\d{2}-\d{4}\b/,
  phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/,
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
  creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/,
  address: /\b\d+\s+[\w\s]+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln)\b/i,
  dateOfBirth: /\b(?:0[1-9]|1[0-2])\/(?:0[1-9]|[12]\d|3[01])\/(?:19|20)\d{2}\b/,
};

function detectPII(text: string): PIIDetectionResult {
  const detected: { type: string; match: string; position: number }[] = [];

  for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
    const matches = text.matchAll(new RegExp(pattern, 'g'));
    for (const match of matches) {
      detected.push({
        type,
        match: match[0],
        position: match.index!,
      });
    }
  }

  return {
    hasPII: detected.length > 0,
    detected,
    recommendation: detected.length > 0
      ? 'Please remove personal information before submitting'
      : null,
  };
}
```

### 8.3 Processing Guardrails

#### 8.3.1 Rate Limiting

```typescript
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  maxTokensPerWindow: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  free: {
    windowMs: 3600000, // 1 hour
    maxRequests: 5,
    maxTokensPerWindow: 10000,
  },
  ai_lite: {
    windowMs: 3600000,
    maxRequests: 20,
    maxTokensPerWindow: 50000,
  },
  ai_pro: {
    windowMs: 3600000,
    maxRequests: 50,
    maxTokensPerWindow: 200000,
  },
  human_review: {
    windowMs: 3600000,
    maxRequests: 100,
    maxTokensPerWindow: 500000,
  },
};

class RateLimiter {
  private redis: Redis;

  async checkLimit(userId: string, tier: string): Promise<RateLimitResult> {
    const config = RATE_LIMITS[tier] || RATE_LIMITS.free;
    const key = `rate:${userId}:${tier}`;

    const [requests, tokens] = await this.redis.mget(
      `${key}:requests`,
      `${key}:tokens`
    );

    const currentRequests = parseInt(requests || '0');
    const currentTokens = parseInt(tokens || '0');

    if (currentRequests >= config.maxRequests) {
      return {
        allowed: false,
        reason: 'Request limit exceeded',
        resetAt: await this.redis.pttl(`${key}:requests`),
      };
    }

    if (currentTokens >= config.maxTokensPerWindow) {
      return {
        allowed: false,
        reason: 'Token limit exceeded',
        resetAt: await this.redis.pttl(`${key}:tokens`),
      };
    }

    return { allowed: true };
  }

  async recordUsage(userId: string, tier: string, tokens: number): Promise<void> {
    const config = RATE_LIMITS[tier] || RATE_LIMITS.free;
    const key = `rate:${userId}:${tier}`;

    await this.redis.multi()
      .incr(`${key}:requests`)
      .expire(`${key}:requests`, config.windowMs / 1000)
      .incrby(`${key}:tokens`, tokens)
      .expire(`${key}:tokens`, config.windowMs / 1000)
      .exec();
  }
}
```

#### 8.3.2 Token Budget Enforcement

```typescript
const TOKEN_BUDGETS = {
  commons_check: {
    maxInputTokens: 2000,
    maxOutputTokens: 1000,
    model: 'claude-3-haiku-20240307',
  },
  full_analysis: {
    maxInputTokens: 8000,
    maxOutputTokens: 4000,
    model: 'claude-3-5-sonnet-20241022',
  },
  rewrite: {
    maxInputTokens: 4000,
    maxOutputTokens: 2000,
    model: 'claude-3-5-sonnet-20241022',
  },
};

function enforceTokenBudget(
  operation: string,
  inputText: string
): TokenBudgetResult {
  const budget = TOKEN_BUDGETS[operation];
  if (!budget) {
    throw new Error(`Unknown operation: ${operation}`);
  }

  const estimatedInputTokens = estimateTokens(inputText);

  if (estimatedInputTokens > budget.maxInputTokens) {
    return {
      allowed: false,
      reason: `Input exceeds ${budget.maxInputTokens} token limit`,
      suggestion: `Please shorten your essay to approximately ${
        Math.floor(budget.maxInputTokens * 0.75)
      } words`,
    };
  }

  return {
    allowed: true,
    model: budget.model,
    maxOutputTokens: budget.maxOutputTokens,
  };
}
```

### 8.4 Output Guardrails

#### 8.4.1 Ghostwriting Detection

```typescript
// Detect if AI output crosses from "coaching" to "ghostwriting"
interface GhostwritingCheck {
  originalEssayLength: number;
  suggestedContentLength: number;
  replacementPercentage: number;
}

function checkGhostwriting(
  originalEssay: string,
  aiOutput: AIAnalysisOutput
): GhostwritingCheckResult {
  const GHOSTWRITING_THRESHOLD = 0.4; // 40% replacement = potential ghostwriting

  let totalSuggestedChars = 0;

  // Calculate suggested replacement content
  if (aiOutput.rewrites) {
    for (const rewrite of aiOutput.rewrites) {
      totalSuggestedChars += rewrite.suggestedText.length;
    }
  }

  const replacementRatio = totalSuggestedChars / originalEssay.length;

  if (replacementRatio > GHOSTWRITING_THRESHOLD) {
    return {
      flagged: true,
      replacementPercentage: replacementRatio * 100,
      recommendation:
        'AI suggestions cover >40% of your essay. Consider using feedback ' +
        'to guide your own rewrites rather than direct replacements.',
    };
  }

  return { flagged: false };
}
```

#### 8.4.2 Output Schema Validation

```typescript
import { z } from 'zod';

const AnalysisOutputSchema = z.object({
  overallScore: z.number().min(0).max(100),
  dimensions: z.array(z.object({
    name: z.string(),
    score: z.number().min(0).max(6),
    weight: z.number().min(0).max(1),
    rationale: z.string().max(500),
    suggestions: z.array(z.string()).max(3),
  })).length(7),
  topFixes: z.array(z.object({
    priority: z.number().min(1).max(5),
    issue: z.string().max(200),
    suggestion: z.string().max(300),
    location: z.string().optional(),
  })).max(5),
  commonsFlags: z.array(z.object({
    flag: z.string(),
    triggered: z.boolean(),
    severity: z.enum(['low', 'medium', 'high']),
    explanation: z.string().max(200),
  })).max(10),
});

async function validateAndSanitizeOutput(
  rawOutput: string
): Promise<AnalysisOutput> {
  // Parse JSON from potential markdown code blocks
  const jsonMatch = rawOutput.match(/```json\n?([\s\S]*?)\n?```/)
    || rawOutput.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new OutputValidationError('No valid JSON found in AI response');
  }

  const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);

  // Validate against schema
  const result = AnalysisOutputSchema.safeParse(parsed);

  if (!result.success) {
    console.error('Schema validation failed:', result.error);
    throw new OutputValidationError('AI response does not match expected format');
  }

  // Additional sanitization
  return sanitizeOutput(result.data);
}

function sanitizeOutput(output: AnalysisOutput): AnalysisOutput {
  // Remove any accidentally included PII
  const sanitized = JSON.parse(JSON.stringify(output));

  // Sanitize all string fields
  const sanitizeString = (str: string) => {
    return str
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
      .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]');
  };

  // Recursively sanitize
  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') return sanitizeString(obj);
    if (Array.isArray(obj)) return obj.map(sanitizeObject);
    if (typeof obj === 'object' && obj !== null) {
      return Object.fromEntries(
        Object.entries(obj).map(([k, v]) => [k, sanitizeObject(v)])
      );
    }
    return obj;
  };

  return sanitizeObject(sanitized);
}
```

### 8.5 Academic Integrity Guardrails

```typescript
// Policies aligned with university AI guidelines
const ACADEMIC_INTEGRITY_POLICY = {
  // What we allow
  allowed: [
    'Grammar and spelling correction suggestions',
    'Structural feedback on organization',
    'Clarity and readability improvements',
    'Identification of clichés and generic language',
    'School-specific fit analysis',
    'Voice preservation analysis',
  ],

  // What we explicitly avoid
  prohibited: [
    'Generating essay content from scratch',
    'Rewriting entire essays',
    'Providing "winning essay" templates',
    'Writing admissions-ready text',
    'Bypassing human review requirements',
  ],

  // Disclosure requirements
  disclosure: `
    EssayAI provides AI-powered coaching and feedback on your essays.
    All analysis and suggestions are meant to guide YOUR writing process.

    IMPORTANT: Many universities require disclosure of AI tool usage.
    We recommend:
    1. Check your target schools' AI policies
    2. Disclose use of EssayAI if required
    3. Use our feedback to improve YOUR writing, not as replacement text

    EssayAI is a coaching tool, not a ghostwriting service.
  `,
};

function enforceAcademicIntegrity(
  request: AnalysisRequest,
  response: AnalysisResponse
): IntegrityCheckResult {
  // Check 1: Ensure request is for feedback, not generation
  if (request.type === 'generate' || request.essay?.length < 100) {
    return {
      passed: false,
      violation: 'GENERATION_REQUEST',
      message: 'EssayAI analyzes existing essays. Please write your draft first.',
    };
  }

  // Check 2: Ensure response isn't too prescriptive
  if (response.rewrites?.some(r => r.suggestedText.length > 300)) {
    return {
      passed: false,
      violation: 'EXCESSIVE_CONTENT',
      message: 'Suggested rewrites should guide, not replace student writing.',
      action: 'truncate_rewrites',
    };
  }

  // Check 3: Include disclosure
  response.metadata = {
    ...response.metadata,
    integrityDisclosure: ACADEMIC_INTEGRITY_POLICY.disclosure,
    analysisType: 'coaching_feedback',
  };

  return { passed: true };
}
```

### 8.6 Monitoring & Alerting

```typescript
interface GuardrailMetrics {
  inputBlocks: number;
  outputBlocks: number;
  injectionAttempts: number;
  piiDetections: number;
  rateLimitHits: number;
  ghostwritingFlags: number;
}

class GuardrailMonitor {
  private metrics: GuardrailMetrics = {
    inputBlocks: 0,
    outputBlocks: 0,
    injectionAttempts: 0,
    piiDetections: 0,
    rateLimitHits: 0,
    ghostwritingFlags: 0,
  };

  async recordEvent(
    eventType: keyof GuardrailMetrics,
    context: {
      userId: string;
      requestId: string;
      details: Record<string, any>;
    }
  ): Promise<void> {
    this.metrics[eventType]++;

    // Log to analytics
    await this.logToAnalytics({
      event: `guardrail_${eventType}`,
      ...context,
      timestamp: new Date(),
    });

    // Alert on thresholds
    if (eventType === 'injectionAttempts' && this.metrics.injectionAttempts > 10) {
      await this.sendAlert({
        severity: 'high',
        message: 'Elevated prompt injection attempts detected',
        metrics: this.metrics,
      });
    }
  }

  async getMetrics(window: 'hour' | 'day' | 'week'): Promise<GuardrailMetrics> {
    return this.queryMetrics(window);
  }
}
```

---

## 9. Entity Relationship Diagram (ERD)

### 9.1 Core Data Model

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ESSAYAI DATA MODEL                                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│      User        │       │     Profile      │       │   Subscription   │
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│ id (PK)          │──────<│ id (PK)          │       │ id (PK)          │
│ email            │       │ userId (FK)      │>──────│ userId (FK)      │
│ passwordHash     │       │ firstName        │       │ stripeSubId      │
│ role             │       │ lastName         │       │ plan             │
│ emailVerified    │       │ grade            │       │ status           │
│ createdAt        │       │ targetMajor      │       │ currentPeriodEnd │
│ updatedAt        │       │ toneSample       │       │ createdAt        │
└──────────────────┘       │ toneEmbedding    │       └──────────────────┘
                           │ preferredSchools │
                           │ createdAt        │
                           └──────────────────┘
                                    │
                                    │ 1:N
                                    ▼
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│     School       │       │      Essay       │       │   EssayVersion   │
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│ id (PK)          │       │ id (PK)          │──────<│ id (PK)          │
│ name             │       │ userId (FK)      │       │ essayId (FK)     │
│ type             │>──────│ schoolId (FK)    │       │ content          │
│ location         │       │ type             │       │ wordCount        │
│ ranking          │       │ prompt           │       │ toneEmbedding    │
│ acceptanceRate   │       │ wordLimit        │       │ version          │
│ essayPrompts     │       │ status           │       │ createdAt        │
│ mission          │       │ createdAt        │       └──────────────────┘
│ culture          │       │ updatedAt        │                │
│ keyPrograms      │       └──────────────────┘                │
└──────────────────┘                │                          │
                                    │ 1:N                      │ 1:1
                                    ▼                          ▼
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│   CommonsFlag    │       │      Order       │       │   AIAnalysis     │
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│ id (PK)          │       │ id (PK)          │──────<│ id (PK)          │
│ analysisId (FK)  │>──────│ userId (FK)      │       │ versionId (FK)   │
│ flag             │       │ essayId (FK)     │       │ orderId (FK)     │
│ triggered        │       │ package          │       │ overallScore     │
│ severity         │       │ amount           │       │ dimensions       │
│ explanation      │       │ stripePaymentId  │       │ topFixes         │
│ createdAt        │       │ status           │       │ schoolFit        │
└──────────────────┘       │ createdAt        │       │ toneMatch        │
                           └──────────────────┘       │ modelUsed        │
                                    │                 │ tokensUsed       │
                                    │ 1:1             │ createdAt        │
                                    ▼                 └──────────────────┘
┌──────────────────┐       ┌──────────────────┐                │
│    Reviewer      │       │     Review       │                │ 1:N
├──────────────────┤       ├──────────────────┤                ▼
│ id (PK)          │       │ id (PK)          │       ┌──────────────────┐
│ userId (FK)      │>──────│ orderId (FK)     │       │     Rewrite      │
│ bio              │       │ reviewerId (FK)  │       ├──────────────────┤
│ credentials      │       │ status           │       │ id (PK)          │
│ specialties      │       │ dueAt            │       │ analysisId (FK)  │
│ capacity         │       │ deliveredAt      │       │ paragraphIndex   │
│ rating           │       │ feedback         │       │ goal             │
│ completedReviews │       │ createdAt        │       │ original         │
│ isActive         │       └──────────────────┘       │ suggested        │
└──────────────────┘                │                 │ voiceMatchScore  │
                                    │ 1:N             │ createdAt        │
                                    ▼                 └──────────────────┘
                           ┌──────────────────┐
                           │  ReviewComment   │
                           ├──────────────────┤
                           │ id (PK)          │
                           │ reviewId (FK)    │
                           │ startOffset      │
                           │ endOffset        │
                           │ text             │
                           │ type             │
                           │ createdAt        │
                           └──────────────────┘

┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│    QASession     │       │     Message      │       │ PromptTemplate   │
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│ id (PK)          │──────<│ id (PK)          │       │ id (PK)          │
│ orderId (FK)     │       │ sessionId (FK)   │       │ name             │
│ expertId (FK)    │       │ senderId (FK)    │       │ version          │
│ studentId (FK)   │       │ content          │       │ category         │
│ tier             │       │ readAt           │       │ systemPrompt     │
│ expiresAt        │       │ createdAt        │       │ userPrompt       │
│ status           │       └──────────────────┘       │ outputSchema     │
│ createdAt        │                                  │ isActive         │
└──────────────────┘                                  │ abTestGroup      │
                                                      │ metrics          │
                                                      │ createdAt        │
                                                      └──────────────────┘

┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│  AnalyticsEvent  │       │    AuditLog      │       │     Refund       │
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│ id (PK)          │       │ id (PK)          │       │ id (PK)          │
│ userId (FK)      │       │ userId (FK)      │       │ orderId (FK)     │
│ event            │       │ action           │       │ amount           │
│ properties       │       │ resource         │       │ reason           │
│ sessionId        │       │ resourceId       │       │ stripeRefundId   │
│ createdAt        │       │ details          │       │ status           │
└──────────────────┘       │ ipAddress        │       │ createdAt        │
                           │ createdAt        │       └──────────────────┘
                           └──────────────────┘

┌──────────────────┐       ┌──────────────────┐
│  UpsellTracking  │       │  GuardrailLog    │
├──────────────────┤       ├──────────────────┤
│ id (PK)          │       │ id (PK)          │
│ userId (FK)      │       │ requestId        │
│ upsellType       │       │ userId (FK)      │
│ sourcePackage    │       │ guardrailType    │
│ targetPackage    │       │ triggered        │
│ viewed           │       │ action           │
│ clicked          │       │ details          │
│ purchased        │       │ createdAt        │
│ createdAt        │       └──────────────────┘
└──────────────────┘
```

### 9.2 Prisma Schema (Key Models)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  STUDENT
  PARENT
  COUNSELOR
  REVIEWER
  ADMIN
}

enum EssayType {
  PERSONAL_STATEMENT
  WHY_US
  SUPPLEMENTAL
  ACTIVITY
  OTHER
}

enum OrderStatus {
  PENDING
  PAID
  IN_PROGRESS
  COMPLETED
  CANCELLED
  REFUNDED
}

enum ReviewStatus {
  ASSIGNED
  IN_PROGRESS
  DELIVERED
  REVISION_REQUESTED
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String?
  role          UserRole  @default(STUDENT)
  emailVerified Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  profile       Profile?
  essays        Essay[]
  orders        Order[]
  subscriptions Subscription[]
  analytics     AnalyticsEvent[]
  auditLogs     AuditLog[]
}

model Profile {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id])
  firstName       String?
  lastName        String?
  grade           Int?
  targetMajor     String?
  toneSample      String?  @db.Text
  toneEmbedding   Json?    // Float array
  preferredSchools String[] // School IDs
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model School {
  id             String   @id @default(cuid())
  name           String   @unique
  type           String   // ivy, top20, state, etc.
  location       String
  ranking        Int?
  acceptanceRate Float?
  essayPrompts   Json     // Array of prompt objects for current year
  mission        String?  @db.Text
  culture        String[] // Keywords
  keyPrograms    String[]
  facts          Json?    // Additional school facts
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  essays         Essay[]
}

model Essay {
  id          String     @id @default(cuid())
  userId      String
  user        User       @relation(fields: [userId], references: [id])
  schoolId    String?
  school      School?    @relation(fields: [schoolId], references: [id])
  type        EssayType
  prompt      String?    @db.Text
  wordLimit   Int?
  status      String     @default("draft")
  deletedAt   DateTime?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  versions    EssayVersion[]
  orders      Order[]

  @@index([userId])
  @@index([schoolId])
}

model EssayVersion {
  id            String   @id @default(cuid())
  essayId       String
  essay         Essay    @relation(fields: [essayId], references: [id])
  content       String   @db.Text
  wordCount     Int
  toneEmbedding Json?    // Float array
  version       Int
  createdAt     DateTime @default(now())

  analyses      AIAnalysis[]

  @@unique([essayId, version])
  @@index([essayId])
}

model AIAnalysis {
  id           String       @id @default(cuid())
  versionId    String
  version      EssayVersion @relation(fields: [versionId], references: [id])
  orderId      String?
  overallScore Float
  dimensions   Json         // Array of dimension scores
  topFixes     Json         // Array of fix suggestions
  schoolFit    Json?        // School fit analysis
  toneMatch    Float?       // Cosine similarity score
  modelUsed    String
  tokensUsed   Int
  createdAt    DateTime     @default(now())

  commonsFlags CommonsFlag[]
  rewrites     Rewrite[]

  @@index([versionId])
  @@index([orderId])
}

model CommonsFlag {
  id          String     @id @default(cuid())
  analysisId  String
  analysis    AIAnalysis @relation(fields: [analysisId], references: [id])
  flag        String
  triggered   Boolean
  severity    String     // low, medium, high
  explanation String?
  createdAt   DateTime   @default(now())

  @@index([analysisId])
}

model Rewrite {
  id              String     @id @default(cuid())
  analysisId      String
  analysis        AIAnalysis @relation(fields: [analysisId], references: [id])
  paragraphIndex  Int
  goal            String
  original        String     @db.Text
  suggested       String     @db.Text
  voiceMatchScore Float?
  createdAt       DateTime   @default(now())

  @@index([analysisId])
}

model Order {
  id              String      @id @default(cuid())
  userId          String
  user            User        @relation(fields: [userId], references: [id])
  essayId         String?
  essay           Essay?      @relation(fields: [essayId], references: [id])
  package         String
  amount          Int         // cents
  currency        String      @default("usd")
  stripePaymentId String?
  stripeSessionId String?
  status          OrderStatus @default(PENDING)
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  review          Review?
  qaSession       QASession?
  refund          Refund?

  @@index([userId])
  @@index([essayId])
  @@index([stripePaymentId])
}

model Review {
  id          String       @id @default(cuid())
  orderId     String       @unique
  order       Order        @relation(fields: [orderId], references: [id])
  reviewerId  String
  reviewer    Reviewer     @relation(fields: [reviewerId], references: [id])
  status      ReviewStatus @default(ASSIGNED)
  dueAt       DateTime
  deliveredAt DateTime?
  feedback    String?      @db.Text
  rating      Int?
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  comments    ReviewComment[]

  @@index([reviewerId])
  @@index([status])
}

model ReviewComment {
  id          String   @id @default(cuid())
  reviewId    String
  review      Review   @relation(fields: [reviewId], references: [id])
  startOffset Int
  endOffset   Int
  text        String   @db.Text
  type        String   // suggestion, question, praise, critical
  createdAt   DateTime @default(now())

  @@index([reviewId])
}

model Reviewer {
  id              String   @id @default(cuid())
  userId          String   @unique
  bio             String?  @db.Text
  credentials     String[] // e.g., ["Former Harvard AO", "10 years exp"]
  specialties     String[] // e.g., ["STEM", "Liberal Arts", "International"]
  capacity        Int      @default(10) // Max active reviews
  rating          Float?
  completedReviews Int     @default(0)
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  reviews         Review[]
  qaSessions      QASession[]
}

model QASession {
  id        String   @id @default(cuid())
  orderId   String   @unique
  order     Order    @relation(fields: [orderId], references: [id])
  expertId  String
  expert    Reviewer @relation(fields: [expertId], references: [id])
  studentId String
  tier      String   // standard, premium
  expiresAt DateTime
  status    String   @default("active")
  createdAt DateTime @default(now())

  messages  Message[]

  @@index([expertId])
  @@index([studentId])
}

model Message {
  id        String    @id @default(cuid())
  sessionId String
  session   QASession @relation(fields: [sessionId], references: [id])
  senderId  String
  content   String    @db.Text
  readAt    DateTime?
  createdAt DateTime  @default(now())

  @@index([sessionId])
}

model PromptTemplate {
  id             String   @id @default(cuid())
  name           String
  version        Int
  category       String   // analysis, rewrite, school_fit, commons_check
  systemPrompt   String   @db.Text
  userPrompt     String   @db.Text
  outputSchema   Json
  isActive       Boolean  @default(false)
  abTestGroup    String?  // A, B, control
  avgLatency     Float?
  avgTokens      Float?
  userSatisfaction Float?
  errorRate      Float?
  createdAt      DateTime @default(now())
  createdBy      String
  changelog      String?  @db.Text

  @@unique([name, version])
  @@index([category, isActive])
}

model GuardrailLog {
  id            String   @id @default(cuid())
  requestId     String
  userId        String?
  guardrailType String   // input, processing, output
  triggered     Boolean
  action        String   // block, warn, pass
  details       Json
  createdAt     DateTime @default(now())

  @@index([userId])
  @@index([guardrailType])
  @@index([createdAt])
}

model Subscription {
  id               String   @id @default(cuid())
  userId           String
  user             User     @relation(fields: [userId], references: [id])
  stripeSubId      String   @unique
  plan             String
  status           String
  currentPeriodEnd DateTime
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@index([userId])
}

model AnalyticsEvent {
  id         String   @id @default(cuid())
  userId     String?
  user       User?    @relation(fields: [userId], references: [id])
  event      String
  properties Json?
  sessionId  String?
  createdAt  DateTime @default(now())

  @@index([userId])
  @@index([event])
  @@index([createdAt])
}

model AuditLog {
  id         String   @id @default(cuid())
  userId     String?
  user       User?    @relation(fields: [userId], references: [id])
  action     String
  resource   String
  resourceId String?
  details    Json?
  ipAddress  String?
  createdAt  DateTime @default(now())

  @@index([userId])
  @@index([action])
  @@index([createdAt])
}

model Refund {
  id             String   @id @default(cuid())
  orderId        String   @unique
  order          Order    @relation(fields: [orderId], references: [id])
  amount         Int
  reason         String?
  stripeRefundId String?
  status         String
  createdAt      DateTime @default(now())
}

model UpsellTracking {
  id            String   @id @default(cuid())
  userId        String
  upsellType    String
  sourcePackage String
  targetPackage String
  viewed        Boolean  @default(false)
  viewedAt      DateTime?
  clicked       Boolean  @default(false)
  clickedAt     DateTime?
  purchased     Boolean  @default(false)
  purchasedAt   DateTime?
  createdAt     DateTime @default(now())

  @@index([userId])
  @@index([upsellType])
}
```

---

## 10. Tech Stack & Architecture

### 10.1 Current Stack (Production)

| Layer | Technology | Justification |
|-------|------------|---------------|
| **Frontend** | Next.js 16 (App Router) | SSR, edge functions, optimal DX |
| **Language** | TypeScript 5 | Type safety, better tooling |
| **UI Components** | Shadcn/ui + Tailwind CSS 4 | Accessible, customizable, fast |
| **State** | Zustand 5 | Lightweight, intuitive |
| **Backend** | Next.js API Routes | Unified codebase, serverless |
| **Database** | PostgreSQL (Supabase) | Robust, scalable, built-in auth |
| **ORM** | Prisma 5 | Type-safe queries, migrations |
| **Auth** | Supabase Auth | Secure, managed, OAuth ready |
| **AI (Analysis)** | Claude 3.5 Sonnet | Best reasoning, nuanced feedback |
| **AI (Fast)** | Claude 3 Haiku | Cost-effective quick checks |
| **Embeddings** | OpenAI text-embedding-3-small | Best quality/cost ratio |
| **Payments** | Stripe | Industry standard, PCI compliant |
| **Email** | Resend | Developer-friendly, reliable |
| **PDF** | jsPDF | Client-side generation |
| **Hosting** | Vercel | Optimal for Next.js, global CDN |

### 10.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            ESSAYAI ARCHITECTURE                              │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────────┐
                              │    CDN/Edge      │
                              │   (Vercel Edge)  │
                              └────────┬─────────┘
                                       │
                              ┌────────▼─────────┐
                              │   Next.js App    │
                              │   (App Router)   │
                              │                  │
                              │ ┌──────────────┐ │
                              │ │   Frontend   │ │
                              │ │   (React)    │ │
                              │ └──────────────┘ │
                              │                  │
                              │ ┌──────────────┐ │
                              │ │ API Routes   │ │
                              │ │ (Serverless) │ │
                              │ └──────────────┘ │
                              └────────┬─────────┘
                                       │
          ┌────────────────────────────┼────────────────────────────┐
          │                            │                            │
          ▼                            ▼                            ▼
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│    Supabase      │       │   AI Services    │       │     Stripe       │
│                  │       │                  │       │                  │
│ ┌──────────────┐ │       │ ┌──────────────┐ │       │ ┌──────────────┐ │
│ │  PostgreSQL  │ │       │ │   Anthropic  │ │       │ │   Checkout   │ │
│ │   Database   │ │       │ │  Claude API  │ │       │ │   Sessions   │ │
│ └──────────────┘ │       │ └──────────────┘ │       │ └──────────────┘ │
│ ┌──────────────┐ │       │ ┌──────────────┐ │       │ ┌──────────────┐ │
│ │     Auth     │ │       │ │    OpenAI    │ │       │ │   Webhooks   │ │
│ │   (JWT/RLS)  │ │       │ │  Embeddings  │ │       │ │              │ │
│ └──────────────┘ │       │ └──────────────┘ │       │ └──────────────┘ │
│ ┌──────────────┐ │       │ ┌──────────────┐ │       │ ┌──────────────┐ │
│ │   Storage    │ │       │ │   (Future)   │ │       │ │Subscriptions │ │
│ │    (Docs)    │ │       │ │    Gemini    │ │       │ │              │ │
│ └──────────────┘ │       │ └──────────────┘ │       │ └──────────────┘ │
└──────────────────┘       └──────────────────┘       └──────────────────┘

                              ┌──────────────────┐
                              │     Resend       │
                              │ (Transactional)  │
                              └──────────────────┘
```

### 10.3 Recommended Stack Additions

| Need | Recommended Technology | Priority |
|------|------------------------|----------|
| **Caching** | Vercel KV (Redis) | P1 |
| **Rate Limiting** | Vercel KV + custom middleware | P0 |
| **Background Jobs** | Vercel Functions + Inngest | P1 |
| **Error Tracking** | Sentry | P0 |
| **Analytics** | PostHog (self-hosted) or Mixpanel | P1 |
| **Feature Flags** | LaunchDarkly or Vercel Edge Config | P2 |
| **Search** | Algolia or Typesense | P2 |
| **Monitoring** | Vercel Analytics + custom dashboards | P1 |

### 10.4 AI Model Selection Matrix

| Use Case | Model | Cost/1M tokens | Latency | Quality |
|----------|-------|----------------|---------|---------|
| Commons Check | Claude 3 Haiku | $0.25 | ~1-2s | Good |
| Full Analysis | Claude 3.5 Sonnet | $3.00 | ~5-10s | Excellent |
| Rewrites | Claude 3.5 Sonnet | $3.00 | ~3-5s | Excellent |
| School Fit | Claude 3 Haiku | $0.25 | ~1-2s | Good |
| Embeddings | text-embedding-3-small | $0.02 | ~0.5s | Excellent |

**Future Considerations:**
- Claude 3 Opus for premium "Deep Review" tier
- Fine-tuned models for school-specific analysis
- Local embedding models for cost optimization at scale

---

## 11. Go-to-Market Strategy

### 11.1 Launch Phases

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         GO-TO-MARKET TIMELINE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  PHASE 1: Soft Launch          PHASE 2: Growth            PHASE 3: Scale    │
│  (Q1 2026)                     (Q2-Q3 2026)               (Q4 2026+)        │
│                                                                              │
│  ┌─────────────────┐           ┌─────────────────┐        ┌─────────────────┐
│  │ Beta users      │           │ Paid acquisition│        │ B2B expansion   │
│  │ (500-1000)      │           │ SEO/Content     │        │ School licenses │
│  │                 │           │                 │        │                 │
│  │ Product-market  │   ───►    │ Referral program│  ───►  │ API/White-label │
│  │ fit validation  │           │                 │        │                 │
│  │                 │           │ Influencer      │        │ International   │
│  │ Price testing   │           │ partnerships    │        │ expansion       │
│  └─────────────────┘           └─────────────────┘        └─────────────────┘
│                                                                              │
│  Target: 2,000 users           Target: 25,000 users      Target: 100,000+   │
│  Revenue: $50K MRR             Revenue: $300K MRR        Revenue: $1M+ MRR  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 11.2 Channel Strategy

#### Primary Channels (>70% of acquisition)

| Channel | Strategy | Target CAC |
|---------|----------|------------|
| **SEO/Content** | Long-tail keywords ("how to write Common App essay", "Harvard supplemental essay tips") | <$5 |
| **Reddit/Discord** | Authentic engagement on r/ApplyingToCollege, r/chanceme | <$2 |
| **YouTube** | Educational content, essay teardowns, success stories | <$10 |
| **TikTok/Instagram** | Student testimonials, quick tips, authenticity focus | <$15 |

#### Secondary Channels (30% of acquisition)

| Channel | Strategy | Target CAC |
|---------|----------|------------|
| **Referral Program** | 20% off for referrer and referee | <$20 |
| **School Counselor Partnerships** | Free tool access for counselors → student referrals | <$30 |
| **College Consultant Affiliates** | 15-20% rev share for referrals | <$50 |
| **Paid Social** | Lookalike audiences from converters | <$40 |

### 11.3 Content Marketing Strategy

#### Content Pillars

1. **Educational (40%)**: How-to guides, essay writing tips, school-specific advice
2. **Success Stories (25%)**: Anonymized accepted essays, student testimonials
3. **Tool/Product (20%)**: Feature announcements, tutorials, comparisons
4. **Thought Leadership (15%)**: Admissions trends, AI in education, equity in access

#### SEO Keyword Targets

| Keyword Cluster | Monthly Volume | Difficulty | Priority |
|-----------------|----------------|------------|----------|
| "common app essay examples" | 40,000 | High | P0 |
| "how to write college essay" | 22,000 | Medium | P0 |
| "why us essay [school]" | 8,000 (per school) | Low | P1 |
| "college essay review service" | 3,200 | Medium | P0 |
| "AI essay helper" | 5,400 | Low | P1 |
| "personal statement tips" | 12,000 | Medium | P1 |

### 11.4 Partnership Strategy

#### Tier 1: Strategic Partnerships

| Partner Type | Value Proposition | Target Partners |
|--------------|-------------------|-----------------|
| **Test Prep Companies** | Bundle with SAT/ACT prep | Khan Academy, PrepScholar |
| **College Search Platforms** | Integrate essay tools | Niche, CollegeVine |
| **High School Networks** | District-wide licenses | Large urban districts |

#### Tier 2: Affiliate Partnerships

| Partner Type | Commission | Target |
|--------------|------------|--------|
| Independent Consultants | 20% first purchase | 100 partners |
| Education YouTubers | 15% + custom discount | 50 partners |
| Student Ambassadors | Free premium + 10% | 200 ambassadors |

### 11.5 Launch Calendar

| Date | Activity | Goal |
|------|----------|------|
| **Feb 1, 2026** | Beta launch (invite-only) | 500 users |
| **Mar 15, 2026** | Product Hunt launch | 2,000 signups |
| **Apr 1, 2026** | SEO content push (50 articles) | 10,000 organic visits/mo |
| **May 1, 2026** | Counselor program launch | 50 school partners |
| **Jun 15, 2026** | Summer "Early Bird" campaign | 15,000 users |
| **Aug 1, 2026** | Full public launch | 25,000 users |
| **Sep 1, 2026** | Peak season marketing push | 50,000 users |
| **Nov 15, 2026** | Early Decision support campaign | Conversion push |

---

## 12. Pricing Strategy

### 12.1 Pricing Philosophy

**Core Principles:**
1. **Accessibility First**: Entry point under $10 to capture students who can't afford consultants
2. **Value Stacking**: Clear feature differentiation between tiers
3. **Anchor Pricing**: Show consultant comparison ($50K vs. $29)
4. **Urgency Alignment**: Peak pricing during admissions season

### 12.2 Current Pricing Structure

#### One-Time Packages

| Package | Price | Target Persona | Value Proposition |
|---------|-------|----------------|-------------------|
| **AI Lite** | $9 | Budget-conscious students | Quick check, top 5 fixes |
| **AI Pro (Single)** | $29 | Serious applicants | Full analysis + rewrites |
| **Human Lite** | $79 | Quality-seekers | Single expert review |
| **Human Full** | $129-$399 | Comprehensive | Multiple revision rounds |
| **Deep Review** | $450 | Premium seekers | Senior editor + video call |

#### Subscriptions

| Plan | Price | Best For |
|------|-------|----------|
| **AI Pro Monthly** | $49/mo | Multiple essays (up to 6) |
| **Unlimited Annual** | $299/yr | Comprehensive coverage |

#### Add-Ons

| Add-On | Price | Description |
|--------|-------|-------------|
| Rush (24h) | $49 | Expedited turnaround |
| Q&A Standard | $150 | 24h expert access |
| Q&A Premium | $300 | 48h unlimited access |

### 12.3 Competitive Price Positioning

```
                         PRICE
                           │
            $50,000+       │    ┌─────────────────┐
                           │    │   IvyWise       │
                           │    │   Ivy Coach     │
            $5,000         │    └─────────────────┘
                           │
                           │    ┌─────────────────┐
            $1,000         │    │  CollegeAdvisor │
                           │    └─────────────────┘
                           │
                           │    ┌─────────────────┐
              $450         │    │  EssayAI Deep   │ ◄── Premium option
                           │    └─────────────────┘
              $129         │    ┌─────────────────┐
                           │    │  EssayAI Human  │ ◄── Mid-tier
                           │    └─────────────────┘
               $29         │    ┌─────────────────┐
                           │    │  EssayAI Pro    │ ◄── Core product
                           │    └─────────────────┘
                $9         │    ┌─────────────────┐
                           │    │  EssayAI Lite   │ ◄── Entry point
                           │    └─────────────────┘
                $0         │    Grammarly, ChatGPT
                           │
                           └─────────────────────────────────
                                            SPECIALIZATION
```

### 12.4 Pricing Experiments to Run

| Experiment | Hypothesis | Metric |
|------------|------------|--------|
| AI Pro at $39 vs $29 | Higher price = higher perceived value | Conversion rate |
| Bundle discount (3 essays) | Encourages multi-school analysis | ARPU |
| "Ivy League" premium (+$20) | School-specific commands premium | Upsell rate |
| Freemium (limited commons check) | Increases funnel top | Free → Paid conversion |
| Family plan (2 students) | Capture siblings | LTV |

### 12.5 Seasonal Pricing

| Period | Strategy | Discount |
|--------|----------|----------|
| **Jan-Feb** | "Early Bird" promo | 20% off annual |
| **Jun-Jul** | "Summer Start" push | 15% off + bonus review |
| **Aug-Oct** | Peak season (no discount) | Full price |
| **Nov** | ED/EA urgency | Rush included free |
| **Dec** | RD preparation | 10% off bundles |

---

## 13. Success Metrics & KPIs

### 13.1 North Star Metric

**Essays Analyzed with Positive Outcome**
- Definition: Essays that went through EssayAI and user reported acceptance to target school
- Target: 5,000 reported acceptances by end of 2026 cycle

### 13.2 Primary KPIs

| Category | Metric | Target Q2 2026 | Target Q4 2026 |
|----------|--------|----------------|----------------|
| **Growth** | Monthly Active Users | 10,000 | 50,000 |
| **Revenue** | Monthly Recurring Revenue | $150K | $500K |
| **Engagement** | Essays per User | 2.5 | 3.5 |
| **Retention** | 30-day Retention | 40% | 50% |
| **Satisfaction** | NPS Score | 50 | 65 |

### 13.3 Secondary KPIs

| Category | Metric | Target |
|----------|--------|--------|
| **Acquisition** | CAC (Customer Acquisition Cost) | <$30 |
| **Monetization** | ARPU (Average Revenue Per User) | $75 |
| **Quality** | AI Analysis Accuracy (user validation) | >85% |
| **Operations** | Human Review SLA Met | >95% |
| **Platform** | System Uptime | 99.9% |

### 13.4 Guardrail Metrics (Do Not Cross)

| Metric | Threshold | Action if Crossed |
|--------|-----------|-------------------|
| Churn Rate | >8% monthly | Investigate, pause acquisition |
| Support Ticket Volume | >5 per 100 users | Fix product issues |
| Refund Rate | >3% | Review product quality |
| AI Error Rate | >2% | Pause deployments, investigate |
| Academic Integrity Complaints | >0.1% | Immediate review, policy update |

### 13.5 Cohort Analysis Framework

```
Cohorts to track:
├── By Acquisition Channel
│   ├── Organic Search
│   ├── Paid Social
│   ├── Referral
│   └── Partnership
├── By Package Type
│   ├── AI Only
│   ├── Human Review
│   └── Hybrid
├── By Student Type
│   ├── Domestic
│   ├── International
│   └── First-Generation
└── By School Target
    ├── Ivy League
    ├── Top 20
    ├── Top 50
    └── Other
```

---

## 14. Risk Analysis & Mitigation

### 14.1 Risk Matrix

```
                        IMPACT
                          │
              High        │   ┌─────┐    ┌─────┐
                          │   │  3  │    │  1  │
                          │   └─────┘    └─────┘
                          │
              Medium      │   ┌─────┐    ┌─────┐
                          │   │  5  │    │  2  │
                          │   └─────┘    └─────┘
                          │
              Low         │   ┌─────┐    ┌─────┐
                          │   │  6  │    │  4  │
                          │   └─────┘    └─────┘
                          │
                          └───────────────────────
                              Low    Medium   High
                                 LIKELIHOOD

1. AI Detection Flagging (High Impact, High Likelihood)
2. Competitive Response (Medium Impact, High Likelihood)
3. Academic Integrity Backlash (High Impact, Medium Likelihood)
4. API Cost Increases (Low Impact, High Likelihood)
5. Seasonal Revenue Volatility (Medium Impact, Medium Likelihood)
6. Regulatory Changes (Low Impact, Low Likelihood)
```

### 14.2 Risk Mitigation Strategies

#### Risk 1: AI Detection Flagging Users' Essays

**Threat:** Universities flag EssayAI-revised essays as AI-generated

**Mitigation:**
- Voice preservation technology (tone embeddings)
- Coaching-only approach (never ghostwriting)
- Clear disclaimers and usage guidelines
- "Human-in-the-loop" verification option
- Research partnerships with detection tool vendors

#### Risk 2: Competitive Response

**Threat:** Jasper, Grammarly, or incumbents launch competing products

**Mitigation:**
- Deep specialization moat (admissions-specific)
- Network effects from reviewer marketplace
- School-specific database (hard to replicate)
- Strong brand positioning around ethics/authenticity
- Speed to market with Ivy League features

#### Risk 3: Academic Integrity Backlash

**Threat:** Media or university criticism of AI essay tools

**Mitigation:**
- Proactive PR positioning as "coaching tool"
- Publish transparency reports
- Partner with ethics researchers
- Offer free access for research
- Clear terms of service on appropriate use

#### Risk 4: API Cost Increases

**Threat:** Anthropic/OpenAI raise prices significantly

**Mitigation:**
- Token optimization (caching, prompt engineering)
- Multi-provider support (Claude, GPT, Gemini)
- Explore fine-tuned smaller models
- Pass costs to high-tier users only
- Negotiate enterprise agreements at scale

#### Risk 5: Seasonal Revenue Volatility

**Threat:** 80% of revenue in Aug-Dec creates cash flow issues

**Mitigation:**
- Annual subscription push (smooths revenue)
- Expand to grad school essays (different timeline)
- International market (different admission cycles)
- B2B school contracts (annual licenses)
- Summer programs for rising juniors

#### Risk 6: Data Privacy Regulations

**Threat:** GDPR/CCPA requirements, especially for minors

**Mitigation:**
- COPPA compliance (parental consent under 13)
- Data minimization practices
- Clear privacy policy
- EU data residency option
- Regular third-party audits

### 14.3 Contingency Plans

| Scenario | Trigger | Response |
|----------|---------|----------|
| Major competitor launch | >10% traffic loss | Aggressive differentiation campaign |
| AI model degradation | Quality drop >10% | Fallback to previous model version |
| Security breach | Any PII exposure | Incident response plan, disclosure |
| Viral negative PR | >1000 negative mentions | Crisis comms, CEO statement |
| Cash flow crisis | <3 months runway | Cost cuts, bridge financing |

---

## 15. Appendix

### 15.1 Glossary

| Term | Definition |
|------|------------|
| **Commons Check** | Quick 5-second screening using Claude Haiku |
| **Full Analysis** | Comprehensive 7-dimension rubric scoring |
| **Tone Embedding** | Vector representation of writing style |
| **School Fit** | Alignment analysis between essay and target school |
| **Voice Preservation** | Ensuring AI suggestions don't alter student's natural voice |
| **Guardrail** | Safety control constraining AI behavior |
| **Prompt Injection** | Attack attempting to override AI instructions |

### 15.2 Research Sources

**Market Research:**
- [AI Writing Tools Market Analysis 2025-2026](https://aiwithit.com/ai-tool-comparisons/best-ai-writing-assistants/)
- [Essay Writing Trends 2025](https://triad-city-beat.com/essay-writing-trends-in-2025-ai-tools-student-habits-and-market-growth/)
- [AI Essay Writers Growth Stats](https://www.yomu.ai/resources/the-rise-of-ai-essay-writers-in-2025-stats-growth-and-whats-next)

**Competitive Intelligence:**
- [Jasper vs Copy.ai Analysis](https://aloa.co/ai/comparisons/ai-writing-comparison/jasper-vs-copy-ai/)
- [College Admissions Consultants Ranking 2026](https://research.com/universities-colleges/best-college-admissions-consultants-ranking)
- [IvyWise Pricing & Services](https://www.ivywise.com/)
- [CollegeAdvisor Pricing](https://www.collegeadvisor.com/pricing/)
- [Ivy Coach Consulting Fees](https://www.ivycoach.com/the-ivy-coach-blog/college-admissions/fees-college-consultants/)

**Admissions Trends:**
- [2025-2026 Common App Essay Prompts](https://ivymax.com/guide-to-common-app-essay-prompts-2025/)
- [Ivy League Admissions Guide 2026](https://paidpe.com/ivy-league-admissions-guide-2026-essays-scores-extracurriculars/)
- [College Admission Trends 2026](https://www.collegedata.com/resources/getting-in/6-college-admission-trends-to-watch-in-2026)
- [Common App Updates 2025-2026](https://www.ivyloungetestprep.com/blog/common-app-updates-2025-2026)

**AI Detection & Academic Integrity:**
- [Gen AI Policies at Top Universities 2025](https://www.thesify.ai/blog/gen-ai-policies-update-2025)
- [Academic Integrity & AI Detection 2025](https://packback.co/resources/blog/moving-beyond-plagiarism-and-ai-detection-academic-integrity-in-2025/)
- [Columbia University AI Policy](https://provost.columbia.edu/content/office-senior-vice-provost/ai-policy)
- [State of Academic Integrity 2025](https://www.pangram.com/blog/the-state-of-academic-integrity-and-ai-detection-2025)

**AI Safety & Guardrails:**
- [AI Guardrails Implementation Guide](https://www.wiz.io/academy/ai-security/ai-guardrails)
- [LLM Guardrails Best Practices](https://www.datadoghq.com/blog/llm-guardrails-best-practices/)
- [Prompt Injection Prevention](https://kili-technology.com/blog/preventing-adversarial-prompt-injections-with-llm-guardrails)
- [AWS Bedrock Guardrails](https://aws.amazon.com/blogs/machine-learning/build-safe-and-responsible-generative-ai-applications-with-guardrails/)

**Demographics:**
- [College Enrollment Statistics 2024-2025](https://www.bestcolleges.com/research/college-enrollment-statistics/)
- [College Enrollment Demographics 2026](https://educationdata.org/college-enrollment-statistics)
- [International Students Open Doors Report](https://www.highereddive.com/news/international-students-in-us-up-45-in-2024-25-but-warning-signs-loom/805614/)
- [Demographic Cliff Analysis](https://agb.org/trusteeship-article/feature-the-enrollment-cliff/)

### 15.3 Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Jan 2026 | CTO Office | Initial comprehensive PRD |

---

**Document Status:** Ready for Executive Review
**Next Review Date:** February 15, 2026
**Owner:** CTO Office
