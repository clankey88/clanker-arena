// Ad impression tracking models
import { kv } from "../../utils/kv.ts";
import { AdImpression, AdStatus } from "../../types/index.ts";

const KV_PREFIXES = {
  AD_IMPRESSIONS: "ads:impressions",
  AD_IMPRESSIONS_BY_USER: "ads:impressions:by_user",
  AD_STATS: "ads:stats",
};

// Create ad impression record
export async function createAdImpression(impression: AdImpression): Promise<boolean> {
  const result = await kv.atomic()
    .check({ key: [KV_PREFIXES.AD_IMPRESSIONS, impression.id], versionstamp: null })
    .set([KV_PREFIXES.AD_IMPRESSIONS, impression.id], impression)
    .set([KV_PREFIXES.AD_IMPRESSIONS_BY_USER, impression.userId, impression.id], impression.id)
    .commit();
  
  return result.ok;
}

// Get ad impression
export async function getAdImpression(id: string): Promise<AdImpression | null> {
  const res = await kv.get<AdImpression>([KV_PREFIXES.AD_IMPRESSIONS, id]);
  return res.value;
}

// Update ad impression status
export async function updateAdImpression(
  id: string,
  status: AdStatus,
  duration?: number,
  reward?: number
): Promise<boolean> {
  const impression = await getAdImpression(id);
  if (!impression) return false;
  
  impression.status = status;
  if (duration !== undefined) impression.duration = duration;
  if (reward !== undefined) impression.reward = reward;
  if (status === "completed") impression.completedAt = new Date();
  
  await kv.set([KV_PREFIXES.AD_IMPRESSIONS, id], impression);
  return true;
}

// List user ad impressions
export async function listUserAdImpressions(userId: string, limit = 50): Promise<AdImpression[]> {
  const iter = kv.list<string>({
    prefix: [KV_PREFIXES.AD_IMPRESSIONS_BY_USER, userId],
  }, { limit });
  
  const impressions: AdImpression[] = [];
  for await (const entry of iter) {
    const impression = await getAdImpression(entry.value);
    if (impression) impressions.push(impression);
  }
  
  return impressions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

// Get ad statistics for a user
export async function getUserAdStats(userId: string): Promise<{
  totalWatched: number;
  totalRewards: number;
  completionRate: number;
}> {
  const impressions = await listUserAdImpressions(userId, 1000);
  
  const totalWatched = impressions.length;
  const completed = impressions.filter(i => i.status === "completed").length;
  const totalRewards = impressions
    .filter(i => i.status === "completed")
    .reduce((sum, i) => sum + (i.reward || 0), 0);
  
  return {
    totalWatched,
    totalRewards,
    completionRate: totalWatched > 0 ? (completed / totalWatched) * 100 : 0,
  };
}

// Daily ad limit check (prevent abuse)
export async function checkDailyAdLimit(userId: string, maxPerDay = 50): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];
  const key = [KV_PREFIXES.AD_STATS, userId, today];
  
  const res = await kv.get<number>(key);
  const count = res.value || 0;
  
  if (count >= maxPerDay) {
    return false; // Limit reached
  }
  
  // Increment counter
  await kv.set(key, count + 1, {
    expireIn: 1000 * 60 * 60 * 48, // Expire after 48 hours
  });
  
  return true;
}
