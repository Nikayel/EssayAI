/**
 * Ivy League Free Preview Analysis
 * POST /api/ivy/preview - Run free preview analysis without authentication
 *
 * Returns limited results (score + issue count) to entice upgrade
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { analyzeIvyEssay } from '@/lib/ai/ivy-analyzer';
import { validateSchoolId } from '@/lib/ai/ivy-prompts';
import { getIvySchool } from '@/lib/data/ivy-league';
import { checkRateLimit } from '@/lib/rag/rate-limiter';

// =============================================================================
// REQUEST SCHEMA
// =============================================================================

const PreviewRequestSchema = z.object({
  schoolId: z.string().refine(validateSchoolId, 'Invalid Ivy League school'),
  essays: z.array(z.object({
    promptId: z.string(),
    essayText: z.string().min(50, 'Essay must be at least 50 characters'),
  })).min(1, 'At least one essay required'),
  intake: z.object({
    demographics: z.object({
      isFirstGen: z.boolean().optional(),
      isInternational: z.boolean().optional(),
    }).optional(),
    academic: z.object({
      intendedMajor: z.string().optional(),
    }).optional(),
  }).passthrough().optional(),
});

// =============================================================================
// POST - Free Preview Analysis
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP (generous for preview)
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = checkRateLimit(ip, 'ivy_preview');

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many preview requests. Please try again later.' },
        { status: 429, headers: rateLimitResult.headers }
      );
    }

    // Parse request
    const body = await request.json();
    const validation = PreviewRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { schoolId, essays, intake } = validation.data;

    // Get school info
    const school = getIvySchool(schoolId);
    if (!school) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 400 }
      );
    }

    // Get school's essay prompts for matching
    const schoolPrompts = school.essayPrompts || [];

    // Combine all essays for analysis (portfolio approach)
    const combinedEssay = essays.map(e => {
      const prompt = schoolPrompts.find(p => p.id === e.promptId);
      return `[${prompt?.title || 'Essay'}]\n${e.essayText}`;
    }).join('\n\n---\n\n');

    // Run analysis on the first/main essay for preview
    const mainEssay = essays[0];
    const mainPrompt = schoolPrompts.find(p => p.id === mainEssay.promptId);

    const analysisResult = await analyzeIvyEssay({
      essayText: mainEssay.essayText,
      schoolId,
      essayType: mainPrompt?.type || 'supplemental',
      promptText: mainPrompt?.prompt || 'Write about something meaningful to you.',
      wordLimit: mainPrompt?.wordLimit,
    });

    // Count total issues across all categories
    // flag=true means issue detected
    const issueCount =
      (analysisResult.commons_check.about_applicant.flag ? 1 : 0) +
      (analysisResult.commons_check.generic_language.flag ? 1 : 0) +
      (analysisResult.commons_check.school_specific.flag ? 1 : 0) +
      (analysisResult.commons_check.cliches.flag ? 1 : 0) +
      (analysisResult.commons_check.voice_authentic.flag ? 1 : 0) +
      (analysisResult.school_fit_analysis.fit_score < 70 ? 1 : 0) +
      (analysisResult.overall.score_100 < 75 ? 1 : 0);

    // Return LIMITED preview result (teaser only)
    // Full results require payment
    return NextResponse.json({
      success: true,
      preview: true,
      result: {
        // Visible to free users
        overallScore: analysisResult.overall.score_100,
        issueCount: Math.max(issueCount, 3), // Show at least 3 issues to encourage upgrade
        schoolName: school.name,
        fitScore: analysisResult.school_fit_analysis.fit_score,
        // Teaser summary (limited)
        summary: analysisResult.overall.summary.substring(0, 150) + '...',
        // Signal that more is available
        hasDetailedFeedback: true,
        hasLineByLine: true,
        hasAOPerspective: true,
        // Blurred/hidden fields
        topIssues: analysisResult.commons_check.cliches.phrases?.slice(0, 2) || [],
      },
      // Session info for potential purchase
      sessionData: {
        schoolId,
        essayCount: essays.length,
        wordCount: combinedEssay.split(/\s+/).length,
      },
    });

  } catch (error) {
    console.error('Ivy preview error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Preview analysis failed. Please try again.' },
      { status: 500 }
    );
  }
}
