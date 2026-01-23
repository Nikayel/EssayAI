/**
 * Marketing Landing Page
 * Main landing page with conversion-optimized design
 */

import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle,
  Sparkles,
  Shield,
  Clock,
  Star,
  GraduationCap,
  Users,
  Trophy,
  Zap,
  MessageSquare,
  Target,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmailCapture, LeadMagnetCapture } from '@/components/marketing/email-capture';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-8 h-8 text-blue-600" />
              <span className="font-bold text-xl">EssayEdge AI</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <Link href="/pricing" className="text-gray-600 hover:text-gray-900">Pricing</Link>
              <Link href="/for-parents" className="text-gray-600 hover:text-gray-900">For Parents</Link>
              <Link href="/login" className="text-gray-600 hover:text-gray-900">Log In</Link>
              <Link href="/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4" />
              Trusted by 10,000+ students
            </div>

            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Get Into Your Dream School<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Without Losing Your Voice
              </span>
            </h1>

            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              AI-powered essay feedback that helps you stand out authentically.
              See exactly what admissions officers look for — and fix it before you submit.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/signup">
                <Button size="xl" className="w-full sm:w-auto">
                  Analyze Your Essay Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button size="xl" variant="outline" className="w-full sm:w-auto">
                  View Pricing
                </Button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                Results in 60 seconds
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-500" />
                100% confidential
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-gray-900">10K+</div>
              <div className="text-gray-600">Essays Analyzed</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-gray-900">94%</div>
              <div className="text-gray-600">Improved Scores</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-gray-900">4.9★</div>
              <div className="text-gray-600">Average Rating</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-gray-900">48hr</div>
              <div className="text-gray-600">Expert Review</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get actionable feedback in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="relative overflow-hidden">
              <CardContent className="pt-8 pb-6 px-6 text-center">
                <div className="absolute top-0 right-0 bg-blue-600 text-white w-12 h-12 flex items-center justify-center text-xl font-bold rounded-bl-2xl">
                  1
                </div>
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4">
                  <MessageSquare className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Paste Your Essay</h3>
                <p className="text-gray-600">
                  Upload your essay and tell us which school you&apos;re targeting
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <CardContent className="pt-8 pb-6 px-6 text-center">
                <div className="absolute top-0 right-0 bg-purple-600 text-white w-12 h-12 flex items-center justify-center text-xl font-bold rounded-bl-2xl">
                  2
                </div>
                <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-2xl mb-4">
                  <Zap className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Get AI Analysis</h3>
                <p className="text-gray-600">
                  Our AI analyzes your essay using admissions officer criteria
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <CardContent className="pt-8 pb-6 px-6 text-center">
                <div className="absolute top-0 right-0 bg-green-600 text-white w-12 h-12 flex items-center justify-center text-xl font-bold rounded-bl-2xl">
                  3
                </div>
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-2xl mb-4">
                  <Target className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Make It Perfect</h3>
                <p className="text-gray-600">
                  Follow specific suggestions to strengthen your essay
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              What Makes Us Different
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We help you improve while keeping your authentic voice
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: 'Voice Preservation',
                description: 'We enhance YOUR story, not replace it with generic AI writing',
                color: 'blue',
              },
              {
                icon: Star,
                title: 'AO Perspective',
                description: 'See exactly what admissions officers think when reading your essay',
                color: 'yellow',
              },
              {
                icon: Trophy,
                title: 'School-Specific',
                description: 'Feedback tailored to each school\'s unique values and culture',
                color: 'purple',
              },
              {
                icon: Users,
                title: 'Expert Reviews',
                description: 'Optional human review from former admissions officers',
                color: 'green',
              },
              {
                icon: Zap,
                title: 'Instant Results',
                description: 'Get actionable feedback in under 60 seconds',
                color: 'orange',
              },
              {
                icon: Clock,
                title: 'Track Progress',
                description: 'See how each revision improves your score',
                color: 'pink',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 bg-${feature.color}-100 rounded-xl mb-4`}>
                  <feature.icon className={`w-6 h-6 text-${feature.color}-600`} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Students Love Us
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "The feedback was incredibly specific. I knew exactly what to fix and why it mattered for Stanford.",
                name: "Sarah K.",
                school: "Accepted to Stanford",
                rating: 5,
              },
              {
                quote: "I was worried AI feedback would make my essay sound generic, but it actually helped me find MY voice.",
                name: "Marcus T.",
                school: "Accepted to Yale",
                rating: 5,
              },
              {
                quote: "The AO perspective feature was a game-changer. I finally understood what they were looking for.",
                name: "Emily C.",
                school: "Accepted to Columbia",
                rating: 5,
              },
            ].map((testimonial) => (
              <Card key={testimonial.name} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4">&quot;{testimonial.quote}&quot;</p>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-green-600">{testimonial.school}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Lead Magnet Section */}
      <section className="py-24 bg-gradient-to-br from-blue-600 to-purple-700">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Free Guide: 10 Essay Mistakes That Kill Applications
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Learn what admissions officers see over and over — and how to avoid it.
          </p>
          <div className="bg-white rounded-2xl p-8 shadow-2xl">
            <EmailCapture
              source="homepage"
              leadMagnet="common-mistakes"
              buttonText="Get Free Guide"
              variant="stacked"
              successMessage="Check your email for your free guide!"
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Ready to Stand Out?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of students who improved their essays with EssayEdge AI
          </p>
          <Link href="/signup">
            <Button size="xl">
              Start Your Free Analysis
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12">
            <div>
              <div className="flex items-center gap-2 text-white mb-4">
                <GraduationCap className="w-6 h-6" />
                <span className="font-bold">EssayEdge AI</span>
              </div>
              <p className="text-sm">
                Voice-preserving essay feedback for college applications.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/features" className="hover:text-white">Features</Link></li>
                <li><Link href="/for-parents" className="hover:text-white">For Parents</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
                <li><Link href="/guides" className="hover:text-white">Essay Guides</Link></li>
                <li><Link href="/faq" className="hover:text-white">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><Link href="/privacy" className="hover:text-white">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-sm text-center">
            © {new Date().getFullYear()} EssayEdge AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
