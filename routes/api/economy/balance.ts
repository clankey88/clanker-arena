// TICKET T-005: Secured balance endpoint with authentication and rate limiting
import { Handlers } from "$fresh/server.ts";
import { getBalance, addBalance, deductBalance } from "../../../lib/economy/balance.ts";
import { requireAuth, rateLimit, validateCSRFToken, AuthState } from "../../../lib/security/middleware.ts";

export const handler: Handlers<AuthState> = {
  async GET(req, ctx) {
    // Apply rate limiting (100 requests per minute)
    const rateLimitResponse = await rateLimit(100, 60000)(req, ctx);
    if (rateLimitResponse.status === 429) {
      return rateLimitResponse;
    }
    
    // Apply authentication
    const authResponse = await requireAuth(req, ctx);
    if (authResponse.status === 401) {
      return authResponse;
    }
    
    // Users can only query their own balance
    const userId = ctx.state.user?.id;
    if (!userId) {
      return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    
    const balance = await getBalance(userId);
    return Response.json({ ok: true, balance });
  },

  async POST(req, ctx) {
    // Apply rate limiting (20 requests per minute for balance modifications)
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
    
    const currentUserId = ctx.state.user?.id;
    if (!currentUserId) {
      return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    
    try {
      const body = await req.json();
      const { action, amount, description } = body;
      
      // Validate input
      if (!action || typeof amount !== "number" || amount <= 0) {
        return Response.json(
          { ok: false, error: "Invalid action or amount" },
          { status: 400 }
        );
      }
      
      if (amount > 1000000) {
        return Response.json(
          { ok: false, error: "Amount too large" },
          { status: 400 }
        );
      }
      
      // Only allow users to deduct from their own balance
      // Admin grants should go through a separate admin endpoint
      if (action === "deduct") {
        const result = await deductBalance(
          currentUserId,
          amount,
          "purchase",
          description || "Purchase"
        );
        return Response.json(result);
      }
      
      return Response.json(
        { ok: false, error: "Invalid action. Use 'deduct' for purchases." },
        { status: 400 }
      );
    } catch (error) {
      console.error("Balance operation error:", error);
      return Response.json(
        { ok: false, error: "Internal server error" },
        { status: 500 }
      );
    }
  },
};