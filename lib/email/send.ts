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
