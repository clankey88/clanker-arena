// Fetch ad from Mondiad
import { Handlers } from "$fresh/server.ts";
import { fetchAd, AD_ZONES, isMondiAdConfigured } from "../../../lib/ads/mondiad.ts";
import { createAdImpression, checkDailyAdLimit } from "../../../lib/ads/models.ts";
import { requireAuth, rateLimit, AuthState } from "../../../lib/security/middleware.ts";
import { AdImpression } from "../../../types/index.ts";

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
    
    const userId = ctx.state.user?.id;
    if (!userId) {
      return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    
    // Check if Mondiad is configured
    if (!isMondiAdConfigured()) {
      return Response.json(
        { ok: false, error: "Ad system not configured" },
        { status: 503 }
      );
    }
    
    try {
      const body = await req.json();
      const { zoneType } = body;
      
      // Validate zone type
      if (!zoneType || !AD_ZONES[zoneType]) {
        return Response.json(
          { ok: false, error: "Invalid zone type" },
          { status: 400 }
        );
      }
      
      const zone = AD_ZONES[zoneType];
      
      // Check if zone is enabled
      if (!zone.enabled) {
        return Response.json(
          { ok: false, error: "Ad zone is disabled" },
          { status: 503 }
        );
      }
      
      // Check daily limit
      const canWatch = await checkDailyAdLimit(userId);
      if (!canWatch) {
        return Response.json(
          { ok: false, error: "Daily ad limit reached" },
          { status: 429 }
        );
      }
      
      // Fetch ad from Mondiad
      const userAgent = req.headers.get("user-agent") || undefined;
      const ip = ctx.remoteAddr?.hostname;
      const referrer = req.headers.get("referer") || undefined;
      
      const adResponse = await fetchAd({
        zoneId: zone.zoneId,
        userId,
        userAgent,
        ip,
        referrer,
      });
      
      if (!adResponse.success || !adResponse.ad) {
        return Response.json(
          { ok: false, error: adResponse.error || "No ad available" },
          { status: 503 }
        );
      }
      
      // Create impression record
      const impression: AdImpression = {
        id: crypto.randomUUID(),
        userId,
        adId: adResponse.ad.id,
        adType: adResponse.ad.type,
        status: "served",
        metadata: {
          zoneType,
          impressionUrl: adResponse.ad.impressionUrl || "",
          clickUrl: adResponse.ad.clickUrl || "",
        },
        createdAt: new Date(),
      };
      
      await createAdImpression(impression);
      
      return Response.json({
        ok: true,
        impressionId: impression.id,
        ad: {
          id: adResponse.ad.id,
          type: adResponse.ad.type,
          videoUrl: adResponse.ad.videoUrl,
          duration: adResponse.ad.duration,
          bannerUrl: adResponse.ad.bannerUrl,
          width: adResponse.ad.width,
          height: adResponse.ad.height,
          rewardAmount: zone.rewardAmount,
          minDuration: zone.minDuration,
        },
      });
    } catch (error) {
      console.error("Ad fetch error:", error);
      return Response.json(
        { ok: false, error: "Failed to fetch ad" },
        { status: 500 }
      );
    }
  },
};
