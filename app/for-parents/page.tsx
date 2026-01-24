import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DeadlineUrgency } from '@/components/marketing/deadline-urgency';
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
  BookOpen
} from 'lucide-react';

export default function ForParentsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <DeadlineUrgency />

      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">IvyWay</h1>
          <nav className="flex gap-4">
            <Link href="/">
              <Button variant="ghost">For Students</Button>
            </Link>
            <Link href="/pricing">
              <Button variant="ghost">Pricing</Button>
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

      {/* Hero - Parent Focused */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-800 px-4 py-2 rounded-full mb-6">
          <Heart className="w-4 h-4" />
          <span className="text-sm font-medium">For Parents Who Want the Best for Their Child</span>
        </div>

        <h2 className="text-5xl font-bold text-gray-900 mb-6">
          Give Your Child an Edge
          <br />
          <span className="text-blue-600">Without Doing the Work for Them</span>
        </h2>

        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          College essays make or break Ivy League applications. Our expert feedback helps
          your child write authentically while fixing the mistakes that get essays rejected.
          <strong> They do the work. We guide the way.</strong>
        </p>

        <div className="flex gap-4 justify-center mb-8">
          <Link href="/signup">
            <Button size="lg" className="text-lg px-8 py-6">
              Start Free Analysis
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <Link href="/pricing">
            <Button size="lg" variant="outline" className="text-lg px-8 py-6">
              View Packages
            </Button>
          </Link>
        </div>

        <p className="text-sm text-gray-500">
          Free initial check included. Can be used as an education expense.
        </p>
      </section>

      {/* Parent Concerns Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">
            We Understand Your Concerns
          </h3>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <CardTitle className="text-lg">"Will AI write the essay for them?"</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  <strong>No.</strong> We provide feedback and suggestions, never finished text.
                  Your child remains the author. Our tone preservation technology ensures their
                  voice stays authentic. Admissions officers can spot ghostwritten essays—we help
                  students sound like <em>themselves</em>, just better.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Shield className="w-5 h-5 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">"Is their essay private and secure?"</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  <strong>Absolutely.</strong> Essays are encrypted, never shared, and never used
                  to train AI models. We're COPPA compliant for students under 16, requiring
                  parental consent. Data can be deleted anytime upon request.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <CardTitle className="text-lg">"Does this actually help?"</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Our AI is trained on what works at top schools. We flag the exact issues
                  that cause rejection: generic language, lack of reflection, weak openings.
                  Students who revise based on our feedback see measurable score improvements.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-purple-600" />
                  </div>
                  <CardTitle className="text-lg">"Is this a worthwhile investment?"</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Private college counselors charge $5,000-$15,000+. Our comprehensive Ivy package
                  is under $500, covering all 8 schools with AI + human review. For a single essay
                  check, it's less than the cost of one test prep session.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-4">What Your Child Gets</h3>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Professional-level feedback that helps them improve—not shortcuts that undermine their work
          </p>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <BookOpen className="w-8 h-8 text-blue-600 mb-4" />
              <h4 className="font-semibold text-lg mb-2">Detailed Analysis</h4>
              <p className="text-gray-600 text-sm">
                Score across 7 dimensions (authenticity, reflection, structure...) with
                specific examples from their essay showing what works and what doesn't.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <Users className="w-8 h-8 text-purple-600 mb-4" />
              <h4 className="font-semibold text-lg mb-2">Expert Human Review</h4>
              <p className="text-gray-600 text-sm">
                Optional review by experienced editors—former admissions readers, English PhDs,
                and professional writing coaches who've helped thousands of students.
              </p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <Eye className="w-8 h-8 text-green-600 mb-4" />
              <h4 className="font-semibold text-lg mb-2">School-Specific Insights</h4>
              <p className="text-gray-600 text-sm">
                Analysis tailored to specific Ivy League schools—what Harvard looks for is
                different from Yale. We show them exactly how to demonstrate fit.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Parent Visibility */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-blue-50 rounded-2xl p-8 md:p-12">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Eye className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-4">Stay Informed Without Hovering</h3>
                <p className="text-gray-700 mb-4">
                  We understand the delicate balance: you want to support your child's
                  application without taking over. That's why we offer:
                </p>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Optional parent email notifications when analysis is complete</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Clear receipts for your records (529 eligible in many states)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Progress tracking—see that they're actively improving</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span>Deadline reminders so nothing falls through the cracks</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Overview */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-4">Transparent, Simple Pricing</h3>
          <p className="text-gray-600 mb-12 max-w-2xl mx-auto">
            No hidden fees. No subscriptions required. Pay for what you need.
          </p>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>AI Analysis</CardTitle>
                <CardDescription>Quick, detailed feedback</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold mb-2">$9-$29</div>
                <p className="text-sm text-gray-600">per essay</p>
                <p className="text-sm text-gray-500 mt-4">Results in under 60 seconds</p>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-500 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                MOST POPULAR
              </div>
              <CardHeader>
                <CardTitle>AI + Human Review</CardTitle>
                <CardDescription>Expert editor feedback</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold mb-2">$79-$149</div>
                <p className="text-sm text-gray-600">per essay</p>
                <p className="text-sm text-gray-500 mt-4">48-hour delivery</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ivy Premium Bundle</CardTitle>
                <CardDescription>All 8 Ivies covered</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold mb-2">$499</div>
                <p className="text-sm text-gray-600">complete package</p>
                <p className="text-sm text-gray-500 mt-4">AI + 3 human reviews</p>
              </CardContent>
            </Card>
          </div>

          <Link href="/pricing">
            <Button size="lg" className="mt-8">
              See All Packages
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-4">
            Help Your Child Put Their Best Essay Forward
          </h3>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            The essay is often the deciding factor for borderline admits.
            Give your child the feedback they need to stand out.
          </p>
          <Link href="/signup">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
              Start Free Analysis
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-white">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2025 IvyWay. Privacy-first. Voice-preserving.</p>
          <p className="text-sm mt-2">
            Questions? Email us at <a href="mailto:support@ivyway.ai" className="text-brand-600">support@ivyway.ai</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
