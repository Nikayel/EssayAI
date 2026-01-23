'use client';

/**
 * Activities Step
 * Collects spike/narrative and key activities
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import type { StudentIntake, Activity } from '@/lib/scoring';

interface ActivitiesStepProps {
  initialData?: StudentIntake['activities'];
  onComplete: (data: StudentIntake['activities']) => void;
  onBack: () => void;
  onSkip: () => void;
}

const EMPTY_ACTIVITY: Activity = {
  name: '',
  role: '',
  hoursPerWeek: 0,
  weeksPerYear: 0,
  yearsInvolved: 0,
  impact: '',
};

export function ActivitiesStep({ initialData, onComplete, onBack, onSkip }: ActivitiesStepProps) {
  const [formData, setFormData] = useState({
    spike: initialData?.spike || '',
    topActivities: initialData?.topActivities?.length ? initialData.topActivities : [{ ...EMPTY_ACTIVITY }],
    leadershipRoles: initialData?.leadershipRoles || [],
    summerExperiences: initialData?.summerExperiences || '',
  });

  const [leadershipInput, setLeadershipInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete({
      spike: formData.spike,
      topActivities: formData.topActivities.filter(a => a.name),
      leadershipRoles: formData.leadershipRoles,
      summerExperiences: formData.summerExperiences,
    });
  };

  const updateActivity = (index: number, field: keyof Activity, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      topActivities: prev.topActivities.map((a, i) =>
        i === index ? { ...a, [field]: value } : a
      ),
    }));
  };

  const addActivity = () => {
    if (formData.topActivities.length < 5) {
      setFormData(prev => ({
        ...prev,
        topActivities: [...prev.topActivities, { ...EMPTY_ACTIVITY }],
      }));
    }
  };

  const removeActivity = (index: number) => {
    setFormData(prev => ({
      ...prev,
      topActivities: prev.topActivities.filter((_, i) => i !== index),
    }));
  };

  const addLeadership = () => {
    if (leadershipInput && !formData.leadershipRoles.includes(leadershipInput)) {
      setFormData(prev => ({
        ...prev,
        leadershipRoles: [...prev.leadershipRoles, leadershipInput],
      }));
      setLeadershipInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Spike / Main Narrative */}
      <div className="space-y-2">
        <Label htmlFor="spike">Your "Spike" / Main Narrative</Label>
        <Textarea
          id="spike"
          placeholder="What's the central theme that ties your application together? e.g., 'Using technology to improve healthcare access in rural communities'"
          value={formData.spike}
          onChange={(e) => setFormData(prev => ({ ...prev, spike: e.target.value }))}
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          This is the main story you want admissions officers to remember about you
        </p>
      </div>

      {/* Top Activities */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Top Activities (up to 5)</Label>
          {formData.topActivities.length < 5 && (
            <Button type="button" variant="outline" size="sm" onClick={addActivity}>
              <Plus className="h-4 w-4 mr-1" /> Add Activity
            </Button>
          )}
        </div>

        {formData.topActivities.map((activity, index) => (
          <Card key={index} className="p-4 space-y-3">
            <div className="flex items-start justify-between">
              <span className="text-sm font-medium">Activity {index + 1}</span>
              {formData.topActivities.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeActivity(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Input
                  placeholder="Activity name"
                  value={activity.name}
                  onChange={(e) => updateActivity(index, 'name', e.target.value)}
                />
              </div>
              <Input
                placeholder="Your role"
                value={activity.role}
                onChange={(e) => updateActivity(index, 'role', e.target.value)}
              />
              <Input
                placeholder="Years involved"
                type="number"
                min={1}
                max={6}
                value={activity.yearsInvolved || ''}
                onChange={(e) => updateActivity(index, 'yearsInvolved', parseInt(e.target.value) || 0)}
              />
            </div>

            <Textarea
              placeholder="Brief description of your impact (optional)"
              value={activity.impact}
              onChange={(e) => updateActivity(index, 'impact', e.target.value)}
              rows={2}
            />
          </Card>
        ))}
      </div>

      {/* Leadership Roles */}
      <div className="space-y-2">
        <Label>Leadership Positions</Label>
        <div className="flex gap-2">
          <Input
            placeholder="e.g., Club President, Team Captain"
            value={leadershipInput}
            onChange={(e) => setLeadershipInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addLeadership();
              }
            }}
          />
          <Button type="button" onClick={addLeadership}>
            Add
          </Button>
        </div>
        {formData.leadershipRoles.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.leadershipRoles.map((role, i) => (
              <span
                key={i}
                className="px-2 py-1 bg-muted rounded text-sm flex items-center gap-1"
              >
                {role}
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    leadershipRoles: prev.leadershipRoles.filter((_, j) => j !== i),
                  }))}
                  className="hover:text-destructive"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Summer Experiences */}
      <div className="space-y-2">
        <Label htmlFor="summer">Notable Summer Experiences</Label>
        <Textarea
          id="summer"
          placeholder="How do you spend your summers? (programs, work, projects, travel)"
          value={formData.summerExperiences}
          onChange={(e) => setFormData(prev => ({ ...prev, summerExperiences: e.target.value }))}
          rows={2}
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
