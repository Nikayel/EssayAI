'use client';

/**
 * Voice Step
 * Collects writing voice sample for tone analysis
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import type { StudentIntake } from '@/lib/scoring';

interface VoiceStepProps {
  initialData?: StudentIntake['voice'];
  essayText?: string;
  onComplete: (data: StudentIntake['voice']) => void;
  onBack: () => void;
  onSkip: () => void;
}

const VOICE_PROMPTS = [
  'Describe your morning routine in your own words',
  'Tell a story about a time you laughed really hard',
  'Describe your favorite place to think',
  'Write about something that annoys you',
  'Explain something you\'re good at to someone who knows nothing about it',
];

export function VoiceStep({ initialData, essayText, onComplete, onBack, onSkip }: VoiceStepProps) {
  const [formData, setFormData] = useState({
    toneSample: initialData?.toneSample || '',
    writingStyle: initialData?.writingStyle || '',
    usesHumor: initialData?.usesHumor || false,
  });

  const [selectedPrompt, setSelectedPrompt] = useState(VOICE_PROMPTS[0]);
  const wordCount = formData.toneSample.split(/\s+/).filter(w => w.length > 0).length;

  // If we have essay text, offer to extract a sample
  const canExtractFromEssay = essayText && essayText.length > 200;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete({
      toneSample: formData.toneSample,
      writingStyle: (formData.writingStyle || 'conversational') as StudentIntake['voice']['writingStyle'],
      usesHumor: formData.usesHumor,
    });
  };

  const extractFromEssay = () => {
    if (essayText) {
      // Extract first 200 words as a sample
      const words = essayText.split(/\s+/).slice(0, 200);
      setFormData(prev => ({ ...prev, toneSample: words.join(' ') }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className="text-sm text-muted-foreground">
        We use your natural writing voice to detect when your essay sounds "coached" or
        different from how you normally write. This is one of the most powerful ways to
        ensure authenticity.
      </p>

      {/* Voice Sample */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="toneSample">Voice Sample (150-250 words)</Label>
          {canExtractFromEssay && (
            <Button type="button" variant="outline" size="sm" onClick={extractFromEssay}>
              Extract from Essay
            </Button>
          )}
        </div>

        {/* Prompt selector */}
        <div className="p-3 bg-muted rounded-lg text-sm">
          <p className="font-medium mb-2">Write about:</p>
          <Select value={selectedPrompt} onValueChange={setSelectedPrompt}>
            <SelectTrigger className="bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {VOICE_PROMPTS.map(prompt => (
                <SelectItem key={prompt} value={prompt}>
                  {prompt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Textarea
          id="toneSample"
          placeholder="Write naturally, as if you're texting a friend or writing in a journal. Don't try to sound formal or impressive."
          value={formData.toneSample}
          onChange={(e) => setFormData(prev => ({ ...prev, toneSample: e.target.value }))}
          rows={6}
        />

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{wordCount} words</span>
          <span className={wordCount >= 150 && wordCount <= 250 ? 'text-green-600' : ''}>
            {wordCount < 150 ? `${150 - wordCount} more words needed` :
             wordCount > 250 ? `${wordCount - 250} words over limit` :
             '✓ Perfect length'}
          </span>
        </div>
      </div>

      {/* Writing Style */}
      <div className="space-y-2">
        <Label>How would you describe your writing style?</Label>
        <Select
          value={formData.writingStyle}
          onValueChange={(value) => setFormData(prev => ({ ...prev, writingStyle: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select your style" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="formal">Formal / Academic</SelectItem>
            <SelectItem value="conversational">Conversational / Casual</SelectItem>
            <SelectItem value="storytelling">Storytelling / Narrative</SelectItem>
            <SelectItem value="analytical">Analytical / Structured</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Humor */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="usesHumor"
          checked={formData.usesHumor}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, usesHumor: !!checked }))}
        />
        <Label htmlFor="usesHumor" className="cursor-pointer">
          I naturally use humor in my writing
        </Label>
      </div>

      {/* Why this matters */}
      <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm">
        <p className="font-medium mb-1">Why does this matter?</p>
        <p className="text-muted-foreground">
          Admissions officers can tell when an essay has been over-edited by consultants.
          By comparing your essay to your natural voice, we can flag sections that don't
          sound like you and might seem "coached."
        </p>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={onSkip}>
            Skip
          </Button>
          <Button type="submit">
            Complete & Analyze
          </Button>
        </div>
      </div>
    </form>
  );
}
