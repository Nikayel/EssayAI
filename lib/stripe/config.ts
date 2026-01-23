import Stripe from 'stripe';

/**
 * Stripe client configuration
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
});

/**
 * Package pricing in cents
 */
export const PRICING = {
  // ==========================================================================
  // NEW TIERED ANALYSIS SYSTEM
  // ==========================================================================
  ANALYSIS_QUICK: 999, // $9.99 - Quick Score
  ANALYSIS_STANDARD: 7900, // $79 - Full Analysis
  ANALYSIS_PREMIUM: 24900, // $249 - Expert Review (includes human)

  // Legacy tiers (kept for backwards compatibility)
  // Standard tiers
  AI_LITE: 900, // $9
  AI_PRO_SINGLE: 2900, // $29
  AI_PRO_MONTHLY: 4900, // $49/month (up to 6 essays)

  // Ivy League tiers (premium)
  IVY_SINGLE: 3900, // $39 - Single Ivy essay analysis
  IVY_BUNDLE_3: 9900, // $99 - 3 Ivy essays
  IVY_BUNDLE_8: 19900, // $199 - All 8 Ivies
  IVY_UNLIMITED: 29900, // $299 - Unlimited Ivy essays for season

  // Human review tiers
  HUMAN_LITE: 7900, // $79
  HUMAN_OVERALL_REVIEW: 12900, // $129 - NEW!
  HUMAN_FULL_1: 12900, // $129
  HUMAN_FULL_3: 27900, // $279
  HUMAN_FULL_5: 39900, // $399
  DEEP_REVIEW: 45000, // $450 - NEW PREMIUM!

  // Ivy + Human combos
  IVY_HUMAN_COMBO: 14900, // $149 - AI + 1 human review for 1 Ivy
  IVY_PREMIUM_BUNDLE: 49900, // $499 - All 8 Ivies AI + 3 human reviews

  // Add-ons
  EXPERT_QA_PREMIUM: 30000, // $300 - 2-day unlimited Q&A (DEEP_REVIEW upsell)
  EXPERT_QA_STANDARD: 15000, // $150 - 1-day Q&A session
  RUSH_ADDON: 4900, // $49
} as const;

/**
 * Package descriptions
 */
export const PACKAGE_INFO = {
  AI_LITE: {
    name: 'AI Lite',
    description: 'Commons Check + basic rubric scores + 5 targeted fixes',
    price: PRICING.AI_LITE,
    features: [
      'Commons Check flags',
      'Basic rubric scores',
      '5 targeted improvement suggestions',
      'Word count & formatting check',
    ],
  },
  AI_PRO_SINGLE: {
    name: 'AI Pro (Single Essay)',
    description: 'Full rubric + rewrite suggestions + school-fit analysis',
    price: PRICING.AI_PRO_SINGLE,
    features: [
      'Everything in AI Lite',
      'Full weighted rubric (7 dimensions)',
      'Rewrite suggestions with voice preservation',
      'Version comparison & diff view',
      'School-fit analysis',
      'Tone preservation check',
      'Comprehensive checklist',
    ],
  },
  AI_PRO_MONTHLY: {
    name: 'AI Pro (Monthly)',
    description: 'Up to 6 essays per month',
    price: PRICING.AI_PRO_MONTHLY,
    features: [
      'Everything in AI Pro',
      'Up to 6 essays per month',
      'Unlimited revisions',
      'Priority support',
    ],
  },
  HUMAN_LITE: {
    name: 'Human Review Lite',
    description: '1 comprehensive edit pass with margin comments',
    price: PRICING.HUMAN_LITE,
    features: [
      'Professional editor review',
      'Margin comments & tracked changes',
      'Written summary & recommendations',
      '48-hour turnaround',
      'Direct messaging with reviewer',
    ],
  },
  HUMAN_FULL_1: {
    name: 'Human Full (1 Review)',
    description: 'Single in-depth review with iteration',
    price: PRICING.HUMAN_FULL_1,
    features: [
      'Everything in Human Lite',
      'More detailed feedback',
      '1 revision round included',
      '72-hour turnaround',
    ],
  },
  HUMAN_FULL_3: {
    name: 'Human Full (3 Reviews)',
    description: 'Three review rounds for continuous improvement',
    price: PRICING.HUMAN_FULL_3,
    features: [
      'Everything in Human Full',
      '3 review rounds',
      'Track progress across revisions',
      'Best value for serious applicants',
    ],
  },
  HUMAN_FULL_5: {
    name: 'Human Full (5 Reviews)',
    description: 'Complete coaching package',
    price: PRICING.HUMAN_FULL_5,
    features: [
      'Everything in Human Full',
      '5 review rounds',
      'Dedicated editor assignment',
      'Priority scheduling',
      'Comprehensive voice development',
    ],
  },
  HUMAN_OVERALL_REVIEW: {
    name: 'Overall Review',
    description: 'Single comprehensive holistic review',
    price: PRICING.HUMAN_OVERALL_REVIEW,
    features: [
      'AI analysis included',
      'Expert holistic review',
      'Overall assessment & summary',
      'Top-level improvement recommendations',
      '48-hour turnaround',
      'Perfect for quick feedback',
    ],
  },
  DEEP_REVIEW: {
    name: 'Deep Review Premium',
    description: 'The ultimate essay transformation package',
    price: PRICING.DEEP_REVIEW,
    features: [
      'AI Pro analysis included',
      'Line-by-line deep edit',
      'Comprehensive structural analysis',
      'Voice coaching & development',
      'Multiple revision rounds (up to 5)',
      'Dedicated senior editor',
      '1-on-1 video call session',
      'School-specific optimization',
      'Admissions strategy consultation',
      '24-hour priority turnaround',
      'Guaranteed transformation or money back',
    ],
  },
  EXPERT_QA_PREMIUM: {
    name: '2-Day Expert Q&A Session',
    description: 'Unlimited questions & answers about your essay for 48 hours',
    price: PRICING.EXPERT_QA_PREMIUM,
    features: [
      'Unlimited questions for 48 hours',
      'Direct messaging with your expert reviewer',
      'Follow-up on any part of your review',
      'Strategy questions answered',
      'Revision guidance included',
      'Same expert who reviewed your essay',
      'Response time: under 2 hours during business hours',
    ],
  },
  EXPERT_QA_STANDARD: {
    name: 'Expert Q&A Session',
    description: 'Ask questions about your essay and get expert answers',
    price: PRICING.EXPERT_QA_STANDARD,
    features: [
      '24-hour Q&A window',
      'Up to 10 questions answered',
      'Direct messaging with expert',
      'Clarification on feedback',
      'Revision suggestions',
      'Response time: under 4 hours',
    ],
  },

  // === IVY LEAGUE PACKAGES ===
  IVY_SINGLE: {
    name: 'Ivy League Single',
    description: 'Deep analysis for one Ivy League essay',
    price: PRICING.IVY_SINGLE,
    features: [
      'School-specific analysis',
      'Fit score with evidence',
      '2025-26 prompt alignment',
      'Mission & values match',
      'Red flag detection',
      'Actionable improvements',
      'Voice preservation check',
    ],
  },
  IVY_BUNDLE_3: {
    name: 'Ivy League 3-Pack',
    description: 'Analyze essays for 3 Ivy League schools',
    price: PRICING.IVY_BUNDLE_3,
    features: [
      'Everything in Ivy Single',
      '3 school analyses',
      'Cross-essay consistency',
      'Save $18 vs individual',
    ],
  },
  IVY_BUNDLE_8: {
    name: 'Full Ivy Coverage',
    description: 'All 8 Ivy League schools covered',
    price: PRICING.IVY_BUNDLE_8,
    features: [
      'Everything in Ivy Single',
      'All 8 Ivy analyses',
      'School comparison insights',
      'Portfolio consistency check',
      'Save $112 vs individual',
    ],
  },
  IVY_UNLIMITED: {
    name: 'Ivy Season Pass',
    description: 'Unlimited Ivy essays for entire application season',
    price: PRICING.IVY_UNLIMITED,
    features: [
      'Unlimited Ivy analyses',
      'All 8 schools',
      'Revision tracking',
      'Priority support',
      'Valid through April 2026',
    ],
  },
  IVY_HUMAN_COMBO: {
    name: 'Ivy + Expert Review',
    description: 'AI analysis plus human expert review',
    price: PRICING.IVY_HUMAN_COMBO,
    features: [
      'Ivy League AI analysis',
      '1 expert human review',
      'School-specific feedback',
      '48-hour turnaround',
      'Best of both worlds',
    ],
  },
  IVY_PREMIUM_BUNDLE: {
    name: 'Ivy Premium Bundle',
    description: 'The complete Ivy League package',
    price: PRICING.IVY_PREMIUM_BUNDLE,
    features: [
      'All 8 Ivy AI analyses',
      '3 expert human reviews',
      'Priority turnaround',
      'Dedicated support',
      'Strategy consultation',
      'Best value for serious applicants',
    ],
  },
} as const;
