import { kv } from "../../utils/kv.ts";
import { KV_PREFIXES } from "../../utils/kv_helpers.ts";
import type { BracketSlot } from "../../types/index.ts";

export async function generateBracket(
  tournamentId: string,
  teamIds: string[],
): Promise<BracketSlot[]> {
  const shuffled = [...teamIds].sort(() => Math.random() - 0.5);
  const totalSlots = nextPowerOf2(shuffled.length);
  const slots: BracketSlot[] = [];

  for (let i = 0; i < shuffled.length; i += 2) {
    const slot: BracketSlot = {
      round: 1,
      position: slots.length,
      teamAId: shuffled[i] ?? null,
      teamBId: shuffled[i + 1] ?? null,
      winnerId: null,
      matchId: null,
    };
    slots.push(slot);
  }

  if (shuffled.length < totalSlots) {
    const byes = totalSlots - shuffled.length;
    for (let i = 0; i < byes; i++) {
      const idx = slots.length - 1 - i;
      if (idx >= 0) {
        slots[idx].teamBId = null;
        slots[idx].winnerId = slots[idx].teamAId;
      }
    }
  }

  const totalRounds = Math.log2(totalSlots);
  for (let r = 2; r <= totalRounds; r++) {
    const prevCount = slots.filter((s) => s.round === r - 1).length;
    for (let p = 0; p < prevCount / 2; p++) {
      slots.push({
        round: r,
        position: slots.length,
        teamAId: null,
        teamBId: null,
        winnerId: null,
        matchId: null,
      });
    }
  }

  await kv.set([KV_PREFIXES.TOURNAMENTS_BRACKET, tournamentId], slots);
  return slots;
}

export async function getBracket(tournamentId: string): Promise<BracketSlot[]> {
  const res = await kv.get<BracketSlot[]>([KV_PREFIXES.TOURNAMENTS_BRACKET, tournamentId]);
  return res.value ?? [];
}

export async function recordMatchResult(
  tournamentId: string,
  matchId: string,
  winnerTeamId: string,
): Promise<{ ok: boolean; nextSlot?: BracketSlot; finished?: boolean; winnerId?: string }> {
  const bracket = await getBracket(tournamentId);
  const slotIdx = bracket.findIndex((s) => s.matchId === matchId);
  if (slotIdx === -1) return { ok: false };

  const slot = bracket[slotIdx];
  slot.winnerId = winnerTeamId;

  const nextRound = slot.round + 1;
  const nextSlot = bracket.find((s) => s.round === nextRound && s.teamAId === null);
  if (nextSlot) {
    if (nextSlot.teamAId === null) {
      nextSlot.teamAId = winnerTeamId;
    } else {
      nextSlot.teamBId = winnerTeamId;
    }
  }

  const lastRound = Math.max(...bracket.map((s) => s.round));
  if (slot.round === lastRound) {
    return { ok: true, finished: true, winnerId: winnerTeamId };
  }

  await kv.set([KV_PREFIXES.TOURNAMENTS_BRACKET, tournamentId], bracket);
  return { ok: true, nextSlot };
}

export function getBracketProgress(bracket: BracketSlot[]): { total: number; completed: number; currentRound: number } {
  const total = bracket.length;
  const completed = bracket.filter((s) => s.winnerId !== null).length;
  const currentRound = Math.min(...bracket.filter((s) => s.winnerId === null).map((s) => s.round));
  return { total, completed, currentRound: isFinite(currentRound) ? currentRound : Math.max(...bracket.map((s) => s.round)) };
}

function nextPowerOf2(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}
