/**
 * School Constants
 * Uses centralized config system for dynamic values
 *
 * IMPORTANT: Do NOT hardcode years, dates, or rates here.
 * Use the config system which auto-calculates based on current date.
 */

import {
  getIvyLeagueSchools,
  getGraduationYears,
  getCurrentCycle,
  getSchoolDeadline,
  IVY_LEAGUE_DISPLAY_NAMES,
} from '@/lib/config';

// =============================================================================
// IVY LEAGUE SCHOOLS (Static - these don't change)
// =============================================================================

export const IVY_SCHOOLS = getIvyLeagueSchools();

export type IvySchool = (typeof IVY_SCHOOLS)[number];

// =============================================================================
// DYNAMIC VALUES (Auto-calculated from config)
// =============================================================================

/**
 * Get current graduation years for intake forms
 * Auto-updates based on current date
 */
export function getValidGraduationYears(): number[] {
  return getGraduationYears();
}

/**
 * Get deadlines for current admissions cycle
 * Auto-calculates based on current date
 */
export function getIvyDeadlines(): Record<string, { ed: string; rd: string }> {
  const schools = getIvyLeagueSchools();
  const deadlines: Record<string, { ed: string; rd: string }> = {};

  for (const school of schools) {
    const ed = getSchoolDeadline(school, 'earlyDecision');
    const rd = getSchoolDeadline(school, 'regularDecision');

    if (ed && rd) {
      deadlines[school] = { ed, rd };
    }
  }

  return deadlines;
}

/**
 * Get current admissions cycle string
 */
export function getAdmissionsCycle(): string {
  return getCurrentCycle();
}

// =============================================================================
// STATIC VALUES (These don't change)
// =============================================================================

export const DEADLINE_TYPES = [
  { value: 'EARLY_DECISION', label: 'Early Decision (Binding)' },
  { value: 'EARLY_ACTION', label: 'Early Action' },
  { value: 'RESTRICTIVE_EA', label: 'Restrictive Early Action' },
  { value: 'REGULAR_DECISION', label: 'Regular Decision' },
  { value: 'ROLLING', label: 'Rolling Admissions' },
] as const;

export type DeadlineType = (typeof DEADLINE_TYPES)[number]['value'];

// =============================================================================
// DISPLAY HELPERS
// =============================================================================

/**
 * Get display name for a school
 */
export function getSchoolDisplayName(schoolId: string): string {
  const normalized = schoolId.toLowerCase() as keyof typeof IVY_LEAGUE_DISPLAY_NAMES;
  return IVY_LEAGUE_DISPLAY_NAMES[normalized] ?? schoolId;
}

/**
 * Get all schools with display names
 */
export function getSchoolsWithNames(): Array<{ id: string; name: string }> {
  return IVY_SCHOOLS.map(id => ({
    id,
    name: getSchoolDisplayName(id),
  }));
}

// =============================================================================
// BACKWARDS COMPATIBILITY
// These are deprecated - use the functions above instead
// =============================================================================

/** @deprecated Use getValidGraduationYears() instead */
export const GRADUATION_YEARS = getGraduationYears();

/** @deprecated Use getIvyDeadlines() instead */
export const IVY_DEADLINES_2024_25 = getIvyDeadlines();
