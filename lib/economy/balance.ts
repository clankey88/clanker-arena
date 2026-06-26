import { kv } from "../../utils/kv.ts";
import { KV_PREFIXES } from "../../utils/kv_helpers.ts";
import { recordTransaction } from "./transactions.ts";
import type { TransactionType } from "../../types/index.ts";

export interface BalanceResult {
  ok: boolean;
  balance: number;
  error?: string;
}

export async function getBalance(userId: string): Promise<number> {
  const res = await kv.get<number>([KV_PREFIXES.ECONOMY_BALANCE, userId]);
  return res.value ?? 0;
}

export async function addBalance(
  userId: string,
  amount: number,
  type: TransactionType,
  description: string,
): Promise<BalanceResult> {
  if (amount <= 0) return { ok: false, balance: await getBalance(userId), error: "Amount must be positive" };
  const current = await getBalance(userId);
  const newBalance = current + amount;
  const atomic = kv.atomic()
    .set([KV_PREFIXES.ECONOMY_BALANCE, userId], newBalance)
    .set([KV_PREFIXES.ECONOMY_TRANSACTIONS, userId, crypto.randomUUID()], {
      id: crypto.randomUUID(),
      userId,
      type,
      amount,
      balanceBefore: current,
      balanceAfter: newBalance,
      description,
      createdAt: new Date(),
    });
  await atomic.commit();
  return { ok: true, balance: newBalance };
}

export async function deductBalance(
  userId: string,
  amount: number,
  type: TransactionType,
  description: string,
): Promise<BalanceResult> {
  if (amount <= 0) return { ok: false, balance: await getBalance(userId), error: "Amount must be positive" };
  const current = await getBalance(userId);
  if (current < amount) {
    return { ok: false, balance: current, error: "Insufficient balance" };
  }
  const newBalance = current - amount;
  const atomic = kv.atomic()
    .set([KV_PREFIXES.ECONOMY_BALANCE, userId], newBalance)
    .set([KV_PREFIXES.ECONOMY_TRANSACTIONS, userId, crypto.randomUUID()], {
      id: crypto.randomUUID(),
      userId,
      type,
      amount: -amount,
      balanceBefore: current,
      balanceAfter: newBalance,
      description,
      createdAt: new Date(),
    });
  await atomic.commit();
  return { ok: true, balance: newBalance };
}
