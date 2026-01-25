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
export type IvyTier = 'ivy_single' | 'ivy_bundle_3';
export type PremiumTier = 'premium';
export type AllTiers = QuickTier | IvyTier | PremiumTier;

/** @deprecated Use AllTiers instead */
export type StandardTier = 'standard' | 'premium';

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

/**
 * SIMPLIFIED TIER CONFIG (Jan 2026)
 *
 * Main Funnel:
 *   FREE → $9.99 Quick → $39 Ivy Single → $79 Ivy 3-Pack → $249 Premium
 *
 * Each tier has clear value proposition and upsell path.
 */
export const TIER_CONFIG: Record<AllTiers, TierInfo> = {
  // =========================================================================
  // QUICK TIER - $9.99 (Entry Point)
  // =========================================================================
  quick: {
    id: 'quick',
    name: 'Quick Scan',
    shortName: 'Quick',
    priceInCents: PRICING.ANALYSIS_QUICK,
    description: 'Personalized feedback in 60 seconds',
    features: [
      'Overall score (0-100)',
      'Top 5 critical issues identified',
      'Personalized feedback using YOUR spike & activities',
      'AI detection check',
      'First-gen/international context awareness',
    ],
    isIvy: false,
    upsellTo: 'ivy_single',
  },

  // =========================================================================
  // IVY SINGLE - $39 (Main Conversion Point)
  // =========================================================================
  ivy_single: {
    id: 'ivy_single',
    name: 'Ivy Single School',
    shortName: 'Ivy Single',
    priceInCents: PRICING.IVY_SINGLE,
    description: 'Complete analysis for ONE Ivy school',
    features: [
      'Full portfolio analysis (all essays for this school)',
      'Line-by-line feedback with fixes',
      'School-specific AO perspective',
      '"So What?" test on each essay',
      'Resume-essay detection',
      'Instant reject signal detection',
    ],
    schoolsIncluded: 1,
    isIvy: true,
    upsellTo: 'ivy_bundle_3',
  },

  // =========================================================================
  // IVY 3-PACK - $79 (Most Popular)
  // =========================================================================
  ivy_bundle_3: {
    id: 'ivy_bundle_3',
    name: 'Ivy 3-School Bundle',
    shortName: 'Ivy 3-Pack',
    priceInCents: PRICING.IVY_BUNDLE_3,
    description: 'Complete analysis for THREE Ivy schools',
    features: [
      'Everything in Ivy Single for 3 schools',
      'Cross-school narrative consistency check',
      'Strategic differentiation tips',
      'Portfolio comparison across schools',
    ],
    schoolsIncluded: 3,
    isIvy: true,
    savingsVsIndividual: 3800, // $38 savings vs buying 3 singles
    upsellTo: 'premium',
  },

  // =========================================================================
  // PREMIUM - $249 (3 Ivies AI + Human Expert)
  // =========================================================================
  premium: {
    id: 'premium',
    name: 'Premium Expert Review',
    shortName: 'Premium',
    priceInCents: PRICING.ANALYSIS_PREMIUM,
    description: '3 Ivy schools + human expert review',
    features: [
      'Everything in Ivy 3-Pack',
      'Human expert review (former AO)',
      'Detailed margin comments',
      'Direct messaging with your reviewer',
      '48-hour turnaround',
    ],
    schoolsIncluded: 3,
    isIvy: true,
  },
};

// Legacy alias for backwards compatibility
/** @deprecated Use TIER_CONFIG instead */
export const LEGACY_TIER_CONFIG = {
  ...TIER_CONFIG,
  // Add standard as alias for ivy_bundle_3 for backwards compat
  standard: {
    ...TIER_CONFIG.ivy_bundle_3,
    id: 'standard' as AllTiers,
    name: 'Full Analysis',
    isIvy: false,
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
    TIER_CONFIG.premium, // Premium includes 3 Ivies + human review
  ];
}

/**
 * Validate if a tier is an Ivy tier
 */
export function isIvyTier(tierId: string): tierId is IvyTier {
  return ['ivy_single', 'ivy_bundle_3'].includes(tierId);
}

/**
 * Get the appropriate Ivy tier based on number of schools
 */
export function getRecommendedIvyTier(schoolCount: number): IvyTier | PremiumTier {
  if (schoolCount <= 1) return 'ivy_single';
  if (schoolCount <= 3) return 'ivy_bundle_3';
  // For 4+ schools, recommend premium which includes human review
  return 'premium';
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
 *
 * Upsell Flow:
 *   Quick ($9.99) → Ivy Single ($39): "Get line-by-line fixes"
 *   Ivy Single ($39) → Ivy 3-Pack ($79): "Add 2 more schools"
 *   Ivy 3-Pack ($79) → Premium ($249): "Add human expert review"
 */
export function getUpsellMessage(currentTier: AllTiers): UpsellMessage | null {
  const upsellTier = getUpsellTier(currentTier);
  if (!upsellTier) return null;

  const upgradePrice = getFormattedUpgradePrice(currentTier, upsellTier.id);

  switch (upsellTier.id) {
    case 'ivy_single':
      return {
        headline: 'Want line-by-line feedback?',
        subtext: `Upgrade to see exactly HOW to fix each issue, plus school-specific AO insights and portfolio analysis. Just ${upgradePrice} more.`,
        ctaText: `Get Full Analysis - ${upgradePrice}`,
        tier: upsellTier,
      };

    case 'ivy_bundle_3':
      return {
        headline: 'Applying to more than one Ivy?',
        subtext: `Most students apply to 2-4 Ivies. Get full analysis for 3 schools with cross-narrative consistency check. Save ${getBundleSavings('ivy_bundle_3')?.formatted} vs buying separately.`,
        ctaText: `Upgrade to 3-School Bundle - ${upgradePrice}`,
        tier: upsellTier,
        savings: getBundleSavings('ivy_bundle_3')?.formatted,
      };

    case 'premium':
      return {
        headline: 'Want a former AO to review your essays?',
        subtext: `Get everything in the 3-School Bundle PLUS a human expert review from a former admissions officer. 48-hour turnaround, direct messaging.`,
        ctaText: `Add Expert Review - ${upgradePrice}`,
        tier: upsellTier,
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
