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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {IVY_SCHOOLS.map(school => (
            <button
              key={school}
              type="button"
              onClick={() => onChange(school)}
              className={`p-3 sm:p-2 rounded-lg border text-sm font-medium transition-all ${
                value === school
                  ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300'
                  : 'border-neutral-200 hover:border-neutral-300 dark:border-neutral-700 dark:hover:border-neutral-600'
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
