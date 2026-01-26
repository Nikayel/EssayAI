import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DeadlineUrgency } from '@/components/marketing/deadline-urgency';
import { TrustBadges } from '@/components/marketing/trust-badges';
import { MobileNav } from '@/components/layout/mobile-nav';
import {
  Shield,
  Eye,
  Clock,
  CheckCircle,
  ArrowRight,
  Heart,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Users,
  BookOpen,
  PenTool,
  Quote,
  Lock,
  Zap,
  Star
} from 'lucide-react';

// =============================================================================
// PAGE CONFIGURATION
// =============================================================================

const PARENT_CONCERNS = [
  {
    question: '"Will AI write the essay for them?"',
    answer: 'No. We provide feedback and suggestions, never finished text. Your child remains the author. Our tone preservation technology ensures their voice stays authentic.',
    icon: AlertTriangle,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
  },
  {
    question: '"Is their essay private and secure?"',
    answer: 'Absolutely. Essays are encrypted, never shared, and never used to train AI models. We\'re COPPA compliant. Data can be deleted anytime upon request.',
    icon: Shield,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  {
    question: '"Does this actually help?"',
    answer: 'Our AI is trained on what works at top schools. We flag the exact issues that cause rejection: generic language, lack of reflection, weak openings.',
    icon: TrendingUp,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
  },
  {
    question: '"Is this a worthwhile investment?"',
    answer: 'Private counselors charge $5,000-$15,000+. IvyWay starts at $9.99. For the cost of one test prep session, get expert-level essay feedback.',
    icon: DollarSign,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
  },
];

const BENEFITS = [
  {
    title: 'Detailed Analysis',
    desc: 'Score across 7 dimensions with specific examples showing what works and what doesn\'t.',
    icon: BookOpen,
    color: 'text-blue-600',
  },
  {
    title: 'Expert Human Review',
    desc: 'Optional review by former admissions readers and professional writing coaches.',
    icon: Users,
    color: 'text-purple-600',
  },
  {
    title: 'School-Specific Insights',
    desc: 'Analysis tailored to specific schools—what Harvard looks for differs from Yale.',
    icon: Eye,
    color: 'text-green-600',
  },
];

const VISIBILITY_FEATURES = [
  'Optional parent email notifications when analysis is complete',
  'Clear receipts for your records (529 eligible in many states)',
  'Progress tracking—see that they\'re actively improving',
  'Deadline reminders so nothing falls through the cracks',
];

// =============================================================================
// PAGE COMPONENT
// =============================================================================

export default function ForParentsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      <DeadlineUrgency />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-neutral-200/60 bg-white/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-sm">
              <PenTool className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-neutral-900 tracking-tight">IvyWay</span>
          </Link>
          <nav className="hidden md:flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="sm">For Students</Button>
            </Link>
            <Link href="/pricing">
              <Button variant="ghost" size="sm">Pricing</Button>
            </Link>
            <div className="w-px h-6 bg-neutral-200 mx-2" />
            <Link href="/login">
              <Button variant="ghost" size="sm">Log In</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </nav>
          <MobileNav />
        </div>
      </header>

      {/* Hero - Parent Focused */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 via-white to-white" />

        <div className="relative container mx-auto px-4 pt-16 pb-20 md:pt-24 md:pb-32">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="info" size="lg" className="mb-6">
              <Heart className="w-3.5 h-3.5" />
              For Parents Who Want the Best
            </Badge>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-neutral-900 mb-6 leading-[1.1] tracking-tight">
              Give Your Child an Edge
              <br />
              <span className="text-blue-600">Without Doing the Work for Them</span>
            </h1>

            <p className="text-lg md:text-xl text-neutral-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              College essays make or break Ivy League applications. Expert feedback helps
              your child write authentically while fixing the mistakes that get essays rejected.
              <span className="font-medium text-neutral-800"> They do the work. We guide the way.</span>
            </p>

            <div className="flex flex-wrap justify-center gap-6 mb-10 text-sm text-neutral-500">
              <span className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-success-500" />
                100% private & secure
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" />
                Results in 60 seconds
              </span>
              <span className="flex items-center gap-1.5">
                <Star className="w-4 h-4 text-brand-500 fill-brand-500" />
                4.9/5 parent satisfaction
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="xl" className="w-full sm:w-auto text-lg px-10">
                  Start Free Analysis
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="xl" variant="outline" className="w-full sm:w-auto">
                  View Packages
                </Button>
              </Link>
            </div>

            <p className="text-sm text-neutral-500 mt-6">
              Free initial check included. Can be used as an education expense.
            </p>
          </div>
        </div>
      </section>

      {/* Parent Concerns Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" size="lg" className="mb-4">
              <Shield className="w-3.5 h-3.5" />
              Your Questions Answered
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
              We Understand Your Concerns
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {PARENT_CONCERNS.map((concern, i) => {
              const Icon = concern.icon;
              return (
                <Card key={i} variant="interactive">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${concern.iconBg} rounded-xl flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${concern.iconColor}`} />
                      </div>
                      <CardTitle className="text-lg">{concern.question}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-neutral-600 leading-relaxed">{concern.answer}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* What Your Child Gets */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-neutral-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="default" size="lg" className="mb-4">
              <BookOpen className="w-3.5 h-3.5" />
              What They Get
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
              Professional-Level Feedback
            </h2>
            <p className="text-neutral-600 max-w-xl mx-auto text-lg">
              Not shortcuts that undermine their work—real guidance that helps them improve.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {BENEFITS.map((benefit, i) => {
              const Icon = benefit.icon;
              return (
                <div key={i} className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
                  <Icon className={`w-8 h-8 ${benefit.color} mb-4`} />
                  <h3 className="font-semibold text-lg text-neutral-900 mb-2">{benefit.title}</h3>
                  <p className="text-neutral-600 text-sm leading-relaxed">{benefit.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Parent Visibility */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-blue-50 rounded-2xl p-8 md:p-12 border border-blue-100">
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Eye className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-neutral-900 mb-4">
                  Stay Informed Without Hovering
                </h3>
                <p className="text-neutral-700 mb-6 leading-relaxed">
                  We understand the delicate balance: you want to support your child's
                  application without taking over. That's why we offer:
                </p>
                <ul className="space-y-3">
                  {VISIBILITY_FEATURES.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-neutral-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Authority Quote */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-neutral-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Quote className="w-10 h-10 text-brand-200 mx-auto mb-6" />
            <blockquote className="text-xl md:text-2xl text-neutral-700 font-medium leading-relaxed mb-6">
              "As a parent, I was worried about over-helping. IvyWay gave my daughter the feedback she needed without me having to read every draft. She got into Brown ED."
            </blockquote>
            <div className="flex items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
                JT
              </div>
              <div className="text-left">
                <p className="font-semibold text-neutral-900">Jennifer T.</p>
                <p className="text-sm text-neutral-500">Parent of Brown '29 Admit</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Overview */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4 text-center">
          <Badge variant="premium" size="lg" className="mb-4">
            <DollarSign className="w-3.5 h-3.5" />
            Transparent Pricing
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
            Simple, Honest Pricing
          </h2>
          <p className="text-neutral-600 mb-12 max-w-xl mx-auto text-lg">
            No hidden fees. No subscriptions. Pay only for what you need.
          </p>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card>
              <CardHeader className="text-center">
                <CardTitle>AI Analysis</CardTitle>
                <p className="text-sm text-neutral-500">Quick, detailed feedback</p>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-4xl font-bold mb-2">$9.99</div>
                <p className="text-sm text-neutral-600">per essay</p>
                <p className="text-xs text-neutral-400 mt-4">Results in under 60 seconds</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-brand-500 relative shadow-lg">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-brand-500 to-brand-600 text-white px-4 py-1 rounded-full text-xs font-semibold">
                Most Popular
              </div>
              <CardHeader className="text-center">
                <CardTitle>AI + Human Review</CardTitle>
                <p className="text-sm text-neutral-500">Expert editor feedback</p>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-4xl font-bold mb-2">$79</div>
                <p className="text-sm text-neutral-600">per essay</p>
                <p className="text-xs text-neutral-400 mt-4">48-hour turnaround</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <CardTitle>Ivy Bundle</CardTitle>
                <p className="text-sm text-neutral-500">3 schools covered</p>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-4xl font-bold mb-2">$79</div>
                <p className="text-sm text-neutral-600">all essays for 3 schools</p>
                <p className="text-xs text-neutral-400 mt-4">Best value for Ivy applicants</p>
              </CardContent>
            </Card>
          </div>

          <Link href="/pricing" className="inline-block mt-10">
            <Button size="lg" variant="outline">
              See All Packages
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 md:py-28 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Help Your Child Put Their Best Essay Forward
          </h2>
          <p className="text-blue-100 mb-8 max-w-xl mx-auto text-lg">
            The essay is often the deciding factor for borderline admits.
            Give your child the feedback they need to stand out.
          </p>
          <Link href="/signup">
            <Button size="xl" variant="secondary" className="text-lg px-10">
              Start Free Analysis
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200 py-10 bg-neutral-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600">
                <PenTool className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-neutral-700">IvyWay</span>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-4 text-sm text-neutral-500">
              <span>&copy; 2025 IvyWay. Privacy-first.</span>
              <a href="mailto:support@ivyway.ai" className="text-brand-600 hover:underline">
                support@ivyway.ai
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
