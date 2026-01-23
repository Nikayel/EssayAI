/**
 * Email Templates - Centralized email template system
 * DRY: All templates use a shared base layout
 */

// =============================================================================
// SHARED STYLES
// =============================================================================

const COLORS = {
  primary: '#2563eb',
  primaryDark: '#1d4ed8',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  purple: '#8b5cf6',
  pink: '#ec4899',
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    500: '#6b7280',
    700: '#374151',
    900: '#111827',
  },
};

const GRADIENTS = {
  primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  purple: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
  warm: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
};

// =============================================================================
// BASE LAYOUT
// =============================================================================

interface BaseEmailProps {
  preheader?: string;
  headerGradient?: string;
  headerTitle: string;
  headerSubtitle?: string;
  bodyContent: string;
  ctaText?: string;
  ctaUrl?: string;
  footerExtra?: string;
}

export function baseEmailLayout({
  preheader,
  headerGradient = GRADIENTS.primary,
  headerTitle,
  headerSubtitle,
  bodyContent,
  ctaText,
  ctaUrl,
  footerExtra,
}: BaseEmailProps): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://essayedgeai.com';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${headerTitle}</title>
  ${preheader ? `<!--[if !mso]><!--><div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</div><!--<![endif]-->` : ''}
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: ${COLORS.gray[700]};
      margin: 0;
      padding: 0;
      background-color: ${COLORS.gray[100]};
    }
    .wrapper {
      padding: 40px 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: ${headerGradient};
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .header p {
      margin: 10px 0 0;
      opacity: 0.9;
      font-size: 16px;
    }
    .content {
      padding: 40px 30px;
    }
    .content p {
      margin: 0 0 16px;
    }
    .button {
      background: ${COLORS.primary};
      color: white !important;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 8px;
      display: inline-block;
      font-weight: 600;
      font-size: 16px;
      transition: background 0.2s;
    }
    .button:hover {
      background: ${COLORS.primaryDark};
    }
    .button-center {
      text-align: center;
      margin: 32px 0;
    }
    .score-badge {
      background: ${COLORS.success};
      color: white;
      padding: 16px 32px;
      border-radius: 50px;
      display: inline-block;
      font-size: 32px;
      font-weight: 700;
    }
    .alert-box {
      background: #fef3c7;
      border-left: 4px solid ${COLORS.warning};
      padding: 16px 20px;
      border-radius: 0 8px 8px 0;
      margin: 20px 0;
    }
    .success-box {
      background: #d1fae5;
      border-left: 4px solid ${COLORS.success};
      padding: 16px 20px;
      border-radius: 0 8px 8px 0;
      margin: 20px 0;
    }
    .feature-list {
      list-style: none;
      padding: 0;
      margin: 20px 0;
    }
    .feature-list li {
      padding: 8px 0 8px 28px;
      position: relative;
    }
    .feature-list li::before {
      content: "✓";
      color: ${COLORS.success};
      font-weight: bold;
      position: absolute;
      left: 0;
    }
    .footer {
      text-align: center;
      padding: 30px;
      background: ${COLORS.gray[50]};
      border-top: 1px solid ${COLORS.gray[100]};
    }
    .footer p {
      margin: 8px 0;
      color: ${COLORS.gray[500]};
      font-size: 14px;
    }
    .footer a {
      color: ${COLORS.primary};
      text-decoration: none;
    }
    .unsubscribe {
      font-size: 12px;
      color: ${COLORS.gray[500]};
      margin-top: 20px;
    }
    .divider {
      height: 1px;
      background: ${COLORS.gray[100]};
      margin: 24px 0;
    }

    @media only screen and (max-width: 600px) {
      .wrapper { padding: 20px 10px; }
      .header { padding: 30px 20px; }
      .header h1 { font-size: 24px; }
      .content { padding: 30px 20px; }
      .button { padding: 12px 24px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>${headerTitle}</h1>
        ${headerSubtitle ? `<p>${headerSubtitle}</p>` : ''}
      </div>
      <div class="content">
        ${bodyContent}
        ${ctaText && ctaUrl ? `
        <div class="button-center">
          <a href="${ctaUrl}" class="button">${ctaText}</a>
        </div>
        ` : ''}
      </div>
      <div class="footer">
        <p><strong>EssayEdge AI</strong></p>
        <p>Voice-preserving essay feedback for college applications</p>
        <p><a href="${appUrl}">essayedgeai.com</a></p>
        ${footerExtra || ''}
        <p class="unsubscribe">
          <a href="${appUrl}/email-preferences">Manage email preferences</a> ·
          <a href="${appUrl}/unsubscribe">Unsubscribe</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

// =============================================================================
// SPECIFIC TEMPLATES
// =============================================================================

export interface WelcomeEmailData {
  userName: string;
  email: string;
}

export function welcomeEmail({ userName, email }: WelcomeEmailData): string {
  return baseEmailLayout({
    preheader: `Welcome to EssayEdge AI! Let's make your college essays shine.`,
    headerGradient: GRADIENTS.primary,
    headerTitle: '🎓 Welcome to EssayEdge AI!',
    headerSubtitle: "Let's make your essays shine",
    bodyContent: `
      <p>Hi ${userName || 'there'},</p>
      <p>Thanks for joining EssayEdge AI! You've taken the first step toward crafting standout college essays.</p>

      <div class="success-box">
        <strong>What makes us different:</strong><br>
        We preserve YOUR voice while helping you improve. No generic AI rewrites - just actionable feedback.
      </div>

      <p><strong>Here's what you can do:</strong></p>
      <ul class="feature-list">
        <li>Get instant AI-powered essay analysis</li>
        <li>See exactly what admissions officers look for</li>
        <li>Track improvements across draft versions</li>
        <li>Get human expert reviews (Premium)</li>
      </ul>

      <p>Ready to analyze your first essay?</p>
    `,
    ctaText: 'Start Your First Analysis →',
    ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  });
}

export interface AnalysisCompleteData {
  userName: string;
  essayType: string;
  score: number;
  tier: 'quick' | 'standard' | 'premium';
  sessionId: string;
}

export function analysisCompleteEmail({
  userName,
  essayType,
  score,
  tier,
  sessionId
}: AnalysisCompleteData): string {
  const scoreColor = score >= 75 ? COLORS.success : score >= 50 ? COLORS.warning : COLORS.error;
  const tierFeatures = {
    quick: ['Overall score', '3-5 actionable items', 'AI detection check'],
    standard: ['Full dimension breakdown', 'Line-by-line annotations', 'School-specific insights', 'AO perspective'],
    premium: ['Everything in Standard', 'AI rewrite suggestions', 'Human expert review (48hrs)'],
  };

  return baseEmailLayout({
    preheader: `Your ${essayType} essay scored ${score}/100 - see your full analysis!`,
    headerGradient: GRADIENTS.primary,
    headerTitle: '✨ Your Analysis is Ready!',
    bodyContent: `
      <p>Hi ${userName || 'there'},</p>
      <p>Great news! We've completed the analysis of your <strong>${essayType}</strong> essay.</p>

      <div style="text-align: center; margin: 32px 0;">
        <div class="score-badge" style="background: ${scoreColor};">${score}/100</div>
        <p style="margin-top: 12px; color: ${COLORS.gray[500]};">Overall Score</p>
      </div>

      <p><strong>Your ${tier.charAt(0).toUpperCase() + tier.slice(1)} analysis includes:</strong></p>
      <ul class="feature-list">
        ${tierFeatures[tier].map(f => `<li>${f}</li>`).join('')}
      </ul>

      ${tier === 'quick' ? `
      <div class="alert-box">
        <strong>Want deeper insights?</strong><br>
        Upgrade to Standard for full line-by-line feedback and school-specific analysis.
      </div>
      ` : ''}
    `,
    ctaText: 'View Full Analysis →',
    ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL}/analysis/${sessionId}`,
  });
}

export interface HumanReviewAssignedData {
  userName: string;
  reviewerName?: string;
  reviewerCredentials?: string;
  dueDate: string;
}

export function humanReviewAssignedEmail({
  userName,
  reviewerName,
  reviewerCredentials,
  dueDate,
}: HumanReviewAssignedData): string {
  return baseEmailLayout({
    preheader: `Your essay has been assigned for human review - expect feedback by ${dueDate}`,
    headerGradient: GRADIENTS.purple,
    headerTitle: '👤 Human Review Started',
    headerSubtitle: 'An expert is reviewing your essay',
    bodyContent: `
      <p>Hi ${userName || 'there'},</p>
      <p>Your essay has been assigned to one of our expert reviewers.</p>

      ${reviewerName ? `
      <div class="success-box">
        <strong>Your Reviewer:</strong> ${reviewerName}<br>
        ${reviewerCredentials ? `<em>${reviewerCredentials}</em>` : ''}
      </div>
      ` : ''}

      <div class="alert-box">
        <strong>Expected by:</strong> ${dueDate}<br>
        We'll email you as soon as the review is complete.
      </div>

      <p><strong>What to expect:</strong></p>
      <ul class="feature-list">
        <li>Line-by-line expert feedback</li>
        <li>Strategic positioning advice</li>
        <li>Specific suggestions for your target school</li>
        <li>Voice-preserving improvement tips</li>
      </ul>
    `,
    ctaText: 'View Analysis Progress →',
    ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  });
}

export interface HumanReviewCompleteData {
  userName: string;
  reviewerName: string;
  reviewerCredentials?: string;
  sessionId: string;
}

export function humanReviewCompleteEmail({
  userName,
  reviewerName,
  reviewerCredentials,
  sessionId,
}: HumanReviewCompleteData): string {
  return baseEmailLayout({
    preheader: `${reviewerName} has completed reviewing your essay - see their expert feedback!`,
    headerGradient: GRADIENTS.success,
    headerTitle: '🎉 Expert Review Complete!',
    headerSubtitle: 'Your personalized feedback is ready',
    bodyContent: `
      <p>Hi ${userName || 'there'},</p>
      <p>Great news! Your human review is complete.</p>

      <div class="success-box">
        <strong>Reviewed by:</strong> ${reviewerName}<br>
        ${reviewerCredentials ? `<em>${reviewerCredentials}</em>` : ''}
      </div>

      <p><strong>Your review includes:</strong></p>
      <ul class="feature-list">
        <li>Detailed expert commentary</li>
        <li>Strategic positioning insights</li>
        <li>Specific revision suggestions</li>
        <li>School-fit assessment</li>
      </ul>

      <p>We recommend reviewing the feedback carefully and making revisions while the insights are fresh!</p>
    `,
    ctaText: 'View Expert Feedback →',
    ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL}/analysis/${sessionId}`,
  });
}

export interface LeadMagnetEmailData {
  email: string;
  downloadLink: string;
  resourceName: string;
}

export function leadMagnetEmail({
  email,
  downloadLink,
  resourceName
}: LeadMagnetEmailData): string {
  return baseEmailLayout({
    preheader: `Your free resource is ready: ${resourceName}`,
    headerGradient: GRADIENTS.primary,
    headerTitle: '📚 Your Free Resource',
    headerSubtitle: resourceName,
    bodyContent: `
      <p>Thanks for your interest!</p>
      <p>Here's your free download of <strong>${resourceName}</strong>.</p>

      <p>This guide will help you:</p>
      <ul class="feature-list">
        <li>Understand what top schools actually look for</li>
        <li>Avoid common essay mistakes</li>
        <li>Make your voice stand out authentically</li>
      </ul>
    `,
    ctaText: 'Download Now →',
    ctaUrl: downloadLink,
    footerExtra: `
      <div class="divider"></div>
      <p style="font-size: 13px;">
        <strong>Want personalized feedback?</strong><br>
        Try our AI analysis starting at just $9.99.
      </p>
    `,
  });
}

export interface NewsletterEmailData {
  email: string;
  subject: string;
  content: string;
  preheader?: string;
}

export function newsletterEmail({
  email,
  subject,
  content,
  preheader
}: NewsletterEmailData): string {
  return baseEmailLayout({
    preheader: preheader || subject,
    headerGradient: GRADIENTS.primary,
    headerTitle: subject,
    bodyContent: content,
    ctaText: 'Visit EssayEdge AI',
    ctaUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://essayedgeai.com',
  });
}
