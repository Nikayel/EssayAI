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
      from: 'EssayEdge AI <noreply@essayedgeai.com>',
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
      <p>EssayEdge AI - Voice-preserving essay feedback</p>
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
      <p>EssayEdge AI - Expert human review</p>
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
      <p>EssayEdge AI - Transform your essays</p>
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
      <p>EssayEdge AI - Blunt, actionable essay feedback</p>
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
      <p>EssayEdge AI - Expert human review for college essays</p>
    </div>
  </div>
</body>
</html>
  `;
}
