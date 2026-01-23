'use client';

/**
 * Essay Context Step
 * Collects information about the specific essay being analyzed
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { StudentIntake } from '@/lib/scoring';

// =============================================================================
// TYPES
// =============================================================================

interface EssayContextStepProps {
  initialData?: StudentIntake['essayContext'];
  targetSchool?: string;
  onComplete: (data: StudentIntake['essayContext']) => void;
  onBack: () => void;
  isFirst?: boolean;
}

const SCHOOLS = [
  { id: 'harvard', name: 'Harvard University' },
  { id: 'yale', name: 'Yale University' },
  { id: 'princeton', name: 'Princeton University' },
  { id: 'columbia', name: 'Columbia University' },
  { id: 'brown', name: 'Brown University' },
  { id: 'dartmouth', name: 'Dartmouth College' },
  { id: 'cornell', name: 'Cornell University' },
  { id: 'upenn', name: 'University of Pennsylvania' },
  { id: 'mit', name: 'MIT' },
  { id: 'stanford', name: 'Stanford University' },
  { id: 'other', name: 'Other School' },
];

const ESSAY_TYPES = [
  { id: 'personal_statement', name: 'Personal Statement (Common App)' },
  { id: 'why_us', name: 'Why This School' },
  { id: 'supplemental', name: 'Supplemental Essay' },
  { id: 'activity', name: 'Activity/Extracurricular' },
  { id: 'diversity', name: 'Diversity Essay' },
  { id: 'community', name: 'Community Essay' },
  { id: 'intellectual', name: 'Intellectual Curiosity' },
  { id: 'short_answer', name: 'Short Answer' },
];

const CONCERNS = [
  { id: 'too_generic', name: 'Too generic / not personal enough' },
  { id: 'not_enough_depth', name: 'Lacks depth / surface-level' },
  { id: 'wrong_tone', name: 'Tone doesn\'t feel right' },
  { id: 'school_fit', name: 'Not sure if it fits the school' },
  { id: 'grammar', name: 'Grammar and mechanics' },
  { id: 'structure', name: 'Structure and flow' },
  { id: 'other', name: 'Other' },
];

// =============================================================================
// COMPONENT
// =============================================================================

export function EssayContextStep({
  initialData,
  targetSchool,
  onComplete,
  onBack,
  isFirst,
}: EssayContextStepProps) {
  const [formData, setFormData] = useState({
    targetSchool: initialData?.targetSchool || targetSchool || '',
    essayType: initialData?.essayType || 'personal_statement',
    essayPrompt: initialData?.essayPrompt || '',
    wordLimit: initialData?.wordLimit || 650,
    biggestConcern: initialData?.biggestConcern || 'too_generic',
    draftNumber: initialData?.draftNumber || 'first',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onComplete({
      targetSchool: formData.targetSchool,
      essayType: formData.essayType as StudentIntake['essayContext']['essayType'],
      essayPrompt: formData.essayPrompt,
      wordLimit: formData.wordLimit,
      biggestConcern: formData.biggestConcern as StudentIntake['essayContext']['biggestConcern'],
      draftNumber: formData.draftNumber as StudentIntake['essayContext']['draftNumber'],
      previousFeedback: undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Target School */}
      <div className="space-y-2">
        <Label htmlFor="targetSchool">Target School *</Label>
        <Select
          value={formData.targetSchool}
          onValueChange={(value) => setFormData(prev => ({ ...prev, targetSchool: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a school" />
          </SelectTrigger>
          <SelectContent>
            {SCHOOLS.map(school => (
              <SelectItem key={school.id} value={school.id}>
                {school.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          We'll tailor feedback to this school's specific values and culture
        </p>
      </div>

      {/* Essay Type */}
      <div className="space-y-2">
        <Label htmlFor="essayType">Essay Type *</Label>
        <Select
          value={formData.essayType}
          onValueChange={(value) => setFormData(prev => ({ ...prev, essayType: value as StudentIntake['essayContext']['essayType'] }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select essay type" />
          </SelectTrigger>
          <SelectContent>
            {ESSAY_TYPES.map(type => (
              <SelectItem key={type.id} value={type.id}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Essay Prompt */}
      <div className="space-y-2">
        <Label htmlFor="essayPrompt">Essay Prompt (optional)</Label>
        <Textarea
          id="essayPrompt"
          placeholder="Paste the essay prompt here..."
          value={formData.essayPrompt}
          onChange={(e) => setFormData(prev => ({ ...prev, essayPrompt: e.target.value }))}
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          Providing the prompt helps us check if you're answering the question
        </p>
      </div>

      {/* Word Limit */}
      <div className="space-y-2">
        <Label htmlFor="wordLimit">Word Limit</Label>
        <Input
          id="wordLimit"
          type="number"
          min={50}
          max={5000}
          value={formData.wordLimit}
          onChange={(e) => setFormData(prev => ({ ...prev, wordLimit: parseInt(e.target.value) || 650 }))}
        />
      </div>

      {/* Draft Number */}
      <div className="space-y-2">
        <Label htmlFor="draftNumber">Which Draft Is This?</Label>
        <Select
          value={formData.draftNumber}
          onValueChange={(value) => setFormData(prev => ({ ...prev, draftNumber: value as StudentIntake['essayContext']['draftNumber'] }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select draft number" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="first">First draft</SelectItem>
            <SelectItem value="second">Second draft</SelectItem>
            <SelectItem value="third_plus">Third or later</SelectItem>
            <SelectItem value="final">Final version</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          We adjust feedback intensity based on where you are in the process
        </p>
      </div>

      {/* Biggest Concern */}
      <div className="space-y-2">
        <Label htmlFor="biggestConcern">What's Your Biggest Concern?</Label>
        <Select
          value={formData.biggestConcern}
          onValueChange={(value) => setFormData(prev => ({ ...prev, biggestConcern: value as StudentIntake['essayContext']['biggestConcern'] }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select your main concern" />
          </SelectTrigger>
          <SelectContent>
            {CONCERNS.map(concern => (
              <SelectItem key={concern.id} value={concern.id}>
                {concern.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          We'll prioritize feedback on this area
        </p>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        {!isFirst && (
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
        )}
        <Button type="submit" className={isFirst ? 'ml-auto' : ''}>
          Continue
        </Button>
      </div>
    </form>
  );
}
