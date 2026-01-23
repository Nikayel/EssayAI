/**
 * Essay Scoring API Endpoint
 * POST /api/score - Analyze essay with 5-dimension scoring engine
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { analyzeEssay, studentProfileToIntake, enhanceWithRAGContext } from '@/lib/scoring';
import type { StudentIntake, EssayTypeEnum } from '@/lib/scoring';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

// =============================================================================
// REQUEST VALIDATION
// =============================================================================

const EssayContextSchema = z.object({
  targetSchool: z.string().min(1),
  essayType: z.enum([
    'personal_statement',
    'why_us',
    'supplemental',
    'activity',
    'diversity',
    'community',
    'intellectual',
    'short_answer',
  ]),
  essayPrompt: z.string().optional(),
  wordLimit: z.number().min(50).max(5000).optional(),
  biggestConcern: z.enum([
    'too_generic',
    'not_enough_depth',
    'wrong_tone',
    'school_fit',
    'grammar',
    'structure',
    'other',
  ]).optional(),
  draftNumber: z.enum(['first', 'second', 'third_plus', 'final']).optional(),
});

const ScoreRequestSchema = z.object({
  essayText: z.string().min(50, 'Essay must be at least 50 characters').max(50000),
  essayContext: EssayContextSchema,
  // Optional: provide full intake for more accurate scoring
  intake: z.any().optional(),
  // Options
  includeAnnotations: z.boolean().optional().default(true),
  includeBenchmark: z.boolean().optional().default(true),
  includeRAGEnhancement: z.boolean().optional().default(true),
});

// =============================================================================
// MAIN HANDLER
// =============================================================================

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Parse request body
    const body = await request.json();
    const validation = ScoreRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          details: validation.error.issues,
        },
        { status: 400 }
      );
    }

    const {
      essayText,
      essayContext,
      intake: providedIntake,
      includeAnnotations,
      includeBenchmark,
      includeRAGEnhancement,
    } = validation.data;

    // Get authenticated user (optional - allows anonymous scoring)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let intake: StudentIntake;

    // If user is authenticated, try to get their profile
    if (user && !providedIntake) {
      const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
      });

      if (profile) {
        // Convert profile to intake format
        intake = studentProfileToIntake(
          {
            spike: profile.spike || undefined,
            topActivities: profile.topActivities,
            biggestWorry: profile.biggestWorry || undefined,
            toneSample: profile.toneSample || undefined,
            toneEmbedding: profile.toneEmbedding as number[] | undefined,
            graduationYear: profile.graduationYear || undefined,
            isFirstGen: profile.isFirstGen || undefined,
            familyEducationLevel: profile.familyEducationLevel as any,
            isInternational: profile.isInternational || undefined,
            countryOfOrigin: profile.countryOfOrigin || undefined,
            primaryLanguage: profile.primaryLanguage || undefined,
            immigrationStory: profile.immigrationStory as any,
            geographicContext: profile.geographicContext as any,
            schoolType: profile.schoolType as any,
            familyResponsibilities: profile.familyResponsibilities,
            intendedMajor: profile.intendedMajor || undefined,
            academicInterests: profile.academicInterests,
            intellectualPassion: profile.intellectualPassion || undefined,
            hasResearchExperience: profile.hasResearchExperience || undefined,
            researchDescription: profile.researchDescription || undefined,
            academicChallenges: profile.academicChallenges || undefined,
            activitiesStructured: profile.activitiesStructured as any,
            workExperience: profile.workExperience as any,
            leadershipRoles: profile.leadershipRoles,
            summerExperiences: profile.summerExperiences || undefined,
            identityFactors: profile.identityFactors,
            significantChallenges: profile.significantChallenges || undefined,
            uniquePerspective: profile.uniquePerspective || undefined,
            whatAOsShouldKnow: profile.whatAOsShouldKnow || undefined,
            writingStyle: profile.writingStyle as any,
            usesHumor: profile.usesHumor || undefined,
          },
          {
            targetSchool: essayContext.targetSchool,
            essayType: essayContext.essayType as EssayTypeEnum,
            essayPrompt: essayContext.essayPrompt || '',
            wordLimit: essayContext.wordLimit || 650,
            biggestConcern: essayContext.biggestConcern || 'too_generic',
            draftNumber: essayContext.draftNumber || 'first',
            previousFeedback: undefined,
          }
        );
      } else {
        // No profile, use minimal intake
        intake = createMinimalIntake(essayContext);
      }
    } else if (providedIntake) {
      // Use provided intake
      intake = providedIntake as StudentIntake;
    } else {
      // Anonymous user, minimal intake
      intake = createMinimalIntake(essayContext);
    }

    // Run scoring engine
    const result = await analyzeEssay(essayText, intake, {
      includeAnnotations,
      includeBenchmark,
    });

    // Optionally enhance with RAG context
    let enhancedResult = result;
    if (includeRAGEnhancement && user) {
      try {
        // Get similar essays from RAG (simplified - in production, call RAG retrieval)
        const ragContext = await getRAGContext(essayContext.targetSchool, essayContext.essayType);
        enhancedResult = enhanceWithRAGContext(result, ragContext);
      } catch (ragError) {
        console.error('RAG enhancement failed:', ragError);
        // Continue without RAG enhancement
      }
    }

    // Store analysis history if user is authenticated
    if (user) {
      try {
        await prisma.analyticsEvent.create({
          data: {
            userId: user.id,
            event: 'essay_scored',
            properties: {
              overallScore: enhancedResult.overallScore,
              scoreLabel: enhancedResult.scoreLabel,
              targetSchool: essayContext.targetSchool,
              essayType: essayContext.essayType,
              wordCount: enhancedResult.metadata.wordCount,
              processingTimeMs: enhancedResult.metadata.processingTimeMs,
            },
          },
        });
      } catch (analyticsError) {
        console.error('Analytics tracking failed:', analyticsError);
        // Don't fail the request for analytics errors
      }
    }

    return NextResponse.json({
      success: true,
      result: enhancedResult,
      meta: {
        processingTimeMs: Date.now() - startTime,
        authenticated: !!user,
        ragEnhanced: includeRAGEnhancement && !!user,
      },
    });

  } catch (error) {
    console.error('Scoring error:', error);

    return NextResponse.json(
      {
        error: 'Scoring failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function createMinimalIntake(essayContext: z.infer<typeof EssayContextSchema>): StudentIntake {
  return {
    demographics: {
      isFirstGen: false,
      familyEducationLevel: 'bachelors',
      isInternational: false,
      geographicContext: 'suburban',
      schoolType: 'public',
      familyResponsibilities: [],
    },
    academic: {
      intendedMajor: '',
      academicInterests: [],
    },
    activities: {
      spike: '',
      topActivities: [],
      leadershipRoles: [],
    },
    personal: {
      identityFactors: [],
    },
    essayContext: {
      targetSchool: essayContext.targetSchool,
      essayType: essayContext.essayType as EssayTypeEnum,
      essayPrompt: essayContext.essayPrompt || '',
      wordLimit: essayContext.wordLimit || 650,
      biggestConcern: essayContext.biggestConcern || 'too_generic',
      draftNumber: essayContext.draftNumber || 'first',
      previousFeedback: undefined,
    },
    voice: {
      toneSample: '',
      writingStyle: 'conversational',
      usesHumor: false,
    },
  };
}

async function getRAGContext(
  targetSchool: string,
  essayType: string
): Promise<{
  similarEssays?: Array<{ score: number; school: string; themes: string[] }>;
  feedbackPatterns?: Array<{ issueType: string; successRate: number; fixStrategy: string }>;
}> {
  try {
    // Query similar essays from RAG database
    const similarEssays = await prisma.exampleEssay.findMany({
      where: {
        schoolId: { contains: targetSchool, mode: 'insensitive' },
        essayType: essayType,
        outcome: 'accepted',
      },
      take: 10,
      select: {
        scoreRange: true,
        schoolId: true,
        themeTags: true,
      },
    });

    // Query feedback patterns
    const feedbackPatterns = await prisma.feedbackPattern.findMany({
      where: {
        successRate: { gte: 0.6 },
      },
      take: 10,
      select: {
        issueType: true,
        successRate: true,
        fixStrategy: true,
      },
    });

    return {
      similarEssays: similarEssays.map(e => {
        // Parse scoreRange string like "90-100" to get average
        let score = 75;
        if (e.scoreRange) {
          const parts = e.scoreRange.split('-').map(Number);
          if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            score = (parts[0] + parts[1]) / 2;
          }
        }
        return {
          score,
          school: e.schoolId,
          themes: e.themeTags,
        };
      }),
      feedbackPatterns: feedbackPatterns.map(p => ({
        issueType: p.issueType,
        successRate: p.successRate,
        fixStrategy: p.fixStrategy ?? '',
      })),
    };
  } catch (error) {
    console.error('RAG context retrieval failed:', error);
    return {};
  }
}

// =============================================================================
// GET - Health check and schema info
// =============================================================================

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/score',
    version: '1.0.0',
    description: '5-dimension essay scoring engine',
    dimensions: [
      { name: 'Authenticity & Voice', maxScore: 25, weight: '25%' },
      { name: 'Insight & Reflection', maxScore: 25, weight: '25%' },
      { name: 'School Fit & Alignment', maxScore: 20, weight: '20%' },
      { name: 'Specificity & Craft', maxScore: 20, weight: '20%' },
      { name: 'Risk & Red Flags', maxScore: 10, weight: '10% (deduction-based)' },
    ],
    supportedSchools: [
      'harvard', 'yale', 'princeton', 'columbia',
      'brown', 'dartmouth', 'cornell', 'upenn',
    ],
    essayTypes: [
      'personal_statement', 'why_us', 'supplemental',
      'activity', 'diversity', 'community', 'intellectual', 'short_answer',
    ],
  });
}
