// Payment and Payout models with KV storage
import { kv } from "../../utils/kv.ts";
import { Payment, Payout, PaymentStatus } from "../../types/index.ts";

const KV_PREFIXES = {
  PAYMENTS: "payments",
  PAYMENTS_BY_USER: "payments:by_user",
  PAYOUTS: "payouts",
  PAYOUTS_BY_USER: "payouts:by_user",
  STRIPE_EVENTS: "stripe:events",
};

// Payment functions
export async function createPayment(payment: Payment): Promise<boolean> {
  const result = await kv.atomic()
    .check({ key: [KV_PREFIXES.PAYMENTS, payment.id], versionstamp: null })
    .set([KV_PREFIXES.PAYMENTS, payment.id], payment)
    .set([KV_PREFIXES.PAYMENTS_BY_USER, payment.userId, payment.id], payment.id)
    .commit();
  
  return result.ok;
}

export async function getPayment(id: string): Promise<Payment | null> {
  const res = await kv.get<Payment>([KV_PREFIXES.PAYMENTS, id]);
  return res.value;
}

export async function updatePaymentStatus(
  id: string,
  status: PaymentStatus,
  stripePaymentIntentId?: string
): Promise<boolean> {
  const payment = await getPayment(id);
  if (!payment) return false;
  
  payment.status = status;
  payment.updatedAt = new Date();
  if (stripePaymentIntentId) {
    payment.stripePaymentIntentId = stripePaymentIntentId;
  }
  
  await kv.set([KV_PREFIXES.PAYMENTS, id], payment);
  return true;
}

export async function listUserPayments(userId: string, limit = 50): Promise<Payment[]> {
  const iter = kv.list<string>({
    prefix: [KV_PREFIXES.PAYMENTS_BY_USER, userId],
  }, { limit });
  
  const payments: Payment[] = [];
  for await (const entry of iter) {
    const payment = await getPayment(entry.value);
    if (payment) payments.push(payment);
  }
  
  return payments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

// Payout functions
export async function createPayout(payout: Payout): Promise<boolean> {
  const result = await kv.atomic()
    .check({ key: [KV_PREFIXES.PAYOUTS, payout.id], versionstamp: null })
    .set([KV_PREFIXES.PAYOUTS, payout.id], payout)
    .set([KV_PREFIXES.PAYOUTS_BY_USER, payout.userId, payout.id], payout.id)
    .commit();
  
  return result.ok;
}

export async function getPayout(id: string): Promise<Payout | null> {
  const res = await kv.get<Payout>([KV_PREFIXES.PAYOUTS, id]);
  return res.value;
}

export async function updatePayoutStatus(
  id: string,
  status: PaymentStatus,
  stripePayoutId?: string
): Promise<boolean> {
  const payout = await getPayout(id);
  if (!payout) return false;
  
  payout.status = status;
  if (status === "succeeded") {
    payout.processedAt = new Date();
  }
  if (stripePayoutId) {
    payout.stripePayoutId = stripePayoutId;
  }
  
  await kv.set([KV_PREFIXES.PAYOUTS, id], payout);
  return true;
}

export async function listUserPayouts(userId: string, limit = 50): Promise<Payout[]> {
  const iter = kv.list<string>({
    prefix: [KV_PREFIXES.PAYOUTS_BY_USER, userId],
  }, { limit });
  
  const payouts: Payout[] = [];
  for await (const entry of iter) {
    const payout = await getPayout(entry.value);
    if (payout) payouts.push(payout);
  }
  
  return payouts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

// Stripe webhook event deduplication
export async function hasProcessedStripeEvent(eventId: string): Promise<boolean> {
  const res = await kv.get([KV_PREFIXES.STRIPE_EVENTS, eventId]);
  return res.value !== null;
}

export async function markStripeEventProcessed(eventId: string): Promise<void> {
  // Store for 30 days
  await kv.set([KV_PREFIXES.STRIPE_EVENTS, eventId], true, {
    expireIn: 1000 * 60 * 60 * 24 * 30,
  });
}
