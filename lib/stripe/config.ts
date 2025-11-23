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
  AI_LITE: 900, // $9
  AI_PRO_SINGLE: 2900, // $29
  AI_PRO_MONTHLY: 4900, // $49/month (up to 6 essays)
  HUMAN_LITE: 7900, // $79
  HUMAN_FULL_1: 12900, // $129
  HUMAN_FULL_3: 27900, // $279
  HUMAN_FULL_5: 39900, // $399
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
} as const;
