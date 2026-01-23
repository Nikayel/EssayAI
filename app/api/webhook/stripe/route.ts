import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/config';
import { prisma } from '@/lib/prisma';
import { analyzeEssay } from '@/lib/ai/analyzer';
import { sendEmail, analysisCompleteEmail, reviewAssignedEmail } from '@/lib/email/send';
import { trackUpsellPurchase } from '@/lib/analytics/track';
import Stripe from 'stripe';

/**
 * POST /api/webhook/stripe
 * Handle Stripe webhook events
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  try {
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

            // Run AI analysis in background (don't await - let it run async)
            analyzeEssay({
              essayText: latestVersion.content,
              essayType: order.essay.type.toLowerCase().replace('_', ' '),
              school: order.essay.targetSchool || undefined,
              prompt: order.essay.promptText,
              wordLimit: order.essay.wordLimit || undefined,
              hasPreviousDraft: latestVersion.versionIndex > 1,
            })
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
                  html: analysisCompleteEmail(userName, order.essay.type.replace(/_/g, ' '), Math.round(analysisResult.overall.score_100)),
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
                console.error('AI analysis failed:', error);
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

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
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

  // Check if already processed
  const existingSession = await prisma.analysisSession.findUnique({
    where: { id: analysisSessionId },
  });

  if (!existingSession) {
    console.error(`Analysis session ${analysisSessionId} not found`);
    return;
  }

  if (existingSession.stripePaymentId) {
    console.log(`Analysis session ${analysisSessionId} already processed, skipping`);
    return;
  }

  // Update analysis session with payment info
  await prisma.analysisSession.update({
    where: { id: analysisSessionId },
    data: {
      stripePaymentId: session.id,
      paidAmount: session.amount_total || 0,
    },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: userId || undefined,
      action: 'TIERED_ANALYSIS_PAYMENT',
      resource: 'ANALYSIS_SESSION',
      details: {
        sessionId: analysisSessionId,
        tier,
        amount: session.amount_total,
      },
    },
  });

  // For premium tier, queue human review if AI is complete
  if (tier === 'premium' && existingSession.status === 'HUMAN_QUEUED') {
    await queueHumanReview(existingSession);
  }

  console.log(`✅ Tiered analysis payment processed: ${analysisSessionId} (${tier})`);
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

  // Create human review assignment
  const assignment = await prisma.humanReviewAssignment.create({
    data: {
      sessionId: analysisSession.id,
      reviewerId: availableReviewer?.id,
      studentEmail: analysisSession.userEmail,
      targetSchool: analysisSession.targetSchool,
      essayType: analysisSession.essayType,
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
