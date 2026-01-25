/**
 * Configuration System - Main Entry Point
 *
 * Usage:
 *   import { config, getConfig } from '@/lib/config';
 *
 *   // Access current config (sync, uses cached values)
 *   const price = config.pricing.tiers.quick;
 *
 *   // Get specific value with DB override check (async)
 *   const price = await getConfig('pricing.tiers.quick');
 *
 * Design:
 *   1. Defaults are calculated/static in defaults.ts
 *   2. DB overrides take precedence (ConfigOverride table)
 *   3. Cache is refreshed periodically or on-demand
 */

import type { AppConfig, ConfigOverride, AnalysisTier, TierConfig, IvyTier, IvyTierConfig, AnyTier } from './types';
import {
  buildDefaultConfig,
  TIER_CONFIGS,
  IVY_TIER_CONFIGS,
  calculateCurrentCycle,
  calculateGraduationYears,
  IVY_LEAGUE_SCHOOLS,
  IVY_LEAGUE_DISPLAY_NAMES,
} from './defaults';

// =============================================================================
// CONFIG CACHE
// =============================================================================

let configCache: AppConfig | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get the full configuration object
 * Uses cache, rebuilds if stale
 */
export function getAppConfig(): AppConfig {
  const now = Date.now();

  if (!configCache || now - cacheTimestamp > CACHE_TTL_MS) {
    configCache = buildDefaultConfig();
    cacheTimestamp = now;
  }

  return configCache;
}

/**
 * Force refresh the config cache
 * Call this after admin updates config
 */
export function refreshConfig(): void {
  configCache = null;
  cacheTimestamp = 0;
}

// =============================================================================
// TYPED CONFIG ACCESSORS
// =============================================================================

/**
 * Main config object - use for synchronous access
 * Values are calculated fresh or from cache
 */
export const config = {
  get pricing() {
    return getAppConfig().pricing;
  },
  get cycle() {
    return getAppConfig().cycle;
  },
  get scoring() {
    return getAppConfig().scoring;
  },
  get models() {
    return getAppConfig().models;
  },
  get aiDetection() {
    return getAppConfig().aiDetection;
  },
  get guardrails() {
    return getAppConfig().guardrails;
  },
};

// =============================================================================
// ASYNC CONFIG WITH DB OVERRIDE
// =============================================================================

/**
 * Get a config value with database override support
 * Path uses dot notation: "pricing.tiers.quick"
 *
 * @param path - Dot-notation path to config value
 * @param defaultValue - Fallback if path doesn't exist
 */
export async function getConfig<T>(path: string, defaultValue?: T): Promise<T> {
  // Try to get DB override first
  const override = await getConfigOverride(path);
  if (override !== null) {
    return override as T;
  }

  // Fall back to default config
  const config = getAppConfig();
  const value = getNestedValue(config, path);

  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Config path not found: ${path}`);
  }

  return value as T;
}

/**
 * Set a config override in the database
 * This persists across restarts
 */
export async function setConfigOverride(
  path: string,
  value: unknown,
  updatedBy?: string
): Promise<void> {
  // Import prisma lazily to avoid circular deps
  const { prisma } = await import('@/lib/db');

  await prisma.configOverride.upsert({
    where: { key: path },
    update: {
      value: value as any,
      updatedBy,
    },
    create: {
      key: path,
      value: value as any,
      updatedBy,
    },
  });

  // Invalidate cache
  refreshConfig();
}

/**
 * Get a config override from database
 */
async function getConfigOverride(path: string): Promise<unknown | null> {
  try {
    // Import prisma lazily to avoid circular deps
    const { prisma } = await import('@/lib/db');

    const override = await prisma.configOverride.findUnique({
      where: { key: path },
    });

    return override?.value ?? null;
  } catch {
    // If DB not available, return null (use defaults)
    return null;
  }
}

// =============================================================================
// TIER HELPERS
// =============================================================================

/**
 * Get tier configuration by ID
 */
export function getTierConfig(tier: AnalysisTier): TierConfig {
  return TIER_CONFIGS[tier];
}

/**
 * Get Ivy tier configuration by ID
 */
export function getIvyTierConfig(tier: IvyTier): IvyTierConfig {
  return IVY_TIER_CONFIGS[tier];
}

/**
 * Get any tier config (standard or Ivy)
 */
export function getAnyTierConfig(tier: AnyTier): TierConfig | IvyTierConfig {
  if (tier.startsWith('ivy_')) {
    return IVY_TIER_CONFIGS[tier as IvyTier];
  }
  return TIER_CONFIGS[tier as AnalysisTier];
}

/**
 * Check if tier is an Ivy tier
 */
export function isIvyTier(tier: string): tier is IvyTier {
  return tier.startsWith('ivy_');
}

/**
 * Get all tier configurations
 */
export function getAllTiers(): TierConfig[] {
  return Object.values(TIER_CONFIGS);
}

/**
 * Get all Ivy tier configurations
 */
export function getAllIvyTiers(): IvyTierConfig[] {
  return Object.values(IVY_TIER_CONFIGS);
}

/**
 * Get tier price in cents
 */
export function getTierPrice(tier: AnalysisTier): number {
  if (tier === 'preview') return 0; // Preview is free
  return config.pricing.tiers[tier as Exclude<AnalysisTier, 'preview'>];
}

/**
 * Check if a feature is available for a tier
 */
export function tierHasFeature(
  tier: AnalysisTier,
  feature: keyof TierConfig['features']
): boolean {
  const tierConfig = getTierConfig(tier);
  const value = tierConfig.features[feature];

  // Handle numeric features (like actionableItemsLimit)
  if (typeof value === 'number') {
    return value !== 0;
  }

  return Boolean(value);
}

// =============================================================================
// CYCLE HELPERS
// =============================================================================

/**
 * Get current admissions cycle string
 */
export function getCurrentCycle(): string {
  return calculateCurrentCycle();
}

/**
 * Get valid graduation years for forms
 */
export function getGraduationYears(): number[] {
  return calculateGraduationYears();
}

/**
 * Get school deadline for current cycle
 */
export function getSchoolDeadline(
  schoolId: string,
  type: 'earlyDecision' | 'earlyAction' | 'regularDecision'
): string | null {
  const deadlines = config.cycle.deadlines[schoolId.toLowerCase()];
  if (!deadlines) return null;
  return deadlines[type] ?? null;
}

/**
 * Get acceptance rate for a school
 */
export function getAcceptanceRate(schoolId: string): number | null {
  return config.cycle.acceptanceRates[schoolId.toLowerCase()] ?? null;
}

// =============================================================================
// SCORING HELPERS
// =============================================================================

/**
 * Get score label for a numeric score
 */
export function getScoreLabel(
  score: number
): 'needs_work' | 'developing' | 'competitive' | 'strong' | 'exceptional' {
  const { thresholds } = config.scoring;

  if (score >= thresholds.exceptional.min) return 'exceptional';
  if (score >= thresholds.strong.min) return 'strong';
  if (score >= thresholds.competitive.min) return 'competitive';
  if (score >= thresholds.developing.min) return 'developing';
  return 'needs_work';
}

/**
 * Get default weights for scoring
 */
export function getDefaultWeights() {
  return config.scoring.defaultWeights;
}

/**
 * Get dimension max scores
 */
export function getDimensionMaxScores() {
  return config.scoring.dimensionMaxScores;
}

// =============================================================================
// MODEL HELPERS
// =============================================================================

/**
 * Get Claude model ID by tier
 */
export function getClaudeModel(tier: 'fast' | 'balanced' | 'premium'): string {
  return config.models.claude[tier];
}

/**
 * Get embedding model config
 */
export function getEmbeddingModel() {
  return config.models.embedding;
}

// =============================================================================
// SCHOOL HELPERS
// =============================================================================

/**
 * Get all Ivy League school IDs
 */
export function getIvyLeagueSchools(): readonly string[] {
  return IVY_LEAGUE_SCHOOLS;
}

/**
 * Get display name for a school
 */
export function getSchoolDisplayName(schoolId: string): string {
  const normalized = schoolId.toLowerCase() as keyof typeof IVY_LEAGUE_DISPLAY_NAMES;
  return IVY_LEAGUE_DISPLAY_NAMES[normalized] ?? schoolId;
}

/**
 * Check if a school ID is valid Ivy League
 */
export function isIvyLeagueSchool(schoolId: string): boolean {
  return IVY_LEAGUE_SCHOOLS.includes(schoolId.toLowerCase() as any);
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: Record<string, any>, path: string): unknown {
  return path.split('.').reduce((current, key) => {
    if (current === undefined || current === null) return undefined;
    return current[key];
  }, obj as any);
}

// =============================================================================
// EXPORTS
// =============================================================================

export type {
  AppConfig,
  ConfigOverride,
  AnalysisTier,
  TierConfig,
  IvyTier,
  IvyTierConfig,
  AnyTier,
  TierFeatures,
  IvyTierFeatures,
  PricingConfig,
  ScoringConfig,
  AIModelConfig,
  AIDetectionConfig,
  GuardrailsConfig,
} from './types';

export {
  TIER_CONFIGS,
  IVY_TIER_CONFIGS,
  IVY_LEAGUE_SCHOOLS,
  IVY_LEAGUE_DISPLAY_NAMES,
} from './defaults';
