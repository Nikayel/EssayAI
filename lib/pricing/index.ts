/**
 * Centralized Pricing Configuration & Utilities
 *
 * Single source of truth for all pricing, tiers, and display utilities.
 * Import from here instead of directly from stripe/config.ts
 */

import { PRICING, PACKAGE_INFO } from '@/lib/stripe/config';

// =============================================================================
// TIER TYPES
// =============================================================================

export type QuickTier = 'quick';
export type StandardTier = 'standard' | 'premium';
export type IvyTier = 'ivy_single' | 'ivy_bundle_3' | 'ivy_bundle_8';
export type AllTiers = QuickTier | StandardTier | IvyTier;

// =============================================================================
// TIER CONFIGURATION
// =============================================================================

export interface TierInfo {
  id: AllTiers;
  name: string;
  shortName: string;
  priceInCents: number;
  description: string;
  features: string[];
  schoolsIncluded?: number; // For Ivy tiers
  isIvy: boolean;
  upsellTo?: AllTiers; // What tier to upsell to after purchase
  savingsVsIndividual?: number; // For bundles
}

export const TIER_CONFIG: Record<AllTiers, TierInfo> = {
  // Quick tier - entry point
  quick: {
    id: 'quick',
    name: 'Quick Feedback',
    shortName: 'Quick',
    priceInCents: PRICING.ANALYSIS_QUICK,
    description: 'Essential fixes in 60 seconds',
    features: [
      'Overall score (0-100)',
      'Top 5 issues with fixes',
      'AI detection check',
      'Strength highlights',
    ],
    isIvy: false,
    upsellTo: 'ivy_single',
  },

  // Standard tier
  standard: {
    id: 'standard',
    name: 'Full Analysis',
    shortName: 'Full',
    priceInCents: PRICING.ANALYSIS_STANDARD,
    description: 'Complete essay analysis with line-by-line feedback',
    features: [
      'Everything in Quick',
      '7-dimension rubric scoring',
      'Line-by-line suggestions',
      'School-fit analysis',
      'Voice preservation check',
      'Rewrite suggestions',
    ],
    isIvy: false,
    upsellTo: 'ivy_single',
  },

  // Premium tier
  premium: {
    id: 'premium',
    name: 'Expert Review',
    shortName: 'Expert',
    priceInCents: PRICING.ANALYSIS_PREMIUM,
    description: 'AI + human expert review within 48 hours',
    features: [
      'Everything in Full Analysis',
      'Human expert review',
      'Detailed margin comments',
      'Direct messaging with reviewer',
      '48-hour turnaround',
    ],
    isIvy: false,
  },

  // Ivy Single - primary Ivy entry point
  ivy_single: {
    id: 'ivy_single',
    name: 'Ivy Single School',
    shortName: 'Ivy Single',
    priceInCents: PRICING.IVY_SINGLE,
    description: 'Complete analysis for ONE Ivy - all essays as portfolio',
    features: [
      'ALL essays for one school analyzed',
      'School-specific AO perspective',
      'Portfolio coherence analysis',
      'Resume-essay detection',
      '"So What?" test on each essay',
      'Instant reject signal detection',
      'Committee pitch assessment',
      'Line-by-line annotations',
    ],
    schoolsIncluded: 1,
    isIvy: true,
    upsellTo: 'ivy_bundle_3',
  },

  // Ivy 3-School Bundle
  ivy_bundle_3: {
    id: 'ivy_bundle_3',
    name: 'Ivy 3-School Bundle',
    shortName: 'Ivy 3-Pack',
    priceInCents: PRICING.IVY_BUNDLE_3,
    description: 'Complete analysis for THREE Ivies',
    features: [
      'Everything in Ivy Single for 3 schools',
      'Cross-school narrative check',
      'Strategic differentiation tips',
      'Portfolio comparison across schools',
    ],
    schoolsIncluded: 3,
    isIvy: true,
    savingsVsIndividual: 3800, // $38 savings
    upsellTo: 'ivy_bundle_8',
  },

  // Ivy All 8
  ivy_bundle_8: {
    id: 'ivy_bundle_8',
    name: 'Complete Ivy Coverage',
    shortName: 'All 8 Ivies',
    priceInCents: PRICING.IVY_BUNDLE_8,
    description: 'All 8 Ivy League schools covered',
    features: [
      'Everything for ALL 8 schools',
      'Master narrative tracking',
      'Full cross-school analysis',
      'School-by-school tailoring tips',
    ],
    schoolsIncluded: 8,
    isIvy: true,
    savingsVsIndividual: 16300, // $163 savings
  },
};

// =============================================================================
// PRICING UTILITIES
// =============================================================================

/**
 * Format price in cents to display string
 */
export function formatPrice(cents: number, options?: { showCents?: boolean }): string {
  const dollars = cents / 100;
  if (options?.showCents || cents % 100 !== 0) {
    return `$${dollars.toFixed(2)}`;
  }
  return `$${Math.floor(dollars)}`;
}

/**
 * Get tier configuration by ID
 */
export function getTierInfo(tierId: AllTiers): TierInfo {
  return TIER_CONFIG[tierId];
}

/**
 * Get formatted price for a tier
 */
export function getTierPrice(tierId: AllTiers, options?: { showCents?: boolean }): string {
  return formatPrice(TIER_CONFIG[tierId].priceInCents, options);
}

/**
 * Get all Ivy tiers
 */
export function getIvyTiers(): TierInfo[] {
  return Object.values(TIER_CONFIG).filter(t => t.isIvy);
}

/**
 * Get non-Ivy tiers
 */
export function getStandardTiers(): TierInfo[] {
  return Object.values(TIER_CONFIG).filter(t => !t.isIvy);
}

/**
 * Calculate savings for a bundle tier
 */
export function getBundleSavings(tierId: IvyTier): { amount: number; formatted: string } | null {
  const tier = TIER_CONFIG[tierId];
  if (!tier.savingsVsIndividual) return null;
  return {
    amount: tier.savingsVsIndividual,
    formatted: formatPrice(tier.savingsVsIndividual),
  };
}

/**
 * Get upsell tier info (for post-purchase upselling)
 */
export function getUpsellTier(currentTierId: AllTiers): TierInfo | null {
  const current = TIER_CONFIG[currentTierId];
  if (!current.upsellTo) return null;
  return TIER_CONFIG[current.upsellTo];
}

/**
 * Calculate upgrade price (difference between tiers)
 */
export function getUpgradePrice(fromTier: AllTiers, toTier: AllTiers): number {
  const from = TIER_CONFIG[fromTier];
  const to = TIER_CONFIG[toTier];
  return Math.max(0, to.priceInCents - from.priceInCents);
}

/**
 * Get formatted upgrade price
 */
export function getFormattedUpgradePrice(fromTier: AllTiers, toTier: AllTiers): string {
  return formatPrice(getUpgradePrice(fromTier, toTier));
}

// =============================================================================
// IVY-SPECIFIC UTILITIES
// =============================================================================

/**
 * Get Ivy tier options for display (sorted by price)
 */
export function getIvyTierOptions(): TierInfo[] {
  return [
    TIER_CONFIG.ivy_single,
    TIER_CONFIG.ivy_bundle_3,
    TIER_CONFIG.ivy_bundle_8,
  ];
}

/**
 * Validate if a tier is an Ivy tier
 */
export function isIvyTier(tierId: string): tierId is IvyTier {
  return ['ivy_single', 'ivy_bundle_3', 'ivy_bundle_8'].includes(tierId);
}

/**
 * Get the appropriate Ivy tier based on number of schools
 */
export function getRecommendedIvyTier(schoolCount: number): IvyTier {
  if (schoolCount <= 1) return 'ivy_single';
  if (schoolCount <= 3) return 'ivy_bundle_3';
  return 'ivy_bundle_8';
}

// =============================================================================
// UPSELL MESSAGING
// =============================================================================

export interface UpsellMessage {
  headline: string;
  subtext: string;
  ctaText: string;
  tier: TierInfo;
  savings?: string;
}

/**
 * Get upsell message for post-purchase screen
 */
export function getUpsellMessage(currentTier: AllTiers): UpsellMessage | null {
  const upsellTier = getUpsellTier(currentTier);
  if (!upsellTier) return null;

  const upgradePrice = getFormattedUpgradePrice(currentTier, upsellTier.id);

  switch (upsellTier.id) {
    case 'ivy_single':
      return {
        headline: 'Applying to an Ivy?',
        subtext: `Get school-specific AO feedback, portfolio coherence analysis, and instant reject detection for just ${upgradePrice} more.`,
        ctaText: `Upgrade to Ivy Analysis - ${upgradePrice}`,
        tier: upsellTier,
      };
    case 'ivy_bundle_3':
      return {
        headline: 'Applying to multiple Ivies?',
        subtext: `Add 2 more schools and get cross-school narrative analysis. Save ${getBundleSavings('ivy_bundle_3')?.formatted} vs buying separately.`,
        ctaText: `Upgrade to 3-School Bundle - ${upgradePrice}`,
        tier: upsellTier,
        savings: getBundleSavings('ivy_bundle_3')?.formatted,
      };
    case 'ivy_bundle_8':
      return {
        headline: 'Going for all 8 Ivies?',
        subtext: `Get complete coverage for all 8 schools with master narrative tracking. Save ${getBundleSavings('ivy_bundle_8')?.formatted}!`,
        ctaText: `Upgrade to Complete Ivy - ${upgradePrice}`,
        tier: upsellTier,
        savings: getBundleSavings('ivy_bundle_8')?.formatted,
      };
    default:
      return null;
  }
}

// =============================================================================
// PRICING DISPLAY COMPONENTS DATA
// =============================================================================

/**
 * Get pricing card data for display
 */
export function getPricingCardData(tierId: AllTiers) {
  const tier = TIER_CONFIG[tierId];
  return {
    ...tier,
    formattedPrice: formatPrice(tier.priceInCents),
    savings: tier.savingsVsIndividual ? formatPrice(tier.savingsVsIndividual) : null,
    pricePerSchool: tier.schoolsIncluded
      ? formatPrice(Math.round(tier.priceInCents / tier.schoolsIncluded))
      : null,
  };
}

// Re-export raw pricing for cases where it's needed
export { PRICING, PACKAGE_INFO } from '@/lib/stripe/config';
