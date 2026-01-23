'use client';

/**
 * Demographics Step
 * Collects background information for calibrated scoring
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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

interface DemographicsStepProps {
  initialData?: StudentIntake['demographics'];
  onComplete: (data: StudentIntake['demographics']) => void;
  onBack: () => void;
  onSkip: () => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function DemographicsStep({
  initialData,
  onComplete,
  onBack,
  onSkip,
}: DemographicsStepProps) {
  const [formData, setFormData] = useState({
    isFirstGen: initialData?.isFirstGen || false,
    familyEducationLevel: initialData?.familyEducationLevel || '',
    householdIncome: initialData?.householdIncome || '',
    isInternational: initialData?.isInternational || false,
    geographicContext: initialData?.geographicContext || '',
    schoolType: initialData?.schoolType || '',
    familyResponsibilities: initialData?.familyResponsibilities || [],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onComplete({
      isFirstGen: formData.isFirstGen,
      familyEducationLevel: (formData.familyEducationLevel || 'bachelors') as StudentIntake['demographics']['familyEducationLevel'],
      householdIncome: formData.householdIncome as StudentIntake['demographics']['householdIncome'],
      isInternational: formData.isInternational,
      geographicContext: (formData.geographicContext || 'suburban') as StudentIntake['demographics']['geographicContext'],
      schoolType: (formData.schoolType || 'public') as StudentIntake['demographics']['schoolType'],
      familyResponsibilities: formData.familyResponsibilities as StudentIntake['demographics']['familyResponsibilities'],
    });
  };

  const toggleResponsibility = (responsibility: string) => {
    setFormData(prev => ({
      ...prev,
      familyResponsibilities: prev.familyResponsibilities.includes(responsibility as any)
        ? prev.familyResponsibilities.filter(r => r !== responsibility)
        : [...prev.familyResponsibilities, responsibility as any],
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className="text-sm text-muted-foreground">
        This information helps us calibrate our feedback. First-gen students, for example,
        may not have the same access to college counseling, and we adjust accordingly.
        <strong> All fields are optional.</strong>
      </p>

      {/* First Generation */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="isFirstGen"
          checked={formData.isFirstGen}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isFirstGen: !!checked }))}
        />
        <Label htmlFor="isFirstGen" className="cursor-pointer">
          I am a first-generation college student
        </Label>
      </div>

      {/* Family Education Level */}
      <div className="space-y-2">
        <Label>Highest Education in Immediate Family</Label>
        <Select
          value={formData.familyEducationLevel}
          onValueChange={(value) => setFormData(prev => ({ ...prev, familyEducationLevel: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="no_college">No college</SelectItem>
            <SelectItem value="some_college">Some college</SelectItem>
            <SelectItem value="bachelors">Bachelor's degree</SelectItem>
            <SelectItem value="graduate">Graduate/Professional degree</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* International Status */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="isInternational"
          checked={formData.isInternational}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isInternational: !!checked }))}
        />
        <Label htmlFor="isInternational" className="cursor-pointer">
          I am an international student
        </Label>
      </div>

      {/* Geographic Context */}
      <div className="space-y-2">
        <Label>Geographic Context</Label>
        <Select
          value={formData.geographicContext}
          onValueChange={(value) => setFormData(prev => ({ ...prev, geographicContext: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rural">Rural</SelectItem>
            <SelectItem value="suburban">Suburban</SelectItem>
            <SelectItem value="urban">Urban</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* School Type */}
      <div className="space-y-2">
        <Label>High School Type</Label>
        <Select
          value={formData.schoolType}
          onValueChange={(value) => setFormData(prev => ({ ...prev, schoolType: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="public">Public</SelectItem>
            <SelectItem value="private">Private</SelectItem>
            <SelectItem value="charter">Charter</SelectItem>
            <SelectItem value="magnet">Magnet</SelectItem>
            <SelectItem value="homeschool">Homeschool</SelectItem>
            <SelectItem value="international">International</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Family Responsibilities */}
      <div className="space-y-3">
        <Label>Family Responsibilities (select all that apply)</Label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: 'caregiving', label: 'Caregiving for family member' },
            { id: 'work_to_support', label: 'Work to support family' },
            { id: 'sibling_care', label: 'Sibling care' },
            { id: 'translation', label: 'Translation/interpretation' },
          ].map(item => (
            <div key={item.id} className="flex items-center space-x-2">
              <Checkbox
                id={item.id}
                checked={formData.familyResponsibilities.includes(item.id as any)}
                onCheckedChange={() => toggleResponsibility(item.id)}
              />
              <Label htmlFor={item.id} className="cursor-pointer text-sm">
                {item.label}
              </Label>
            </div>
          ))}
        </div>
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
            Continue
          </Button>
        </div>
      </div>
    </form>
  );
}
