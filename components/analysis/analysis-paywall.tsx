'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Lock,
  Check,
  ArrowRight,
  Sparkles,
  Target,
  Users,
  Eye,
  FileText,
  AlertTriangle,
  Clock,
  Star,
  Shield,
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface QuickTeaserData {
  overallScore: number;
  scoreLabel: string;
  actionableItemsCount: number;
  aiDetected: boolean;
  hiddenInsights: {
    totalIssuesFound: number;
    schoolSpecificIssues: number;
    strengthsFound: number;
  };
}

interface AnalysisPaywallProps {
  teaser: QuickTeaserData;
  school: string;
  onSelectTier: (tier: 'quick' | 'standard' | 'premium') => void;
  isLoading?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function AnalysisPaywall({
  teaser,
  school,
  onSelectTier,
  isLoading = false,
}: AnalysisPaywallProps) {
  const [selectedTier, setSelectedTier] = useState<'quick' | 'standard' | 'premium'>('standard');

  const handleContinue = () => {
    onSelectTier(selectedTier);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Score Preview */}
      <ScorePreview teaser={teaser} school={school} />

      {/* AI Warning if detected */}
      {teaser.aiDetected && (
        <Card className="mt-4 border-amber-200 bg-amber-50">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-900">AI Writing Patterns Detected</h4>
                <p className="text-sm text-amber-800">
                  Our analysis found patterns commonly associated with AI-generated text.
                  Unlock full results to see exactly what was flagged.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tier Selection */}
      <div className="mt-8">
        <h3 className="text-xl font-bold text-center mb-2">Choose Your Analysis Level</h3>
        <p className="text-center text-gray-600 mb-6">
          We found {teaser.hiddenInsights.totalIssuesFound} issues and{' '}
          {teaser.hiddenInsights.strengthsFound} strengths. Select a tier to see the full breakdown.
        </p>

        <div className="grid md:grid-cols-3 gap-4">
          <TierCard
            tier="quick"
            name="Essay Score"
            price="$9.99"
            isSelected={selectedTier === 'quick'}
            onSelect={() => setSelectedTier('quick')}
            features={[
              'Overall score with explanation',
              `Top ${teaser.actionableItemsCount} issues to fix`,
              'AI detection verdict',
              'Blurred preview of full analysis',
            ]}
            highlighted={false}
          />

          <TierCard
            tier="standard"
            name="Full Analysis"
            price="$79"
            isSelected={selectedTier === 'standard'}
            onSelect={() => setSelectedTier('standard')}
            features={[
              'Everything in Quick',
              'Full 5-dimension breakdown',
              'Line-by-line annotations with fixes',
              `${school}-specific feedback`,
              'AO perspective insights',
              'All strengths highlighted',
            ]}
            highlighted={true}
            badge="Most Popular"
          />

          <TierCard
            tier="premium"
            name="Expert Review"
            price="$249"
            isSelected={selectedTier === 'premium'}
            onSelect={() => setSelectedTier('premium')}
            features={[
              'Everything in Full Analysis',
              'AI-generated rewrite suggestions',
              'Human expert review',
              'Former AO or PhD reviewer',
              'Direct email feedback',
              '48-hour turnaround',
            ]}
            highlighted={false}
            badge="Best Value"
          />
        </div>
      </div>

      {/* CTA Button */}
      <div className="mt-8 text-center">
        <button
          onClick={handleContinue}
          disabled={isLoading}
          className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Unlock {selectedTier === 'quick' ? 'Results' : 'Full Analysis'}
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>

        <div className="mt-4 flex items-center justify-center gap-6 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Shield className="w-4 h-4" />
            Secure payment
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            Instant access
          </span>
          <span className="flex items-center gap-1">
            <Star className="w-4 h-4" />
            100% satisfaction
          </span>
        </div>
      </div>

      {/* Social Proof */}
      <SocialProof />
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function ScorePreview({ teaser, school }: { teaser: QuickTeaserData; school: string }) {
  const scoreColors: Record<string, string> = {
    needs_work: 'from-red-500 to-red-600',
    developing: 'from-orange-500 to-orange-600',
    competitive: 'from-blue-500 to-blue-600',
    strong: 'from-green-500 to-green-600',
    exceptional: 'from-purple-500 to-purple-600',
  };

  return (
    <Card className="overflow-hidden">
      <div className={`bg-gradient-to-r ${scoreColors[teaser.scoreLabel]} p-8 text-white`}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Score Circle */}
          <div className="text-center">
            <div className="w-32 h-32 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
              <div>
                <span className="text-5xl font-bold">{teaser.overallScore}</span>
                <span className="text-xl opacity-80">/100</span>
              </div>
            </div>
            <p className="mt-2 text-white/90 font-medium">
              {teaser.scoreLabel.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
            </p>
          </div>

          {/* Preview Stats */}
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold mb-4">
              Your {school} Essay Analysis is Ready
            </h2>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <AlertTriangle className="w-6 h-6 mx-auto mb-1 opacity-80" />
                <p className="text-2xl font-bold">{teaser.hiddenInsights.totalIssuesFound}</p>
                <p className="text-xs opacity-80">Issues Found</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <Target className="w-6 h-6 mx-auto mb-1 opacity-80" />
                <p className="text-2xl font-bold">{teaser.hiddenInsights.schoolSpecificIssues}</p>
                <p className="text-xs opacity-80">{school}-Specific</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <Sparkles className="w-6 h-6 mx-auto mb-1 opacity-80" />
                <p className="text-2xl font-bold">{teaser.hiddenInsights.strengthsFound}</p>
                <p className="text-xs opacity-80">Strengths</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Locked Preview - Accessible alternative to blur */}
      <CardContent className="py-6">
        <div className="flex items-center justify-center gap-2 text-gray-500 mb-4">
          <Lock className="w-4 h-4" />
          <span className="text-sm">Full analysis preview</span>
        </div>

        <div className="relative">
          {/* Visual placeholder bars - no blur, uses opacity gradient for paywall effect */}
          <div className="select-none pointer-events-none" aria-hidden="true">
            <div className="space-y-3 opacity-40">
              <div className="h-4 bg-gradient-to-r from-gray-300 to-gray-100 rounded w-3/4" />
              <div className="h-4 bg-gradient-to-r from-gray-300 to-gray-100 rounded w-1/2" />
              <div className="h-4 bg-gradient-to-r from-gray-300 to-gray-100 rounded w-5/6" />
              <div className="h-4 bg-gradient-to-r from-gray-300 to-gray-100 rounded w-2/3" />
            </div>
          </div>
          {/* Screen reader accessible text */}
          <span className="sr-only">Content locked - select a tier above to unlock your full analysis</span>
        </div>
      </CardContent>
    </Card>
  );
}

function TierCard({
  tier,
  name,
  price,
  isSelected,
  onSelect,
  features,
  highlighted,
  badge,
}: {
  tier: 'quick' | 'standard' | 'premium';
  name: string;
  price: string;
  isSelected: boolean;
  onSelect: () => void;
  features: string[];
  highlighted: boolean;
  badge?: string;
}) {
  return (
    <button
      onClick={onSelect}
      className={`relative p-6 rounded-xl border-2 text-left transition-all ${
        isSelected
          ? highlighted
            ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-100'
            : 'border-gray-900 bg-gray-50 shadow-lg'
          : highlighted
          ? 'border-blue-200 hover:border-blue-300'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* Badge - responsive positioning */}
      {badge && (
        <div className="mb-2 md:mb-0 md:absolute md:-top-3 md:left-1/2 md:transform md:-translate-x-1/2">
          <Badge className="bg-blue-600 text-white">{badge}</Badge>
        </div>
      )}

      {/* Selection indicator */}
      <div
        className={`absolute top-4 right-4 w-5 h-5 rounded-full border-2 ${
          isSelected
            ? 'border-blue-600 bg-blue-600'
            : 'border-gray-300 bg-white'
        }`}
      >
        {isSelected && <Check className="w-full h-full text-white p-0.5" />}
      </div>

      {/* Content */}
      <div className="pr-8">
        <h4 className="font-bold text-lg">{name}</h4>
        <p className="text-2xl font-bold text-blue-600 mt-1">{price}</p>

        <ul className="mt-4 space-y-2">
          {features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
              <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </button>
  );
}

function SocialProof() {
  return (
    <div className="mt-12 pt-8 border-t border-gray-200">
      <p className="text-center text-sm text-gray-500 mb-4">
        Trusted by students accepted to top universities
      </p>

      <div className="flex flex-wrap justify-center gap-8 opacity-60">
        {['Harvard', 'Yale', 'Princeton', 'Stanford', 'MIT'].map((school) => (
          <span key={school} className="text-sm font-semibold text-gray-700">
            {school}
          </span>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4 max-w-md mx-auto text-center">
        <div>
          <p className="text-2xl font-bold text-blue-600">10,000+</p>
          <p className="text-xs text-gray-500">Essays analyzed</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-blue-600">4.9/5</p>
          <p className="text-xs text-gray-500">Average rating</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-blue-600">85%</p>
          <p className="text-xs text-gray-500">Acceptance rate</p>
        </div>
      </div>
    </div>
  );
}
