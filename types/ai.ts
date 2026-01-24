/**
 * Core type definitions for AI analysis and scoring
 */

export type EssayType = 'personal_statement' | 'why_us' | 'supplemental' | 'activity' | 'other';

export interface ScoreDimension {
  score: number; // 0-6
  rationales: string[];
}

export interface CommonsCheckFlag {
  flag: boolean;
  evidence?: string[];
  phrases?: string[];
  notes?: string;
}

export interface CommonsCheck {
  about_applicant: CommonsCheckFlag;
  jargon_overuse: CommonsCheckFlag;
  goals_articulated: CommonsCheckFlag;
  school_alignment: CommonsCheckFlag;
  buzzwords_cliches: CommonsCheckFlag;
  genericness: CommonsCheckFlag;
  /** Renamed from trauma_without_reflection for more sensitive framing */
  reflection_depth_needed: CommonsCheckFlag;
  exaggeration: CommonsCheckFlag;
  tone_drift: CommonsCheckFlag;
  ethics_risks: CommonsCheckFlag;
}

export interface SuggestionFix {
  issue: string;
  why_it_matters: string;
  example_edit: string;
}

export interface SentenceLevelEdit {
  from: string;
  to: string;
}

export interface Suggestions {
  top5: SuggestionFix[];
  outline_fix: string[];
  sentence_level: SentenceLevelEdit[];
}

export interface AnalysisResponse {
  meta: {
    essay_type: EssayType;
    word_count: number;
    prompt: string;
    school: string;
    /** Prompt version for tracking/debugging */
    prompt_version?: string;
  };
  scores: {
    authenticity: ScoreDimension;
    reflection: ScoreDimension;
    structure: ScoreDimension;
    specificity_fit: ScoreDimension;
    clarity_style: ScoreDimension;
    mechanics: ScoreDimension;
    /** "So What?" test - does essay reveal something meaningful? (10%) */
    uniqueness: ScoreDimension;
    /** Ethical considerations and red flags (5%) */
    ethics: ScoreDimension;
  };
  /** Score anchor explanations for user understanding */
  score_anchors?: {
    [score: number]: {
      label: string;
      userFriendly: string;
    };
  };
  commons_check: CommonsCheck;
  suggestions: Suggestions;
  overall: {
    score_100: number;
    summary: string;
    next_actions_checklist: string[];
  };
}

export interface ParagraphRewrite {
  goal: 'tighten_intro' | 'show_specificity' | 'clarify_goals' | 'tone' | 'structure' | 'voice';
  paragraph_original: string;
  paragraph_rewrite: string;
  note_on_voice: string;
}

export interface RewriteResponse {
  rewrites: ParagraphRewrite[];
}

export interface SchoolFitAlignment {
  tags: Array<'course_match' | 'location_reason' | 'faculty_reference' | 'mission_link'>;
  evidence: string[];
}

export interface ToneComparisonResult {
  similarity_score: number; // 0-1, cosine similarity
  drift_detected: boolean;
  notes: string;
}
