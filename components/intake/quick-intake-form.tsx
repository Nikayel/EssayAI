'use client';

/**
 * Quick Intake Form ($9.99 tier)
 *
 * Streamlined 1-2 step form to collect context BEFORE payment.
 * This makes the $9.99 tier feel personalized and increases conversion.
 *
 * Collects:
 * - Target school + essay type (required)
 * - Spike/main angle (recommended - makes feedback personalized)
 * - Top activities (recommended - detects resume-essay patterns)
 * - First-gen/international status (optional - adjusts feedback tone)
 * - Draft status (optional - adjusts feedback intensity)
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  Sparkles,
  Target,
  Users,
  Plus,
  X,
  Lightbulb,
  HelpCircle,
} from 'lucide-react';
import type { QuickIntake } from '@/lib/scoring/tiers/types';
import { cn } from '@/lib/utils/cn';

// =============================================================================
// TYPES
// =============================================================================

interface QuickIntakeFormProps {
  initialData?: Partial<QuickIntake>;
  targetSchool?: string;
  onComplete: (intake: QuickIntake) => void;
  onSkip?: () => void;
  className?: string;
}

const ESSAY_TYPES = [
  { value: 'personal_statement', label: 'Personal Statement (Common App)' },
  { value: 'why_school', label: '"Why This School?" Essay' },
  { value: 'supplemental', label: 'Supplemental Essay' },
  { value: 'diversity', label: 'Diversity / Background Essay' },
  { value: 'activity', label: 'Activity / Extracurricular Essay' },
  { value: 'intellectual', label: 'Intellectual Curiosity Essay' },
  { value: 'other', label: 'Other' },
];

const DRAFT_STATUS = [
  { value: 'first_draft', label: 'First draft - be honest with me' },
  { value: 'revised', label: 'Revised a few times' },
  { value: 'final_polish', label: 'Final polish - almost ready to submit' },
];

// =============================================================================
// COMPONENT
// =============================================================================

export function QuickIntakeForm({
  initialData,
  targetSchool,
  onComplete,
  onSkip,
  className,
}: QuickIntakeFormProps) {
  const [formData, setFormData] = useState<Partial<QuickIntake>>({
    targetSchool: targetSchool || initialData?.targetSchool || '',
    essayType: initialData?.essayType || 'personal_statement',
    spike: initialData?.spike || '',
    topActivities: initialData?.topActivities || [],
    draftStatus: initialData?.draftStatus || 'first_draft',
    isFirstGen: initialData?.isFirstGen || false,
    isInternational: initialData?.isInternational || false,
    wordLimit: initialData?.wordLimit || 650,
  });

  const [newActivity, setNewActivity] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const intake: QuickIntake = {
      targetSchool: formData.targetSchool || '',
      essayType: formData.essayType || 'personal_statement',
      spike: formData.spike,
      topActivities: formData.topActivities,
      draftStatus: formData.draftStatus,
      isFirstGen: formData.isFirstGen,
      isInternational: formData.isInternational,
      wordLimit: formData.wordLimit,
    };

    onComplete(intake);
  };

  const handleAddActivity = () => {
    if (newActivity.trim() && (formData.topActivities?.length || 0) < 3) {
      setFormData(prev => ({
        ...prev,
        topActivities: [...(prev.topActivities || []), newActivity.trim()],
      }));
      setNewActivity('');
    }
  };

  const handleRemoveActivity = (index: number) => {
    setFormData(prev => ({
      ...prev,
      topActivities: prev.topActivities?.filter((_, i) => i !== index),
    }));
  };

  const canSubmit = formData.targetSchool && formData.essayType;

  return (
    <Card className={cn('w-full max-w-xl', className)}>
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 rounded-lg bg-brand-100">
            <Target className="w-4 h-4 text-brand-600" />
          </div>
          <Badge variant="outline" className="text-xs">
            Makes feedback personalized
          </Badge>
        </div>
        <CardTitle>Tell Us About Your Essay</CardTitle>
        <CardDescription>
          This takes 30 seconds and helps us give you feedback that&apos;s actually useful.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Required: Target School + Essay Type */}
          <div className="grid gap-4">
            {!targetSchool && (
              <div className="space-y-2">
                <Label htmlFor="targetSchool">Target School</Label>
                <Input
                  id="targetSchool"
                  placeholder="e.g., Harvard, Yale, Stanford"
                  value={formData.targetSchool}
                  onChange={e => setFormData(prev => ({ ...prev, targetSchool: e.target.value }))}
                  required
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="essayType">Essay Type</Label>
              <Select
                value={formData.essayType}
                onValueChange={value => setFormData(prev => ({ ...prev, essayType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select essay type" />
                </SelectTrigger>
                <SelectContent>
                  {ESSAY_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Recommended: Spike (Main Angle) */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="spike">Your Main Angle / Spike</Label>
              <Badge variant="secondary" className="text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                Recommended
              </Badge>
            </div>
            <Textarea
              id="spike"
              placeholder="e.g., 'Environmental tech - I built an app that tracks local water quality and got it adopted by my city'"
              value={formData.spike || ''}
              onChange={e => setFormData(prev => ({ ...prev, spike: e.target.value }))}
              className="min-h-[80px]"
            />
            <p className="text-xs text-muted-foreground">
              We&apos;ll check if your essay connects to this theme. AOs want a cohesive narrative.
            </p>
          </div>

          {/* Recommended: Top Activities */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>Top 3 Activities</Label>
              <Badge variant="secondary" className="text-xs">
                <Users className="w-3 h-3 mr-1" />
                Helps us spot resume-essays
              </Badge>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="e.g., Founded coding club, State debate champion"
                value={newActivity}
                onChange={e => setNewActivity(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddActivity())}
                disabled={(formData.topActivities?.length || 0) >= 3}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleAddActivity}
                disabled={(formData.topActivities?.length || 0) >= 3}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {formData.topActivities && formData.topActivities.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.topActivities.map((activity, i) => (
                  <Badge key={i} variant="secondary" className="pr-1">
                    {activity}
                    <button
                      type="button"
                      onClick={() => handleRemoveActivity(i)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              We&apos;ll flag if your essay lists achievements instead of showing who you are.
            </p>
          </div>

          {/* Draft Status */}
          <div className="space-y-2">
            <Label htmlFor="draftStatus">Draft Status</Label>
            <Select
              value={formData.draftStatus}
              onValueChange={value => setFormData(prev => ({ ...prev, draftStatus: value as QuickIntake['draftStatus'] }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select draft status" />
              </SelectTrigger>
              <SelectContent>
                {DRAFT_STATUS.map(status => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Advanced Options (collapsed by default) */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <HelpCircle className="w-3 h-3" />
              {showAdvanced ? 'Hide' : 'Show'} background options
            </button>

            {showAdvanced && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg space-y-4">
                <p className="text-xs text-muted-foreground">
                  These help us calibrate feedback for your specific situation.
                </p>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isFirstGen"
                    checked={formData.isFirstGen}
                    onCheckedChange={checked => setFormData(prev => ({ ...prev, isFirstGen: !!checked }))}
                  />
                  <Label htmlFor="isFirstGen" className="text-sm font-normal">
                    I&apos;m a first-generation college student
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isInternational"
                    checked={formData.isInternational}
                    onCheckedChange={checked => setFormData(prev => ({ ...prev, isInternational: !!checked }))}
                  />
                  <Label htmlFor="isInternational" className="text-sm font-normal">
                    I&apos;m an international student
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wordLimit" className="text-sm">Word Limit</Label>
                  <Input
                    id="wordLimit"
                    type="number"
                    value={formData.wordLimit || 650}
                    onChange={e => setFormData(prev => ({ ...prev, wordLimit: parseInt(e.target.value) || 650 }))}
                    className="w-24"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit / Skip */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button type="submit" className="flex-1" disabled={!canSubmit}>
              Get Personalized Feedback
              <ArrowRight className="w-4 h-4" />
            </Button>
            {onSkip && (
              <Button type="button" variant="ghost" onClick={onSkip}>
                Skip for now
              </Button>
            )}
          </div>

          {/* Value Prop Reminder */}
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg">
            <Lightbulb className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-800">
              <strong>Why this matters:</strong> Generic feedback is useless. By knowing your spike and activities,
              we can tell you if your essay actually connects to YOUR story - not just generic advice.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default QuickIntakeForm;
