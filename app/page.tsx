import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SocialProofBanner } from '@/components/marketing/social-proof-banner';
import { DeadlineUrgency } from '@/components/marketing/deadline-urgency';
import { ReviewerShowcase } from '@/components/marketing/reviewer-showcase';
import { TrustBadges } from '@/components/marketing/trust-badges';
import { MobileNav } from '@/components/layout/mobile-nav';
import {
  CheckCircle,
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
  MessageSquare,
  GraduationCap,
  PenTool,
  BarChart3,
  Users,
  FileCheck,
  Heart
} from 'lucide-react';

const IVY_SCHOOLS = ['Harvard', 'Yale', 'Princeton', 'Columbia', 'UPenn', 'Dartmouth', 'Brown', 'Cornell'];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Urgency Banner */}
      <DeadlineUrgency />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-neutral-200/60 bg-white/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600">
              <PenTool className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-neutral-900">IvyWay</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            <Link href="/pricing">
              <Button variant="ghost" size="sm">Pricing</Button>
            </Link>
            <Link href="/ivy">
              <Button variant="ghost" size="sm">Ivy League</Button>
            </Link>
            <Link href="/for-parents">
              <Button variant="ghost" size="sm">For Parents</Button>
            </Link>
            <div className="w-px h-6 bg-neutral-200 mx-2" />
            <Link href="/login">
              <Button variant="outline" size="sm">Log In</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </nav>

          {/* Mobile Navigation */}
          <MobileNav />
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute inset-0 bg-gradient-mesh opacity-40" />

        <div className="relative container mx-auto px-4 pt-12 pb-16 md:pt-24 md:pb-32">
          {/* Social Proof Banner */}
          <div className="mb-10">
            <SocialProofBanner />
          </div>

          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="new" size="lg" className="mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              AI-Powered Essay Analysis
            </Badge>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-neutral-900 mb-6 leading-tight tracking-tight">
              Get Into Your Dream{' '}
              <span className="text-gradient">Ivy League School</span>
            </h1>

            <p className="text-lg md:text-xl text-neutral-600 mb-6 max-w-2xl mx-auto leading-relaxed">
              AI that knows YOUR story - your spike, your activities, your background.
              Not generic advice. Feedback that actually helps you stand out.
            </p>

            {/* Trust badges */}
            <TrustBadges className="mb-10" />

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="xl" className="w-full sm:w-auto">
                  Start Free Analysis
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="xl" variant="outline" className="w-full sm:w-auto">
                  View Pricing
                </Button>
              </Link>
            </div>

            <p className="text-sm text-neutral-500 mt-6">
              Free Commons Check for essays up to 650 words. No credit card required.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section - Bento Grid */}
      <section className="py-20 md:py-28 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="default" size="lg" className="mb-4">
              <Zap className="w-3.5 h-3.5" />
              Why IvyWay
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
              Everything You Need to Perfect Your Essay
            </h2>
            <p className="text-neutral-600 max-w-2xl mx-auto text-lg">
              Comprehensive analysis powered by AI that understands what top schools look for
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Feature 1 - Large */}
            <Card variant="brand" className="md:col-span-2 md:row-span-2">
              <CardHeader className="pb-4">
                <div className="p-3 w-fit rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 mb-4">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-2xl">7-Dimension Analysis</CardTitle>
                <CardDescription className="text-base">
                  Comprehensive scoring across every aspect that matters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  {[
                    { label: 'Authenticity', desc: 'Voice & genuine story' },
                    { label: 'Reflection', desc: 'Depth of insight' },
                    { label: 'Structure', desc: 'Flow & organization' },
                    { label: 'Specificity', desc: 'Concrete details' },
                    { label: 'Clarity', desc: 'Clear communication' },
                    { label: 'Ethics', desc: 'Appropriate content' },
                  ].map((item, i) => (
                    <div key={i} className="p-2 sm:p-3 rounded-xl bg-white/60 border border-brand-200/30">
                      <p className="font-semibold text-neutral-900 text-sm">{item.label}</p>
                      <p className="text-xs text-neutral-500">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card variant="interactive">
              <CardHeader>
                <div className="p-3 w-fit rounded-xl bg-gradient-to-br from-success-500 to-emerald-600 mb-2">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <CardTitle>Voice Preservation</CardTitle>
                <CardDescription>
                  We analyze your tone and ensure all suggestions maintain your unique voice. You stay the author, always.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 3 */}
            <Card variant="interactive">
              <CardHeader>
                <div className="p-3 w-fit rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 mb-2">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <CardTitle>Expert Human Review</CardTitle>
                <CardDescription>
                  Optional access to former admissions officers and experienced coaches for personalized feedback.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-neutral-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="secondary" size="lg" className="mb-4">
              <FileCheck className="w-3.5 h-3.5" />
              How It Works
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
              Four Simple Steps to a Better Essay
            </h2>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {[
                {
                  step: 1,
                  title: 'Tell Us Your Story',
                  desc: 'Share your spike, top activities, and target school. Takes 30 seconds.',
                  icon: Users,
                },
                {
                  step: 2,
                  title: 'Upload Your Essay',
                  desc: 'Paste your draft. We analyze it against YOUR narrative, not generic advice.',
                  icon: PenTool,
                },
                {
                  step: 3,
                  title: 'Get Personalized Feedback',
                  desc: '"Your spike is X but your essay doesn\'t mention it" - feedback that actually helps.',
                  icon: Sparkles,
                },
                {
                  step: 4,
                  title: 'Upgrade for More Depth',
                  desc: 'Get line-by-line fixes, school-specific AO feedback, or human expert review.',
                  icon: BarChart3,
                },
              ].map((item) => (
                <div key={item.step} className="flex gap-5 p-6 rounded-2xl bg-white border border-neutral-200/60 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white font-bold text-lg shadow-[0_4px_14px_0_rgba(124,58,237,0.25)]">
                      {item.step}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-neutral-900 mb-1">{item.title}</h3>
                    <p className="text-neutral-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why Us - Competitor Comparison */}
      <section className="py-20 md:py-28 bg-white border-t border-neutral-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="info" size="lg" className="mb-4">
              <Shield className="w-3.5 h-3.5" />
              Why IvyWay?
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
              Not Another Grammar Checker
            </h2>
            <p className="text-neutral-600 max-w-2xl mx-auto text-lg">
              Grammarly fixes commas. ChatGPT writes for you. We do neither.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {/* Comparison Table - scrollable on mobile with visual indicator */}
            <div className="relative">
              {/* Mobile scroll hint */}
              <div className="sm:hidden text-center text-xs text-neutral-500 mb-2">
                <span className="inline-flex items-center gap-1">
                  ← Swipe to see more →
                </span>
              </div>
              <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-neutral-100">
                <div className="min-w-[500px] overflow-hidden rounded-2xl border border-neutral-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-neutral-50">
                      <th className="text-left p-3 sm:p-4 font-semibold text-neutral-600 whitespace-nowrap">Feature</th>
                      <th className="text-center p-3 sm:p-4 font-semibold text-neutral-600 whitespace-nowrap">Grammarly</th>
                      <th className="text-center p-3 sm:p-4 font-semibold text-neutral-600 whitespace-nowrap">ChatGPT</th>
                      <th className="text-center p-3 sm:p-4 font-semibold text-brand-600 bg-brand-50 whitespace-nowrap">IvyWay</th>
                    </tr>
                  </thead>
                <tbody className="divide-y divide-neutral-100">
                  <tr>
                    <td className="p-4 text-neutral-900">Built for college essays</td>
                    <td className="p-4 text-center text-neutral-400">-</td>
                    <td className="p-4 text-center text-neutral-400">-</td>
                    <td className="p-4 text-center text-green-600 bg-brand-50/30">✓</td>
                  </tr>
                  <tr>
                    <td className="p-4 text-neutral-900">Preserves your voice</td>
                    <td className="p-4 text-center text-neutral-400">-</td>
                    <td className="p-4 text-center text-red-500">✗</td>
                    <td className="p-4 text-center text-green-600 bg-brand-50/30">✓</td>
                  </tr>
                  <tr>
                    <td className="p-4 text-neutral-900">School-specific feedback</td>
                    <td className="p-4 text-center text-neutral-400">-</td>
                    <td className="p-4 text-center text-neutral-400">-</td>
                    <td className="p-4 text-center text-green-600 bg-brand-50/30">✓</td>
                  </tr>
                  <tr>
                    <td className="p-4 text-neutral-900">Admissions officer perspective</td>
                    <td className="p-4 text-center text-neutral-400">-</td>
                    <td className="p-4 text-center text-neutral-400">-</td>
                    <td className="p-4 text-center text-green-600 bg-brand-50/30">✓</td>
                  </tr>
                  <tr>
                    <td className="p-4 text-neutral-900">Human expert review option</td>
                    <td className="p-4 text-center text-neutral-400">-</td>
                    <td className="p-4 text-center text-neutral-400">-</td>
                    <td className="p-4 text-center text-green-600 bg-brand-50/30">✓</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          </div>

          <p className="text-center text-neutral-500 mt-6 text-sm">
            Generic tools don't understand what gets you admitted. We do.
          </p>
          </div>
        </div>
      </section>

      {/* Reviewer Showcase */}
      <ReviewerShowcase />

      {/* Ivy League Schools */}
      <section className="py-20 md:py-28 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="premium" size="lg" className="mb-4">
              <GraduationCap className="w-3.5 h-3.5" />
              School-Specific Analysis
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
              Ivy League Essay Analysis
            </h2>
            <p className="text-neutral-600 max-w-2xl mx-auto text-lg">
              Our AI is trained on 2025-26 prompts from all 8 Ivy League schools.
              Get school-specific feedback that shows you exactly what each school is looking for.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto mb-10">
            {IVY_SCHOOLS.map(school => (
              <div
                key={school}
                className="px-5 py-3 bg-white rounded-2xl border border-neutral-200 shadow-sm hover:shadow-md hover:border-brand-300 hover:-translate-y-0.5 transition-all cursor-default"
              >
                <span className="font-semibold text-neutral-700">{school}</span>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link href="/pricing">
              <Button variant="outline" size="lg">
                View Ivy League Packages
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Money Back Guarantee */}
      <section className="py-16 bg-gradient-to-r from-success-50 to-emerald-50 border-y border-success-200/50">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-success-500 shadow-[0_4px_14px_0_rgba(34,197,94,0.25)]">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-success-800">100% Satisfaction Guarantee</h3>
          </div>
          <p className="text-success-700 max-w-xl mx-auto text-lg">
            Not satisfied with your analysis? Contact us within 48 hours and we'll make it right
            or refund your purchase. No questions asked.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 md:py-32 bg-gradient-to-b from-white to-neutral-50">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <Badge variant="default" size="lg" className="mb-6">
              <Heart className="w-3.5 h-3.5" />
              Join 10,000+ Students
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
              Ready to Perfect Your Essay?
            </h2>
            <p className="text-neutral-600 mb-8 text-lg">
              Start with a free Commons Check and see how we can help you stand out
            </p>
            <Link href="/signup">
              <Button size="xl">
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200 py-12 bg-neutral-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600">
                <PenTool className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-neutral-700">IvyWay</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-neutral-500">
              <Link href="/pricing" className="hover:text-neutral-900 transition-colors">Pricing</Link>
              <Link href="/for-parents" className="hover:text-neutral-900 transition-colors">For Parents</Link>
              <span>&copy; 2025 IvyWay. Privacy-first. Voice-preserving.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
