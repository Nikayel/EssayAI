/**
 * Analytics & Conversion Tracking
 * Track upsells, conversions, and user events
 */

export interface AnalyticsEvent {
  event: string;
  userId?: string;
  properties?: Record<string, any>;
  timestamp: Date;
}

/**
 * Track analytics event
 */
export async function trackEvent(event: string, properties?: Record<string, any>) {
  try {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Analytics Event:', { event, properties, timestamp: new Date() });
    }

    // Send to analytics API
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event,
        properties,
        timestamp: new Date(),
      }),
    }).catch((err) => {
      // Fail silently - don't block user experience
      console.error('Analytics tracking failed:', err);
    });
  } catch (error) {
    // Never throw - analytics should never break the app
    console.error('Analytics error:', error);
  }
}

/**
 * Track upsell view
 */
export function trackUpsellView(packageType: string, currentPackage: string) {
  return trackEvent('upsell_viewed', {
    upsell_package: packageType,
    current_package: currentPackage,
  });
}

/**
 * Track upsell click
 */
export function trackUpsellClick(packageType: string, currentPackage: string, price: number) {
  return trackEvent('upsell_clicked', {
    upsell_package: packageType,
    current_package: currentPackage,
    price_cents: price,
  });
}

/**
 * Track upsell purchase
 */
export function trackUpsellPurchase(packageType: string, currentPackage: string, price: number) {
  return trackEvent('upsell_purchased', {
    upsell_package: packageType,
    current_package: currentPackage,
    price_cents: price,
    revenue: price / 100,
  });
}

/**
 * Track page view
 */
export function trackPageView(page: string) {
  return trackEvent('page_viewed', { page });
}

/**
 * Track essay submission
 */
export function trackEssaySubmission(essayType: string, wordCount: number) {
  return trackEvent('essay_submitted', {
    essay_type: essayType,
    word_count: wordCount,
  });
}

/**
 * Track analysis completion
 */
export function trackAnalysisComplete(essayId: string, score: number) {
  return trackEvent('analysis_completed', {
    essay_id: essayId,
    score,
  });
}

/**
 * Track review delivery
 */
export function trackReviewDelivered(reviewId: string, packageType: string) {
  return trackEvent('review_delivered', {
    review_id: reviewId,
    package: packageType,
  });
}
