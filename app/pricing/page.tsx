import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PACKAGE_INFO } from '@/lib/stripe/config';
import { Check } from 'lucide-react';

export default function PricingPage() {
  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(0)}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <h1 className="text-2xl font-bold text-gray-900">EssayEdge AI</h1>
          </Link>
          <nav className="flex gap-4">
            <Link href="/login">
              <Button variant="outline">Log In</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Pricing Header */}
      <section className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          Simple, Transparent Pricing
        </h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Start free. Upgrade anytime. No subscriptions required (except monthly AI Pro).
        </p>
      </section>

      {/* AI Packages */}
      <section className="container mx-auto px-4 py-8">
        <h3 className="text-2xl font-bold mb-6">AI-Powered Analysis</h3>
        <div className="grid md:grid-cols-3 gap-6">
          {/* Free */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Free</CardTitle>
              <CardDescription>Try it out</CardDescription>
              <div className="text-3xl font-bold mt-4">$0</div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-sm">1 Commons Check (650 words max)</span>
                </li>
                <li className="flex gap-2">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-sm">Pass/fail flags + quick tips</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter>
              <Link href="/signup" className="w-full">
                <Button className="w-full">Start Free</Button>
              </Link>
            </CardFooter>
          </Card>

          {/* AI Lite */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle>{PACKAGE_INFO.AI_LITE.name}</CardTitle>
              <CardDescription>{PACKAGE_INFO.AI_LITE.description}</CardDescription>
              <div className="text-3xl font-bold mt-4">
                {formatPrice(PACKAGE_INFO.AI_LITE.price)}
                <span className="text-sm font-normal text-gray-600">/essay</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {PACKAGE_INFO.AI_LITE.features.map((feature, idx) => (
                  <li key={idx} className="flex gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Link href="/signup" className="w-full">
                <Button className="w-full" variant="outline">Get Started</Button>
              </Link>
            </CardFooter>
          </Card>

          {/* AI Pro */}
          <Card className="border-2 border-blue-500 relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
              Popular
            </div>
            <CardHeader>
              <CardTitle>{PACKAGE_INFO.AI_PRO_SINGLE.name}</CardTitle>
              <CardDescription>{PACKAGE_INFO.AI_PRO_SINGLE.description}</CardDescription>
              <div className="text-3xl font-bold mt-4">
                {formatPrice(PACKAGE_INFO.AI_PRO_SINGLE.price)}
                <span className="text-sm font-normal text-gray-600">/essay</span>
              </div>
              <div className="text-sm text-gray-600">
                or {formatPrice(PACKAGE_INFO.AI_PRO_MONTHLY.price)}/month (up to 6 essays)
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {PACKAGE_INFO.AI_PRO_SINGLE.features.map((feature, idx) => (
                  <li key={idx} className="flex gap-2">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Link href="/signup" className="w-full">
                <Button className="w-full">Get Started</Button>
              </Link>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* Human Review */}
      <section className="container mx-auto px-4 py-8">
        <h3 className="text-2xl font-bold mb-6">Human Review & Coaching</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Human Lite */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{PACKAGE_INFO.HUMAN_LITE.name}</CardTitle>
              <div className="text-2xl font-bold mt-2">
                {formatPrice(PACKAGE_INFO.HUMAN_LITE.price)}
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {PACKAGE_INFO.HUMAN_LITE.features.slice(0, 3).map((feature, idx) => (
                  <li key={idx} className="flex gap-2">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-xs">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {['HUMAN_FULL_1', 'HUMAN_FULL_3', 'HUMAN_FULL_5'].map((key) => {
            const pkg = PACKAGE_INFO[key as keyof typeof PACKAGE_INFO];
            return (
              <Card key={key} className={key === 'HUMAN_FULL_3' ? 'border-2 border-purple-500' : ''}>
                <CardHeader>
                  <CardTitle className="text-lg">{pkg.name}</CardTitle>
                  <div className="text-2xl font-bold mt-2">
                    {formatPrice(pkg.price)}
                  </div>
                  {key === 'HUMAN_FULL_3' && (
                    <div className="text-xs text-purple-600 font-semibold">Best Value</div>
                  )}
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {pkg.features.slice(0, 3).map((feature, idx) => (
                      <li key={idx} className="flex gap-2">
                        <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-xs">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-4 py-12">
        <h3 className="text-2xl font-bold mb-6 text-center">Frequently Asked Questions</h3>
        <div className="max-w-3xl mx-auto space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Will you rewrite my essay?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                No. We provide suggestions and examples, but YOU remain the author. Our AI and
                reviewers are trained to preserve your voice and never inject content you didn&apos;t provide.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How fast is the AI analysis?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Commons Check: under 15 seconds. Full AI Pro analysis: under 60 seconds for most essays.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What about refunds?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                24-hour cooling-off period if no human work has started. Partial refunds if SLA is missed.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-white">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2024 EssayEdge AI. Privacy-first. Voice-preserving.</p>
        </div>
      </footer>
    </div>
  );
}
