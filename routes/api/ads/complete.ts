// Complete ad viewing and award reward
import { Handlers } from "$fresh/server.ts";
import { updateAdImpression, getAdImpression } from "../../../lib/ads/models.ts";
import { addBalance } from "../../../lib/economy/balance.ts";
import { trackImpression, trackClick, reportCompletion, AD_ZONES } from "../../../lib/ads/mondiad.ts";
import { requireAuth, validateCSRFToken, rateLimit, AuthState } from "../../../lib/security/middleware.ts";

export const handler: Handlers<AuthState> = {
  async POST(req, ctx) {
    // Apply rate limiting (30 requests per minute)
    const rateLimitResponse = await rateLimit(30, 60000)(req, ctx);
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
    
    try {
      const body = await req.json();
      const { impressionId, duration, completed, clicked } = body;
      
      if (!impressionId) {
        return Response.json(
          { ok: false, error: "Missing impressionId" },
          { status: 400 }
        );
      }
      
      // Get impression record
      const impression = await getAdImpression(impressionId);
      if (!impression) {
        return Response.json(
          { ok: false, error: "Impression not found" },
          { status: 404 }
        );
      }
      
      // Verify user owns this impression
      if (impression.userId !== userId) {
        return Response.json(
          { ok: false, error: "Unauthorized" },
          { status: 403 }
        );
      }
      
      // Check if already completed
      if (impression.status === "completed") {
        return Response.json(
          { ok: false, error: "Ad already completed" },
          { status: 400 }
        );
      }
      
      // Track impression
      if (impression.metadata?.impressionUrl) {
        await trackImpression(impression.adId, impression.metadata.impressionUrl);
      }
      
      // Track click if user clicked
      if (clicked && impression.metadata?.clickUrl) {
        await trackClick(impression.adId, impression.metadata.clickUrl);
      }
      
      // Determine reward based on completion
      let reward = 0;
      let status: "completed" | "skipped" = "skipped";
      
      if (completed && duration !== undefined) {
        // Find zone config to get reward amount and min duration
        const zoneType = impression.metadata?.zoneType;
        const zone = zoneType ? AD_ZONES[zoneType] : null;
        
        if (zone && duration >= (zone.minDuration || 0)) {
          reward = zone.rewardAmount;
          status = "completed";
          
          // Report completion to Mondiad
          await reportCompletion(impression.adId, duration, true);
        } else {
          // Not enough watch time
          await reportCompletion(impression.adId, duration, false);
        }
      }
      
      // Update impression
      await updateAdImpression(impressionId, status, duration, reward);
      
      // Award reward if earned
      if (reward > 0) {
        await addBalance(
          userId,
          reward,
          "admin_grant",
          `Ad reward: ${impression.adId}`
        );
      }
      
      return Response.json({
        ok: true,
        status,
        reward,
        message: reward > 0 ? `Earned ${reward} credits!` : "Ad not completed",
      });
    } catch (error) {
      console.error("Ad completion error:", error);
      return Response.json(
        { ok: false, error: "Failed to complete ad" },
        { status: 500 }
      );
    }
  },
};
