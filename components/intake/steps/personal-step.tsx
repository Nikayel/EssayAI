'use client';

/**
 * Personal Step
 * Collects personal identity and unique perspective
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import type { StudentIntake } from '@/lib/scoring';

interface PersonalStepProps {
  initialData?: StudentIntake['personal'];
  onComplete: (data: StudentIntake['personal']) => void;
  onBack: () => void;
  onSkip: () => void;
}

const IDENTITY_OPTIONS = [
  { id: 'race_ethnicity', label: 'Race/Ethnicity is important to my story' },
  { id: 'gender', label: 'Gender identity is important to my story' },
  { id: 'lgbtq', label: 'LGBTQ+ identity is important to my story' },
  { id: 'disability', label: 'Disability is part of my story' },
  { id: 'religion', label: 'Religion/faith is important to my story' },
  { id: 'military', label: 'Military connection (self/family)' },
];

export function PersonalStep({ initialData, onComplete, onBack, onSkip }: PersonalStepProps) {
  const [formData, setFormData] = useState({
    identityFactors: initialData?.identityFactors || [],
    significantChallenges: initialData?.significantChallenges || '',
    uniquePerspective: initialData?.uniquePerspective || '',
    whatAOsShouldKnow: initialData?.whatAOsShouldKnow || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete({
      identityFactors: formData.identityFactors as StudentIntake['personal']['identityFactors'],
      significantChallenges: formData.significantChallenges,
      uniquePerspective: formData.uniquePerspective,
      whatAOsShouldKnow: formData.whatAOsShouldKnow,
    });
  };

  const toggleIdentity = (id: string) => {
    setFormData(prev => ({
      ...prev,
      identityFactors: prev.identityFactors.includes(id as any)
        ? prev.identityFactors.filter(i => i !== id)
        : [...prev.identityFactors, id as any],
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className="text-sm text-muted-foreground">
        This section helps us understand your unique perspective. All responses are optional
        and used only to provide more relevant feedback.
      </p>

      {/* Identity Factors */}
      <div className="space-y-3">
        <Label>Identity Factors (select any that apply to your essay)</Label>
        <div className="space-y-2">
          {IDENTITY_OPTIONS.map(option => (
            <div key={option.id} className="flex items-center space-x-2">
              <Checkbox
                id={option.id}
                checked={formData.identityFactors.includes(option.id as any)}
                onCheckedChange={() => toggleIdentity(option.id)}
              />
              <Label htmlFor={option.id} className="cursor-pointer text-sm">
                {option.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Significant Challenges */}
      <div className="space-y-2">
        <Label htmlFor="challenges">Significant Challenges Overcome</Label>
        <Textarea
          id="challenges"
          placeholder="Have you faced significant adversity? (health, family, financial, etc.) Only share if relevant to your essay."
          value={formData.significantChallenges}
          onChange={(e) => setFormData(prev => ({ ...prev, significantChallenges: e.target.value }))}
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          We use this to evaluate context, not to judge your circumstances
        </p>
      </div>

      {/* Unique Perspective */}
      <div className="space-y-2">
        <Label htmlFor="unique">What Makes You Different?</Label>
        <Textarea
          id="unique"
          placeholder="What perspective or experience do you bring that most applicants don't have?"
          value={formData.uniquePerspective}
          onChange={(e) => setFormData(prev => ({ ...prev, uniquePerspective: e.target.value }))}
          rows={3}
        />
      </div>

      {/* What AOs Should Know */}
      <div className="space-y-2">
        <Label htmlFor="aoknow">What's Not in Your Application?</Label>
        <Textarea
          id="aoknow"
          placeholder="Is there anything important about you that doesn't show up elsewhere in your application?"
          value={formData.whatAOsShouldKnow}
          onChange={(e) => setFormData(prev => ({ ...prev, whatAOsShouldKnow: e.target.value }))}
          rows={3}
        />
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
          <Button type="submit">Continue</Button>
        </div>
      </div>
    </form>
  );
}
