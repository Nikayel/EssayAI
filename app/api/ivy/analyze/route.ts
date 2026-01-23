import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import {
  analyzeIvyEssay,
  analyzeSchoolFit,
  generateIvyRewrites,
  compareToneWithSample,
  countWords,
} from '@/lib/ai/ivy-analyzer';
import { validateSchoolId } from '@/lib/ai/ivy-prompts';
import { getIvySchool } from '@/lib/data/ivy-league';
import { z } from 'zod';

// ============================================================================
// REQUEST SCHEMAS
// ============================================================================

const IvyAnalyzeRequestSchema = z.object({
  versionId: z.string(),
  schoolId: z.string().refine(validateSchoolId, 'Invalid Ivy League school'),
  analysisType: z.enum(['full', 'fit_only']),
  essayType: z.string().optional(),
  promptText: z.string().optional(),
  wordLimit: z.number().optional(),
});

const IvyRewriteRequestSchema = z.object({
  versionId: z.string(),
  schoolId: z.string().refine(validateSchoolId, 'Invalid Ivy League school'),
  goals: z.array(z.enum(['school_fit', 'specificity', 'voice', 'structure', 'clarity'])),
});

// ============================================================================
// POST /api/ivy/analyze - Run Ivy League essay analysis
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request
    const body = await request.json();
    const validated = IvyAnalyzeRequestSchema.parse(body);

    // Fetch version and verify ownership
    const version = await prisma.essayVersion.findFirst({
      where: { id: validated.versionId },
      include: { essay: true },
    });

    if (!version || version.essay.userId !== user.id) {
      return NextResponse.json(
        { error: 'Version not found or unauthorized' },
        { status: 404 }
      );
    }

    // Get user profile for tone sample
    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
    });

    // Get school info
    const school = getIvySchool(validated.schoolId);
    if (!school) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 400 }
      );
    }

    // Determine essay type and prompt
    const essayType = validated.essayType || version.essay.type.toLowerCase().replace('_', ' ');
    const promptText = validated.promptText || version.essay.promptText;
    const wordLimit = validated.wordLimit || version.essay.wordLimit || undefined;

    if (validated.analysisType === 'fit_only') {
      // Quick school fit analysis only
      const fitResult = await analyzeSchoolFit(version.content, validated.schoolId);

      return NextResponse.json({
        success: true,
        type: 'fit_only',
        school: {
          id: school.id,
          name: school.name,
          acceptanceRate: school.acceptanceRate,
        },
        result: fitResult,
      });
    }

    // Full Ivy analysis
    const analysisResult = await analyzeIvyEssay({
      essayText: version.content,
      schoolId: validated.schoolId,
      essayType,
      promptText,
      wordLimit,
      toneSample: profile?.toneSample || undefined,
    });

    // Run tone comparison if user has tone sample
    let toneComparison = null;
    if (profile?.toneSample) {
      toneComparison = await compareToneWithSample(
        version.content,
        profile.toneSample
      );
    }

    // Store analysis in database
    const analysis = await prisma.aIAnalysis.create({
      data: {
        versionId: version.id,
        analysisJson: {
          ...analysisResult,
          ivy_specific: true,
          school_id: validated.schoolId,
          tone_comparison: toneComparison,
        } as any,
        overallScore: analysisResult.overall.score_100,
        modelRef: 'claude-3-5-sonnet-20241022-ivy',
        commonsFlags: {
          create: [
            {
              key: 'about_applicant',
              flag: analysisResult.commons_check.about_applicant.flag,
              evidence: analysisResult.commons_check.about_applicant.evidence,
            },
            {
              key: 'generic_language',
              flag: analysisResult.commons_check.generic_language.flag,
              evidence: analysisResult.commons_check.generic_language.phrases,
            },
            {
              key: 'school_specific',
              flag: analysisResult.commons_check.school_specific.flag,
              evidence: analysisResult.commons_check.school_specific.evidence,
            },
            {
              key: 'cliches',
              flag: analysisResult.commons_check.cliches.flag,
              evidence: analysisResult.commons_check.cliches.phrases,
            },
            {
              key: 'voice_authentic',
              flag: analysisResult.commons_check.voice_authentic.flag,
              evidence: [analysisResult.commons_check.voice_authentic.notes],
            },
          ],
        },
      },
      include: {
        commonsFlags: true,
      },
    });

    // Track analytics
    await prisma.analyticsEvent.create({
      data: {
        userId: user.id,
        event: 'ivy_analysis_complete',
        properties: {
          school_id: validated.schoolId,
          school_name: school.name,
          overall_score: analysisResult.overall.score_100,
          fit_score: analysisResult.school_fit_analysis.fit_score,
          word_count: countWords(version.content),
        },
      },
    });

    return NextResponse.json({
      success: true,
      type: 'full',
      analysisId: analysis.id,
      school: {
        id: school.id,
        name: school.name,
        acceptanceRate: school.acceptanceRate,
      },
      result: analysisResult,
      toneComparison,
    });

  } catch (error) {
    console.error('Ivy analysis error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Analysis failed', message: (error as Error).message },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET /api/ivy/analyze - Get available schools and prompts
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('school');

    if (schoolId) {
      // Return specific school info with prompts
      const school = getIvySchool(schoolId);
      if (!school) {
        return NextResponse.json({ error: 'School not found' }, { status: 404 });
      }

      return NextResponse.json({
        school: {
          id: school.id,
          name: school.name,
          fullName: school.name,
          location: school.location,
          acceptanceRate: school.acceptanceRate,
          mission: school.mission,
          cultureKeywords: school.cultureKeywords,
          valueKeywords: school.valueKeywords,
          notablePrograms: school.notablePrograms,
        },
        prompts: school.essayPrompts.map(p => ({
          id: p.id,
          type: p.type,
          title: p.title,
          prompt: p.prompt,
          wordLimit: p.wordLimit,
          tips: p.tips,
        })),
      });
    }

    // Return list of all Ivy schools
    const { IVY_LEAGUE_SCHOOLS } = await import('@/lib/data/ivy-league');

    return NextResponse.json({
      schools: IVY_LEAGUE_SCHOOLS.map(s => ({
        id: s.id,
        name: s.name,
        shortName: s.shortName,
        location: s.location,
        acceptanceRate: s.acceptanceRate,
        promptCount: s.essayPrompts.length,
      })),
    });

  } catch (error) {
    console.error('Ivy schools fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schools' },
      { status: 500 }
    );
  }
}
