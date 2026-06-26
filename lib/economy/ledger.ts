import { kv } from "../../utils/kv.ts";
import { KV_PREFIXES } from "../../utils/kv_helpers.ts";
import type { RealMoneyLedger } from "../../types/index.ts";

export async function createLedgerEntry(
  userId: string,
  tournamentId: string,
  amount: number,
): Promise<RealMoneyLedger> {
  const entry: RealMoneyLedger = {
    id: crypto.randomUUID(),
    userId,
    tournamentId,
    amount,
    status: "pending",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const atomic = kv.atomic()
    .set([KV_PREFIXES.REAL_MONEY_LEDGER, entry.id], entry)
    .set([KV_PREFIXES.REAL_MONEY_PENDING, entry.id], entry)
    .set([KV_PREFIXES.REAL_MONEY_USER, userId, entry.id], entry);

  await atomic.commit();
  return entry;
}

export async function getPendingLedgerEntries(): Promise<RealMoneyLedger[]> {
  const iter = kv.list<RealMoneyLedger>({ prefix: [KV_PREFIXES.REAL_MONEY_PENDING] });
  const entries: RealMoneyLedger[] = [];
  for await (const res of iter) {
    entries.push(res.value);
  }
  return entries;
}

export async function getLedgerEntriesForUser(userId: string): Promise<RealMoneyLedger[]> {
  const iter = kv.list<RealMoneyLedger>({ prefix: [KV_PREFIXES.REAL_MONEY_USER, userId] });
  const entries: RealMoneyLedger[] = [];
  for await (const res of iter) {
    entries.push(res.value);
  }
  return entries;
}

export async function approveLedgerEntry(ledgerId: string, adminNote?: string): Promise<boolean> {
  const res = await kv.get<RealMoneyLedger>([KV_PREFIXES.REAL_MONEY_LEDGER, ledgerId]);
  if (!res.value) return false;

  const entry = res.value;
  entry.status = "approved";
  entry.adminNote = adminNote;
  entry.updatedAt = new Date();

  const atomic = kv.atomic()
    .check(res)
    .set([KV_PREFIXES.REAL_MONEY_LEDGER, ledgerId], entry)
    .delete([KV_PREFIXES.REAL_MONEY_PENDING, ledgerId])
    .set([KV_PREFIXES.REAL_MONEY_USER, entry.userId, ledgerId], entry);

  const result = await atomic.commit();
  return result.ok;
}

export async function rejectLedgerEntry(ledgerId: string, adminNote?: string): Promise<boolean> {
  const res = await kv.get<RealMoneyLedger>([KV_PREFIXES.REAL_MONEY_LEDGER, ledgerId]);
  if (!res.value) return false;

  const entry = res.value;
  entry.status = "rejected";
  entry.adminNote = adminNote;
  entry.updatedAt = new Date();

  const atomic = kv.atomic()
    .check(res)
    .set([KV_PREFIXES.REAL_MONEY_LEDGER, ledgerId], entry)
    .delete([KV_PREFIXES.REAL_MONEY_PENDING, ledgerId])
    .set([KV_PREFIXES.REAL_MONEY_USER, entry.userId, ledgerId], entry);

  const result = await atomic.commit();
  return result.ok;
}
