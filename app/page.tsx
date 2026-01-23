import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SocialProofBanner } from '@/components/marketing/social-proof-banner';
import { DeadlineUrgency } from '@/components/marketing/deadline-urgency';
import { ReviewerShowcase } from '@/components/marketing/reviewer-showcase';
import { Shield, Clock, Star, CheckCircle, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Urgency Banner */}
      <DeadlineUrgency />

      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">EssayEdge AI</h1>
          <nav className="flex gap-4">
            <Link href="/pricing">
              <Button variant="ghost">Pricing</Button>
            </Link>
            <Link href="/for-parents">
              <Button variant="ghost">For Parents</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline">Log In</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        {/* Social Proof Banner */}
        <SocialProofBanner />

        <h2 className="text-5xl font-bold text-gray-900 mb-6 mt-8">
          Get Into Your Dream Ivy League School
          <br />
          <span className="text-blue-600">With Essays That Actually Work</span>
        </h2>
        <p className="text-xl text-gray-600 mb-4 max-w-2xl mx-auto">
          AI analysis trained on successful admits + expert reviewers who've read 10,000+ essays.
          See exactly what's missing and how to fix it.
        </p>

        {/* Trust badges */}
        <div className="flex justify-center gap-8 mb-8 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-600" />
            <span>Your essay stays private</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span>Results in 60 seconds</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            <span>4.9/5 student rating</span>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <Link href="/signup">
            <Button size="lg" className="text-lg px-8 py-6">
              Start Free Analysis
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <Link href="/pricing">
            <Button size="lg" variant="outline" className="text-lg px-8 py-6">
              View Pricing
            </Button>
          </Link>
        </div>

        <p className="text-sm text-gray-500 mt-4">
          Free Commons Check for essays up to 650 words. No credit card required.
        </p>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-center mb-12">Why EssayEdge AI?</h3>
        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Fast, Structured Feedback</CardTitle>
              <CardDescription>
                Get comprehensive analysis in under 60 seconds
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Our AI evaluates your essay across 7 dimensions: authenticity, reflection,
                structure, specificity, clarity, mechanics, and ethics.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Voice Preservation</CardTitle>
              <CardDescription>
                Suggestions, not ghostwriting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                We analyze your tone and ensure all edits maintain your unique voice.
                You stay the author, always.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tiered Support</CardTitle>
              <CardDescription>
                From AI-only to multi-round coaching
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Start with free AI checks, upgrade to detailed analysis, or add expert
                human reviewers for comprehensive guidance.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">How It Works</h3>
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h4 className="font-semibold text-lg mb-2">Upload Your Essay</h4>
                <p className="text-gray-600">
                  Paste your draft, select essay type, and add your prompt
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h4 className="font-semibold text-lg mb-2">Get AI Analysis</h4>
                <p className="text-gray-600">
                  Receive detailed scores, flags, and targeted improvement suggestions
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h4 className="font-semibold text-lg mb-2">Apply & Iterate</h4>
                <p className="text-gray-600">
                  Review suggestions, make edits, track progress across versions
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <h4 className="font-semibold text-lg mb-2">Optional: Add Human Review</h4>
                <p className="text-gray-600">
                  Get professional editor feedback with comments and coaching
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviewer Showcase */}
      <ReviewerShowcase />

      {/* Ivy League Specific Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4">Ivy League Essay Analysis</h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our AI is trained on 2025-26 prompts from all 8 Ivy League schools.
              Get school-specific feedback that shows you exactly what Harvard, Yale, or Princeton is looking for.
            </p>
          </div>

          <div className="grid grid-cols-4 md:grid-cols-8 gap-4 max-w-4xl mx-auto">
            {['Harvard', 'Yale', 'Princeton', 'Columbia', 'UPenn', 'Dartmouth', 'Brown', 'Cornell'].map(school => (
              <div key={school} className="text-center p-3 bg-white rounded-lg border shadow-sm">
                <span className="text-sm font-medium text-gray-700">{school}</span>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link href="/pricing">
              <Button variant="outline" size="lg">
                View Ivy League Packages
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Money Back Guarantee */}
      <section className="bg-green-50 py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <h3 className="text-2xl font-bold text-green-800">100% Satisfaction Guarantee</h3>
          </div>
          <p className="text-green-700 max-w-xl mx-auto">
            Not satisfied with your analysis? Contact us within 48 hours and we'll make it right
            or refund your purchase. No questions asked.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h3 className="text-3xl font-bold mb-4">Ready to Improve Your Essay?</h3>
        <p className="text-gray-600 mb-8">Start with a free Commons Check today</p>
        <Link href="/signup">
          <Button size="lg" className="text-lg px-8 py-6">
            Get Started Free
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2024 EssayEdge AI. Privacy-first. Voice-preserving.</p>
        </div>
      </footer>
    </div>
  );
}
