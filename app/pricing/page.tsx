import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PACKAGE_INFO, PRICING } from '@/lib/stripe/config';
import { Check, Sparkles, Users, Zap, PenTool, ArrowRight, School } from 'lucide-react';
import { MobileNav } from '@/components/layout/mobile-nav';
import {
  formatPrice,
  TIER_CONFIG,
  getBundleSavings,
} from '@/lib/pricing';

export default function PricingPage() {
  // Get tier info from centralized config
  const quickTier = TIER_CONFIG.quick;
  const standardTier = TIER_CONFIG.standard;
  const premiumTier = TIER_CONFIG.premium;
  const ivySingleTier = TIER_CONFIG.ivy_single;
  const ivyBundle3Tier = TIER_CONFIG.ivy_bundle_3;
  const ivyBundle8Tier = TIER_CONFIG.ivy_bundle_8;

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-neutral-200/60 bg-white/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600">
              <PenTool className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-neutral-900">IvyWay</span>
          </Link>
          <nav className="hidden md:flex gap-4">
            <Link href="/login">
              <Button variant="outline">Log In</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </nav>
          <MobileNav />
        </div>
      </header>

      {/* Pricing Header */}
      <section className="container mx-auto px-4 py-10 sm:py-16 text-center">
        <Badge variant="default" size="lg" className="mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          Simple Pricing
        </Badge>
        <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">
          Choose Your Path to a Better Essay
        </h2>
        <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
          Start free. No subscriptions. Pay only for what you need.
        </p>
      </section>

      {/* How It Works - Value-first funnel */}
      <section className="container mx-auto px-4 py-12 border-t border-neutral-200 bg-brand-50/30">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-2xl font-bold text-neutral-900 mb-8">
            How It Works: Try Before You Buy
          </h3>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold">1</div>
              <h4 className="font-medium mb-1">Choose School</h4>
              <p className="text-sm text-neutral-500">Pick your target school</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold">2</div>
              <h4 className="font-medium mb-1">Answer Questions</h4>
              <p className="text-sm text-neutral-500">Tell us your background</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold">3</div>
              <h4 className="font-medium mb-1">Upload Essays</h4>
              <p className="text-sm text-neutral-500">Paste your essay(s)</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">4</div>
              <h4 className="font-medium mb-1">See Results</h4>
              <p className="text-sm text-neutral-500">Unlock for {formatPrice(quickTier.priceInCents)}</p>
            </div>
          </div>
          <Link href="/ivy" className="inline-block mt-8">
            <Button size="lg">
              <Sparkles className="w-4 h-4" />
              Start Free Analysis
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Main 3 Tiers - Clear Choice */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h3 className="text-2xl font-bold text-neutral-900 mb-2">Pricing Tiers</h3>
          <p className="text-neutral-600">Choose the depth of analysis you need</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Tier 1: Quick Unlock */}
          <Card className="border-2 border-neutral-200 relative">
            <CardHeader className="text-center pb-2">
              <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-neutral-100 flex items-center justify-center">
                <Zap className="w-6 h-6 text-neutral-600" />
              </div>
              <CardTitle className="text-2xl">{quickTier.name}</CardTitle>
              <CardDescription className="text-base">{quickTier.description}</CardDescription>
              <div className="text-4xl font-bold mt-4">{formatPrice(quickTier.priceInCents, { showCents: true })}</div>
              <p className="text-sm text-neutral-500">per essay</p>
            </CardHeader>
            <CardContent className="pt-6">
              <ul className="space-y-3">
                {quickTier.features.map((feature, i) => (
                  <li key={i} className="flex gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Link href="/ivy" className="w-full">
                <Button className="w-full" variant="outline" size="lg">
                  Start Free, Unlock for {formatPrice(quickTier.priceInCents, { showCents: true })}
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Tier 2: AI Pro - MOST POPULAR */}
          <Card className="border-2 border-brand-500 relative shadow-xl shadow-brand-500/10 ring-2 ring-brand-500/20 md:-my-2">
            <div className="mb-4 text-center md:mb-0 md:absolute md:-top-4 md:left-1/2 md:-translate-x-1/2 bg-gradient-to-r from-brand-500 to-brand-600 text-white px-6 py-1.5 rounded-full text-sm font-semibold">
              Most Popular
            </div>
            <CardHeader className="text-center pb-2">
              <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-2xl">AI Pro Analysis</CardTitle>
              <CardDescription className="text-base">Full analysis with specific fixes</CardDescription>
              <div className="text-4xl font-bold mt-4">{formatPrice(PACKAGE_INFO.AI_PRO_SINGLE.price)}</div>
              <p className="text-sm text-neutral-500">per essay</p>
            </CardHeader>
            <CardContent className="pt-6">
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span><strong>7-dimension</strong> rubric scoring</span>
                </li>
                <li className="flex gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>Line-by-line suggestions</span>
                </li>
                <li className="flex gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>School-fit analysis</span>
                </li>
                <li className="flex gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>Voice preservation check</span>
                </li>
                <li className="flex gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>Unlimited revisions</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Link href="/signup" className="w-full">
                <Button className="w-full" size="lg">
                  Get AI Pro
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Tier 3: Expert Review */}
          <Card className="border-2 border-amber-400 relative bg-gradient-to-b from-amber-50/50 to-white">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-1.5 rounded-full text-sm font-semibold">
              Human Expert
            </div>
            <CardHeader className="text-center pb-2">
              <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-2xl">Expert Review</CardTitle>
              <CardDescription className="text-base">AI + real human expert feedback</CardDescription>
              <div className="text-4xl font-bold mt-4">{formatPrice(PACKAGE_INFO.HUMAN_FULL_1.price)}</div>
              <p className="text-sm text-neutral-500">AI + 1 expert review</p>
            </CardHeader>
            <CardContent className="pt-6">
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span><strong>Everything</strong> in AI Pro</span>
                </li>
                <li className="flex gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>Former admissions officer review</span>
                </li>
                <li className="flex gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>Detailed margin comments</span>
                </li>
                <li className="flex gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>Direct messaging with expert</span>
                </li>
                <li className="flex gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>48-hour turnaround</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Link href="/signup" className="w-full">
                <Button className="w-full" variant="premium" size="lg">
                  Get Expert Review
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* Ivy League Section */}
      <section className="container mx-auto px-4 py-16 border-t border-neutral-200">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <Badge variant="premium" size="lg" className="mb-4">
            <School className="w-3.5 h-3.5" />
            Ivy League Specialists
          </Badge>
          <h3 className="text-3xl font-bold text-neutral-900 mb-4">
            Applying to Ivy League Schools?
          </h3>
          <p className="text-neutral-600">
            School-specific analysis from the perspective of actual admissions officers.
            Every essay analyzed as part of your complete portfolio.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Ivy Single */}
          <Card className="border-2 border-neutral-200 relative">
            <CardHeader className="text-center pb-2">
              <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-neutral-100 flex items-center justify-center">
                <School className="w-6 h-6 text-neutral-600" />
              </div>
              <CardTitle className="text-xl">{ivySingleTier.name}</CardTitle>
              <CardDescription className="text-sm">{ivySingleTier.description}</CardDescription>
              <div className="text-3xl font-bold mt-4">{formatPrice(ivySingleTier.priceInCents)}</div>
              <p className="text-sm text-neutral-500">All essays for {ivySingleTier.schoolsIncluded} school</p>
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="space-y-2 text-sm">
                {ivySingleTier.features.slice(0, 4).map((feature, i) => (
                  <li key={i} className="flex gap-2">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Link href="/ivy" className="w-full">
                <Button variant="outline" className="w-full">
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Ivy 3-Pack - Popular */}
          <Card className="border-2 border-brand-500 relative shadow-xl shadow-brand-500/10 ring-2 ring-brand-500/20 md:-my-2">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-brand-500 to-brand-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
              Most Popular
            </div>
            <CardHeader className="text-center pb-2">
              <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-xl">{ivyBundle3Tier.name}</CardTitle>
              <CardDescription className="text-sm">{ivyBundle3Tier.description}</CardDescription>
              <div className="text-3xl font-bold mt-4">{formatPrice(ivyBundle3Tier.priceInCents)}</div>
              <p className="text-sm text-neutral-500">Save {getBundleSavings('ivy_bundle_3')?.formatted} vs individual</p>
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="space-y-2 text-sm">
                {ivyBundle3Tier.features.map((feature, i) => (
                  <li key={i} className="flex gap-2">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Link href="/ivy" className="w-full">
                <Button className="w-full">
                  Get 3-School Bundle
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Ivy All 8 - Best Value */}
          <Card className="border-2 border-amber-400 relative bg-gradient-to-b from-amber-50/50 to-white">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
              Best Value
            </div>
            <CardHeader className="text-center pb-2">
              <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-xl">{ivyBundle8Tier.name}</CardTitle>
              <CardDescription className="text-sm">{ivyBundle8Tier.description}</CardDescription>
              <div className="text-3xl font-bold mt-4">{formatPrice(ivyBundle8Tier.priceInCents)}</div>
              <p className="text-sm text-neutral-500">Save {getBundleSavings('ivy_bundle_8')?.formatted} vs individual</p>
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="space-y-2 text-sm">
                {ivyBundle8Tier.features.map((feature, i) => (
                  <li key={i} className="flex gap-2">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Link href="/ivy" className="w-full">
                <Button variant="premium" className="w-full">
                  Get Complete Coverage
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* Why We're Different - Quick Comparison */}
      <section className="container mx-auto px-4 py-12 border-t border-neutral-200">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-2xl font-bold mb-8">Why IvyWay vs. Grammarly or ChatGPT?</h3>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div className="p-6 bg-white rounded-2xl border border-neutral-200">
              <div className="text-3xl mb-3">🎯</div>
              <h4 className="font-semibold mb-2">Built for College Essays</h4>
              <p className="text-sm text-neutral-600">Grammarly checks grammar. We analyze what admissions officers actually look for.</p>
            </div>
            <div className="p-6 bg-white rounded-2xl border border-neutral-200">
              <div className="text-3xl mb-3">🔒</div>
              <h4 className="font-semibold mb-2">Voice Preservation</h4>
              <p className="text-sm text-neutral-600">ChatGPT rewrites your voice out. We keep YOU the author while improving clarity.</p>
            </div>
            <div className="p-6 bg-white rounded-2xl border border-neutral-200">
              <div className="text-3xl mb-3">🏫</div>
              <h4 className="font-semibold mb-2">School-Specific</h4>
              <p className="text-sm text-neutral-600">Trained on 2025-26 Ivy prompts. Know if your essay fits Harvard vs. Yale vs. Cornell.</p>
            </div>
          </div>
        </div>
      </section>

      {/* More Options (Collapsed) */}
      <section className="container mx-auto px-4 py-12">
        <details className="max-w-4xl mx-auto">
          <summary className="text-lg font-semibold cursor-pointer text-neutral-700 hover:text-neutral-900 mb-6">
            Need more options? View all packages →
          </summary>

          <div className="mt-6 space-y-8">
            {/* Multi-Review Packages */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Multiple Review Packages</h4>
              <div className="grid md:grid-cols-3 gap-4">
                {['HUMAN_FULL_1', 'HUMAN_FULL_3', 'HUMAN_FULL_5'].map((key) => {
                  const pkg = PACKAGE_INFO[key as keyof typeof PACKAGE_INFO];
                  return (
                    <Card key={key} className={key === 'HUMAN_FULL_3' ? 'border-2 border-purple-500' : ''}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{pkg.name}</CardTitle>
                        <div className="text-2xl font-bold">{formatPrice(pkg.price)}</div>
                        {key === 'HUMAN_FULL_3' && <Badge variant="premium">Best Value</Badge>}
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-1 text-sm">
                          {pkg.features.slice(0, 3).map((f, i) => (
                            <li key={i} className="flex gap-2">
                              <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Premium */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Premium Packages</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="border-2 border-violet-600">
                  <CardHeader className="pb-2">
                    <CardTitle>{PACKAGE_INFO.DEEP_REVIEW.name}</CardTitle>
                    <CardDescription>The ultimate essay transformation</CardDescription>
                    <div className="text-3xl font-bold">{formatPrice(PACKAGE_INFO.DEEP_REVIEW.price)}</div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1 text-sm">
                      {PACKAGE_INFO.DEEP_REVIEW.features.slice(0, 5).map((f, i) => (
                        <li key={i} className="flex gap-2">
                          <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Ivy Season Pass</CardTitle>
                    <CardDescription>Unlimited Ivy essays through April</CardDescription>
                    <div className="text-3xl font-bold">$299</div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1 text-sm">
                      <li className="flex gap-2"><Check className="w-4 h-4 text-green-600" />All 8 Ivy League schools</li>
                      <li className="flex gap-2"><Check className="w-4 h-4 text-green-600" />Unlimited AI analyses</li>
                      <li className="flex gap-2"><Check className="w-4 h-4 text-green-600" />Valid through April 2026</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </details>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-4 py-12 border-t border-neutral-200">
        <h3 className="text-2xl font-bold mb-8 text-center">Common Questions</h3>
        <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-6">
          <div className="p-6 bg-white rounded-xl border border-neutral-200">
            <h4 className="font-semibold mb-2">Will you rewrite my essay?</h4>
            <p className="text-sm text-neutral-600">
              No. You stay the author. We suggest improvements that preserve your voice.
            </p>
          </div>
          <div className="p-6 bg-white rounded-xl border border-neutral-200">
            <h4 className="font-semibold mb-2">How fast is the AI analysis?</h4>
            <p className="text-sm text-neutral-600">
              Under 60 seconds for full AI Pro. Commons Check is instant.
            </p>
          </div>
          <div className="p-6 bg-white rounded-xl border border-neutral-200">
            <h4 className="font-semibold mb-2">Can I get a refund?</h4>
            <p className="text-sm text-neutral-600">
              48-hour satisfaction guarantee. Not happy? We'll make it right or refund you.
            </p>
          </div>
          <div className="p-6 bg-white rounded-xl border border-neutral-200">
            <h4 className="font-semibold mb-2">Is my essay kept private?</h4>
            <p className="text-sm text-neutral-600">
              100%. Your essay is never shared, sold, or used to train AI models.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h3 className="text-2xl font-bold mb-4">Not sure which to pick?</h3>
        <p className="text-neutral-600 mb-6">Start free, see your score, then decide if you need more.</p>
        <Link href="/signup">
          <Button size="lg">
            Start Free Analysis
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200 py-8 bg-white">
        <div className="container mx-auto px-4 text-center text-neutral-600">
          <p>&copy; 2025 IvyWay. Privacy-first. Voice-preserving.</p>
        </div>
      </footer>
    </div>
  );
}
