/**
 * Admin Config API
 * GET /api/admin/config - Get all config overrides
 * POST /api/admin/config - Set a config override
 * DELETE /api/admin/config - Remove a config override
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { config } from '@/lib/config';

// =============================================================================
// MIDDLEWARE - Check Admin
// =============================================================================

async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Unauthorized', status: 401 };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  if (dbUser?.role !== 'ADMIN') {
    return { error: 'Forbidden - Admin access required', status: 403 };
  }

  return { user };
}

// =============================================================================
// GET - Get All Config
// =============================================================================

export async function GET() {
  const auth = await checkAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    // Get all overrides from database
    const overrides = await prisma.configOverride.findMany({
      orderBy: { key: 'asc' },
    });

    // Get current config state
    const currentConfig = {
      pricing: config.pricing,
      cycle: config.cycle,
      scoring: config.scoring,
      models: config.models,
    };

    return NextResponse.json({
      success: true,
      currentConfig,
      overrides: overrides.map((o) => ({
        key: o.key,
        value: o.value,
        updatedAt: o.updatedAt,
        updatedBy: o.updatedBy,
      })),
      configKeys: getConfigKeys(),
    });
  } catch (error) {
    console.error('Failed to fetch config:', error);
    return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 });
  }
}

// =============================================================================
// POST - Set Config Override
// =============================================================================

const SetConfigSchema = z.object({
  key: z.string().min(1),
  value: z.any(),
});

export async function POST(request: NextRequest) {
  const auth = await checkAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const validated = SetConfigSchema.parse(body);

    // Validate the key is a known config path
    const validKeys = getConfigKeys();
    if (!validKeys.includes(validated.key)) {
      return NextResponse.json(
        { error: `Invalid config key: ${validated.key}. Valid keys: ${validKeys.slice(0, 5).join(', ')}...` },
        { status: 400 }
      );
    }

    // Upsert the override
    const override = await prisma.configOverride.upsert({
      where: { key: validated.key },
      create: {
        key: validated.key,
        value: validated.value,
        updatedBy: auth.user.id,
      },
      update: {
        value: validated.value,
        updatedBy: auth.user.id,
      },
    });

    // Log the change
    await prisma.auditLog.create({
      data: {
        userId: auth.user.id,
        action: 'config_override_set',
        resource: validated.key,
        details: { newValue: validated.value },
      },
    });

    return NextResponse.json({
      success: true,
      override: {
        key: override.key,
        value: override.value,
        updatedAt: override.updatedAt,
      },
      message: `Config "${validated.key}" updated. Changes take effect immediately.`,
    });
  } catch (error) {
    console.error('Failed to set config:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to set config' }, { status: 500 });
  }
}

// =============================================================================
// DELETE - Remove Config Override
// =============================================================================

const DeleteConfigSchema = z.object({
  key: z.string().min(1),
});

export async function DELETE(request: NextRequest) {
  const auth = await checkAdmin();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ error: 'Key parameter required' }, { status: 400 });
    }

    await prisma.configOverride.delete({
      where: { key },
    });

    // Log the change
    await prisma.auditLog.create({
      data: {
        userId: auth.user.id,
        action: 'config_override_removed',
        resource: key,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Config override for "${key}" removed. Default value restored.`,
    });
  } catch (error) {
    console.error('Failed to remove config:', error);
    return NextResponse.json({ error: 'Failed to remove config' }, { status: 500 });
  }
}

// =============================================================================
// HELPERS
// =============================================================================

function getConfigKeys(): string[] {
  return [
    // Pricing
    'pricing.tiers.quick.priceInCents',
    'pricing.tiers.standard.priceInCents',
    'pricing.tiers.premium.priceInCents',

    // Cycle
    'cycle.currentCycle',
    'cycle.deadlines',
    'cycle.graduationYears',

    // Scoring
    'scoring.thresholds.exceptional.min',
    'scoring.thresholds.strong.min',
    'scoring.thresholds.competitive.min',
    'scoring.thresholds.developing.min',
    'scoring.defaultWeights.authenticity',
    'scoring.defaultWeights.insight',
    'scoring.defaultWeights.schoolFit',
    'scoring.defaultWeights.specificity',
    'scoring.defaultWeights.risk',

    // AI Detection
    'aiDetection.thresholds.emDashThreshold',
    'aiDetection.thresholds.vocabMatchThreshold',
    'aiDetection.thresholds.structurePatternThreshold',
    'aiDetection.enabled',

    // Guardrails
    'guardrails.maxEssayLength',
    'guardrails.minEssayLength',
    'guardrails.blockedPatterns',
  ];
}
