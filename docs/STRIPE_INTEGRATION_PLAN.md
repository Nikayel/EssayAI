# Stripe Integration Plan for EssayAI

## Overview

This document outlines the Stripe payment integration architecture for the tiered essay analysis system.

## Current Implementation Status

### Completed
- [x] Stripe checkout session creation (`/api/tiered-analysis/checkout`)
- [x] Webhook handler for payment completion (`/api/webhook/stripe`)
- [x] Payment verification before analysis
- [x] Session-to-payment linking via `stripePaymentId`

### Pending
- [ ] Stripe Customer Portal for refunds/subscription management
- [ ] Promotional codes / coupon support
- [ ] Bundle pricing (multiple essays)

---

## Payment Flow Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   User Selects  │────>│  Create Checkout │────>│  Stripe Hosted  │
│      Tier       │     │     Session      │     │    Checkout     │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
                                                          v
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Run Analysis  │<────│ Webhook Confirms │<────│  User Pays      │
│   (if paid)     │     │     Payment      │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

---

## Stripe vs. Alternatives Comparison

### Stripe (Recommended)
**Pros:**
- Industry standard, most trusted
- Excellent developer experience
- Built-in fraud protection
- Supports 135+ currencies
- Webhook reliability with automatic retries
- PCI DSS Level 1 compliance built-in
- Apple Pay / Google Pay support

**Cons:**
- 2.9% + $0.30 per transaction
- Some international limitations

**Best for:** Our use case (B2C, variable pricing, one-time payments)

### Paddle
**Pros:**
- Merchant of Record (handles VAT/taxes)
- Simpler international compliance
- Lower effective rate for international

**Cons:**
- Less flexible pricing
- Slower onboarding
- 5% + $0.50 per transaction

**Best for:** SaaS subscriptions, especially selling to EU

### LemonSqueezy
**Pros:**
- Simple setup
- Good for digital products
- Merchant of Record

**Cons:**
- 5% + $0.50 per transaction
- Limited customization
- Newer, less battle-tested

**Best for:** Small indie projects, digital downloads

### Recommendation: **Stay with Stripe**
- Best developer experience
- Lowest fees for our price points
- Most flexible for our tiered model
- Better webhook reliability

---

## Webhook Architecture

### Current Webhook Flow

```typescript
// 1. Stripe sends POST to /api/webhook/stripe
// 2. Verify signature using STRIPE_WEBHOOK_SECRET
// 3. Handle checkout.session.completed event
// 4. Update database + trigger analysis
```

### Critical Webhook Events

| Event | When | Our Action |
|-------|------|------------|
| `checkout.session.completed` | Payment successful | Mark paid, start analysis |
| `checkout.session.expired` | User abandoned | Clean up session |
| `charge.refunded` | Admin refunds | Mark refunded, potentially revoke access |
| `charge.dispute.created` | Chargeback | Flag for review |

### Webhook Security

1. **Signature Verification** (implemented)
```typescript
stripe.webhooks.constructEvent(body, signature, webhookSecret)
```

2. **Idempotency** (implemented)
```typescript
// Check if already processed
const existing = await prisma.analysisSession.findFirst({
  where: { stripePaymentId: checkoutSessionId }
});
if (existing) return; // Skip duplicate
```

3. **Event Ordering** - Stripe doesn't guarantee order, but for our flow:
   - `checkout.session.completed` is the only critical event
   - We verify payment status in checkout session

### Webhook Retry Policy
Stripe automatically retries failed webhooks:
- Immediate retry
- 5 min, 30 min, 2 hr, 5 hr, 10 hr, 18 hr
- Up to 72 hours total

---

## Pricing Configuration

### Current Tiers

| Tier | Price | Stripe Product ID |
|------|-------|-------------------|
| Quick (Essay Score) | $9.99 | `prod_quick_*` |
| Standard (Full Analysis) | $79.00 | `prod_standard_*` |
| Premium (Expert Review) | $249.00 | `prod_premium_*` |

### Setting Up Stripe Products

```bash
# Create products in Stripe Dashboard or via API:

# Quick Tier
stripe products create \
  --name="Essay Score" \
  --description="Quick essay scoring with actionable feedback"

# Create price for product
stripe prices create \
  --product=prod_xxxxx \
  --unit-amount=999 \
  --currency=usd
```

### Price ID Environment Variables

```env
STRIPE_PRICE_QUICK=price_xxxxxxxxxxxxxx
STRIPE_PRICE_STANDARD=price_xxxxxxxxxxxxxx
STRIPE_PRICE_PREMIUM=price_xxxxxxxxxxxxxx
```

---

## Checkout Session Configuration

### Current Implementation

```typescript
// /api/tiered-analysis/checkout/route.ts
const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  line_items: [{
    price_data: {
      currency: 'usd',
      unit_amount: tierConfig.priceInCents,
      product_data: {
        name: tierConfig.name,
        description: tierConfig.description,
      },
    },
    quantity: 1,
  }],
  mode: 'payment',
  success_url: `${baseUrl}/analysis/${sessionId}?success=true`,
  cancel_url: `${baseUrl}/analysis/${sessionId}?cancelled=true`,
  metadata: {
    analysisSessionId: sessionId,
    tier,
    userId: user?.id,
  },
  customer_email: email,
});
```

### Key Metadata Fields

| Field | Purpose |
|-------|---------|
| `analysisSessionId` | Link payment to analysis session |
| `tier` | Verify correct tier was paid for |
| `userId` | Associate with user account (if logged in) |

---

## Error Handling

### Payment Failures

```typescript
// In checkout route
if (!session.url) {
  return NextResponse.json({
    error: 'Failed to create checkout session'
  }, { status: 500 });
}
```

### Webhook Failures

```typescript
// Return 200 to prevent Stripe retries for non-retryable errors
// Return 500 for retryable errors (DB down, etc.)
```

### Verification Failures

```typescript
// /api/tiered-analysis/route.ts
const verification = await verifyPayment(checkoutSessionId, tier);
if (!verification.verified) {
  return NextResponse.json({
    error: 'Payment verification failed',
    message: verification.error
  }, { status: 402 });
}
```

---

## Testing

### Test Cards

| Scenario | Card Number |
|----------|-------------|
| Success | 4242 4242 4242 4242 |
| Decline | 4000 0000 0000 0002 |
| 3D Secure | 4000 0027 6000 3184 |
| Insufficient funds | 4000 0000 0000 9995 |

### Webhook Testing

```bash
# Install Stripe CLI
stripe login

# Forward webhooks to local
stripe listen --forward-to localhost:3000/api/webhook/stripe

# Trigger test event
stripe trigger checkout.session.completed
```

### Environment Variables for Testing

```env
# Use Stripe test mode keys
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx  # From stripe listen output
```

---

## Production Checklist

- [ ] Switch to live Stripe keys
- [ ] Set up production webhook endpoint in Stripe Dashboard
- [ ] Configure webhook to only listen to needed events
- [ ] Set up Stripe Radar rules for fraud detection
- [ ] Enable email receipts in Stripe Dashboard
- [ ] Set up Stripe tax collection if needed
- [ ] Configure payout schedule
- [ ] Set up dispute notifications

---

## Future Enhancements

### 1. Bundle Pricing
Allow users to purchase multiple essay analyses at a discount:
- 3-essay bundle: 15% off
- 5-essay bundle: 25% off

### 2. Subscription Model (Potential)
For counselors or heavy users:
- Monthly unlimited Quick analyses
- Discounted Standard/Premium credits

### 3. Promotional Codes
```typescript
// Add to checkout session
allow_promotion_codes: true,
```

### 4. Payment Links
Pre-generated links for marketing:
```typescript
const paymentLink = await stripe.paymentLinks.create({
  line_items: [{ price: 'price_xxx', quantity: 1 }],
});
```

---

## Support & Debugging

### Common Issues

1. **"Payment already used" error**
   - Checkout session was already processed
   - User clicked back button after payment

2. **"Payment tier mismatch" error**
   - Metadata tier doesn't match requested tier
   - Possible tampering attempt

3. **Webhook not receiving events**
   - Check Stripe Dashboard webhook logs
   - Verify endpoint URL is correct
   - Check webhook secret matches

### Stripe Dashboard Links
- [Test Dashboard](https://dashboard.stripe.com/test)
- [Webhook Logs](https://dashboard.stripe.com/test/webhooks)
- [Checkout Sessions](https://dashboard.stripe.com/test/checkout/sessions)
