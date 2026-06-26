// Stripe webhook handler
import { Handlers } from "$fresh/server.ts";
import { stripe, STRIPE_CONFIG } from "../../../lib/payments/stripe.ts";
import { updatePaymentStatus, hasProcessedStripeEvent, markStripeEventProcessed } from "../../../lib/payments/models.ts";
import { addBalance } from "../../../lib/economy/balance.ts";

export const handler: Handlers = {
  async POST(req) {
    if (!stripe) {
      return new Response("Stripe not configured", { status: 503 });
    }
    
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return new Response("Missing signature", { status: 400 });
    }
    
    try {
      const body = await req.text();
      
      // Verify webhook signature
      const event = stripe.webhooks.constructEvent(
        body,
        signature,
        STRIPE_CONFIG.webhookSecret
      );
      
      // Check for duplicate events
      if (await hasProcessedStripeEvent(event.id)) {
        console.log(`Duplicate event ${event.id}, skipping`);
        return Response.json({ received: true });
      }
      
      // Handle different event types
      switch (event.type) {
        case "payment_intent.succeeded": {
          const paymentIntent = event.data.object;
          const userId = paymentIntent.metadata.userId;
          
          if (userId) {
            // Update payment status
            await updatePaymentStatus(
              paymentIntent.id,
              "succeeded",
              paymentIntent.id
            );
            
            // Add balance to user (convert cents to virtual currency)
            await addBalance(
              userId,
              paymentIntent.amount,
              "admin_grant",
              `Deposit via Stripe: ${paymentIntent.id}`
            );
            
            console.log(`Payment succeeded for user ${userId}: ${paymentIntent.amount} cents`);
          }
          break;
        }
        
        case "payment_intent.payment_failed": {
          const paymentIntent = event.data.object;
          await updatePaymentStatus(paymentIntent.id, "failed");
          console.log(`Payment failed: ${paymentIntent.id}`);
          break;
        }
        
        case "payment_intent.canceled": {
          const paymentIntent = event.data.object;
          await updatePaymentStatus(paymentIntent.id, "canceled");
          console.log(`Payment canceled: ${paymentIntent.id}`);
          break;
        }
        
        case "payment_intent.processing": {
          const paymentIntent = event.data.object;
          await updatePaymentStatus(paymentIntent.id, "processing");
          break;
        }
        
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
      
      // Mark event as processed
      await markStripeEventProcessed(event.id);
      
      return Response.json({ received: true });
    } catch (error) {
      console.error("Webhook error:", error);
      return new Response(
        `Webhook Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        { status: 400 }
      );
    }
  },
};
