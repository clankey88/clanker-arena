import { kv } from "../../utils/kv.ts";
import { KV_PREFIXES } from "../../utils/kv_helpers.ts";
import type { Transaction, TransactionType } from "../../types/index.ts";

export async function recordTransaction(
  userId: string,
  amount: number,
  type: TransactionType,
  balanceBefore: number,
  description: string,
): Promise<Transaction> {
  const tx: Transaction = {
    id: crypto.randomUUID(),
    userId,
    type,
    amount,
    balanceBefore,
    balanceAfter: balanceBefore + amount,
    description,
    createdAt: new Date(),
  };
  await kv.set([KV_PREFIXES.ECONOMY_TRANSACTIONS, userId, tx.id], tx);
  return tx;
}

export async function getTransactions(userId: string, limit = 50): Promise<Transaction[]> {
  const iter = kv.list<Transaction>({ prefix: [KV_PREFIXES.ECONOMY_TRANSACTIONS, userId] }, { limit, reverse: true });
  const txs: Transaction[] = [];
  for await (const res of iter) {
    txs.push(res.value);
  }
  return txs;
}
