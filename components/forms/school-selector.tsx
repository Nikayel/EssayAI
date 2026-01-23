'use client';

import { IVY_SCHOOLS } from '@/lib/constants/schools';

interface SchoolSelectorProps {
  value: string;
  onChange: (school: string) => void;
  showIvyQuickSelect?: boolean;
}

export function SchoolSelector({ value, onChange, showIvyQuickSelect = true }: SchoolSelectorProps) {
  return (
    <div className="space-y-3">
      {showIvyQuickSelect && (
        <div className="grid grid-cols-4 gap-2">
          {IVY_SCHOOLS.map(school => (
            <button
              key={school}
              type="button"
              onClick={() => onChange(school)}
              className={`p-2 rounded-lg border text-sm font-medium transition-all ${
                value === school
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {school}
            </button>
          ))}
        </div>
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Or type school name..."
        className="w-full px-3 py-2 border rounded-md"
        list="schools-datalist"
      />
      <datalist id="schools-datalist">
        {IVY_SCHOOLS.map(s => <option key={s} value={s} />)}
      </datalist>
    </div>
  );
}
