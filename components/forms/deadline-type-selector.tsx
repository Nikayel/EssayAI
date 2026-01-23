'use client';

import { DEADLINE_TYPES } from '@/lib/constants/schools';

interface DeadlineTypeSelectorProps {
  value: string;
  onChange: (type: string) => void;
}

export function DeadlineTypeSelector({ value, onChange }: DeadlineTypeSelectorProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border rounded-md"
    >
      {DEADLINE_TYPES.map(type => (
        <option key={type.value} value={type.value}>
          {type.label}
        </option>
      ))}
    </select>
  );
}
