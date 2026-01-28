import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/config';
import { prisma } from '@/lib/prisma';
import { analyzeEssay } from '@/lib/ai/analyzer';
import { sendEmail, analysisCompleteEmail, reviewAssignedEmail } from '@/lib/email/send';
import { trackUpsellPurchase } from '@/lib/analytics/track';
import Stripe from 'stripe';

// =============================================================================
// WEBHOOK RELIABILITY UTILITIES
// =============================================================================

// In-memory deduplication cache (cleared on restart, last line of defense)
const processedEvents = new Map<string, number>();
const DEDUP_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const DEDUP_CACHE_MAX_SIZE = 1000;

function isEventProcessed(eventId: string): boolean {
  const timestamp = processedEvents.get(eventId);
  if (timestamp && Date.now() - timestamp < DEDUP_CACHE_TTL) {
    return true;
  }
  return false;
}

function markEventProcessed(eventId: string): void {
  // Clean old entries if cache is too large
  if (processedEvents.size > DEDUP_CACHE_MAX_SIZE) {
    const now = Date.now();
    for (const [id, ts] of processedEvents.entries()) {
      if (now - ts > DEDUP_CACHE_TTL) {
        processedEvents.delete(id);
      }
    }
  }
  processedEvents.set(eventId, Date.now());
}

// Timeout wrapper for background operations
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

// Structured logging helper
function webhookLog(level: 'info' | 'error' | 'warn', eventId: string, message: string, data?: Record<string, unknown>) {
  const log = { timestamp: new Date().toISOString(), eventId, message, ...data };
  if (level === 'error') {
    console.error('[WEBHOOK]', JSON.stringify(log));
  } else if (level === 'warn') {
    console.warn('[WEBHOOK]', JSON.stringify(log));
  } else {
    console.log('[WEBHOOK]', JSON.stringify(log));
  }
}

// =============================================================================
// MAIN WEBHOOK HANDLER
// =============================================================================

/**
 * POST /api/webhook/stripe
 * Handle Stripe webhook events
 *
 * Reliability features:
 * - Event ID deduplication (in-memory + DB checks)
 * - Signature verification
 * - Structured logging
 * - Timeout protection on background tasks
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  // Validate environment
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[WEBHOOK] STRIPE_WEBHOOK_SECRET is not configured');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error('[WEBHOOK] Signature verification failed:', error);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  // Event ID deduplication (fast in-memory check)
  if (isEventProcessed(event.id)) {
    webhookLog('info', event.id, 'Duplicate event skipped (in-memory cache)', { type: event.type });
    return NextResponse.json({ received: true, skipped: true, reason: 'duplicate' });
  }

  try {
    webhookLog('info', event.id, 'Processing webhook event', { type: event.type });

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;
        const analysisSessionId = session.metadata?.analysisSessionId;

        // Handle tiered-analysis payments
        if (analysisSessionId) {
          await handleTieredAnalysisPayment(session, analysisSessionId);
          break;
        }

        // Handle legacy order-based payments
        if (orderId) {
          // Check if order is already paid (prevent duplicate processing)
          const existingOrder = await prisma.order.findUnique({
            where: { id: orderId },
          });

          if (existingOrder?.status === 'PAID') {
            console.log(`Order ${orderId} already processed, skipping duplicate webhook`);
            return NextResponse.json({ received: true, skipped: true });
          }

          // Update order status
          const order = await prisma.order.update({
            where: { id: orderId },
            data: {
              status: 'PAID',
              stripePaymentId: session.payment_intent as string,
            },
            include: {
              user: {
                include: {
                  profile: true,
                },
              },
              essay: {
                include: {
                  versions: {
                    orderBy: { versionIndex: 'desc' },
                    take: 1,
                  },
                },
              },
            },
          });

          // Create audit log
          await prisma.auditLog.create({
            data: {
              userId: session.metadata?.userId,
              action: 'PAYMENT_COMPLETED',
              resource: 'ORDER',
              details: {
                orderId,
                amount: session.amount_total,
                package: session.metadata?.package,
              },
            },
          });

          // TRACK REFERRAL CONVERSION
          // If user was referred and this is their first purchase, update referral status
          const referral = await prisma.referral.findFirst({
            where: {
              referredUserId: order.userId,
              status: 'SIGNED_UP', // Only convert if not already converted
            },
          });

          if (referral) {
            await prisma.referral.update({
              where: { id: referral.id },
              data: {
                status: 'CONVERTED',
                purchasedAt: new Date(),
                rewardAmount: 2000, // $20 credit in cents
              },
            });

            // Track analytics for referral conversion
            await prisma.analyticsEvent.create({
              data: {
                userId: referral.referrerId,
                event: 'referral_converted',
                properties: {
                  referredUserId: order.userId,
                  rewardAmount: 2000,
                  purchaseAmount: session.amount_total,
                  package: session.metadata?.package,
                },
              },
            });

            console.log(`🎉 Referral converted! Referrer ${referral.referrerId} earned $20 credit`);
          }

          // Track upsell purchase if this was an upsell (metadata contains previousPackage)
          if (session.metadata?.previousPackage && session.metadata?.package) {
            trackUpsellPurchase(
              session.metadata.package,
              session.metadata.previousPackage,
              session.amount_total || 0
            );
          }

          // TRIGGER AI ANALYSIS AUTOMATICALLY
          if (order.essay) {
            const latestVersion = order.essay.versions[0];

            // Run AI analysis in background with timeout (5 min max)
            // Don't await - let it run async, but ensure it doesn't hang forever
            withTimeout(
              analyzeEssay({
                essayText: latestVersion.content,
                essayType: order.essay.type.toLowerCase().replace('_', ' '),
                school: order.essay.targetSchool || undefined,
                prompt: order.essay.promptText,
                wordLimit: order.essay.wordLimit || undefined,
                hasPreviousDraft: latestVersion.versionIndex > 1,
              }),
              5 * 60 * 1000, // 5 minute timeout
              `AI analysis for order ${orderId}`
            )
              .then(async (analysisResult) => {
                // Store analysis in database
                await prisma.aIAnalysis.create({
                  data: {
                    versionId: latestVersion.id,
                    analysisJson: analysisResult as any,
                    overallScore: analysisResult.overall.score_100,
                    modelRef: 'claude-3-5-sonnet-20241022',
                    commonsFlags: {
                      create: Object.entries(analysisResult.commons_check).map(
                        ([key, value]) => ({
                          key,
                          flag: value.flag,
                          evidence: value.evidence || value.phrases || (value.notes ? [value.notes] : []),
                        })
                      ),
                    },
                  },
                });

                console.log(`✅ AI analysis complete for version ${latestVersion.id}`);

                // Send analysis complete email
                const userName = order.user.profile?.name || order.user.email.split('@')[0];
                await sendEmail({
                  to: order.user.email,
                  subject: '✨ Your Analysis is Ready!',
                  html: analysisCompleteEmail(userName, order.essay?.type.replace(/_/g, ' ') || 'Essay', Math.round(analysisResult.overall.score_100)),
                });

                // If human review package, create review assignment
                const needsHumanReview = ['HUMAN_LITE', 'HUMAN_OVERALL_REVIEW', 'DEEP_REVIEW', 'HUMAN_FULL_1', 'HUMAN_FULL_3', 'HUMAN_FULL_5'].includes(order.package);

                if (needsHumanReview) {
                  // Calculate due date based on package
                  const hoursToAdd = order.package === 'HUMAN_LITE' ? 48 : order.package === 'DEEP_REVIEW' ? 24 : 72;
                  const dueAt = new Date(Date.now() + hoursToAdd * 60 * 60 * 1000);

                  await prisma.review.create({
                    data: {
                      orderId: order.id,
                      versionId: latestVersion.id,
                      status: 'ASSIGNED',
                      dueAt,
                    },
                  });

                  console.log(`📝 Human review assigned for order ${order.id}`);

                  // Send review assigned email
                  await sendEmail({
                    to: order.user.email,
                    subject: '📝 Expert Review Assigned!',
                    html: reviewAssignedEmail(userName, dueAt.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })),
                  });
                }
              })
              .catch((error) => {
                webhookLog('error', event.id, 'Background AI analysis failed', {
                  orderId,
                  versionId: latestVersion.id,
                  error: String(error),
                });
              });
          }
        }
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;

        if (orderId) {
          await prisma.order.update({
            where: { id: orderId },
            data: { status: 'CANCELLED' },
          });
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntent = charge.payment_intent as string;

        const order = await prisma.order.findFirst({
          where: { stripePaymentId: paymentIntent },
        });

        if (order) {
          await prisma.order.update({
            where: { id: order.id },
            data: { status: 'REFUNDED' },
          });

          await prisma.refund.create({
            data: {
              orderId: order.id,
              amount: charge.amount_refunded,
              stripeRefundId: charge.refunds?.data[0]?.id,
            },
          });
        }
        break;
      }
    }

    // Mark event as processed to prevent duplicates
    markEventProcessed(event.id);
    webhookLog('info', event.id, 'Webhook processed successfully', { type: event.type });
    return NextResponse.json({ received: true });
  } catch (error) {
    webhookLog('error', event.id, 'Webhook handler error', { error: String(error), type: event.type });
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

// =============================================================================
// TIERED ANALYSIS PAYMENT HANDLER
// =============================================================================

async function handleTieredAnalysisPayment(
  session: Stripe.Checkout.Session,
  analysisSessionId: string
) {
  const tier = session.metadata?.tier;
  const userId = session.metadata?.userId;
  const isUpgrade = session.metadata?.type === 'upgrade';

  // Check if already processed
  const existingSession = await prisma.analysisSession.findUnique({
    where: { id: analysisSessionId },
  });

  if (!existingSession) {
    console.error(`Analysis session ${analysisSessionId} not found`);
    return;
  }

  // For initial purchases, check if already processed
  if (!isUpgrade && existingSession.status !== 'PENDING') {
    console.log(`Analysis session ${analysisSessionId} already processed (status: ${existingSession.status}), skipping`);
    return;
  }

  // Update analysis session with payment info and start analysis
  await prisma.analysisSession.update({
    where: { id: analysisSessionId },
    data: {
      stripePaymentId: session.id,
      paidAmount: session.amount_total || 0,
      // Update tier if this is an upgrade
      ...(isUpgrade && session.metadata?.toTier ? { tier: session.metadata.toTier } : {}),
      // Set status to ANALYZING to trigger analysis
      status: 'ANALYZING',
    },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: userId || undefined,
      action: isUpgrade ? 'TIERED_ANALYSIS_UPGRADE' : 'TIERED_ANALYSIS_PAYMENT',
      resource: 'ANALYSIS_SESSION',
      details: {
        sessionId: analysisSessionId,
        tier,
        ...(isUpgrade ? { fromTier: session.metadata?.fromTier, toTier: session.metadata?.toTier } : {}),
        amount: session.amount_total,
      },
    },
  });

  // Trigger async analysis
  const internalWebhookSecret = process.env.WEBHOOK_SECRET;
  if (!internalWebhookSecret) {
    console.error('[SECURITY] WEBHOOK_SECRET not configured - cannot trigger analysis');
    return;
  }

  const analysisUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/tiered-analysis/${analysisSessionId}/run`;
  fetch(analysisUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Secret': internalWebhookSecret,
    },
    body: JSON.stringify({
      sessionId: analysisSessionId,
      tier: isUpgrade ? session.metadata?.toTier : tier,
    }),
  }).catch(err => {
    console.error('Failed to trigger analysis:', err);
  });

  // For premium tier, queue human review after AI analysis completes
  // (This will be handled by the analysis completion handler)

  console.log(`✅ Tiered analysis payment processed: ${analysisSessionId} (${tier})${isUpgrade ? ' [UPGRADE]' : ''}`);
}

// =============================================================================
// HUMAN REVIEW QUEUE HANDLER
// =============================================================================

async function queueHumanReview(analysisSession: any) {
  // Find available reviewer with matching expertise
  const targetSchool = analysisSession.targetSchool?.toLowerCase();

  const availableReviewer = await prisma.humanReviewer.findFirst({
    where: {
      isActive: true,
      schoolExpertise: targetSchool ? { has: targetSchool } : undefined,
    },
    orderBy: [
      { totalReviews: 'asc' }, // Prefer reviewers with fewer total reviews for load balancing
    ],
  });

  // Calculate due date (48 hours from now)
  const dueAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

  // Create human review assignment with required fields
  const assignment = await prisma.humanReviewAssignment.create({
    data: {
      reviewerId: availableReviewer?.id,
      studentEmail: analysisSession.userEmail,
      essayText: analysisSession.essayText,
      targetSchool: analysisSession.targetSchool,
      essayType: analysisSession.essayType,
      intakeData: analysisSession.intakeData as any,
      aiAnalysis: analysisSession.aiResult as any || {},
      dueAt,
      status: availableReviewer ? 'ASSIGNED' : 'QUEUED',
      assignedAt: availableReviewer ? new Date() : undefined,
    },
  });

  // Link to analysis session
  await prisma.analysisSession.update({
    where: { id: analysisSession.id },
    data: { humanReviewId: assignment.id },
  });

  // Send notification email to student
  if (analysisSession.userEmail && analysisSession.userEmail !== 'anonymous@temp.com') {
    try {
      await sendEmail({
        to: analysisSession.userEmail,
        subject: '📝 Your Expert Review is Queued!',
        html: reviewAssignedEmail(
          analysisSession.userEmail.split('@')[0],
          dueAt.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        ),
      });
    } catch (emailError) {
      console.error('Failed to send review queued email:', emailError);
    }
  }

  console.log(`📝 Human review ${availableReviewer ? 'assigned' : 'queued'} for session ${analysisSession.id}`);
}
