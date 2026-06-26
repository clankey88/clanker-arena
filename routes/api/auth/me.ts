// TICKET T-005: Get current authenticated user endpoint
import { Handlers } from "$fresh/server.ts";
import { requireAuth, AuthState } from "../../../lib/security/middleware.ts";

export const handler: Handlers<AuthState> = {
  async GET(req, ctx) {
    // Apply authentication middleware
    const authResponse = await requireAuth(req, ctx);
    if (authResponse.status === 401) {
      return authResponse;
    }
    
    if (!ctx.state.user) {
      return Response.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Don't return password hash
    const { passwordHash, ...safeUser } = ctx.state.user;
    
    return Response.json(
      { ok: true, user: safeUser },
      { status: 200 }
    );
  },
};
