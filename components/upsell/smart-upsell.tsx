'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Sparkles, MessageCircle, TrendingUp } from 'lucide-react';
import { PACKAGE_INFO } from '@/lib/stripe/config';
import { useRouter } from 'next/navigation';
import { trackUpsellView, trackUpsellClick } from '@/lib/analytics/track';

interface SmartUpsellProps {
  currentPackage: string;
  essayId: string;
  hasHumanReview: boolean;
}

export function SmartUpsell({ currentPackage, essayId, hasHumanReview }: SmartUpsellProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  // Determine which upsells to show based on current package
  const getUpsells = () => {
    // DEEP_REVIEW buyers get premium Q&A offer
    if (currentPackage === 'DEEP_REVIEW' && hasHumanReview) {
      return [
        {
          package: 'EXPERT_QA_PREMIUM',
          title: '🔥 Continue the Conversation',
          subtitle: 'Your expert is standing by to answer ANY questions',
          icon: MessageCircle,
          highlight: true,
          urgency: 'Limited to Deep Review customers only',
        },
      ];
    }

    // Buyers of human review packages (but not DEEP_REVIEW) get standard Q&A
    if (hasHumanReview && ['HUMAN_LITE', 'HUMAN_OVERALL_REVIEW', 'HUMAN_FULL_1', 'HUMAN_FULL_3', 'HUMAN_FULL_5'].includes(currentPackage)) {
      return [
        {
          package: 'EXPERT_QA_STANDARD',
          title: 'Got Questions About Your Review?',
          subtitle: 'Get expert clarification on any feedback',
          icon: MessageCircle,
          highlight: false,
          urgency: null,
        },
        {
          package: 'DEEP_REVIEW',
          title: 'Upgrade to Deep Review',
          subtitle: 'Transform your essay with 5 revision rounds + video call',
          icon: TrendingUp,
          highlight: false,
          urgency: 'Most students see 15-20 point score improvement',
        },
      ];
    }

    // AI-only package buyers get different upsells
    if (['AI_LITE', 'AI_PRO_SINGLE', 'AI_PRO_MONTHLY'].includes(currentPackage)) {
      return [
        {
          package: 'HUMAN_LITE',
          title: 'Upgrade to Human Review',
          subtitle: 'Get expert human feedback on your essay',
          icon: Sparkles,
          highlight: true,
          urgency: '95% of students who add human review improve their score',
        },
        {
          package: 'DEEP_REVIEW',
          title: 'Go Premium',
          subtitle: 'Line-by-line edit + video call + unlimited revisions',
          icon: TrendingUp,
          highlight: false,
          urgency: 'Best value for serious applicants',
        },
      ];
    }

    return [];
  };

  const upsells = getUpsells();

  // Track upsell views when component mounts
  useEffect(() => {
    upsells.forEach(upsell => {
      trackUpsellView(upsell.package, currentPackage);
    });
  }, [currentPackage]);

  if (upsells.length === 0) return null;

  const handlePurchase = async (packageType: string) => {
    // Track upsell click
    const packageInfo = PACKAGE_INFO[packageType as keyof typeof PACKAGE_INFO];
    trackUpsellClick(packageType, currentPackage, packageInfo.price);
    setIsProcessing(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          essayId,
          package: packageType,
        }),
      });

      if (!res.ok) throw new Error('Failed to create checkout');

      const { url } = await res.json();
      window.location.href = url;
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-5 h-5 text-yellow-500" />
        <h3 className="text-lg font-semibold">Recommended For You</h3>
      </div>

      {upsells.map((upsell) => {
        const packageInfo = PACKAGE_INFO[upsell.package as keyof typeof PACKAGE_INFO];
        const Icon = upsell.icon;

        return (
          <Card
            key={upsell.package}
            className={`${
              upsell.highlight
                ? 'border-2 border-yellow-500 bg-gradient-to-br from-yellow-50 to-white shadow-lg'
                : 'border-2 border-gray-200'
            }`}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    upsell.highlight ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{upsell.title}</CardTitle>
                    <CardDescription className="mt-1">{upsell.subtitle}</CardDescription>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    ${(packageInfo.price / 100).toFixed(0)}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {upsell.urgency && (
                <div className={`mb-4 p-3 rounded-lg ${
                  upsell.highlight ? 'bg-yellow-100 border border-yellow-300' : 'bg-blue-50 border border-blue-200'
                }`}>
                  <p className="text-sm font-semibold text-gray-900">
                    ⚡ {upsell.urgency}
                  </p>
                </div>
              )}

              <ul className="space-y-2 mb-4">
                {packageInfo.features.slice(0, 4).map((feature, idx) => (
                  <li key={idx} className="flex gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
                {packageInfo.features.length > 4 && (
                  <li className="text-sm text-gray-500 ml-6">
                    +{packageInfo.features.length - 4} more features
                  </li>
                )}
              </ul>

              <Button
                onClick={() => handlePurchase(upsell.package)}
                disabled={isProcessing}
                className={`w-full ${
                  upsell.highlight
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-gray-900'
                    : ''
                }`}
                size="lg"
              >
                {isProcessing ? 'Processing...' : `Add ${packageInfo.name}`}
              </Button>

              {upsell.highlight && (
                <p className="text-xs text-center text-gray-600 mt-2">
                  🎁 Special offer - only available now
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}

      <p className="text-xs text-center text-gray-500 mt-4">
        All purchases are secure and include our satisfaction guarantee
      </p>
    </div>
  );
}
