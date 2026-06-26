// Stripe payment integration
import Stripe from "stripe";

// Initialize Stripe
const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
if (!stripeSecretKey) {
  console.warn("STRIPE_SECRET_KEY not set. Stripe payments will not work.");
}

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
      typescript: true,
    })
  : null;

export const STRIPE_CONFIG = {
  currency: "usd",
  minDepositAmount: 500, // $5.00 in cents
  maxDepositAmount: 100000, // $1000.00 in cents
  minPayoutAmount: 1000, // $10.00 in cents
  maxPayoutAmount: 1000000, // $10,000.00 in cents
  webhookSecret: Deno.env.get("STRIPE_WEBHOOK_SECRET") || "",
};

export function isStripeConfigured(): boolean {
  return !!stripe && !!STRIPE_CONFIG.webhookSecret;
}

// Convert cents to dollars for display
export function formatAmount(cents: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

// Validate amount is within limits
export function validateDepositAmount(amount: number): { valid: boolean; error?: string } {
  if (amount < STRIPE_CONFIG.minDepositAmount) {
    return {
      valid: false,
      error: `Minimum deposit is ${formatAmount(STRIPE_CONFIG.minDepositAmount)}`,
    };
  }
  if (amount > STRIPE_CONFIG.maxDepositAmount) {
    return {
      valid: false,
      error: `Maximum deposit is ${formatAmount(STRIPE_CONFIG.maxDepositAmount)}`,
    };
  }
  return { valid: true };
}

export function validatePayoutAmount(amount: number): { valid: boolean; error?: string } {
  if (amount < STRIPE_CONFIG.minPayoutAmount) {
    return {
      valid: false,
      error: `Minimum payout is ${formatAmount(STRIPE_CONFIG.minPayoutAmount)}`,
    };
  }
  if (amount > STRIPE_CONFIG.maxPayoutAmount) {
    return {
      valid: false,
      error: `Maximum payout is ${formatAmount(STRIPE_CONFIG.maxPayoutAmount)}`,
    };
  }
  return { valid: true };
}
