// Stripe deposit/payment endpoint
import { Handlers } from "$fresh/server.ts";
import { stripe, isStripeConfigured, validateDepositAmount, STRIPE_CONFIG } from "../../../lib/payments/stripe.ts";
import { createPayment } from "../../../lib/payments/models.ts";
import { requireAuth, validateCSRFToken, rateLimit, AuthState } from "../../../lib/security/middleware.ts";
import { Payment } from "../../../types/index.ts";

export const handler: Handlers<AuthState> = {
  async POST(req, ctx) {
    // Apply rate limiting (10 requests per minute)
    const rateLimitResponse = await rateLimit(10, 60000)(req, ctx);
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
        { ok: false, error: "Payment system not configured" },
        { status: 503 }
      );
    }
    
    try {
      const body = await req.json();
      const { amount, description } = body;
      
      // Validate amount
      if (typeof amount !== "number" || amount <= 0) {
        return Response.json(
          { ok: false, error: "Invalid amount" },
          { status: 400 }
        );
      }
      
      const validation = validateDepositAmount(amount);
      if (!validation.valid) {
        return Response.json(
          { ok: false, error: validation.error },
          { status: 400 }
        );
      }
      
      // Create Stripe Payment Intent
      const paymentIntent = await stripe!.paymentIntents.create({
        amount,
        currency: STRIPE_CONFIG.currency,
        metadata: {
          userId,
          type: "deposit",
        },
        description: description || "Clanker Arena deposit",
        automatic_payment_methods: {
          enabled: true,
        },
      });
      
      // Create payment record
      const payment: Payment = {
        id: crypto.randomUUID(),
        userId,
        stripePaymentIntentId: paymentIntent.id,
        amount,
        currency: STRIPE_CONFIG.currency,
        status: "pending",
        method: "card",
        description,
        metadata: {
          clientSecret: paymentIntent.client_secret || "",
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      const created = await createPayment(payment);
      if (!created) {
        return Response.json(
          { ok: false, error: "Failed to create payment record" },
          { status: 500 }
        );
      }
      
      return Response.json({
        ok: true,
        paymentId: payment.id,
        clientSecret: paymentIntent.client_secret,
        amount: payment.amount,
      });
    } catch (error) {
      console.error("Deposit error:", error);
      return Response.json(
        { ok: false, error: "Failed to create payment" },
        { status: 500 }
      );
    }
  },
};
