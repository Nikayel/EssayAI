/**
 * Email Intake API
 * POST /api/email-intake - Collect email leads for marketing
 *
 * Security:
 * - Rate limiting per IP
 * - Email validation
 * - Honeypot field for bot detection
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { sendEmail, leadMagnetEmail } from '@/lib/email/send';
import { headers } from 'next/headers';

// =============================================================================
// RATE LIMITING
// =============================================================================

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 10; // 10 submissions per hour per IP

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || record.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }

  record.count++;
  return true;
}

// =============================================================================
// REQUEST VALIDATION
// =============================================================================

const EmailIntakeSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  source: z.enum([
    'homepage',
    'pricing',
    'blog',
    'popup',
    'footer',
    'for-parents',
    'landing',
    'lead-magnet',
  ]),
  leadMagnet: z.string().optional(), // Which free resource they want
  firstName: z.string().max(100).optional(),
  referralCode: z.string().max(50).optional(),
  // Honeypot field - should be empty
  website: z.string().max(0, 'Invalid submission').optional(),
  // Marketing preferences
  marketingConsent: z.boolean().default(true),
});

// =============================================================================
// POST - Collect Email
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    // Get IP for rate limiting
    const headersList = await headers();
    const forwardedFor = headersList.get('x-forwarded-for');
    const ip = forwardedFor?.split(',')[0] || 'unknown';

    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse and validate request
    const body = await request.json();
    const validation = EmailIntakeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { email, source, leadMagnet, firstName, referralCode, website, marketingConsent } = validation.data;

    // Honeypot check - if website field is filled, it's a bot
    if (website && website.length > 0) {
      // Silently accept but don't store
      return NextResponse.json({ success: true, message: 'Thanks for signing up!' });
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists
    const existingLead = await prisma.emailLead.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingLead) {
      // Update source if different
      if (!existingLead.sources.includes(source)) {
        await prisma.emailLead.update({
          where: { email: normalizedEmail },
          data: {
            sources: [...existingLead.sources, source],
            lastActivityAt: new Date(),
          },
        });
      }

      // Still send lead magnet if requested
      if (leadMagnet) {
        await sendLeadMagnetEmail(normalizedEmail, leadMagnet);
      }

      return NextResponse.json({
        success: true,
        message: 'Thanks! Check your email.',
        isExisting: true,
      });
    }

    // Create new lead
    await prisma.emailLead.create({
      data: {
        email: normalizedEmail,
        firstName: firstName || null,
        sources: [source],
        leadMagnets: leadMagnet ? [leadMagnet] : [],
        referralCode: referralCode || null,
        marketingConsent,
        lastActivityAt: new Date(),
        metadata: {
          ip: ip.substring(0, 45), // Truncate for privacy
          userAgent: headersList.get('user-agent')?.substring(0, 200) || null,
        },
      },
    });

    // Send welcome/lead magnet email
    if (leadMagnet) {
      await sendLeadMagnetEmail(normalizedEmail, leadMagnet);
    }

    // Track conversion event (analytics)
    // await trackEmailCapture(normalizedEmail, source);

    return NextResponse.json({
      success: true,
      message: leadMagnet
        ? 'Thanks! Check your email for your free resource.'
        : 'Thanks for signing up! We\'ll be in touch.',
    });

  } catch (error) {
    console.error('Email intake error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}

// =============================================================================
// HELPERS
// =============================================================================

const LEAD_MAGNETS: Record<string, { name: string; downloadUrl: string }> = {
  'essay-guide': {
    name: 'The Ultimate College Essay Guide',
    downloadUrl: `${process.env.NEXT_PUBLIC_APP_URL}/resources/essay-guide.pdf`,
  },
  'common-mistakes': {
    name: '10 Common Essay Mistakes (And How to Fix Them)',
    downloadUrl: `${process.env.NEXT_PUBLIC_APP_URL}/resources/common-mistakes.pdf`,
  },
  'prompt-guide': {
    name: 'How to Answer Any Essay Prompt',
    downloadUrl: `${process.env.NEXT_PUBLIC_APP_URL}/resources/prompt-guide.pdf`,
  },
  'ivy-tips': {
    name: 'What Ivy League Schools Actually Want',
    downloadUrl: `${process.env.NEXT_PUBLIC_APP_URL}/resources/ivy-tips.pdf`,
  },
};

async function sendLeadMagnetEmail(email: string, leadMagnetId: string) {
  const leadMagnet = LEAD_MAGNETS[leadMagnetId];
  if (!leadMagnet) return;

  try {
    await sendEmail({
      to: email,
      subject: `Your Free Resource: ${leadMagnet.name}`,
      html: leadMagnetEmail({
        email,
        downloadLink: leadMagnet.downloadUrl,
        resourceName: leadMagnet.name,
      }),
    });
  } catch (error) {
    console.error('Failed to send lead magnet email:', error);
  }
}
