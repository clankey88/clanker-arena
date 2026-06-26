import { kv } from "../../utils/kv.ts";
import { KV_PREFIXES } from "../../utils/kv_helpers.ts";
import type { DailyRewardRecord, TransactionType } from "../../types/index.ts";
import { addBalance } from "./balance.ts";

const BASE_REWARD = 100;
const STREAK_BONUS = 50;
const MAX_STREAK = 7;

export interface DailyStatus {
  canClaim: boolean;
  streak: number;
  nextReward: number;
  lastClaimDate: string | null;
}

function todayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function yesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function getDailyStatus(userId: string): Promise<DailyStatus> {
  const res = await kv.get<DailyRewardRecord>([KV_PREFIXES.ECONOMY_DAILY, userId]);
  const record = res.value;
  const today = todayString();

  if (!record) {
    return { canClaim: true, streak: 0, nextReward: BASE_REWARD, lastClaimDate: null };
  }

  if (record.lastClaimDate === today) {
    return { canClaim: false, streak: record.streak, nextReward: calcReward(record.streak), lastClaimDate: today };
  }

  const yesterday = yesterdayString();
  const streak = record.lastClaimDate === yesterday ? record.streak : 0;
  return { canClaim: true, streak, nextReward: calcReward(streak), lastClaimDate: record.lastClaimDate };
}

function calcReward(streak: number): number {
  return BASE_REWARD + Math.min(streak, MAX_STREAK) * STREAK_BONUS;
}

export async function claimDailyReward(
  userId: string,
): Promise<{ ok: boolean; amount: number; streak: number; error?: string }> {
  const status = await getDailyStatus(userId);
  if (!status.canClaim) {
    return { ok: false, amount: 0, streak: status.streak, error: "Already claimed today" };
  }

  const newStreak = status.streak + 1;
  const reward = status.nextReward;

  const balResult = await addBalance(userId, reward, "daily_reward", `Daily reward (${newStreak} day streak)`);
  if (!balResult.ok) {
    return { ok: false, amount: 0, streak: status.streak, error: balResult.error };
  }

  const today = todayString();
  const record: DailyRewardRecord = { userId, lastClaimDate: today, streak: newStreak };
  await kv.set([KV_PREFIXES.ECONOMY_DAILY, userId], record);

  return { ok: true, amount: reward, streak: newStreak };
}
