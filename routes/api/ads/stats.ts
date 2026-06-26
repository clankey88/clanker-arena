// Get user ad statistics
import { Handlers } from "$fresh/server.ts";
import { getUserAdStats, listUserAdImpressions } from "../../../lib/ads/models.ts";
import { requireAuth, rateLimit, AuthState } from "../../../lib/security/middleware.ts";

export const handler: Handlers<AuthState> = {
  async GET(req, ctx) {
    // Apply rate limiting (60 requests per minute)
    const rateLimitResponse = await rateLimit(60, 60000)(req, ctx);
    if (rateLimitResponse.status === 429) {
      return rateLimitResponse;
    }
    
    // Apply authentication
    const authResponse = await requireAuth(req, ctx);
    if (authResponse.status === 401) {
      return authResponse;
    }
    
    const userId = ctx.state.user?.id;
    if (!userId) {
      return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    
    try {
      const url = new URL(req.url);
      const includeHistory = url.searchParams.get("includeHistory") === "true";
      
      // Get statistics
      const stats = await getUserAdStats(userId);
      
      const response: any = {
        ok: true,
        stats,
      };
      
      // Optionally include recent history
      if (includeHistory) {
        const history = await listUserAdImpressions(userId, 20);
        response.history = history.map(imp => ({
          id: imp.id,
          adType: imp.adType,
          status: imp.status,
          duration: imp.duration,
          reward: imp.reward,
          createdAt: imp.createdAt,
          completedAt: imp.completedAt,
        }));
      }
      
      return Response.json(response);
    } catch (error) {
      console.error("Ad stats error:", error);
      return Response.json(
        { ok: false, error: "Failed to fetch ad statistics" },
        { status: 500 }
      );
    }
  },
};
