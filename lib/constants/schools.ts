// Centralized school data - single source of truth
export const IVY_SCHOOLS = [
  'Harvard', 'Yale', 'Princeton', 'Columbia',
  'UPenn', 'Dartmouth', 'Brown', 'Cornell',
] as const;

export const IVY_DEADLINES_2024_25 = {
  Harvard: { ed: '2024-11-01', rd: '2025-01-01' },
  Yale: { ed: '2024-11-01', rd: '2025-01-02' },
  Princeton: { ed: '2024-11-01', rd: '2025-01-01' },
  Columbia: { ed: '2024-11-01', rd: '2025-01-01' },
  UPenn: { ed: '2024-11-01', rd: '2025-01-05' },
  Dartmouth: { ed: '2024-11-01', rd: '2025-01-02' },
  Brown: { ed: '2024-11-01', rd: '2025-01-05' },
  Cornell: { ed: '2024-11-01', rd: '2025-01-02' },
} as const;

export const DEADLINE_TYPES = [
  { value: 'EARLY_DECISION', label: 'Early Decision (Binding)' },
  { value: 'EARLY_ACTION', label: 'Early Action' },
  { value: 'RESTRICTIVE_EA', label: 'Restrictive Early Action' },
  { value: 'REGULAR_DECISION', label: 'Regular Decision' },
  { value: 'ROLLING', label: 'Rolling Admissions' },
] as const;

export const GRADUATION_YEARS = [2025, 2026, 2027, 2028] as const;
