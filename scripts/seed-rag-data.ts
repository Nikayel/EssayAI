/**
 * RAG Data Seed Script
 * Populates the database with initial feedback patterns, school insights, and example essays
 *
 * Run with: npx ts-node scripts/seed-rag-data.ts
 * Or: npm run seed:rag
 *
 * Options:
 *   --regenerate-embeddings  Regenerate embeddings for records with empty/null embeddings
 *   --force-all             Regenerate embeddings for ALL records (expensive!)
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

// Parse CLI arguments
const args = process.argv.slice(2);
const REGENERATE_MISSING = args.includes('--regenerate-embeddings');
const FORCE_ALL = args.includes('--force-all');

// =============================================================================
// EMBEDDING CONFIGURATION
// =============================================================================

const EMBEDDING_CONFIG = {
  model: 'text-embedding-3-small',
  dimensions: 1536,
  batchSize: 50, // OpenAI recommends batches of 100 or less
  retryDelayMs: 1000,
  maxRetries: 3,
  maxCharsPerInput: 8000 * 4, // ~8000 tokens * 4 chars/token
};

// =============================================================================
// EMBEDDING GENERATION
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

/**
 * Prepare text for embedding - truncate if too long
 */
function prepareText(text: string): { text: string; wasTruncated: boolean } {
  const trimmed = text.trim().replace(/\s+/g, ' ');
  if (trimmed.length <= EMBEDDING_CONFIG.maxCharsPerInput) {
    return { text: trimmed, wasTruncated: false };
  }
  // Truncate at sentence boundary
  const truncated = trimmed.slice(0, EMBEDDING_CONFIG.maxCharsPerInput);
  const lastPeriod = truncated.lastIndexOf('.');
  const finalText = lastPeriod > EMBEDDING_CONFIG.maxCharsPerInput * 0.8
    ? truncated.slice(0, lastPeriod + 1)
    : truncated;
  return { text: finalText, wasTruncated: true };
}

/**
 * Validate embedding has correct dimensions
 */
function isValidEmbedding(embedding: unknown): embedding is number[] {
  return (
    Array.isArray(embedding) &&
    embedding.length === EMBEDDING_CONFIG.dimensions &&
    embedding.every(v => typeof v === 'number' && !Number.isNaN(v))
  );
}

/**
 * Generate embedding with retry logic
 */
async function generateEmbedding(text: string): Promise<number[] | null> {
  if (!process.env.OPENAI_API_KEY) {
    console.log('⚠️  OPENAI_API_KEY not set, skipping embeddings');
    return null;
  }

  const { text: preparedText, wasTruncated } = prepareText(text);
  if (wasTruncated) {
    console.log('⚠️  Text truncated for embedding (exceeded token limit)');
  }

  for (let attempt = 1; attempt <= EMBEDDING_CONFIG.maxRetries; attempt++) {
    try {
      const client = await getOpenAI();
      const response = await client.embeddings.create({
        model: EMBEDDING_CONFIG.model,
        input: preparedText,
      });

      const embedding = response.data[0]?.embedding;
      if (!isValidEmbedding(embedding)) {
        throw new Error(`Invalid embedding: got ${(embedding as number[])?.length || 0} dimensions, expected ${EMBEDDING_CONFIG.dimensions}`);
      }

      return embedding;
    } catch (error: any) {
      const isRateLimit = error?.status === 429;
      const isRetryable = isRateLimit || error?.code === 'ECONNRESET';

      if (isRetryable && attempt < EMBEDDING_CONFIG.maxRetries) {
        const delay = EMBEDDING_CONFIG.retryDelayMs * Math.pow(2, attempt - 1);
        console.log(`  Retry ${attempt}/${EMBEDDING_CONFIG.maxRetries} after ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      console.error(`Failed to generate embedding (attempt ${attempt}):`, error.message || error);
      return null;
    }
  }
  return null;
}

/**
 * Batch generate embeddings for efficiency
 */
async function batchGenerateEmbeddings(
  texts: string[]
): Promise<(number[] | null)[]> {
  if (!process.env.OPENAI_API_KEY) {
    return texts.map(() => null);
  }

  const results: (number[] | null)[] = new Array(texts.length).fill(null);
  const client = await getOpenAI();

  // Process in batches
  for (let i = 0; i < texts.length; i += EMBEDDING_CONFIG.batchSize) {
    const batchTexts = texts.slice(i, i + EMBEDDING_CONFIG.batchSize);
    const preparedBatch = batchTexts.map(t => prepareText(t).text);

    try {
      const response = await client.embeddings.create({
        model: EMBEDDING_CONFIG.model,
        input: preparedBatch,
      });

      for (let j = 0; j < response.data.length; j++) {
        const embedding = response.data[j]?.embedding;
        if (isValidEmbedding(embedding)) {
          results[i + j] = embedding;
        }
      }

      process.stdout.write(`  Batch ${Math.floor(i / EMBEDDING_CONFIG.batchSize) + 1}/${Math.ceil(texts.length / EMBEDDING_CONFIG.batchSize)} complete\r`);
    } catch (error: any) {
      console.error(`\n  Batch failed:`, error.message || error);
      // Continue with next batch
    }

    // Small delay between batches to avoid rate limits
    if (i + EMBEDDING_CONFIG.batchSize < texts.length) {
      await new Promise(r => setTimeout(r, 100));
    }
  }

  console.log(''); // New line after progress
  return results;
}

// =============================================================================
// SEED FUNCTIONS
// =============================================================================

async function seedFeedbackPatterns(): Promise<{ created: number; updated: number }> {
  console.log('\n📝 Seeding Feedback Patterns...');

  let created = 0;
  let updated = 0;
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
        select: { id: true, embedding: true },
      });

      if (existing) {
        // Check if we need to regenerate embedding
        const needsEmbedding = REGENERATE_MISSING || FORCE_ALL;
        const hasValidEmbedding = isValidEmbedding(existing.embedding);

        if (needsEmbedding && (!hasValidEmbedding || FORCE_ALL)) {
          const embeddingText = `${pattern.patternName}: ${pattern.description}. ${pattern.exampleBefore || ''}`;
          const embedding = await generateEmbedding(embeddingText);

          if (embedding) {
            await prisma.feedbackPattern.update({
              where: { id: existing.id },
              data: { embedding },
            });
            updated++;
            process.stdout.write(`  Updated embedding: ${pattern.patternName}\r`);
            continue;
          }
        }

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
          avgScoreImprovement: pattern.avgScoreImprovement,
          frequency: pattern.frequency,
          successRate: pattern.successRate,
          isActive: true,
        },
      });

      created++;
      process.stdout.write(`  Created: ${pattern.patternName}\r`);
    } catch (error) {
      console.error(`\n  Failed to seed pattern ${pattern.patternName}:`, error);
    }
  }

  console.log(`\n  ✅ Created: ${created}, Updated: ${updated}, Skipped: ${skipped}`);
  return { created, updated };
}

async function seedSchoolInsights(): Promise<{ created: number; updated: number }> {
  console.log('\n🎓 Seeding School Insights...');

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const insight of SEED_SCHOOL_INSIGHTS) {
    try {
      const existing = await prisma.schoolInsight.findFirst({
        where: {
          schoolId: insight.schoolId,
          content: insight.content,
        },
        select: { id: true, embedding: true },
      });

      if (existing) {
        // Check if we need to regenerate embedding
        const needsEmbedding = REGENERATE_MISSING || FORCE_ALL;
        const hasValidEmbedding = isValidEmbedding(existing.embedding);

        if (needsEmbedding && (!hasValidEmbedding || FORCE_ALL)) {
          const embedding = await generateEmbedding(insight.content);

          if (embedding) {
            await prisma.schoolInsight.update({
              where: { id: existing.id },
              data: { embedding },
            });
            updated++;
            process.stdout.write(`  Updated embedding: ${insight.schoolId} - ${insight.insightType}\r`);
            continue;
          }
        }

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

  console.log(`\n  ✅ Created: ${created}, Updated: ${updated}, Skipped: ${skipped}`);
  return { created, updated };
}

async function seedExampleEssays(): Promise<{ created: number; updated: number }> {
  console.log('\n📄 Seeding Example Essays...');

  let created = 0;
  let updated = 0;
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
        select: { id: true, embedding: true },
      });

      if (existing) {
        // Check if we need to regenerate embedding
        const needsEmbedding = REGENERATE_MISSING || FORCE_ALL;
        const hasValidEmbedding = isValidEmbedding(existing.embedding);

        if (needsEmbedding && (!hasValidEmbedding || FORCE_ALL)) {
          const embedding = await generateEmbedding(essay.contentSnippet);

          if (embedding) {
            await prisma.exampleEssay.update({
              where: { id: existing.id },
              data: { embedding },
            });
            updated++;
            process.stdout.write(`  Updated embedding: ${essay.schoolId} - ${essay.essayType}\r`);
            continue;
          }
        }

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

  console.log(`\n  ✅ Created: ${created}, Updated: ${updated}, Skipped: ${skipped}`);
  return { created, updated };
}

// =============================================================================
// EMBEDDING HEALTH CHECK
// =============================================================================

async function checkEmbeddingHealth(): Promise<{
  patterns: { total: number; withEmbedding: number; missing: number };
  insights: { total: number; withEmbedding: number; missing: number };
  essays: { total: number; withEmbedding: number; missing: number };
}> {
  console.log('\n🔍 Checking Embedding Health...\n');

  // Check patterns
  const allPatterns = await prisma.feedbackPattern.findMany({
    where: { isActive: true },
    select: { id: true, embedding: true },
  });
  const patternsWithEmbedding = allPatterns.filter(p => isValidEmbedding(p.embedding)).length;

  // Check insights
  const allInsights = await prisma.schoolInsight.findMany({
    where: { isActive: true },
    select: { id: true, embedding: true },
  });
  const insightsWithEmbedding = allInsights.filter(i => isValidEmbedding(i.embedding)).length;

  // Check essays
  const allEssays = await prisma.exampleEssay.findMany({
    where: { isActive: true },
    select: { id: true, embedding: true },
  });
  const essaysWithEmbedding = allEssays.filter(e => isValidEmbedding(e.embedding)).length;

  const result = {
    patterns: {
      total: allPatterns.length,
      withEmbedding: patternsWithEmbedding,
      missing: allPatterns.length - patternsWithEmbedding,
    },
    insights: {
      total: allInsights.length,
      withEmbedding: insightsWithEmbedding,
      missing: allInsights.length - insightsWithEmbedding,
    },
    essays: {
      total: allEssays.length,
      withEmbedding: essaysWithEmbedding,
      missing: allEssays.length - essaysWithEmbedding,
    },
  };

  console.log('   Resource Type      Total   Valid   Missing');
  console.log('   ' + '-'.repeat(45));
  console.log(`   Feedback Patterns  ${result.patterns.total.toString().padStart(5)}  ${result.patterns.withEmbedding.toString().padStart(6)}  ${result.patterns.missing.toString().padStart(7)}`);
  console.log(`   School Insights    ${result.insights.total.toString().padStart(5)}  ${result.insights.withEmbedding.toString().padStart(6)}  ${result.insights.missing.toString().padStart(7)}`);
  console.log(`   Example Essays     ${result.essays.total.toString().padStart(5)}  ${result.essays.withEmbedding.toString().padStart(6)}  ${result.essays.missing.toString().padStart(7)}`);

  const totalMissing = result.patterns.missing + result.insights.missing + result.essays.missing;
  if (totalMissing > 0) {
    console.log(`\n   ⚠️  ${totalMissing} records missing embeddings!`);
    console.log('   Run with --regenerate-embeddings to fix.');
  } else {
    console.log('\n   ✅ All embeddings are valid!');
  }

  return result;
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log('🚀 Starting RAG Data Seed...\n');
  console.log('Database URL:', process.env.DATABASE_URL?.slice(0, 30) + '...');

  if (REGENERATE_MISSING) {
    console.log('Mode: Regenerate missing embeddings');
  } else if (FORCE_ALL) {
    console.log('Mode: Force regenerate ALL embeddings (expensive!)');
  } else {
    console.log('Mode: Create new records only');
  }

  try {
    // Test connection
    await prisma.$connect();
    console.log('✅ Connected to database\n');

    // Seed in order
    const patternResult = await seedFeedbackPatterns();
    const insightResult = await seedSchoolInsights();
    const essayResult = await seedExampleEssays();

    console.log('\n' + '='.repeat(50));
    console.log('🎉 RAG Data Seed Complete!');
    console.log('='.repeat(50));
    console.log(`   Feedback Patterns: ${patternResult.created} created, ${patternResult.updated} updated`);
    console.log(`   School Insights:   ${insightResult.created} created, ${insightResult.updated} updated`);
    console.log(`   Example Essays:    ${essayResult.created} created, ${essayResult.updated} updated`);
    console.log('='.repeat(50));

    // Run embedding health check
    await checkEmbeddingHealth();

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
