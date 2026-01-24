import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/client';

// =============================================================================
// LEAD CAPTURE API
// =============================================================================
// Captures email leads from landing pages, free resources, and CTAs
// Implements rate limiting and validation for anti-spam protection

const leadSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1).max(100).optional(),
  source: z.string().min(1).max(50), // essay_examples, deadline_calc, newsletter, etc.
  metadata: z.record(z.string(), z.unknown()).optional(), // Extra info like school interest
});

// Simple in-memory rate limiting (per IP)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 5; // 5 requests per minute per IP

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

/**
 * POST /api/leads
 * Capture a new email lead
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') ||
               'unknown';

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const result = leadSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', issues: result.error.issues },
        { status: 400 }
      );
    }

    const { email, name, source, metadata } = result.data;

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Check if lead already exists
    const existingLead = await prisma.lead.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingLead) {
      // Update source if different (track multiple touchpoints)
      if (existingLead.source !== source) {
        const existingMeta = (existingLead.metadata as Record<string, unknown>) || {};
        const additionalSources = (existingMeta.additionalSources as string[]) || [];
        await prisma.lead.update({
          where: { email: normalizedEmail },
          data: {
            metadata: {
              ...existingMeta,
              additionalSources: [...additionalSources, source],
            } as Prisma.InputJsonValue,
          },
        });
      }

      // Return success even if already exists (don't reveal existence)
      return NextResponse.json({
        success: true,
        message: 'Thanks! You\'re on the list.',
      });
    }

    // Create new lead
    await prisma.lead.create({
      data: {
        email: normalizedEmail,
        name,
        source,
        metadata: (metadata || {}) as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Thanks! You\'re on the list.',
    });
  } catch (error) {
    console.error('Lead capture error:', error);
    return NextResponse.json(
      { error: 'Failed to save. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/leads/count
 * Get total lead count (for social proof)
 */
export async function GET(request: NextRequest) {
  try {
    const count = await prisma.lead.count();

    // Return a rounded number for display
    const displayCount = count > 100
      ? Math.floor(count / 100) * 100 + '+'
      : count.toString();

    return NextResponse.json({
      count: displayCount,
      raw: count,
    });
  } catch (error) {
    console.error('Lead count error:', error);
    return NextResponse.json(
      { count: '500+', raw: 0 }, // Fallback for display
      { status: 200 }
    );
  }
}
