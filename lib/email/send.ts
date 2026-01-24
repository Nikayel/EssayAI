import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send email via Resend
 */
export async function sendEmail(params: EmailParams) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'IvyWay <noreply@ivyway.ai>',
      to: params.to,
      subject: params.subject,
      html: params.html,
    });

    if (error) {
      console.error('Email send error:', error);
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Email send failed:', error);
    return { success: false, error };
  }
}

/**
 * Email templates
 */

export function analysisCompleteEmail(userName: string, essayType: string, score: number) {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; }
    .score-badge { background: #10b981; color: white; padding: 10px 20px; border-radius: 50px; display: inline-block; font-size: 24px; font-weight: bold; }
    .button { background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 20px; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✨ Your Analysis is Ready!</h1>
    </div>
    <div class="content">
      <p>Hi ${userName},</p>
      <p>Great news! We've completed the AI analysis of your <strong>${essayType}</strong> essay.</p>

      <div style="text-align: center; margin: 30px 0;">
        <div class="score-badge">${score}/100</div>
        <p style="margin-top: 10px; color: #6b7280;">Overall Score</p>
      </div>

      <p>Your analysis includes:</p>
      <ul>
        <li>7-dimension rubric breakdown</li>
        <li>Top 5 improvement suggestions</li>
        <li>Commons Check flags</li>
        <li>Next action steps</li>
      </ul>

      <div style="text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">
          View Full Analysis →
        </a>
      </div>
    </div>
    <div class="footer">
      <p>IvyWay - Voice-preserving essay feedback</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color: #2563eb;">essayedgeai.com</a></p>
    </div>
  </div>
</body>
</html>
  `;
}

export function reviewAssignedEmail(userName: string, dueDate: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; }
    .due-date { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
    .button { background: #8b5cf6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 20px; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📝 Expert Review Assigned!</h1>
    </div>
    <div class="content">
      <p>Hi ${userName},</p>
      <p>Your essay has been assigned to one of our expert reviewers!</p>

      <div class="due-date">
        <strong>Expected Delivery:</strong> ${dueDate}
      </div>

      <p>What happens next:</p>
      <ol>
        <li>Your reviewer will thoroughly analyze your essay</li>
        <li>You'll receive detailed margin comments</li>
        <li>A comprehensive summary with recommendations</li>
        <li>You can message your reviewer directly</li>
      </ol>

      <div style="text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">
          Track Progress →
        </a>
      </div>
    </div>
    <div class="footer">
      <p>IvyWay - Expert human review</p>
    </div>
  </div>
</body>
</html>
  `;
}

// =============================================================================
// WELCOME & ONBOARDING EMAILS
// =============================================================================

export function welcomeEmail(userName: string, referralCode?: string) {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`;
  const referralSection = referralCode ? `
      <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; font-weight: 600; color: #166534;">Your referral code: ${referralCode}</p>
        <p style="margin: 5px 0 0; font-size: 14px; color: #15803d;">Share with friends - you both get $20 off!</p>
      </div>
  ` : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #fafaf9; padding: 30px; }
    .step { display: flex; align-items: flex-start; margin: 15px 0; padding: 15px; background: white; border-radius: 8px; border: 1px solid #e7e5e4; }
    .step-number { background: #7c3aed; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; flex-shrink: 0; margin-right: 15px; font-size: 14px; }
    .button { background: #7c3aed; color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; display: inline-block; margin-top: 20px; font-weight: 600; }
    .button:hover { background: #6d28d9; }
    .why-box { background: #f5f3ff; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #78716c; font-size: 14px; }
    .highlight { color: #7c3aed; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 28px;">Welcome to IvyWay!</h1>
      <p style="margin: 10px 0 0; opacity: 0.9;">Your essay's about to get a lot stronger</p>
    </div>
    <div class="content">
      <p>Hi ${userName},</p>
      <p>You just made a smart move. Most students submit essays that admissions officers forget 5 minutes later. You're not going to be one of them.</p>

      <div class="why-box">
        <p style="margin: 0 0 10px; font-weight: 600;">Here's what makes us different:</p>
        <ul style="margin: 0; padding-left: 20px;">
          <li><span class="highlight">Not Grammarly</span> - We analyze what admissions officers actually look for</li>
          <li><span class="highlight">Not ChatGPT</span> - We preserve YOUR voice, never rewrite it</li>
          <li><span class="highlight">School-specific</span> - Know if your essay fits Harvard vs. Yale vs. Cornell</li>
        </ul>
      </div>

      <h3 style="margin-bottom: 15px;">Get started in 3 steps:</h3>

      <div class="step">
        <div class="step-number">1</div>
        <div>
          <strong>Paste your essay</strong>
          <p style="margin: 5px 0 0; color: #78716c; font-size: 14px;">Start with your personal statement or any supplemental essay</p>
        </div>
      </div>

      <div class="step">
        <div class="step-number">2</div>
        <div>
          <strong>Get your free Commons Check</strong>
          <p style="margin: 5px 0 0; color: #78716c; font-size: 14px;">See if your essay has red flags that hurt applications</p>
        </div>
      </div>

      <div class="step">
        <div class="step-number">3</div>
        <div>
          <strong>Upgrade if you want more</strong>
          <p style="margin: 5px 0 0; color: #78716c; font-size: 14px;">Full AI analysis ($29) or human expert review ($129)</p>
        </div>
      </div>

      ${referralSection}

      <div style="text-align: center; margin-top: 30px;">
        <a href="${dashboardUrl}" class="button">
          Analyze Your First Essay →
        </a>
      </div>

      <p style="text-align: center; color: #78716c; font-size: 14px; margin-top: 20px;">
        Free check for essays up to 650 words. No credit card required.
      </p>
    </div>
    <div class="footer">
      <p style="margin: 0;">IvyWay - Blunt, actionable essay feedback</p>
      <p style="margin: 5px 0 0;"><a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color: #7c3aed;">essayedgeai.com</a></p>
    </div>
  </div>
</body>
</html>
  `;
}

export function inactivityReminderEmail(userName: string, daysInactive: number) {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`;

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #fafaf9; padding: 30px; }
    .stat { background: white; border-radius: 8px; padding: 20px; margin: 15px 0; text-align: center; border: 1px solid #e7e5e4; }
    .button { background: #7c3aed; color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; display: inline-block; margin-top: 20px; font-weight: 600; }
    .footer { text-align: center; padding: 20px; color: #78716c; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">Your Essay is Waiting</h1>
    </div>
    <div class="content">
      <p>Hi ${userName},</p>
      <p>We noticed you haven't submitted an essay yet. Application deadlines don't wait, and neither should your essays.</p>

      <div class="stat">
        <p style="font-size: 36px; font-weight: bold; margin: 0; color: #7c3aed;">2.3x</p>
        <p style="margin: 5px 0 0; color: #78716c;">More likely to get accepted with feedback (research-backed)</p>
      </div>

      <p>Most students who analyze their essays with us:</p>
      <ul>
        <li>Find 3-5 critical improvements they missed</li>
        <li>Increase their confidence before submitting</li>
        <li>Save time on rewrites with specific fixes</li>
      </ul>

      <div style="text-align: center;">
        <a href="${dashboardUrl}" class="button">
          Start Your Free Analysis →
        </a>
      </div>
    </div>
    <div class="footer">
      <p>IvyWay - Don't submit blind</p>
    </div>
  </div>
</body>
</html>
  `;
}

export function reviewDeliveredEmail(userName: string, essayType: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; }
    .highlight { background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; }
    .button { background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 20px; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Your Review is Complete!</h1>
    </div>
    <div class="content">
      <p>Hi ${userName},</p>
      <p>Excellent news! Your expert reviewer has completed their analysis of your <strong>${essayType}</strong> essay.</p>

      <div class="highlight">
        <p><strong>✓</strong> Detailed margin comments added</p>
        <p><strong>✓</strong> Comprehensive summary included</p>
        <p><strong>✓</strong> Specific improvement recommendations</p>
      </div>

      <p>Take your time reviewing the feedback, and feel free to ask your reviewer any questions via messaging!</p>

      <div style="text-align: center;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">
          View Your Review →
        </a>
      </div>
    </div>
    <div class="footer">
      <p>IvyWay - Transform your essays</p>
    </div>
  </div>
</body>
</html>
  `;
}

// =============================================================================
// TIERED ANALYSIS EMAIL TEMPLATES
// =============================================================================

export function tieredAnalysisCompleteEmail(
  userName: string,
  tier: 'quick' | 'standard' | 'premium',
  score: number,
  sessionId: string,
  accessToken?: string
) {
  const tierLabels = {
    quick: 'Essay Score',
    standard: 'Full Analysis',
    premium: 'Expert Review',
  };

  const tierColors = {
    quick: '#3b82f6',
    standard: '#8b5cf6',
    premium: '#ec4899',
  };

  const resultUrl = accessToken
    ? `${process.env.NEXT_PUBLIC_APP_URL}/analysis/${sessionId}?token=${accessToken}`
    : `${process.env.NEXT_PUBLIC_APP_URL}/analysis/${sessionId}`;

  const scoreLabel = score >= 80 ? 'Exceptional' : score >= 65 ? 'Strong' : score >= 50 ? 'Competitive' : 'Developing';
  const scoreColor = score >= 80 ? '#10b981' : score >= 65 ? '#3b82f6' : score >= 50 ? '#f59e0b' : '#ef4444';

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: ${tierColors[tier]}; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; }
    .score-box { text-align: center; margin: 25px 0; padding: 25px; background: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
    .score-number { font-size: 48px; font-weight: bold; color: ${scoreColor}; }
    .score-label { font-size: 18px; color: ${scoreColor}; margin-top: 5px; }
    .tier-badge { background: ${tierColors[tier]}20; color: ${tierColors[tier]}; padding: 8px 16px; border-radius: 50px; display: inline-block; font-size: 14px; font-weight: 600; }
    .button { background: ${tierColors[tier]}; color: white; padding: 14px 35px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 20px; font-weight: 600; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
    .note { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin-top: 20px; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Your ${tierLabels[tier]} is Ready!</h1>
    </div>
    <div class="content">
      <p>Hi ${userName},</p>
      <p>Your essay analysis is complete. Here's a quick look at your results:</p>

      <div class="score-box">
        <div class="tier-badge">${tierLabels[tier]}</div>
        <div class="score-number">${score}</div>
        <div class="score-label">${scoreLabel}</div>
      </div>

      ${tier === 'quick' ? `
      <p>Your analysis includes:</p>
      <ul>
        <li>Overall score with interpretation</li>
        <li>3-5 specific, actionable improvements</li>
        <li>AI detection check</li>
      </ul>
      <p style="color: #6b7280; font-size: 14px;">Want more detailed feedback? Upgrade to our Full Analysis or Expert Review.</p>
      ` : tier === 'standard' ? `
      <p>Your analysis includes:</p>
      <ul>
        <li>5-dimension detailed breakdown</li>
        <li>Line-by-line annotations with suggested fixes</li>
        <li>School-specific deep dive</li>
        <li>AO perspective insights</li>
        <li>Personalized improvement roadmap</li>
      </ul>
      ` : `
      <p>Your AI analysis is ready! Your expert reviewer has been assigned and will deliver comprehensive human feedback within 48 hours.</p>
      <p>You'll receive another email when your expert review is complete.</p>
      `}

      <div style="text-align: center;">
        <a href="${resultUrl}" class="button">
          View Full Results →
        </a>
      </div>

      ${accessToken ? `
      <div class="note">
        <strong>Important:</strong> Save this email! Since you're a guest user, you'll need this link to access your results.
      </div>
      ` : ''}
    </div>
    <div class="footer">
      <p>IvyWay - Blunt, actionable essay feedback</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color: ${tierColors[tier]};">essayedgeai.com</a></p>
    </div>
  </div>
</body>
</html>
  `;
}

export function humanReviewCompleteEmail(
  userName: string,
  sessionId: string,
  reviewerName: string,
  accessToken?: string
) {
  const resultUrl = accessToken
    ? `${process.env.NEXT_PUBLIC_APP_URL}/analysis/${sessionId}?token=${accessToken}`
    : `${process.env.NEXT_PUBLIC_APP_URL}/analysis/${sessionId}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9fafb; padding: 30px; }
    .reviewer-box { background: white; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
    .button { background: #ec4899; color: white; padding: 14px 35px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 20px; font-weight: 600; }
    .highlight { background: #fdf4ff; border-left: 4px solid #ec4899; padding: 15px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Your Expert Review is Ready!</h1>
    </div>
    <div class="content">
      <p>Hi ${userName},</p>
      <p>Great news! Your expert reviewer has completed their detailed analysis of your essay.</p>

      <div class="reviewer-box">
        <p style="margin: 0; color: #6b7280;">Reviewed by</p>
        <p style="margin: 5px 0 0; font-size: 20px; font-weight: 600;">${reviewerName}</p>
      </div>

      <div class="highlight">
        <p style="margin: 0;"><strong>Your expert review includes:</strong></p>
        <ul style="margin: 10px 0 0; padding-left: 20px;">
          <li>Detailed margin comments throughout your essay</li>
          <li>Comprehensive written summary</li>
          <li>Specific suggestions for strengthening your narrative</li>
          <li>AO perspective on how your essay will be perceived</li>
        </ul>
      </div>

      <div style="text-align: center;">
        <a href="${resultUrl}" class="button">
          View Expert Review →
        </a>
      </div>
    </div>
    <div class="footer">
      <p>IvyWay - Expert human review for college essays</p>
    </div>
  </div>
</body>
</html>
  `;
}
