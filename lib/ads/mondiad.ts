// Mondiad video ads integration
import { AdConfig, AdType } from "../../types/index.ts";

export const MONDIAD_CONFIG = {
  apiKey: Deno.env.get("MONDIAD_API_KEY") || "",
  publisherId: Deno.env.get("MONDIAD_PUBLISHER_ID") || "",
  apiEndpoint: "https://api.mondiad.com/v1",
};

// Ad zone configurations
export const AD_ZONES: Record<string, AdConfig> = {
  video_rewarded: {
    zoneId: Deno.env.get("MONDIAD_VIDEO_ZONE_ID") || "",
    type: "video",
    rewardAmount: 100, // 100 virtual currency
    minDuration: 15, // 15 seconds minimum watch time
    enabled: true,
  },
  video_interstitial: {
    zoneId: Deno.env.get("MONDIAD_INTERSTITIAL_ZONE_ID") || "",
    type: "interstitial",
    rewardAmount: 50,
    minDuration: 5,
    enabled: true,
  },
  banner_main: {
    zoneId: Deno.env.get("MONDIAD_BANNER_ZONE_ID") || "",
    type: "banner",
    rewardAmount: 0, // No reward for banners
    enabled: true,
  },
};

export function isMondiAdConfigured(): boolean {
  return !!(MONDIAD_CONFIG.apiKey && MONDIAD_CONFIG.publisherId);
}

export interface MondiAdRequest {
  zoneId: string;
  userId: string;
  userAgent?: string;
  ip?: string;
  referrer?: string;
}

export interface MondiAdResponse {
  success: boolean;
  ad?: {
    id: string;
    type: AdType;
    videoUrl?: string;
    duration?: number;
    clickUrl?: string;
    impressionUrl?: string;
    bannerUrl?: string;
    width?: number;
    height?: number;
  };
  error?: string;
}

// Fetch ad from Mondiad API
export async function fetchAd(request: MondiAdRequest): Promise<MondiAdResponse> {
  if (!isMondiAdConfigured()) {
    return {
      success: false,
      error: "Mondiad not configured",
    };
  }

  try {
    const response = await fetch(`${MONDIAD_CONFIG.apiEndpoint}/ads/fetch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${MONDIAD_CONFIG.apiKey}`,
      },
      body: JSON.stringify({
        publisher_id: MONDIAD_CONFIG.publisherId,
        zone_id: request.zoneId,
        user_id: request.userId,
        user_agent: request.userAgent,
        ip: request.ip,
        referrer: request.referrer,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Mondiad API error:", error);
      return {
        success: false,
        error: "Failed to fetch ad",
      };
    }

    const data = await response.json();

    return {
      success: true,
      ad: {
        id: data.ad_id,
        type: data.ad_type,
        videoUrl: data.video_url,
        duration: data.duration,
        clickUrl: data.click_url,
        impressionUrl: data.impression_url,
        bannerUrl: data.banner_url,
        width: data.width,
        height: data.height,
      },
    };
  } catch (error) {
    console.error("Mondiad fetch error:", error);
    return {
      success: false,
      error: "Network error",
    };
  }
}

// Track ad impression
export async function trackImpression(adId: string, impressionUrl?: string): Promise<boolean> {
  if (!impressionUrl) return false;

  try {
    await fetch(impressionUrl, { method: "GET" });
    return true;
  } catch (error) {
    console.error("Failed to track impression:", error);
    return false;
  }
}

// Track ad click
export async function trackClick(adId: string, clickUrl?: string): Promise<boolean> {
  if (!clickUrl) return false;

  try {
    await fetch(clickUrl, { method: "GET" });
    return true;
  } catch (error) {
    console.error("Failed to track click:", error);
    return false;
  }
}

// Report ad completion (for video ads)
export async function reportCompletion(
  adId: string,
  duration: number,
  completed: boolean
): Promise<boolean> {
  if (!isMondiAdConfigured()) return false;

  try {
    const response = await fetch(`${MONDIAD_CONFIG.apiEndpoint}/ads/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${MONDIAD_CONFIG.apiKey}`,
      },
      body: JSON.stringify({
        publisher_id: MONDIAD_CONFIG.publisherId,
        ad_id: adId,
        duration,
        completed,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("Failed to report completion:", error);
    return false;
  }
}
