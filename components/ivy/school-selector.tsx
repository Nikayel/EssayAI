'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Ivy League schools data for UI
const IVY_SCHOOLS = [
  {
    id: 'harvard',
    name: 'Harvard',
    fullName: 'Harvard University',
    location: 'Cambridge, MA',
    color: '#A51C30',
    acceptanceRate: '3.2%',
  },
  {
    id: 'yale',
    name: 'Yale',
    fullName: 'Yale University',
    location: 'New Haven, CT',
    color: '#00356B',
    acceptanceRate: '3.7%',
  },
  {
    id: 'princeton',
    name: 'Princeton',
    fullName: 'Princeton University',
    location: 'Princeton, NJ',
    color: '#E77500',
    acceptanceRate: '4.4%',
  },
  {
    id: 'columbia',
    name: 'Columbia',
    fullName: 'Columbia University',
    location: 'New York, NY',
    color: '#B9D9EB',
    acceptanceRate: '3.9%',
  },
  {
    id: 'brown',
    name: 'Brown',
    fullName: 'Brown University',
    location: 'Providence, RI',
    color: '#4E3629',
    acceptanceRate: '5.1%',
  },
  {
    id: 'dartmouth',
    name: 'Dartmouth',
    fullName: 'Dartmouth College',
    location: 'Hanover, NH',
    color: '#00693E',
    acceptanceRate: '5.4%',
  },
  {
    id: 'cornell',
    name: 'Cornell',
    fullName: 'Cornell University',
    location: 'Ithaca, NY',
    color: '#B31B1B',
    acceptanceRate: '7.9%',
  },
  {
    id: 'upenn',
    name: 'Penn',
    fullName: 'University of Pennsylvania',
    location: 'Philadelphia, PA',
    color: '#011F5B',
    acceptanceRate: '5.8%',
  },
] as const;

interface SchoolSelectorProps {
  selectedSchool: string | null;
  onSelect: (schoolId: string) => void;
  disabled?: boolean;
  mode?: 'single' | 'multi';
  selectedSchools?: string[];
  onMultiSelect?: (schoolIds: string[]) => void;
}

export function IvySchoolSelector({
  selectedSchool,
  onSelect,
  disabled = false,
  mode = 'single',
  selectedSchools = [],
  onMultiSelect,
}: SchoolSelectorProps) {
  const handleClick = (schoolId: string) => {
    if (disabled) return;

    if (mode === 'single') {
      onSelect(schoolId);
    } else if (onMultiSelect) {
      const newSelection = selectedSchools.includes(schoolId)
        ? selectedSchools.filter(id => id !== schoolId)
        : [...selectedSchools, schoolId];
      onMultiSelect(newSelection);
    }
  };

  const isSelected = (schoolId: string) => {
    return mode === 'single'
      ? selectedSchool === schoolId
      : selectedSchools.includes(schoolId);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Select Your Target School</h3>
        {mode === 'multi' && (
          <span className="text-sm text-muted-foreground">
            {selectedSchools.length} selected
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {IVY_SCHOOLS.map((school) => (
          <button
            key={school.id}
            onClick={() => handleClick(school.id)}
            disabled={disabled}
            className={cn(
              'relative p-4 rounded-lg border-2 transition-all text-left',
              'hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2',
              isSelected(school.id)
                ? 'border-primary bg-primary/5 ring-2 ring-primary'
                : 'border-border hover:border-primary/50',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {/* School color accent */}
            <div
              className="absolute top-0 left-0 right-0 h-1 rounded-t-lg"
              style={{ backgroundColor: school.color }}
            />

            <div className="pt-1">
              <p className="font-semibold">{school.name}</p>
              <p className="text-xs text-muted-foreground">{school.location}</p>
              <p className="text-xs mt-1 font-medium" style={{ color: school.color }}>
                {school.acceptanceRate} acceptance
              </p>
            </div>

            {isSelected(school.id) && (
              <div className="absolute top-2 right-2">
                <svg
                  className="w-5 h-5 text-primary"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// Compact version for inline use
interface CompactSelectorProps {
  value: string;
  onChange: (schoolId: string) => void;
  disabled?: boolean;
}

export function IvySchoolSelect({ value, onChange, disabled }: CompactSelectorProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={cn(
        'w-full px-3 py-2 rounded-md border border-input bg-background',
        'focus:outline-none focus:ring-2 focus:ring-primary',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <option value="">Select an Ivy League school...</option>
      {IVY_SCHOOLS.map((school) => (
        <option key={school.id} value={school.id}>
          {school.fullName}
        </option>
      ))}
    </select>
  );
}

// School badge component
interface SchoolBadgeProps {
  schoolId: string;
  size?: 'sm' | 'md' | 'lg';
}

export function IvySchoolBadge({ schoolId, size = 'md' }: SchoolBadgeProps) {
  const school = IVY_SCHOOLS.find(s => s.id === schoolId);
  if (!school) return null;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium text-white',
        sizeClasses[size]
      )}
      style={{ backgroundColor: school.color }}
    >
      {school.name}
    </span>
  );
}

// School info card
interface SchoolInfoCardProps {
  schoolId: string;
}

export function IvySchoolInfoCard({ schoolId }: SchoolInfoCardProps) {
  const school = IVY_SCHOOLS.find(s => s.id === schoolId);
  if (!school) return null;

  return (
    <Card className="p-4">
      <div className="flex items-start gap-4">
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
          style={{ backgroundColor: school.color }}
        >
          {school.name[0]}
        </div>
        <div>
          <h4 className="font-semibold">{school.fullName}</h4>
          <p className="text-sm text-muted-foreground">{school.location}</p>
          <p className="text-sm mt-1">
            <span className="font-medium">{school.acceptanceRate}</span> acceptance rate
          </p>
        </div>
      </div>
    </Card>
  );
}

export { IVY_SCHOOLS };
