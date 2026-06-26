# Payments and Ads Integration - Clanker Arena

## Overview

Clanker Arena integrates Stripe for shop purchases/payouts and Mondiad for video advertising to provide a complete monetization system.

---

## Stripe Payments

### Configuration

Set the following environment variables:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Shop Purchase Flow

Users can purchase items from the in-game shop (credits, card packs, etc.) but cannot directly deposit money.

1. User selects item from shop
2. User initiates purchase via `/api/payments/purchase`
3. Server creates Stripe Payment Intent
4. Client completes payment using Stripe Elements
5. Webhook confirms payment success
6. Credits and items are automatically granted

**Available Shop Items:**

| Item | Price | Credits | Bonus Items |
|------|-------|---------|-------------|
| Starter Pack | $4.99 | 1,000 | 5 common cards |
| Premium Pack | $19.99 | 5,000 | 10 rare cards |
| Mega Pack | $99.99 | 25,000 | 5 epic + 1 legendary |
| Small Credits | $4.99 | 1,000 | - |
| Medium Credits | $19.99 | 5,000 | - |
| Large Credits | $49.99 | 15,000 | - |

**Limits:**
- Rate limit: 20 requests per minute
- No minimum/maximum (item prices are fixed)

### Payout/Withdrawal Flow

Users can withdraw their winnings to real money.

1. User requests payout via `/api/payments/payout`
2. Balance is immediately deducted
3. Payout request enters pending status
4. Admin reviews and processes payout
5. Funds transferred via Stripe

**Limits:**
- Minimum payout: $10.00 (1,000 cents)
- Maximum payout: $10,000.00 (1,000,000 cents)
- Rate limit: 5 requests per hour

### API Endpoints

#### Shop Purchase
```
POST /api/payments/purchase
Authorization: Required
CSRF Token: Required

Request:
{
  "itemId": "premium_pack"
}

Response:
{
  "ok": true,
  "paymentId": "uuid",
  "clientSecret": "pi_xxx_secret_xxx",
  "item": {
    "id": "premium_pack",
    "name": "Premium Pack",
    "description": "5000 credits + 10 rare cards",
    "price": 1999,
    "credits": 5000
  }
}
```

#### Request Payout
```
POST /api/payments/payout
Authorization: Required
CSRF Token: Required

Request:
{
  "amount": 5000,  // cents
  "destination": "ba_xxx",  // bank account ID
  "description": "Withdraw winnings"
}

Response:
{
  "ok": true,
  "payoutId": "uuid",
  "amount": 5000,
  "status": "pending",
  "message": "Payout request submitted..."
}
```

#### Webhook Handler
```
POST /api/payments/webhook
Stripe-Signature: Required

Handles:
- payment_intent.succeeded (grants credits and items)
- payment_intent.payment_failed
- payment_intent.canceled
- payment_intent.processing
```

### Security Features

- HTTPS required for production
- Webhook signature verification
- Event deduplication (30-day window)
- Rate limiting on all endpoints
- CSRF protection
- User authentication required
- Balance validation before payouts

---

## Mondiad Video Ads

### Configuration

Set the following environment variables:

```env
MONDIAD_API_KEY=your_api_key
MONDIAD_PUBLISHER_ID=your_publisher_id
MONDIAD_VIDEO_ZONE_ID=zone_id_for_rewarded_videos
MONDIAD_INTERSTITIAL_ZONE_ID=zone_id_for_interstitials
MONDIAD_BANNER_ZONE_ID=zone_id_for_banners
```

### Ad Zones

Three types of ad zones are configured:

1. **Rewarded Video**
   - Reward: 100 virtual currency
   - Minimum watch time: 15 seconds
   - Full video completion required

2. **Interstitial Video**
   - Reward: 50 virtual currency
   - Minimum watch time: 5 seconds
   - Shown between matches

3. **Banner Ads**
   - Reward: None
   - Always visible
   - No interaction required

### Ad Flow

1. User requests ad via `/api/ads/fetch`
2. Server fetches ad from Mondiad API
3. Ad is served to user with impression tracking
4. User watches ad
5. User completes ad via `/api/ads/complete`
6. Reward is credited if minimum watch time met

### API Endpoints

#### Fetch Ad
```
POST /api/ads/fetch
Authorization: Required

Request:
{
  "zoneType": "video_rewarded"  // or "video_interstitial", "banner_main"
}

Response:
{
  "ok": true,
  "impressionId": "uuid",
  "ad": {
    "id": "ad_id",
    "type": "video",
    "videoUrl": "https://...",
    "duration": 30,
    "rewardAmount": 100,
    "minDuration": 15
  }
}
```

#### Complete Ad
```
POST /api/ads/complete
Authorization: Required
CSRF Token: Required

Request:
{
  "impressionId": "uuid",
  "duration": 30,  // seconds watched
  "completed": true,
  "clicked": false
}

Response:
{
  "ok": true,
  "status": "completed",
  "reward": 100,
  "message": "Earned 100 credits!"
}
```

#### Get Ad Statistics
```
GET /api/ads/stats?includeHistory=true
Authorization: Required

Response:
{
  "ok": true,
  "stats": {
    "totalWatched": 45,
    "totalRewards": 3500,
    "completionRate": 87.5
  },
  "history": [...]  // if includeHistory=true
}
```

### Abuse Prevention

- Daily limit: 50 ads per user
- Rate limiting: 30 requests per minute
- Minimum watch time enforcement
- Impression tracking and validation
- User authentication required

### Tracking

All ad interactions are tracked:
- **Impressions**: When ad is served
- **Completions**: When ad is fully watched
- **Clicks**: When user clicks ad
- **Skips**: When user skips before minimum time

---

## Data Models

### Payment
```typescript
interface Payment {
  id: string;
  userId: string;
  stripePaymentIntentId: string;
  amount: number;  // cents
  currency: string;
  status: "pending" | "processing" | "succeeded" | "failed" | "canceled";
  method: "card" | "bank_transfer" | "wallet";
  description?: string;
  metadata?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}
```

### Payout
```typescript
interface Payout {
  id: string;
  userId: string;
  stripePayoutId?: string;
  amount: number;  // cents
  currency: string;
  status: "pending" | "processing" | "succeeded" | "failed" | "canceled";
  method: "card" | "bank_transfer" | "wallet";
  destination?: string;
  description?: string;
  metadata?: Record<string, string>;
  createdAt: Date;
  processedAt?: Date;
}
```

### AdImpression
```typescript
interface AdImpression {
  id: string;
  userId: string;
  adId: string;
  adType: "video" | "banner" | "interstitial";
  status: "pending" | "served" | "completed" | "skipped" | "error";
  duration?: number;
  reward?: number;
  metadata?: Record<string, string>;
  createdAt: Date;
  completedAt?: Date;
}
```

---

## Testing

### Stripe Test Mode

Use Stripe test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires authentication: `4000 0025 0000 3155`

### Mondiad Test Mode

Contact Mondiad support for test zone IDs and API credentials.

---

## Production Checklist

- [ ] Set production Stripe keys
- [ ] Configure Stripe webhook endpoint
- [ ] Set production Mondiad credentials
- [ ] Test shop purchase flow end-to-end
- [ ] Test payout flow with small amount
- [ ] Verify ad serving and rewards
- [ ] Monitor webhook delivery
- [ ] Set up error alerting
- [ ] Review rate limits
- [ ] Test daily ad limits

---

## Troubleshooting

### Payments Not Working
1. Check `STRIPE_SECRET_KEY` is set
2. Verify webhook secret matches Stripe dashboard
3. Check webhook endpoint is publicly accessible
4. Review Stripe dashboard for errors

### Ads Not Serving
1. Check `MONDIAD_API_KEY` is set
2. Verify zone IDs are correct
3. Check daily limit hasn't been reached
4. Review Mondiad dashboard for errors

### Rewards Not Credited
1. Check ad completion endpoint logs
2. Verify minimum watch time was met
3. Check user balance transaction history
4. Review ad impression status in database

---

Last Updated: 2026-06-26