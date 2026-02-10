/**
 * Tiered Analysis System
 * Orchestrates different analysis depths based on pricing tier
 *
 * Tiers:
 *   - Preview (FREE): Score + issue counts (blurred details) + upgrade teaser
 *   - Quick ($9.99): Score + 3-5 actionable items with blunt feedback
 *   - Standard ($79): Full line-by-line + school-specific + AO insights
 *   - Premium ($249): Standard + AI rewrites + human reviewer
 *
 * Ivy League Tiers (NEW - Jan 2026):
 *   - Ivy Single ($39): Complete analysis for ONE school - all essays as portfolio
 *   - Ivy Bundle 3 ($79): Same depth for 3 schools
 *   - Ivy Bundle 8 ($149): All 8 Ivies with cross-school analysis
 */

export * from './types';
export { runPreviewAnalysis } from './preview-analysis';
export { runQuickAnalysis } from './quick-analysis';
export { runStandardAnalysis } from './standard-analysis';
export { AO_INSIGHTS_BY_SCHOOL } from './ao-insights';

// Ivy League Analysis (NEW)
export {
  runIvySingleSchoolAnalysis,
  runIvyThreeSchoolAnalysis,
  runIvyAllSchoolsAnalysis,
  type IvySingleEssayAnalysis,
  type IvySchoolAnalysis,
  type IvyAnalysisResult,
} from './ivy-analysis';

import type {
  AnalysisTier,
  QuickIntake,
  FullIntake,
  PreviewAnalysisResult,
  QuickAnalysisResult,
  StandardAnalysisResult,
  PremiumAnalysisResult,
  TieredAnalysisOptions,
} from './types';
import { runPreviewAnalysis } from './preview-analysis';
import { runQuickAnalysis } from './quick-analysis';
import { runStandardAnalysis } from './standard-analysis';
import { getTierConfig } from '@/lib/config';
import { standardResultToAdminAnalysis } from '../rag-integration';

// =============================================================================
// UNIFIED ANALYSIS FUNCTION
// =============================================================================

export type AnalysisInput = {
  tier: 'preview' | 'quick';
  intake: QuickIntake;
} | {
  tier: 'standard' | 'premium';
  intake: FullIntake;
};

export type AnalysisResult<T extends AnalysisTier> =
  T extends 'preview' ? PreviewAnalysisResult :
  T extends 'quick' ? QuickAnalysisResult :
  T extends 'standard' ? StandardAnalysisResult :
  T extends 'premium' ? PremiumAnalysisResult :
  never;

/**
 * Run analysis based on tier
 * Automatically selects the appropriate analysis depth
 */
export async function runTieredAnalysis<T extends AnalysisTier>(
  essayText: string,
  tier: T,
  intake: T extends 'preview' | 'quick' ? QuickIntake : FullIntake,
  options: TieredAnalysisOptions = {}
): Promise<AnalysisResult<T>> {
  // Validate tier (preview doesn't need config check - it's always free)
  if (tier !== 'preview') {
    const tierConfig = getTierConfig(tier);
    if (!tierConfig) {
      throw new Error(`Invalid tier: ${tier}`);
    }
  }

  switch (tier) {
    case 'preview':
      return runPreviewAnalysis(essayText, intake as QuickIntake, options) as Promise<AnalysisResult<T>>;

    case 'quick':
      return runQuickAnalysis(essayText, intake as QuickIntake, options) as Promise<AnalysisResult<T>>;

    case 'standard': {
      const stdResult = await runStandardAnalysis(essayText, intake as FullIntake, options);
      // Attach admin_analysis for the admin/reviewer dashboard 3-tier view
      const stdAdmin = standardResultToAdminAnalysis(stdResult, essayText, intake as FullIntake);
      return { ...stdResult, admin_analysis: stdAdmin } as unknown as AnalysisResult<T>;
    }

    case 'premium': {
      // Premium includes standard + human review queue
      const standardResult = await runStandardAnalysis(essayText, intake as FullIntake, options);

      // Queue for human review if session ID provided
      let humanReview: PremiumAnalysisResult['humanReview'] = {
        status: 'queued',
        estimatedCompletion: new Date(Date.now() + 48 * 60 * 60 * 1000),
        message: 'Your essay has been queued for human expert review. You\'ll receive an email within 48 hours.',
      };

      if (options.sessionId) {
        try {
          const { queueForHumanReview } = await import('@/lib/reviews/assignment');
          const assignment = await queueForHumanReview(options.sessionId, {
            essay: essayText,
            intake: intake as FullIntake,
            aiAnalysis: standardResult,
            userEmail: options.userEmail || '',
          });

          humanReview = {
            status: assignment.status.toLowerCase() as any,
            assignedTo: assignment.reviewer?.name,
            credentials: assignment.reviewer?.credentials,
            estimatedCompletion: assignment.dueAt,
            message: assignment.reviewer
              ? `Assigned to ${assignment.reviewer.name} (${assignment.reviewer.credentials}). Review due within 48 hours.`
              : 'Your essay has been queued. A reviewer will be assigned shortly.',
          };
        } catch (error) {
          // Continue without human review if queue fails
          console.error('Failed to queue human review:', error);
        }
      }

      // Generate AI rewrite suggestions for top issues
      const rewriteSuggestions = await generateRewriteSuggestions(
        essayText,
        standardResult.allIssues.filter(i => i.bluntFeedback.severity === 'critical').slice(0, 3),
        intake as FullIntake
      );

      // Attach admin_analysis for the admin/reviewer dashboard 3-tier view
      const premAdmin = standardResultToAdminAnalysis(standardResult, essayText, intake as FullIntake);

      return {
        ...standardResult,
        tier: 'premium',
        rewriteSuggestions,
        humanReview,
        admin_analysis: premAdmin,
      } as unknown as AnalysisResult<T>;
    }

    default:
      throw new Error(`Unknown tier: ${tier}`);
  }
}

// =============================================================================
// PREMIUM-SPECIFIC: REWRITE SUGGESTIONS
// =============================================================================

import type { RewriteSuggestion, PrioritizedIssueWithFix } from './types';

async function generateRewriteSuggestions(
  essayText: string,
  topIssues: PrioritizedIssueWithFix[],
  intake: FullIntake
): Promise<RewriteSuggestion[]> {
  const suggestions: RewriteSuggestion[] = [];

  for (const issue of topIssues) {
    // Find the problematic section
    const location = findIssueLocation(essayText, issue);

    if (!location) continue;

    const original = essayText.slice(location.start, location.end);

    // Generate AI rewrite suggestion
    const suggestedRewrite = await generateAIRewrite(original, issue, intake);

    if (suggestedRewrite) {
      suggestions.push({
        issueId: `issue_${issue.rank}`,
        issue: issue.issue,
        location: {
          paragraphNumber: location.paragraphNumber,
          lineStart: location.lineStart,
          lineEnd: location.lineEnd,
        },
        original,
        suggestedRewrite,
        explanation: issue.bluntFeedback.fix,
      });
    }
  }

  return suggestions;
}

function findIssueLocation(
  essayText: string,
  issue: PrioritizedIssueWithFix
): { start: number; end: number; paragraphNumber: number; lineStart: number; lineEnd: number } | null {
  // Try to find by example text
  if (issue.exampleBefore) {
    const index = essayText.indexOf(issue.exampleBefore);
    if (index !== -1) {
      const beforeText = essayText.slice(0, index);
      const paragraphNumber = (beforeText.match(/\n\n/g) || []).length + 1;
      const lineStart = (beforeText.match(/\n/g) || []).length + 1;

      return {
        start: index,
        end: index + issue.exampleBefore.length,
        paragraphNumber,
        lineStart,
        lineEnd: lineStart + (issue.exampleBefore.match(/\n/g) || []).length,
      };
    }
  }

  // Try to find opening if that's the issue
  if (issue.issue.toLowerCase().includes('opening')) {
    const firstSentenceEnd = essayText.search(/[.!?]/);
    if (firstSentenceEnd !== -1) {
      return {
        start: 0,
        end: firstSentenceEnd + 1,
        paragraphNumber: 1,
        lineStart: 1,
        lineEnd: 1,
      };
    }
  }

  return null;
}

async function generateAIRewrite(
  original: string,
  issue: PrioritizedIssueWithFix,
  intake: FullIntake
): Promise<string | null> {
  // For now, return template-based suggestions
  // In production, this would call Claude for actual rewrites

  if (issue.issue.toLowerCase().includes('opening') || issue.issue.toLowerCase().includes('hook')) {
    // Suggest dialogue or action opening
    return `[Try starting with a specific moment, dialogue, or sensory detail instead of "${original.slice(0, 50)}..."]`;
  }

  if (issue.issue.toLowerCase().includes('cliche') || issue.issue.toLowerCase().includes('generic')) {
    return `[Replace "${original.slice(0, 30)}..." with something specific to your experience that only YOU could write]`;
  }

  if (issue.issue.toLowerCase().includes('reflection') || issue.issue.toLowerCase().includes('so what')) {
    return `[After this section, add 2-3 sentences explaining: What did you realize? How did this change you? Why does it matter?]`;
  }

  return null;
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Validate that intake has required fields for tier
 */
export function validateIntakeForTier(
  tier: AnalysisTier,
  intake: QuickIntake | FullIntake
): { valid: boolean; missingFields: string[] } {
  const missingFields: string[] = [];

  // Preview and Quick tier require minimal fields
  // Check both direct fields (QuickIntake) and nested fields (FullIntake)
  const targetSchool = (intake as any).targetSchool || (intake as any).essayContext?.targetSchool;
  const essayType = (intake as any).essayType || (intake as any).essayContext?.essayType;
  if (!targetSchool) missingFields.push('targetSchool');
  if (!essayType) missingFields.push('essayType');

  // Standard and Premium require full intake
  if (tier !== 'preview' && tier !== 'quick') {
    const fullIntake = intake as FullIntake;

    if (!fullIntake.essayContext?.targetSchool) missingFields.push('essayContext.targetSchool');
    if (!fullIntake.essayContext?.essayType) missingFields.push('essayContext.essayType');
    if (!fullIntake.essayContext?.essayPrompt) missingFields.push('essayContext.essayPrompt');
  }

  return {
    valid: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Get tier recommendation based on user needs
 */
export function recommendTier(needs: {
  wantsLineByLine: boolean;
  wantsSchoolSpecific: boolean;
  wantsHumanReview: boolean;
  budget: 'low' | 'medium' | 'high';
}): AnalysisTier {
  if (needs.wantsHumanReview) return 'premium';
  if (needs.wantsLineByLine || needs.wantsSchoolSpecific) return 'standard';
  if (needs.budget === 'low') return 'quick';
  return 'standard';
}
