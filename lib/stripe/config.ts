import Stripe from 'stripe';

/**
 * Lazy-initialized Stripe client
 * Initialized on first use to avoid build-time errors when env vars are missing
 */
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-11-17.clover',
      typescript: true,
    });
  }
  return _stripe;
}

// Legacy export for backwards compatibility - use getStripe() instead
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

/**
 * Package pricing in cents
 *
 * SIMPLIFIED PRICING STRUCTURE (Jan 2026)
 * ========================================
 *
 * Main Funnel:
 *   FREE Preview → $9.99 Quick → $39 Ivy Single → $79 Ivy 3-Pack → $249 Premium
 *
 * The funnel is designed to:
 *   1. Hook with free score + blurred issues
 *   2. $9.99 unlocks personalized feedback (uses spike, activities, background)
 *   3. $39 is the main conversion point (full Ivy analysis for 1 school)
 *   4. $79 bundle for 3 schools (most popular)
 *   5. $249 for premium (3 schools AI + human expert review)
 */
export const PRICING = {
  // ==========================================================================
  // ACTIVE TIERS (Main funnel)
  // ==========================================================================
  ANALYSIS_QUICK: 999,      // $9.99 - Quick Score with personalized feedback
  IVY_SINGLE: 3900,         // $39 - Full analysis for 1 Ivy school
  IVY_BUNDLE_3: 7900,       // $79 - Full analysis for 3 Ivy schools
  ANALYSIS_PREMIUM: 24900,  // $249 - 3 Ivies AI + 1 human expert review

  // ==========================================================================
  // HUMAN REVIEW ADD-ONS
  // ==========================================================================
  HUMAN_REVIEW_SINGLE: 7900,   // $79 - Add human review to any AI analysis
  HUMAN_REVIEW_DEEP: 14900,    // $149 - Deep human review with video call

  // ==========================================================================
  // LEGACY TIERS (kept for backwards compatibility - DO NOT USE IN NEW CODE)
  // ==========================================================================
  /** @deprecated Use IVY_BUNDLE_3 instead */
  ANALYSIS_STANDARD: 7900,
  /** @deprecated */
  AI_LITE: 900,
  /** @deprecated */
  AI_PRO_SINGLE: 2900,
  /** @deprecated */
  AI_PRO_MONTHLY: 4900,
  /** @deprecated - Removed, nobody applies to all 8 Ivies */
  IVY_BUNDLE_8: 14900,
  /** @deprecated */
  IVY_UNLIMITED: 24900,
  /** @deprecated */
  HUMAN_LITE: 7900,
  /** @deprecated */
  HUMAN_OVERALL_REVIEW: 12900,
  /** @deprecated */
  HUMAN_FULL_1: 12900,
  /** @deprecated */
  HUMAN_FULL_3: 27900,
  /** @deprecated */
  HUMAN_FULL_5: 39900,
  /** @deprecated */
  DEEP_REVIEW: 45000,
  /** @deprecated */
  IVY_HUMAN_COMBO: 14900,
  /** @deprecated */
  IVY_PREMIUM_BUNDLE: 49900,
  /** @deprecated */
  EXPERT_QA_PREMIUM: 30000,
  /** @deprecated */
  EXPERT_QA_STANDARD: 15000,
  /** @deprecated */
  RUSH_ADDON: 4900,
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

  // === IVY LEAGUE PACKAGES (Restructured Jan 2026) ===
  // $39 = ONE school, COMPLETE coverage (all essays as portfolio)
  // $79 = THREE schools, same depth
  // $149 = ALL 8 schools
  IVY_SINGLE: {
    name: 'Ivy Single School',
    description: 'Complete analysis for ONE Ivy - all essays analyzed as a portfolio',
    price: PRICING.IVY_SINGLE,
    features: [
      'ALL essays for this school (2-4 depending on school)',
      'School-specific AO perspective analysis',
      'Portfolio coherence check (are essays telling different stories?)',
      'Resume-essay detection (critical feedback if essays list activities)',
      'Leverage points (how to weave your background without being a resume)',
      '"So What?" test on each essay',
      'Former AO reading simulation',
      'Line-by-line annotations',
      'Fit score with specific evidence',
      'Red flag detection for this specific school',
      'Instant reject signal detection',
      'Committee pitch readiness assessment',
    ],
  },
  IVY_BUNDLE_3: {
    name: 'Ivy 3-School Bundle',
    description: 'Complete analysis for THREE Ivies - full portfolio for each',
    price: PRICING.IVY_BUNDLE_3,
    features: [
      'Everything in Ivy Single for 3 schools',
      'ALL essays per school analyzed',
      'Cross-school narrative consistency',
      'Strategic differentiation tips (how to tailor same story)',
      'Portfolio comparison across schools',
      'Save $38 vs buying individually',
    ],
  },
  IVY_BUNDLE_8: {
    name: 'Complete Ivy Coverage',
    description: 'All 8 Ivy League schools - every essay, complete analysis',
    price: PRICING.IVY_BUNDLE_8,
    features: [
      'Everything in Ivy Single for ALL 8 schools',
      'Full portfolio analysis per school',
      'Master narrative tracking across all schools',
      'School-by-school tailoring recommendations',
      'Best value for serious Ivy applicants',
      'Save $163 vs buying individually',
    ],
  },
  IVY_UNLIMITED: {
    name: 'Ivy Season Pass',
    description: 'Unlimited Ivy analyses for entire application season',
    price: PRICING.IVY_UNLIMITED,
    features: [
      'Unlimited analyses for all 8 Ivies',
      'Revision tracking (see improvement over drafts)',
      'Priority support',
      'Valid through April 2026',
      'Best for students iterating heavily',
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
