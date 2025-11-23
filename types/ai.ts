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
  trauma_without_reflection: CommonsCheckFlag;
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
  };
  scores: {
    authenticity: ScoreDimension;
    reflection: ScoreDimension;
    structure: ScoreDimension;
    specificity_fit: ScoreDimension;
    clarity_style: ScoreDimension;
    mechanics: ScoreDimension;
    ethics_originality: ScoreDimension;
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
