'use client';

/**
 * Academic Step
 * Collects academic interests and intellectual passions
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import type { StudentIntake } from '@/lib/scoring';

interface AcademicStepProps {
  initialData?: StudentIntake['academic'];
  onComplete: (data: StudentIntake['academic']) => void;
  onBack: () => void;
  onSkip: () => void;
}

const SUGGESTED_INTERESTS = [
  'STEM', 'Humanities', 'Social Sciences', 'Arts', 'Business',
  'Medicine/Health', 'Law/Policy', 'Engineering', 'Computer Science',
  'Environmental Studies', 'Psychology', 'Economics', 'Philosophy',
];

export function AcademicStep({ initialData, onComplete, onBack, onSkip }: AcademicStepProps) {
  const [formData, setFormData] = useState({
    intendedMajor: initialData?.intendedMajor || '',
    academicInterests: initialData?.academicInterests || [],
    intellectualPassion: initialData?.intellectualPassion || '',
    hasResearchExperience: initialData?.researchExperience?.hasExperience || false,
    researchDescription: initialData?.researchExperience?.description || '',
  });

  const [interestInput, setInterestInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete({
      intendedMajor: formData.intendedMajor,
      academicInterests: formData.academicInterests,
      intellectualPassion: formData.intellectualPassion,
      researchExperience: formData.hasResearchExperience ? {
        hasExperience: true,
        description: formData.researchDescription,
      } : undefined,
    });
  };

  const addInterest = (interest: string) => {
    if (interest && !formData.academicInterests.includes(interest)) {
      setFormData(prev => ({
        ...prev,
        academicInterests: [...prev.academicInterests, interest],
      }));
    }
    setInterestInput('');
  };

  const removeInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      academicInterests: prev.academicInterests.filter(i => i !== interest),
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Intended Major */}
      <div className="space-y-2">
        <Label htmlFor="intendedMajor">Intended Major</Label>
        <Input
          id="intendedMajor"
          placeholder="e.g., Computer Science, Undecided"
          value={formData.intendedMajor}
          onChange={(e) => setFormData(prev => ({ ...prev, intendedMajor: e.target.value }))}
        />
      </div>

      {/* Academic Interests */}
      <div className="space-y-2">
        <Label>Academic Interests</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Add an interest..."
            value={interestInput}
            onChange={(e) => setInterestInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addInterest(interestInput);
              }
            }}
          />
          <Button type="button" onClick={() => addInterest(interestInput)}>
            Add
          </Button>
        </div>

        {/* Suggested interests */}
        <div className="flex flex-wrap gap-2 mt-2">
          {SUGGESTED_INTERESTS.filter(i => !formData.academicInterests.includes(i)).slice(0, 6).map(interest => (
            <Badge
              key={interest}
              variant="outline"
              className="cursor-pointer hover:bg-muted"
              onClick={() => addInterest(interest)}
            >
              + {interest}
            </Badge>
          ))}
        </div>

        {/* Selected interests */}
        {formData.academicInterests.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {formData.academicInterests.map(interest => (
              <Badge key={interest} variant="secondary">
                {interest}
                <X
                  className="ml-1 h-3 w-3 cursor-pointer"
                  onClick={() => removeInterest(interest)}
                />
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Intellectual Passion */}
      <div className="space-y-2">
        <Label htmlFor="intellectualPassion">
          What keeps you up at night? (intellectually)
        </Label>
        <Textarea
          id="intellectualPassion"
          placeholder="What question, problem, or topic are you genuinely obsessed with?"
          value={formData.intellectualPassion}
          onChange={(e) => setFormData(prev => ({ ...prev, intellectualPassion: e.target.value }))}
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          This helps us understand your intellectual curiosity beyond just your major
        </p>
      </div>

      {/* Research Experience */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="hasResearch"
            checked={formData.hasResearchExperience}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasResearchExperience: !!checked }))}
          />
          <Label htmlFor="hasResearch" className="cursor-pointer">
            I have research experience
          </Label>
        </div>

        {formData.hasResearchExperience && (
          <Textarea
            placeholder="Briefly describe your research..."
            value={formData.researchDescription}
            onChange={(e) => setFormData(prev => ({ ...prev, researchDescription: e.target.value }))}
            rows={2}
          />
        )}
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
