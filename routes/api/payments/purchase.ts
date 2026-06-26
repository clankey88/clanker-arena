// Stripe shop purchase endpoint (replaces deposit)
import { Handlers } from "$fresh/server.ts";
import { stripe, isStripeConfigured, STRIPE_CONFIG } from "../../../lib/payments/stripe.ts";
import { createPayment } from "../../../lib/payments/models.ts";
import { requireAuth, validateCSRFToken, rateLimit, AuthState } from "../../../lib/security/middleware.ts";
import { Payment } from "../../../types/index.ts";

// Shop items configuration
export const SHOP_ITEMS = {
  starter_pack: {
    id: "starter_pack",
    name: "Starter Pack",
    description: "1000 credits + 5 common cards",
    price: 499, // $4.99
    credits: 1000,
    items: ["5x common cards"],
  },
  premium_pack: {
    id: "premium_pack",
    name: "Premium Pack",
    description: "5000 credits + 10 rare cards",
    price: 1999, // $19.99
    credits: 5000,
    items: ["10x rare cards"],
  },
  mega_pack: {
    id: "mega_pack",
    name: "Mega Pack",
    description: "25000 credits + 5 epic cards + 1 legendary",
    price: 9999, // $99.99
    credits: 25000,
    items: ["5x epic cards", "1x legendary card"],
  },
  credits_small: {
    id: "credits_small",
    name: "Small Credit Pack",
    description: "1000 credits",
    price: 499, // $4.99
    credits: 1000,
    items: [],
  },
  credits_medium: {
    id: "credits_medium",
    name: "Medium Credit Pack",
    description: "5000 credits",
    price: 1999, // $19.99
    credits: 5000,
    items: [],
  },
  credits_large: {
    id: "credits_large",
    name: "Large Credit Pack",
    description: "15000 credits",
    price: 4999, // $49.99
    credits: 15000,
    items: [],
  },
};

export const handler: Handlers<AuthState> = {
  async POST(req, ctx) {
    // Apply rate limiting (20 requests per minute)
    const rateLimitResponse = await rateLimit(20, 60000)(req, ctx);
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
      const { itemId } = body;
      
      // Validate item
      if (!itemId || !SHOP_ITEMS[itemId as keyof typeof SHOP_ITEMS]) {
        return Response.json(
          { ok: false, error: "Invalid item" },
          { status: 400 }
        );
      }
      
      const item = SHOP_ITEMS[itemId as keyof typeof SHOP_ITEMS];
      
      // Create Stripe Payment Intent
      const paymentIntent = await stripe!.paymentIntents.create({
        amount: item.price,
        currency: STRIPE_CONFIG.currency,
        metadata: {
          userId,
          type: "shop_purchase",
          itemId: item.id,
          credits: item.credits.toString(),
        },
        description: `${item.name} - ${item.description}`,
        automatic_payment_methods: {
          enabled: true,
        },
      });
      
      // Create payment record
      const payment: Payment = {
        id: crypto.randomUUID(),
        userId,
        stripePaymentIntentId: paymentIntent.id,
        amount: item.price,
        currency: STRIPE_CONFIG.currency,
        status: "pending",
        method: "card",
        description: `Shop purchase: ${item.name}`,
        metadata: {
          clientSecret: paymentIntent.client_secret || "",
          itemId: item.id,
          credits: item.credits.toString(),
          items: JSON.stringify(item.items),
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
        item: {
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          credits: item.credits,
        },
      });
    } catch (error) {
      console.error("Shop purchase error:", error);
      return Response.json(
        { ok: false, error: "Failed to create purchase" },
        { status: 500 }
      );
    }
  },
};
