'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TIER_CONFIG,
  formatPrice,
  getUpgradePrice,
  getUpsellMessage,
  type AllTiers,
  type IvyTier,
} from '@/lib/pricing';
import {
  X,
  Sparkles,
  Check,
  ArrowRight,
  Gift,
  TrendingUp,
  School,
} from 'lucide-react';

interface PostPurchaseUpsellProps {
  currentTier: AllTiers;
  sessionId: string;
  onDismiss: () => void;
  onUpgrade: (tier: AllTiers) => void;
  className?: string;
}

export function PostPurchaseUpsell({
  currentTier,
  sessionId,
  onDismiss,
  onUpgrade,
  className,
}: PostPurchaseUpsellProps) {
  const [isLoading, setIsLoading] = useState<AllTiers | null>(null);

  const currentTierInfo = TIER_CONFIG[currentTier];
  const upsellMessage = getUpsellMessage(currentTier);

  // If no upsell available, don't render
  if (!upsellMessage) return null;

  const handleUpgrade = async (targetTier: AllTiers) => {
    setIsLoading(targetTier);
    try {
      const upgradePrice = getUpgradePrice(currentTier, targetTier);
      const response = await fetch('/api/tiered-analysis/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          fromTier: currentTier,
          toTier: targetTier,
          upgradePrice,
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

  // Different upsell flows based on current tier
  if (currentTier === 'quick') {
    // Just bought $9.99 Quick - upsell to Ivy Single ($39)
    const ivySingle = TIER_CONFIG.ivy_single;
    const ivyBundle3 = TIER_CONFIG.ivy_bundle_3;
    const upgradeToSingle = getUpgradePrice('quick', 'ivy_single');
    const upgradeToBundle = getUpgradePrice('quick', 'ivy_bundle_3');

    return (
      <Card className={`border-amber-200 bg-gradient-to-br from-amber-50 to-white ${className}`}>
        <CardHeader className="relative pb-2">
          <button
            onClick={onDismiss}
            className="absolute top-4 right-4 p-1 rounded hover:bg-neutral-100"
          >
            <X className="w-5 h-5 text-neutral-400" />
          </button>
          <Badge variant="premium" size="lg" className="w-fit">
            <Sparkles className="w-3.5 h-3.5" />
            Limited Time Upgrade
          </Badge>
          <CardTitle className="text-xl text-neutral-900">
            Want School-Specific AO Feedback?
          </CardTitle>
          <p className="text-sm text-neutral-600">
            You got the quick feedback. Now see exactly what {currentTierInfo.features[0]?.includes('Ivy') ? 'your target school\'s' : 'Ivy League'} admissions officers will think.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Primary: Ivy Single */}
          <div className="border rounded-lg p-4 bg-white hover:border-amber-300 transition-colors">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-semibold text-neutral-900">{ivySingle.name}</h4>
                <p className="text-sm text-neutral-500">{ivySingle.description}</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-neutral-900">
                  +{formatPrice(upgradeToSingle)}
                </div>
                <div className="text-xs text-neutral-500">to upgrade</div>
              </div>
            </div>
            <ul className="text-sm space-y-1 mb-3">
              {ivySingle.features.slice(0, 4).map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-neutral-600">
                  <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            <Button
              className="w-full"
              onClick={() => handleUpgrade('ivy_single')}
              disabled={isLoading !== null}
            >
              {isLoading === 'ivy_single' ? (
                <span className="animate-pulse">Processing...</span>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4" />
                  Upgrade for {formatPrice(upgradeToSingle)}
                </>
              )}
            </Button>
          </div>

          {/* Secondary: Bundle upsell */}
          <div className="border border-dashed rounded-lg p-3 bg-neutral-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <School className="w-4 h-4 text-neutral-500" />
                <span className="text-sm text-neutral-600">
                  Applying to 3+ Ivies? Save {formatPrice(ivyBundle3.savingsVsIndividual || 0)}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleUpgrade('ivy_bundle_3')}
                disabled={isLoading !== null}
              >
                {formatPrice(upgradeToBundle)} total
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (currentTier === 'ivy_single') {
    // Bought $39 Ivy Single - upsell to 3-school bundle ($79)
    const ivyBundle3 = TIER_CONFIG.ivy_bundle_3;
    const ivyBundle8 = TIER_CONFIG.ivy_bundle_8;
    const upgradeToBundle3 = getUpgradePrice('ivy_single', 'ivy_bundle_3');
    const upgradeToBundle8 = getUpgradePrice('ivy_single', 'ivy_bundle_8');

    return (
      <Card className={`border-green-200 bg-gradient-to-br from-green-50 to-white ${className}`}>
        <CardHeader className="relative pb-2">
          <button
            onClick={onDismiss}
            className="absolute top-4 right-4 p-1 rounded hover:bg-neutral-100"
          >
            <X className="w-5 h-5 text-neutral-400" />
          </button>
          <Badge variant="success" size="lg" className="w-fit">
            <Gift className="w-3.5 h-3.5" />
            Bundle & Save
          </Badge>
          <CardTitle className="text-xl text-neutral-900">
            Applying to More Schools?
          </CardTitle>
          <p className="text-sm text-neutral-600">
            Add more Ivies to your analysis and get cross-school narrative checking included.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 3-School Bundle */}
          <div className="border rounded-lg p-4 bg-white hover:border-green-300 transition-colors">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-semibold text-neutral-900">{ivyBundle3.name}</h4>
                <p className="text-sm text-neutral-500">Add 2 more schools</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-neutral-900">
                  +{formatPrice(upgradeToBundle3)}
                </div>
                <div className="text-xs text-green-600">
                  Save {formatPrice(ivyBundle3.savingsVsIndividual || 0)} vs individual
                </div>
              </div>
            </div>
            <ul className="text-sm space-y-1 mb-3">
              {ivyBundle3.features.slice(1).map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-neutral-600">
                  <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            <Button
              className="w-full bg-green-600 hover:bg-green-700"
              onClick={() => handleUpgrade('ivy_bundle_3')}
              disabled={isLoading !== null}
            >
              {isLoading === 'ivy_bundle_3' ? (
                <span className="animate-pulse">Processing...</span>
              ) : (
                <>
                  <Gift className="w-4 h-4" />
                  Add 2 Schools for {formatPrice(upgradeToBundle3)}
                </>
              )}
            </Button>
          </div>

          {/* All 8 Ivies */}
          <div className="border border-dashed rounded-lg p-3 bg-neutral-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-sm text-neutral-600">
                  All 8 Ivies? Save {formatPrice(ivyBundle8.savingsVsIndividual || 0)}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleUpgrade('ivy_bundle_8')}
                disabled={isLoading !== null}
              >
                +{formatPrice(upgradeToBundle8)}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (currentTier === 'ivy_bundle_3') {
    // Bought $79 bundle - upsell to all 8 ($149)
    const ivyBundle8 = TIER_CONFIG.ivy_bundle_8;
    const upgradePrice = getUpgradePrice('ivy_bundle_3', 'ivy_bundle_8');

    return (
      <Card className={`border-purple-200 bg-gradient-to-br from-purple-50 to-white ${className}`}>
        <CardHeader className="relative pb-2">
          <button
            onClick={onDismiss}
            className="absolute top-4 right-4 p-1 rounded hover:bg-neutral-100"
          >
            <X className="w-5 h-5 text-neutral-400" />
          </button>
          <Badge variant="new" size="lg" className="w-fit">
            <Sparkles className="w-3.5 h-3.5" />
            Complete Coverage
          </Badge>
          <CardTitle className="text-xl text-neutral-900">
            Go for All 8 Ivies?
          </CardTitle>
          <p className="text-sm text-neutral-600">
            Get complete coverage for all Ivy League schools with master narrative tracking.
          </p>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-4 bg-white">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-semibold text-neutral-900">{ivyBundle8.name}</h4>
                <p className="text-sm text-neutral-500">Add 5 more schools</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-neutral-900">
                  +{formatPrice(upgradePrice)}
                </div>
                <div className="text-xs text-purple-600">
                  Save {formatPrice(ivyBundle8.savingsVsIndividual || 0)} total
                </div>
              </div>
            </div>
            <ul className="text-sm space-y-1 mb-3">
              {ivyBundle8.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-neutral-600">
                  <Check className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            <Button
              className="w-full bg-purple-600 hover:bg-purple-700"
              onClick={() => handleUpgrade('ivy_bundle_8')}
              disabled={isLoading !== null}
            >
              {isLoading === 'ivy_bundle_8' ? (
                <span className="animate-pulse">Processing...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Complete Your Ivy Coverage
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default: use generic upsell message
  return (
    <Card className={`border-brand-200 bg-gradient-to-br from-brand-50 to-white ${className}`}>
      <CardHeader className="relative pb-2">
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 p-1 rounded hover:bg-neutral-100"
        >
          <X className="w-5 h-5 text-neutral-400" />
        </button>
        <CardTitle className="text-xl text-neutral-900">
          {upsellMessage.headline}
        </CardTitle>
        <p className="text-sm text-neutral-600">{upsellMessage.subtext}</p>
      </CardHeader>
      <CardContent>
        <Button
          className="w-full"
          onClick={() => handleUpgrade(upsellMessage.tier.id)}
          disabled={isLoading !== null}
        >
          {upsellMessage.ctaText}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
