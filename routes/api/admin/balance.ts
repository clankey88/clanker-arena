// TICKET T-005: Admin-only balance management endpoint
import { Handlers } from "$fresh/server.ts";
import { addBalance } from "../../../lib/economy/balance.ts";
import { requireAuth, validateCSRFToken, AuthState } from "../../../lib/security/middleware.ts";

// TODO: Implement proper admin role checking
// For now, this is a placeholder that should be replaced with actual admin verification
const ADMIN_USER_IDS = new Set([
  // Add admin user IDs here
]);

function isAdmin(userId: string): boolean {
  // TODO: Check admin role from database
  return ADMIN_USER_IDS.has(userId);
}

export const handler: Handlers<AuthState> = {
  async POST(req, ctx) {
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
    
    // Check if user is admin
    if (!isAdmin(currentUserId)) {
      return Response.json(
        { ok: false, error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }
    
    try {
      const body = await req.json();
      const { userId, amount, description } = body;
      
      if (!userId || typeof amount !== "number" || amount <= 0) {
        return Response.json(
          { ok: false, error: "Invalid userId or amount" },
          { status: 400 }
        );
      }
      
      if (amount > 10000000) {
        return Response.json(
          { ok: false, error: "Amount too large" },
          { status: 400 }
        );
      }
      
      const result = await addBalance(
        userId,
        amount,
        "admin_grant",
        description || "Admin grant"
      );
      
      return Response.json(result);
    } catch (error) {
      console.error("Admin balance operation error:", error);
      return Response.json(
        { ok: false, error: "Internal server error" },
        { status: 500 }
      );
    }
  },
};
