// Stripe payout/withdrawal endpoint
import { Handlers } from "$fresh/server.ts";
import { stripe, isStripeConfigured, validatePayoutAmount, STRIPE_CONFIG } from "../../../lib/payments/stripe.ts";
import { createPayout } from "../../../lib/payments/models.ts";
import { getBalance, deductBalance } from "../../../lib/economy/balance.ts";
import { requireAuth, validateCSRFToken, rateLimit, AuthState } from "../../../lib/security/middleware.ts";
import { Payout } from "../../../types/index.ts";

export const handler: Handlers<AuthState> = {
  async POST(req, ctx) {
    // Apply rate limiting (5 requests per hour for payouts)
    const rateLimitResponse = await rateLimit(5, 3600000)(req, ctx);
    if (rateLimitResponse.status === 429) {
      return rateLimitResponse;
    }
    
    // Apply authentication
    const authResponse = await requireAuth(req, ctx);
    if (authResponse.status === 401) {
      return authResponse;
    }
    
    // Validate CSRF token
    const csrfResponse = await validateCSRFToken(req, ctx);
    if (csrfResponse.status === 403) {
      return csrfResponse;
    }
    
    const userId = ctx.state.user?.id;
    if (!userId) {
      return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    
    // Check if Stripe is configured
    if (!isStripeConfigured()) {
      return Response.json(
        { ok: false, error: "Payout system not configured" },
        { status: 503 }
      );
    }
    
    try {
      const body = await req.json();
      const { amount, destination, description } = body;
      
      // Validate amount
      if (typeof amount !== "number" || amount <= 0) {
        return Response.json(
          { ok: false, error: "Invalid amount" },
          { status: 400 }
        );
      }
      
      const validation = validatePayoutAmount(amount);
      if (!validation.valid) {
        return Response.json(
          { ok: false, error: validation.error },
          { status: 400 }
        );
      }
      
      // Check user balance (convert cents to virtual currency)
      // Assuming 1 cent = 1 virtual currency unit
      const balance = await getBalance(userId);
      if (balance < amount) {
        return Response.json(
          { ok: false, error: "Insufficient balance" },
          { status: 400 }
        );
      }
      
      // Validate destination (bank account or card)
      if (!destination || typeof destination !== "string") {
        return Response.json(
          { ok: false, error: "Invalid destination" },
          { status: 400 }
        );
      }
      
      // Create payout record (pending)
      const payout: Payout = {
        id: crypto.randomUUID(),
        userId,
        amount,
        currency: STRIPE_CONFIG.currency,
        status: "pending",
        method: "bank_transfer",
        destination,
        description,
        createdAt: new Date(),
      };
      
      const created = await createPayout(payout);
      if (!created) {
        return Response.json(
          { ok: false, error: "Failed to create payout record" },
          { status: 500 }
        );
      }
      
      // Deduct from user balance immediately
      const deductResult = await deductBalance(
        userId,
        amount,
        "credit_sink",
        `Payout request: ${payout.id}`
      );
      
      if (!deductResult.ok) {
        return Response.json(
          { ok: false, error: "Failed to deduct balance" },
          { status: 500 }
        );
      }
      
      // Note: Actual Stripe payout creation should be done by admin approval
      // or automated process after verification. This is just the request.
      
      return Response.json({
        ok: true,
        payoutId: payout.id,
        amount: payout.amount,
        status: payout.status,
        message: "Payout request submitted. Processing may take 1-3 business days.",
      });
    } catch (error) {
      console.error("Payout error:", error);
      return Response.json(
        { ok: false, error: "Failed to create payout request" },
        { status: 500 }
      );
    }
  },
};
