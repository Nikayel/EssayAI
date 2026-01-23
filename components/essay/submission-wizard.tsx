'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function EssaySubmissionWizard() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);

  // Read URL params for pre-filling from portfolio
  const schoolFromUrl = searchParams.get('school') || '';
  const schoolIdFromUrl = searchParams.get('schoolId') || '';

  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    essayType: 'PERSONAL_STATEMENT',
    targetSchool: '',
    targetSchoolId: '', // Links to portfolio TargetSchool
    wordLimit: 650,
    prompt: '',

    // Step 2: Essay Content
    content: '',

    // Step 3: Package Selection
    package: 'AI_LITE',
  });

  // Pre-fill from URL params on mount
  useEffect(() => {
    if (schoolFromUrl || schoolIdFromUrl) {
      setFormData(prev => ({
        ...prev,
        targetSchool: schoolFromUrl || prev.targetSchool,
        targetSchoolId: schoolIdFromUrl || prev.targetSchoolId,
      }));
    }
  }, [schoolFromUrl, schoolIdFromUrl]);

  const [wordCount, setWordCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const countWords = (text: string) => {
    const count = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    setWordCount(count);
    return count;
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    updateField('content', text);
    countWords(text);
  };

  const canProceed = () => {
    if (step === 1) {
      return formData.essayType && formData.prompt.length > 10;
    }
    if (step === 2) {
      return formData.content.length > 50 && wordCount <= (formData.wordLimit || 1000);
    }
    return true;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Transform field names to match API schema
      const apiPayload = {
        type: formData.essayType,           // essayType → type
        promptText: formData.prompt,         // prompt → promptText
        targetSchool: formData.targetSchool,
        targetSchoolId: formData.targetSchoolId || undefined,
        wordLimit: formData.wordLimit,
        content: formData.content,
      };

      // Create essay first
      const essayRes = await fetch('/api/essays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiPayload),
      });

      if (!essayRes.ok) throw new Error('Failed to create essay');

      const { essay } = await essayRes.json();

      // Redirect to payment
      const checkoutRes = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          package: formData.package,
          essayId: essay.id,
        }),
      });

      if (!checkoutRes.ok) throw new Error('Failed to create checkout');

      const { url } = await checkoutRes.json();
      window.location.href = url; // Redirect to Stripe
    } catch (error) {
      console.error('Submission error:', error);
      alert('Failed to submit essay. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Step {step} of 3</span>
          <span className="text-sm text-gray-600">
            {step === 1 && 'Basic Information'}
            {step === 2 && 'Your Essay'}
            {step === 3 && 'Choose Package'}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Tell us about your essay</CardTitle>
            <CardDescription>This helps our AI give you better feedback</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="essayType">Essay Type</Label>
              <select
                id="essayType"
                className="w-full mt-1 px-3 py-2 border rounded-md"
                value={formData.essayType}
                onChange={(e) => updateField('essayType', e.target.value)}
              >
                <option value="PERSONAL_STATEMENT">Personal Statement (Common App)</option>
                <option value="WHY_US">Why This School?</option>
                <option value="SUPPLEMENTAL">Supplemental Essay</option>
                <option value="ACTIVITY">Activity Description</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <Label htmlFor="targetSchool">Target School (Optional)</Label>
              <Input
                id="targetSchool"
                placeholder="e.g., Stanford, MIT, Harvard"
                value={formData.targetSchool}
                onChange={(e) => updateField('targetSchool', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="wordLimit">Word Limit</Label>
              <Input
                id="wordLimit"
                type="number"
                placeholder="650"
                value={formData.wordLimit}
                onChange={(e) => updateField('wordLimit', parseInt(e.target.value))}
              />
            </div>

            <div>
              <Label htmlFor="prompt">Essay Prompt *</Label>
              <textarea
                id="prompt"
                className="w-full mt-1 px-3 py-2 border rounded-md min-h-[100px]"
                placeholder="Paste your essay prompt here. Example: 'The lessons we take from obstacles we encounter can be fundamental to later success...'"
                value={formData.prompt}
                onChange={(e) => updateField('prompt', e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Providing the exact prompt helps us evaluate relevance and alignment
              </p>
            </div>

            <Button
              onClick={() => setStep(2)}
              className="w-full"
              disabled={!canProceed()}
            >
              Next: Add Your Essay
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Essay Content */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Paste your essay</CardTitle>
            <CardDescription>
              Don't worry about perfection - we'll help you improve it
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="content">Essay Content *</Label>
              <textarea
                id="content"
                className="w-full mt-1 px-3 py-2 border rounded-md min-h-[400px] font-serif"
                placeholder="Start typing or paste your essay here..."
                value={formData.content}
                onChange={handleContentChange}
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-600">
                  Word Count: <span className={wordCount > (formData.wordLimit || 1000) ? 'text-red-600 font-semibold' : 'font-semibold'}>{wordCount}</span> / {formData.wordLimit || 1000}
                </span>
                {wordCount > (formData.wordLimit || 1000) && (
                  <span className="text-sm text-red-600">
                    Over limit by {wordCount - (formData.wordLimit || 1000)} words
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setStep(1)}
                variant="outline"
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                className="flex-1"
                disabled={!canProceed()}
              >
                Next: Choose Package
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Package Selection */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Choose your package</CardTitle>
            <CardDescription>
              Pay now, get instant AI feedback in ~1 minute
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* AI Lite */}
            <div
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                formData.package === 'AI_LITE' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
              onClick={() => updateField('package', 'AI_LITE')}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">AI Lite</h3>
                  <p className="text-sm text-gray-600">Fast feedback in ~30 seconds</p>
                  <ul className="mt-2 text-sm space-y-1">
                    <li>✓ Commons Check flags</li>
                    <li>✓ Basic rubric scores (0-100)</li>
                    <li>✓ Top 5 improvement suggestions</li>
                  </ul>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">$9</div>
                  <div className="text-xs text-gray-500">one-time</div>
                </div>
              </div>
            </div>

            {/* AI Pro */}
            <div
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                formData.package === 'AI_PRO_SINGLE' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
              onClick={() => updateField('package', 'AI_PRO_SINGLE')}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">AI Pro</h3>
                  <p className="text-sm text-gray-600">Comprehensive analysis in ~1 minute</p>
                  <ul className="mt-2 text-sm space-y-1">
                    <li>✓ Everything in AI Lite</li>
                    <li>✓ Full 7-dimension rubric breakdown</li>
                    <li>✓ Paragraph rewrites with voice notes</li>
                    <li>✓ School-fit analysis</li>
                    <li>✓ Tone preservation check</li>
                  </ul>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">$29</div>
                  <div className="text-xs text-gray-500">one-time</div>
                </div>
              </div>
            </div>

            {/* Human Review */}
            <div
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                formData.package === 'HUMAN_LITE' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
              }`}
              onClick={() => updateField('package', 'HUMAN_LITE')}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">Human Review</h3>
                  <p className="text-sm text-gray-600">AI analysis + expert human editor</p>
                  <ul className="mt-2 text-sm space-y-1">
                    <li>✓ Instant AI Pro analysis first</li>
                    <li>✓ Professional editor review (48h)</li>
                    <li>✓ Detailed margin comments</li>
                    <li>✓ Written summary & recommendations</li>
                  </ul>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">$79</div>
                  <div className="text-xs text-gray-500">48h delivery</div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setStep(2)}
                variant="outline"
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Processing...' : 'Continue to Payment'}
              </Button>
            </div>

            <p className="text-xs text-center text-gray-500">
              Secure payment via Stripe. Analysis starts immediately after payment.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
