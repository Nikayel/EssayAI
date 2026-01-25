'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  TIER_CONFIG,
  formatPrice,
  getUpgradePrice,
  type AllTiers,
} from '@/lib/pricing';
import {
  X,
  Sparkles,
  Check,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Users,
  Star,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface PostPurchaseUpsellProps {
  currentTier: AllTiers;
  sessionId: string;
  schoolName?: string;
  onDismiss: () => void;
  onUpgrade: (tier: AllTiers) => void;
  className?: string;
}

/**
 * Apple-inspired Post-Purchase Upsell
 *
 * Design Principles:
 * - Single focused recommendation (not overwhelming)
 * - Celebrate the purchase first (positive reinforcement)
 * - Show clear value proposition
 * - Optional expansion for more options
 * - Clean whitespace-driven layout
 *
 * Psychology:
 * - Loss aversion: "What you're missing"
 * - Social proof: "Most students choose..."
 * - Anchoring: Show savings vs individual
 * - Reciprocity: Offer upgrade discount
 */
export function PostPurchaseUpsell({
  currentTier,
  sessionId,
  schoolName,
  onDismiss,
  onUpgrade,
  className,
}: PostPurchaseUpsellProps) {
  const [isLoading, setIsLoading] = useState<AllTiers | null>(null);
  const [showAllOptions, setShowAllOptions] = useState(false);

  // Get upgrade path based on current tier
  const upgradeConfig = getUpgradeConfig(currentTier);
  if (!upgradeConfig) return null;

  const handleUpgrade = async (targetTier: AllTiers) => {
    setIsLoading(targetTier);
    try {
      const response = await fetch('/api/tiered-analysis/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          fromTier: currentTier,
          toTier: targetTier,
        }),
      });

      const data = await response.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
      onUpgrade(targetTier);
    } catch (err) {
      console.error('Upgrade error:', err);
    } finally {
      setIsLoading(null);
    }
  };

  const { primary, secondary, headline, subtext, socialProof } = upgradeConfig;
  const upgradePrice = getUpgradePrice(currentTier, primary.id);

  return (
    <div className={cn(
      'relative overflow-hidden rounded-2xl',
      'bg-gradient-to-b from-white to-neutral-50',
      'border border-neutral-200/80',
      'shadow-lg shadow-neutral-200/50',
      className
    )}>
      {/* Subtle gradient accent */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600" />

      {/* Close button */}
      <button
        onClick={onDismiss}
        className="absolute top-4 right-4 p-2 rounded-full hover:bg-neutral-100 transition-colors z-10"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4 text-neutral-400" />
      </button>

      {/* Main content - Focused single recommendation */}
      <div className="p-8 pb-6">
        {/* Social proof badge */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex -space-x-1">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="w-6 h-6 rounded-full bg-gradient-to-br from-neutral-200 to-neutral-300 border-2 border-white"
              />
            ))}
          </div>
          <span className="text-xs text-neutral-500">{socialProof}</span>
        </div>

        {/* Headline */}
        <h3 className="text-2xl font-semibold text-neutral-900 tracking-tight mb-2">
          {headline}
        </h3>
        <p className="text-neutral-600 mb-6">
          {subtext}
        </p>

        {/* Primary recommendation - Clean card */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5 mb-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-neutral-900">{primary.name}</h4>
                <Badge variant="premium" size="sm">
                  <Star className="w-3 h-3" />
                  Recommended
                </Badge>
              </div>
              <p className="text-sm text-neutral-500">{primary.description}</p>
            </div>
          </div>

          {/* Key benefits - Max 3 for clarity */}
          <div className="space-y-2 mb-5">
            {primary.keyBenefits.slice(0, 3).map((benefit, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="mt-0.5 w-4 h-4 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                  <Check className="w-2.5 h-2.5 text-green-600" />
                </div>
                <span className="text-sm text-neutral-700">{benefit}</span>
              </div>
            ))}
          </div>

          {/* Price and CTA */}
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-neutral-900">
                  +{formatPrice(upgradePrice)}
                </span>
                <span className="text-sm text-neutral-500">to upgrade</span>
              </div>
              {primary.savings > 0 && (
                <p className="text-xs text-green-600 mt-0.5">
                  Save {formatPrice(primary.savings)} vs buying separately
                </p>
              )}
            </div>
            <Button
              onClick={() => handleUpgrade(primary.id)}
              disabled={isLoading !== null}
              className="px-6"
            >
              {isLoading === primary.id ? (
                <span className="animate-pulse">Processing...</span>
              ) : (
                <>
                  Upgrade
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Expandable other options */}
        {secondary && (
          <div className="border-t border-neutral-100 pt-4">
            <button
              onClick={() => setShowAllOptions(!showAllOptions)}
              className="flex items-center justify-between w-full text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
            >
              <span>See other options</span>
              {showAllOptions ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {showAllOptions && (
              <div className="mt-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
                {secondary.map((option) => {
                  const optionUpgradePrice = getUpgradePrice(currentTier, option.id);
                  return (
                    <div
                      key={option.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 hover:bg-neutral-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white border border-neutral-200 flex items-center justify-center">
                          {option.icon === 'users' ? (
                            <Users className="w-4 h-4 text-neutral-600" />
                          ) : (
                            <Sparkles className="w-4 h-4 text-amber-500" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-neutral-900">{option.name}</p>
                          <p className="text-xs text-neutral-500">{option.shortDesc}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUpgrade(option.id)}
                        disabled={isLoading !== null}
                      >
                        +{formatPrice(optionUpgradePrice)}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Trust footer */}
      <div className="px-8 py-4 bg-neutral-50 border-t border-neutral-100">
        <div className="flex items-center justify-center gap-4 text-xs text-neutral-500">
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            <span>Instant access</span>
          </div>
          <span className="text-neutral-300">•</span>
          <span>Secure payment</span>
          <span className="text-neutral-300">•</span>
          <span>Money-back guarantee</span>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// UPGRADE CONFIGURATION
// =============================================================================

interface UpgradeOption {
  id: AllTiers;
  name: string;
  description?: string;
  shortDesc?: string;
  keyBenefits: string[];
  savings: number;
  icon?: 'users' | 'sparkles';
}

interface UpgradeConfig {
  headline: string;
  subtext: string;
  socialProof: string;
  primary: UpgradeOption;
  secondary?: UpgradeOption[];
}

function getUpgradeConfig(currentTier: AllTiers): UpgradeConfig | null {
  const ivySingle = TIER_CONFIG.ivy_single;
  const ivyBundle3 = TIER_CONFIG.ivy_bundle_3;
  const ivyBundle8 = TIER_CONFIG.ivy_bundle_8;

  switch (currentTier) {
    case 'quick':
      return {
        headline: 'Get the Full Picture',
        subtext: 'See exactly what admissions officers will think about your essay.',
        socialProof: 'Most students upgrade for school-specific feedback',
        primary: {
          id: 'ivy_single',
          name: ivySingle.name,
          description: 'Complete analysis for your target school',
          keyBenefits: [
            'School-specific AO perspective & feedback',
            'Portfolio analysis across all your essays',
            'Red flag detection & "instant reject" checks',
          ],
          savings: 0,
        },
        secondary: [
          {
            id: 'ivy_bundle_3',
            name: ivyBundle3.name,
            shortDesc: 'Analyze 3 schools at once',
            keyBenefits: [],
            savings: ivyBundle3.savingsVsIndividual || 0,
            icon: 'users',
          },
        ],
      };

    case 'ivy_single':
      return {
        headline: 'Applying to More Schools?',
        subtext: 'Add cross-school narrative checking to ensure consistency.',
        socialProof: '67% of Ivy applicants apply to 3+ schools',
        primary: {
          id: 'ivy_bundle_3',
          name: ivyBundle3.name,
          description: 'Add 2 more schools to your analysis',
          keyBenefits: [
            'Cross-school narrative consistency check',
            'Strategic differentiation tips per school',
            'Portfolio comparison across applications',
          ],
          savings: ivyBundle3.savingsVsIndividual || 0,
        },
        secondary: [
          {
            id: 'ivy_bundle_8',
            name: 'Complete Ivy Coverage',
            shortDesc: 'All 8 Ivy League schools',
            keyBenefits: [],
            savings: ivyBundle8.savingsVsIndividual || 0,
            icon: 'sparkles',
          },
        ],
      };

    case 'ivy_bundle_3':
      return {
        headline: 'Complete Your Coverage',
        subtext: 'Get analysis for all 8 Ivy League schools.',
        socialProof: 'Serious applicants cover all their options',
        primary: {
          id: 'ivy_bundle_8',
          name: ivyBundle8.name,
          description: 'Add 5 more schools for complete coverage',
          keyBenefits: [
            'Master narrative tracking across all schools',
            'School-by-school tailoring recommendations',
            'Complete portfolio optimization',
          ],
          savings: ivyBundle8.savingsVsIndividual || 0,
        },
      };

    default:
      return null;
  }
}
