import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SocialProofBanner } from '@/components/marketing/social-proof-banner';
import { DeadlineUrgency } from '@/components/marketing/deadline-urgency';
import { ReviewerShowcase } from '@/components/marketing/reviewer-showcase';
import { TrustBadges } from '@/components/marketing/trust-badges';
import { LiveActivityIndicator } from '@/components/marketing/live-activity';
import { TestimonialCard } from '@/components/marketing/testimonial-card';
import { StickyMobileCTA } from '@/components/marketing/sticky-mobile-cta';
import { SocialProofToast } from '@/components/marketing/social-proof-toast';
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
  Heart,
  Quote,
  Star,
  Clock,
  AlertCircle
} from 'lucide-react';

const IVY_SCHOOLS = ['Harvard', 'Yale', 'Princeton', 'Columbia', 'UPenn', 'Dartmouth', 'Brown', 'Cornell'];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Urgency Banner */}
      <DeadlineUrgency />

      {/* Header - Apple-style minimal */}
      <header className="sticky top-0 z-50 border-b border-neutral-200/60 bg-white/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-sm">
              <PenTool className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-neutral-900 tracking-tight">IvyWay</span>
          </Link>

          {/* Desktop Navigation - Simplified */}
          <nav className="hidden md:flex items-center gap-2">
            <Link href="/pricing">
              <Button variant="ghost" size="sm">Pricing</Button>
            </Link>
            <Link href="/for-parents">
              <Button variant="ghost" size="sm">For Parents</Button>
            </Link>
            <div className="w-px h-6 bg-neutral-200 mx-2" />
            <Link href="/login">
              <Button variant="ghost" size="sm">Log In</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </nav>

          {/* Mobile Navigation */}
          <MobileNav />
        </div>
      </header>

      {/* Hero Section - Apple-style glass design, mobile-optimized */}
      <section className="relative overflow-hidden min-h-[85vh] md:min-h-[90vh] flex items-center">
        {/* Background with floating orbs (Apple style) - lighter on mobile for performance */}
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-50 via-white to-white" />

        {/* Floating glass orbs - hidden on small mobile, reduced on medium */}
        <div className="hidden sm:block absolute top-20 left-[10%] w-48 md:w-72 h-48 md:h-72 glass-orb glass-orb-brand opacity-50 md:opacity-60" />
        <div className="hidden md:block absolute top-40 right-[15%] w-64 lg:w-96 h-64 lg:h-96 glass-orb glass-orb-accent" style={{ animationDelay: '-2s' }} />
        <div className="hidden lg:block absolute bottom-20 left-[20%] w-64 h-64 glass-orb glass-orb-success" style={{ animationDelay: '-4s' }} />

        <div className="relative container mx-auto px-4 py-8 sm:py-12 md:py-20 lg:py-32">
          <div className="max-w-4xl mx-auto">
            {/* Glass panel - tighter padding on mobile for above-fold CTA */}
            <div className="glass-panel p-5 sm:p-8 md:p-12 lg:p-16 text-center">
              {/* Live activity - smaller on mobile */}
              <LiveActivityIndicator className="mb-4 sm:mb-6 md:mb-8" />

              {/* Main Headline - Mobile-first sizing for impact */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-neutral-900 mb-4 sm:mb-6 leading-[1.1] tracking-tight">
                Don't Let a Weak Essay
                <br className="hidden sm:block" />
                <span className="sm:hidden"> </span>
                <span className="text-gradient">Cost You Your Dream School</span>
              </h1>

              {/* Subheadline - Concise on mobile */}
              <p className="text-base sm:text-lg md:text-xl text-neutral-600 mb-5 sm:mb-8 max-w-2xl mx-auto leading-relaxed">
                Get instant, personalized feedback from AI trained on what top schools actually look for.
                <span className="hidden sm:inline font-medium text-neutral-800"> Your voice stays yours.</span>
              </p>

              {/* MOBILE: Primary CTA first (thumb zone), trust badges after */}
              <div className="flex flex-col items-center gap-4 sm:gap-5 mb-5 sm:mb-0">
                {/* Primary CTA - Full width on mobile for easy thumb tap */}
                <Link href="/signup" className="w-full sm:w-auto">
                  <Button size="xl" className="w-full sm:w-auto text-base sm:text-lg px-8 sm:px-12 shadow-lg shadow-brand-500/25">
                    Analyze My Essay Free
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                <p className="text-xs sm:text-sm text-neutral-500">
                  Free for essays up to 650 words. No credit card.
                </p>
              </div>

              {/* Trust indicators - Horizontal scroll on mobile, wrap on desktop */}
              <div className="flex sm:flex-wrap justify-start sm:justify-center gap-2 sm:gap-3 mt-5 sm:mt-8 overflow-x-auto pb-2 sm:pb-0 -mx-2 px-2 sm:mx-0 sm:px-0 scrollbar-hide">
                <span className="glass flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm text-neutral-600 whitespace-nowrap flex-shrink-0">
                  <Shield className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-success-500" />
                  100% private
                </span>
                <span className="glass flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm text-neutral-600 whitespace-nowrap flex-shrink-0">
                  <Clock className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-brand-500" />
                  60 seconds
                </span>
                <span className="glass flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm text-neutral-600 whitespace-nowrap flex-shrink-0">
                  <Star className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-amber-500 fill-amber-500" />
                  4.9/5 rating
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Stats - Only show if real data exists */}
      <section className="py-8 border-y border-neutral-100 bg-neutral-50/50">
        <div className="container mx-auto px-4">
          <SocialProofBanner />
        </div>
      </section>

      {/* Authority Quote - Former AO */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Quote className="w-10 h-10 text-brand-200 mx-auto mb-6" />
            <blockquote className="text-xl md:text-2xl text-neutral-700 font-medium leading-relaxed mb-6">
              "After reading 10,000+ essays at an Ivy League admissions office, I can tell you: most essays fail for the same fixable reasons. IvyWay catches exactly what we look for."
            </blockquote>
            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-semibold">
                MR
              </div>
              <div className="text-left">
                <p className="font-semibold text-neutral-900">Former Admissions Officer</p>
                <p className="text-sm text-neutral-500">Ivy League University, 8+ Years</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem - Loss Aversion */}
      <section className="py-10 sm:py-16 md:py-24 bg-gradient-to-b from-neutral-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8 sm:mb-12">
              <Badge variant="warning" size="lg" className="mb-3 sm:mb-4">
                <AlertCircle className="w-3.5 h-3.5" />
                The Hard Truth
              </Badge>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-900 mb-3 sm:mb-4 px-2">
                Your Essay Can Make or Break Your Application
              </h2>
              <p className="text-neutral-600 text-base sm:text-lg max-w-2xl mx-auto px-2">
                For students with strong grades and test scores, the essay is often the deciding factor.
              </p>
            </div>

            {/* Mobile: horizontal scroll for stats, Desktop: grid */}
            <div className="flex sm:grid sm:grid-cols-3 gap-4 sm:gap-6 overflow-x-auto pb-4 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
              {[
                {
                  stat: '75%',
                  desc: 'of AOs say essays are important or very important',
                  source: 'NACAC Survey',
                },
                {
                  stat: '10 min',
                  desc: 'average time an officer spends on your application',
                  source: 'Inside Higher Ed',
                },
                {
                  stat: '1 in 3',
                  desc: 'rejected despite good grades, due to weak essays',
                  source: 'College Board Data',
                },
              ].map((item, i) => (
                <div key={i} className="flex-shrink-0 w-[260px] sm:w-auto p-5 sm:p-6 rounded-2xl bg-white border border-neutral-200 shadow-sm text-center">
                  <p className="text-3xl sm:text-4xl font-bold text-brand-600 mb-1.5 sm:mb-2">{item.stat}</p>
                  <p className="text-neutral-600 text-sm mb-2 sm:mb-3 leading-snug">{item.desc}</p>
                  <p className="text-xs text-neutral-400">{item.source}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Solution - Features Bento Grid */}
      <section className="py-10 sm:py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 sm:mb-14">
            <Badge variant="default" size="lg" className="mb-3 sm:mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              The IvyWay Difference
            </Badge>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-900 mb-3 sm:mb-4 px-2">
              Feedback That Actually Helps You Stand Out
            </h2>
            <p className="text-neutral-600 max-w-2xl mx-auto text-base sm:text-lg px-2">
              Not generic grammar fixes. Personalized analysis based on YOUR story and YOUR target school.
            </p>
          </div>

          {/* Bento Grid - Cleaner, more Apple-like, mobile-optimized */}
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5 max-w-5xl mx-auto">
            {/* Feature 1 - Large */}
            <Card variant="brand" className="md:col-span-2">
              <CardHeader className="pb-3">
                <div className="p-3 w-fit rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 mb-3">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <CardTitle className="text-xl">7-Dimension Analysis</CardTitle>
                <CardDescription>
                  Scored on the exact criteria admissions officers use
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    'Authenticity',
                    'Reflection',
                    'Structure',
                    'Specificity',
                    'Clarity',
                    'Voice',
                  ].map((item, i) => (
                    <div key={i} className="px-3 py-2 rounded-lg bg-white/60 border border-brand-200/30 text-sm font-medium text-neutral-700">
                      {item}
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
                <CardTitle>Your Voice, Preserved</CardTitle>
                <CardDescription>
                  We help you sound like a better version of yourself—never someone else.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 3 */}
            <Card variant="interactive">
              <CardHeader>
                <div className="p-3 w-fit rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 mb-2">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <CardTitle>School-Specific</CardTitle>
                <CardDescription>
                  Trained on 2025-26 prompts. Know exactly what Harvard vs. Yale vs. Cornell wants.
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 4 */}
            <Card variant="interactive" className="md:col-span-2">
              <CardHeader>
                <div className="p-3 w-fit rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 mb-2">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <CardTitle>Expert Human Review Available</CardTitle>
                <CardDescription>
                  Want a real human perspective? Our former admissions officers and experienced editors provide detailed margin comments and personalized guidance.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works - Simplified */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-neutral-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <Badge variant="secondary" size="lg" className="mb-4">
              <FileCheck className="w-3.5 h-3.5" />
              Simple Process
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
              Better Feedback in 60 Seconds
            </h2>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 md:gap-12">
              {[
                {
                  step: 1,
                  title: 'Paste Your Essay',
                  desc: 'Copy and paste your draft. Tell us your target school and your "spike."',
                },
                {
                  step: 2,
                  title: 'Get Instant Analysis',
                  desc: 'AI identifies exactly what\'s working and what needs to change.',
                },
                {
                  step: 3,
                  title: 'Revise with Confidence',
                  desc: 'Clear, actionable feedback. Upgrade for line-by-line suggestions.',
                },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white font-bold text-xl shadow-[0_4px_14px_0_rgba(124,58,237,0.25)] mb-4">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-lg text-neutral-900 mb-2">{item.title}</h3>
                  <p className="text-neutral-600 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Comparison - Why Not Alternatives */}
      <section className="py-16 md:py-24 bg-white border-t border-neutral-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="info" size="lg" className="mb-4">
              <Shield className="w-3.5 h-3.5" />
              Why IvyWay
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
              Not Another Grammar Checker
            </h2>
            <p className="text-neutral-600 max-w-xl mx-auto text-lg">
              Grammarly fixes commas. ChatGPT writes for you. We do neither.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-neutral-50">
                    <th className="text-left p-4 font-semibold text-neutral-600">What you need</th>
                    <th className="text-center p-4 font-semibold text-neutral-400">Grammarly</th>
                    <th className="text-center p-4 font-semibold text-neutral-400">ChatGPT</th>
                    <th className="text-center p-4 font-semibold text-brand-600 bg-brand-50">IvyWay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {[
                    'Built specifically for college essays',
                    'Preserves your authentic voice',
                    'School-specific feedback',
                    'Admissions officer perspective',
                    'Personalized to YOUR story & spike',
                    'Human expert review option',
                  ].map((feature, i) => (
                    <tr key={i}>
                      <td className="p-4 text-neutral-700">{feature}</td>
                      <td className="p-4 text-center text-neutral-300">—</td>
                      <td className="p-4 text-center text-neutral-300">—</td>
                      <td className="p-4 text-center text-success-600 bg-brand-50/30 font-medium">✓</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial - Social Proof */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-neutral-50 to-white">
        <div className="container mx-auto px-4">
          <TestimonialCard />
        </div>
      </section>

      {/* Reviewer Showcase */}
      <ReviewerShowcase />

      {/* Ivy League Schools */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <Badge variant="premium" size="lg" className="mb-4">
              <GraduationCap className="w-3.5 h-3.5" />
              Ivy League Ready
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
              Trained on 2025-26 Ivy Prompts
            </h2>
            <p className="text-neutral-600 max-w-xl mx-auto text-lg">
              Get feedback tailored to exactly what each school is looking for this cycle.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto mb-10">
            {IVY_SCHOOLS.map(school => (
              <div
                key={school}
                className="px-5 py-2.5 bg-white rounded-full border border-neutral-200 shadow-sm hover:shadow-md hover:border-brand-300 hover:-translate-y-0.5 transition-all cursor-default font-medium text-neutral-700"
              >
                {school}
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link href="/pricing">
              <Button variant="outline" size="lg">
                View Ivy Packages
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Money Back Guarantee */}
      <section className="py-14 bg-gradient-to-r from-success-50 to-emerald-50 border-y border-success-200/50">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-success-500 shadow-[0_4px_14px_0_rgba(34,197,94,0.25)]">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-success-800">100% Satisfaction Guarantee</h3>
          </div>
          <p className="text-success-700 max-w-lg mx-auto">
            Not satisfied? Contact us within 48 hours for a full refund. No questions asked.
          </p>
        </div>
      </section>

      {/* Final CTA - Strong, Clear */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-white to-neutral-50">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
              Your Dream School is Worth It
            </h2>
            <p className="text-neutral-600 mb-8 text-lg">
              Don't leave your essay to chance. Get expert feedback in 60 seconds.
            </p>
            <Link href="/signup">
              <Button size="xl" className="text-lg px-12">
                Start Free Analysis
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <p className="text-sm text-neutral-500 mt-4">
              Join 10,000+ students who've improved their essays with IvyWay
            </p>
          </div>
        </div>
      </section>

      {/* Footer - Minimal, with extra padding for mobile sticky CTA */}
      <footer className="border-t border-neutral-200 py-10 pb-24 md:pb-10 bg-neutral-50">
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
              <span>&copy; 2025 IvyWay. Privacy-first.</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Sticky CTA - appears when scrolling */}
      <StickyMobileCTA />

      {/* Social Proof Toast - shows activity notifications */}
      <SocialProofToast position="bottom-left" />
    </div>
  );
}
