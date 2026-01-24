/**
 * RAG Data Seed Script
 * Populates the database with initial feedback patterns, school insights, and example essays
 *
 * Run with: npx ts-node scripts/seed-rag-data.ts
 * Or: npm run seed:rag
 */

import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';
import {
  SEED_FEEDBACK_PATTERNS,
  SEED_SCHOOL_INSIGHTS,
  SEED_EXAMPLE_ESSAYS,
  type SeedFeedbackPattern,
  type SeedSchoolInsight,
  type SeedExampleEssay,
} from '../lib/rag/seed-data';

const prisma = new PrismaClient();

// =============================================================================
// EMBEDDING GENERATION (Optional - can be run separately)
// =============================================================================

let openai: any = null;

async function getOpenAI() {
  if (!openai) {
    const OpenAI = (await import('openai')).default;
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!process.env.OPENAI_API_KEY) {
    console.log('OPENAI_API_KEY not set, skipping embeddings');
    return null;
  }

  try {
    const client = await getOpenAI();
    const response = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Failed to generate embedding:', error);
    return null;
  }
}

// =============================================================================
// SEED FUNCTIONS
// =============================================================================

async function seedFeedbackPatterns(): Promise<number> {
  console.log('\n📝 Seeding Feedback Patterns...');

  let created = 0;
  let skipped = 0;

  for (const pattern of SEED_FEEDBACK_PATTERNS) {
    try {
      // Check if pattern already exists
      const existing = await prisma.feedbackPattern.findFirst({
        where: {
          issueType: pattern.issueType,
          essayType: pattern.essayType || null,
          schoolId: pattern.schoolId || null,
        },
      });

      if (existing) {
        skipped++;
        continue;
      }

      // Generate embedding for the pattern
      const embeddingText = `${pattern.patternName}: ${pattern.description}. ${pattern.exampleBefore || ''}`;
      const embedding = await generateEmbedding(embeddingText);

      await prisma.feedbackPattern.create({
        data: {
          issueType: pattern.issueType,
          issueCategory: pattern.issueCategory,
          patternName: pattern.patternName,
          description: pattern.description,
          exampleBefore: pattern.exampleBefore || null,
          exampleAfter: pattern.exampleAfter || null,
          fixStrategy: pattern.fixStrategy,
          severity: pattern.severity,
          essayType: pattern.essayType || null,
          schoolId: pattern.schoolId || null,
          embedding: embedding || [],
          avgScoreImprovement: 0,
          frequency: 0,
          successRate: 0,
          isActive: true,
        },
      });

      created++;
      process.stdout.write(`  Created: ${pattern.patternName}\r`);
    } catch (error) {
      console.error(`\n  Failed to seed pattern ${pattern.patternName}:`, error);
    }
  }

  console.log(`\n  ✅ Created: ${created}, Skipped: ${skipped}`);
  return created;
}

async function seedSchoolInsights(): Promise<number> {
  console.log('\n🎓 Seeding School Insights...');

  let created = 0;
  let skipped = 0;

  for (const insight of SEED_SCHOOL_INSIGHTS) {
    try {
      // Check if insight already exists (by content hash)
      const contentHash = createHash('md5')
        .update(insight.content)
        .digest('hex');

      const existing = await prisma.schoolInsight.findFirst({
        where: {
          schoolId: insight.schoolId,
          content: insight.content,
        },
      });

      if (existing) {
        skipped++;
        continue;
      }

      // Generate embedding
      const embedding = await generateEmbedding(insight.content);

      await prisma.schoolInsight.create({
        data: {
          schoolId: insight.schoolId,
          insightType: insight.insightType,
          content: insight.content,
          source: insight.source || null,
          essayTypes: insight.essayTypes,
          relevanceScore: insight.relevanceScore,
          embedding: embedding || [],
          isActive: true,
        },
      });

      created++;
      process.stdout.write(`  Created: ${insight.schoolId} - ${insight.insightType}\r`);
    } catch (error) {
      console.error(
        `\n  Failed to seed insight for ${insight.schoolId}:`,
        error
      );
    }
  }

  console.log(`\n  ✅ Created: ${created}, Skipped: ${skipped}`);
  return created;
}

async function seedExampleEssays(): Promise<number> {
  console.log('\n📄 Seeding Example Essays...');

  let created = 0;
  let skipped = 0;

  for (const essay of SEED_EXAMPLE_ESSAYS) {
    try {
      // Create content hash for deduplication
      const contentHash = createHash('md5')
        .update(essay.contentSnippet)
        .digest('hex');

      // Check if already exists
      const existing = await prisma.exampleEssay.findFirst({
        where: { contentHash },
      });

      if (existing) {
        skipped++;
        continue;
      }

      // Generate embedding
      const embedding = await generateEmbedding(essay.contentSnippet);

      await prisma.exampleEssay.create({
        data: {
          schoolId: essay.schoolId,
          essayType: essay.essayType,
          contentSnippet: essay.contentSnippet,
          contentHash,
          outcome: essay.outcome,
          scoreRange: essay.scoreRange,
          themeTags: essay.themeTags,
          spikeCategory: essay.spikeCategory,
          strengthNotes: essay.strengthNotes,
          keyTechniques: essay.keyTechniques,
          embedding: embedding || [],
          isActive: true,
        },
      });

      created++;
      process.stdout.write(`  Created: ${essay.schoolId} - ${essay.essayType}\r`);
    } catch (error) {
      console.error(
        `\n  Failed to seed example for ${essay.schoolId}:`,
        error
      );
    }
  }

  console.log(`\n  ✅ Created: ${created}, Skipped: ${skipped}`);
  return created;
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log('🚀 Starting RAG Data Seed...\n');
  console.log('Database URL:', process.env.DATABASE_URL?.slice(0, 30) + '...');

  try {
    // Test connection
    await prisma.$connect();
    console.log('✅ Connected to database\n');

    // Seed in order
    const patternCount = await seedFeedbackPatterns();
    const insightCount = await seedSchoolInsights();
    const exampleCount = await seedExampleEssays();

    console.log('\n' + '='.repeat(50));
    console.log('🎉 RAG Data Seed Complete!');
    console.log('='.repeat(50));
    console.log(`   Feedback Patterns: ${patternCount}`);
    console.log(`   School Insights:   ${insightCount}`);
    console.log(`   Example Essays:    ${exampleCount}`);
    console.log('='.repeat(50));

    // Print data availability summary
    console.log('\n📊 Data Availability by School:\n');

    const schools = ['harvard', 'yale', 'princeton', 'columbia', 'brown', 'dartmouth', 'cornell', 'upenn'];

    for (const school of schools) {
      const [insights, examples] = await Promise.all([
        prisma.schoolInsight.count({ where: { schoolId: school, isActive: true } }),
        prisma.exampleEssay.count({ where: { schoolId: school, isActive: true } }),
      ]);
      console.log(`   ${school.padEnd(12)} Insights: ${insights}, Examples: ${examples}`);
    }

    const totalPatterns = await prisma.feedbackPattern.count({ where: { isActive: true } });
    console.log(`\n   Total Patterns: ${totalPatterns}`);

  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
main();
