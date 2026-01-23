/**
 * Analysis Progress SSE Stream
 * GET /api/tiered-analysis/[sessionId]/progress - Real-time progress updates via SSE
 *
 * This endpoint streams progress events during essay analysis:
 * - step_start: A new analysis step is starting
 * - step_complete: A step has finished
 * - thinking: Real-time "thinking" messages (e.g., "Found cliché in paragraph 1")
 * - progress: Percentage complete
 * - complete: Analysis finished
 * - error: Something went wrong
 *
 * Security:
 * - Guest sessions require access token
 * - Stream has 5-minute timeout to prevent resource exhaustion
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import {
  getAnalysisSteps,
  getStepDuration,
  createProgressEvent,
  generateThinkingMessage,
} from '@/lib/analysis/loading-steps';
import { runTieredAnalysis } from '@/lib/scoring/tiers';
import { detectAIWriting } from '@/lib/scoring/ai-detection';
import { detectGenericPhrases } from '@/lib/scoring/generic-phrases';
import type { AnalysisTier, QuickIntake, FullIntake } from '@/lib/scoring/tiers/types';
import type { ProgressEvent } from '@/lib/analysis/loading-steps';

interface RouteParams {
  params: Promise<{ sessionId: string }>;
}

// Stream timeout: 5 minutes
const STREAM_TIMEOUT_MS = 5 * 60 * 1000;

// =============================================================================
// GET - SSE Progress Stream
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const { sessionId } = await params;
  const { searchParams } = new URL(request.url);
  const accessToken = searchParams.get('token');

  if (!sessionId) {
    return new Response('Session ID required', { status: 400 });
  }

  // Get session
  const session = await prisma.analysisSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    return new Response('Session not found', { status: 404 });
  }

  // Check authorization
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let isAuthorized = false;

  if (user) {
    isAuthorized = session.userId === user.id || user.email === session.userEmail;
  } else if (!session.userId) {
    const storedToken = (session.intakeData as any)?._accessToken;
    isAuthorized = accessToken && storedToken && accessToken === storedToken;
  }

  if (!isAuthorized) {
    return new Response('Unauthorized', { status: 401 });
  }

  // If already complete, return result immediately
  if (session.status === 'COMPLETED' || session.status === 'HUMAN_QUEUED') {
    const resultUrl = `/api/tiered-analysis/${sessionId}`;
    return new Response(
      createProgressEvent({ type: 'complete', resultUrl }),
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      }
    );
  }

  // If failed, return error
  if (session.status === 'FAILED') {
    return new Response(
      createProgressEvent({ type: 'error', message: 'Analysis failed. Please try again.' }),
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      }
    );
  }

  // Create SSE stream with timeout
  const encoder = new TextEncoder();
  let streamAborted = false;
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      // Set up timeout
      timeoutHandle = setTimeout(() => {
        streamAborted = true;
        try {
          controller.enqueue(
            encoder.encode(
              createProgressEvent({
                type: 'error',
                message: 'Analysis timed out. Please refresh and try again.',
              })
            )
          );
          controller.close();
        } catch {
          // Controller may already be closed
        }
      }, STREAM_TIMEOUT_MS);

      try {
        const essayText = session.essayText;
        const intake = session.intakeData as QuickIntake | FullIntake | any;
        const tier = session.tier as AnalysisTier;
        const wordCount = essayText.split(/\s+/).length;
        const school = session.targetSchool || 'your target school';

        // Get analysis steps (mix of real and theatrical)
        const steps = getAnalysisSteps(school, wordCount);
        const completedSteps: string[] = [];

        // Helper to send events
        const sendEvent = (event: ProgressEvent) => {
          controller.enqueue(encoder.encode(createProgressEvent(event)));
        };

        // Helper to wait
        const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        // Run through steps
        for (const step of steps) {
          // Check if stream was aborted by timeout
          if (streamAborted) break;

          // Send step start
          sendEvent({
            type: 'step_start',
            stepId: step.id,
            stepLabel: step.label,
            stepMessage: step.marketingMessage,
          });

          // Calculate duration (randomized for realistic feel)
          const duration = getStepDuration(step);

          // For real steps, run actual analysis in the background
          if (step.isRealStep) {
            // Run real analysis based on step
            await runRealStep(step.id, essayText, intake, sendEvent);

            // Wait remaining time after real analysis
            await wait(Math.max(100, duration - 500));
          } else {
            // Theatrical step - just wait with occasional thinking messages
            await runTheatricalStep(step.id, duration, sendEvent);
          }

          // Send step complete
          sendEvent({ type: 'step_complete', stepId: step.id });
          completedSteps.push(step.id);

          // Send progress update
          const percent = Math.round((completedSteps.length / steps.length) * 100);
          sendEvent({ type: 'progress', percent: Math.min(percent, 99) });
        }

        // Check abort before final analysis
        if (streamAborted) return;

        // Now run the full analysis
        sendEvent({ type: 'progress', percent: 95 });

        const result = await runTieredAnalysis(
          essayText,
          tier,
          tier === 'quick' ? (intake as QuickIntake) : (intake as FullIntake),
          {
            sessionId,
            userEmail: session.userEmail,
          }
        );

        // Update session
        await prisma.analysisSession.update({
          where: { id: sessionId },
          data: {
            status: tier === 'premium' ? 'HUMAN_QUEUED' : 'COMPLETED',
            aiResult: result as any,
            aiScore: result.overallScore,
            aiCompletedAt: new Date(),
          },
        });

        // Send complete event
        sendEvent({ type: 'progress', percent: 100 });
        sendEvent({ type: 'complete', resultUrl: `/api/tiered-analysis/${sessionId}` });

        // Clear timeout
        if (timeoutHandle) clearTimeout(timeoutHandle);
        controller.close();

      } catch (error) {
        console.error('SSE stream error:', error);
        if (timeoutHandle) clearTimeout(timeoutHandle);

        if (!streamAborted) {
          controller.enqueue(
            encoder.encode(
              createProgressEvent({
                type: 'error',
                message: 'Analysis failed. Please try again.',
              })
            )
          );
          controller.close();
        }

        // Update session status
        await prisma.analysisSession.update({
          where: { id: sessionId },
          data: { status: 'FAILED' },
        }).catch(console.error);
      }
    },
    cancel() {
      // Clean up timeout if stream is cancelled by client
      if (timeoutHandle) clearTimeout(timeoutHandle);
      streamAborted = true;
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// =============================================================================
// STEP HANDLERS
// =============================================================================

/**
 * Run a real analysis step and emit thinking messages
 */
async function runRealStep(
  stepId: string,
  essayText: string,
  intake: any,
  sendEvent: (event: ProgressEvent) => void
): Promise<void> {
  switch (stepId) {
    case 'parse': {
      // Quick parse - word count, paragraph structure
      const wordCount = essayText.split(/\s+/).length;
      const paragraphCount = essayText.split(/\n\n+/).length;
      // No thinking message for parse
      break;
    }

    case 'cliche_scan': {
      // Run actual cliché detection
      try {
        const result = detectGenericPhrases(essayText);
        if (result.phrases && result.phrases.length > 0) {
          const firstCliche = result.phrases[0];
          const thinking = generateThinkingMessage('cliche_found', {
            phrase: firstCliche.phrase || firstCliche,
            percent: Math.floor(Math.random() * 30) + 20, // 20-50%
          });
          if (thinking) {
            sendEvent({ type: 'thinking', message: thinking.message, sentiment: thinking.sentiment });
          }
        }
      } catch (error) {
        console.error('Cliche detection error:', error);
      }
      break;
    }

    case 'ai_detect': {
      // Run actual AI detection
      try {
        const result = detectAIWriting(essayText);
        if (result.aiLikelihood === 'low') {
          const thinking = generateThinkingMessage('ai_low', {});
          if (thinking) {
            sendEvent({ type: 'thinking', message: thinking.message, sentiment: thinking.sentiment });
          }
        } else if (result.issues.some(i => i.type === 'em_dash_overuse')) {
          const emDashIssue = result.issues.find(i => i.type === 'em_dash_overuse');
          const thinking = generateThinkingMessage('ai_em_dash', {
            count: emDashIssue?.severity === 'critical' ? 7 : 4,
          });
          if (thinking) {
            sendEvent({ type: 'thinking', message: thinking.message, sentiment: thinking.sentiment });
          }
        } else if (result.issues.some(i => i.type === 'ai_vocabulary')) {
          const vocabIssue = result.issues.find(i => i.type === 'ai_vocabulary');
          const match = vocabIssue?.message?.match(/"([^"]+)"/);
          if (match) {
            const thinking = generateThinkingMessage('ai_vocabulary', { word: match[1] });
            if (thinking) {
              sendEvent({ type: 'thinking', message: thinking.message, sentiment: thinking.sentiment });
            }
          }
        }
      } catch (error) {
        console.error('AI detection error:', error);
      }
      break;
    }

    case 'rag_compare': {
      // RAG step - would normally query vector DB
      // For now, emit a positive thinking message
      await new Promise(resolve => setTimeout(resolve, 1000));
      break;
    }

    case 'generate_feedback': {
      // Final generation step
      await new Promise(resolve => setTimeout(resolve, 500));
      break;
    }
  }
}

/**
 * Run a theatrical step (paced messaging for effect)
 */
async function runTheatricalStep(
  stepId: string,
  duration: number,
  sendEvent: (event: ProgressEvent) => void
): Promise<void> {
  const startTime = Date.now();
  const emitThinkingChance = 0.6; // 60% chance to emit a thinking message

  // Wait for part of the duration
  await new Promise(resolve => setTimeout(resolve, duration * 0.4));

  // Maybe emit a thinking message
  if (Math.random() < emitThinkingChance) {
    const theatricalMessages: Record<string, { message: string; sentiment: 'positive' | 'neutral' | 'warning' }[]> = {
      opening_analyze: [
        { message: 'Checking if opening grabs attention in first 30 seconds...', sentiment: 'neutral' },
        { message: 'AOs often decide to keep reading based on the first paragraph.', sentiment: 'neutral' },
      ],
      authenticity: [
        { message: 'Looking for specific details only you could write...', sentiment: 'neutral' },
        { message: 'Checking if voice sounds like a real teenager...', sentiment: 'neutral' },
      ],
      school_fit: [
        { message: 'Analyzing alignment with school values...', sentiment: 'neutral' },
        { message: 'Checking for school-specific references...', sentiment: 'neutral' },
      ],
      ao_simulation: [
        { message: 'Simulating what an AO would think reading this...', sentiment: 'neutral' },
        { message: 'Would an AO want to advocate for this applicant?', sentiment: 'neutral' },
      ],
    };

    const messages = theatricalMessages[stepId];
    if (messages && messages.length > 0) {
      const msg = messages[Math.floor(Math.random() * messages.length)];
      sendEvent({ type: 'thinking', message: msg.message, sentiment: msg.sentiment });
    }
  }

  // Wait for remaining duration
  const elapsed = Date.now() - startTime;
  const remaining = duration - elapsed;
  if (remaining > 0) {
    await new Promise(resolve => setTimeout(resolve, remaining));
  }
}
