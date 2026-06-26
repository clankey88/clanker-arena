import { kv } from "../../utils/kv.ts";
import { KV_PREFIXES } from "../../utils/kv_helpers.ts";
import type { Tournament, TournamentPhase } from "../../types/index.ts";

export async function createTournament(data: {
  name: string;
  description: string;
  mode: "solo" | "team";
  maxTeams: number;
  entryFee: number;
  scheduledAt: Date;
}): Promise<Tournament> {
  const tournament: Tournament = {
    id: crypto.randomUUID(),
    name: data.name,
    description: data.description,
    mode: data.mode,
    phase: "registration",
    maxTeams: data.maxTeams,
    entryFee: data.entryFee,
    prizePool: data.entryFee * data.maxTeams * 0.9,
    scheduledAt: data.scheduledAt,
    createdAt: new Date(),
  };
  const atomic = kv.atomic()
    .set([KV_PREFIXES.TOURNAMENTS, tournament.id], tournament)
    .set([KV_PREFIXES.TOURNAMENTS_ACTIVE, tournament.id], tournament);
  await atomic.commit();
  return tournament;
}

export async function getTournament(id: string): Promise<Tournament | null> {
  const res = await kv.get<Tournament>([KV_PREFIXES.TOURNAMENTS, id]);
  return res.value;
}

export async function listActiveTournaments(): Promise<Tournament[]> {
  const iter = kv.list<Tournament>({ prefix: [KV_PREFIXES.TOURNAMENTS_ACTIVE] });
  const list: Tournament[] = [];
  for await (const res of iter) {
    list.push(res.value);
  }
  return list;
}

export async function listAllTournaments(): Promise<Tournament[]> {
  const iter = kv.list<Tournament>({ prefix: [KV_PREFIXES.TOURNAMENTS] });
  const list: Tournament[] = [];
  for await (const res of iter) {
    list.push(res.value);
  }
  return list;
}

export async function updateTournamentPhase(
  tournamentId: string,
  phase: TournamentPhase,
  winnerId?: string,
): Promise<boolean> {
  const res = await kv.get<Tournament>([KV_PREFIXES.TOURNAMENTS, tournamentId]);
  if (!res.value) return false;

  const tournament = res.value;
  tournament.phase = phase;
  if (winnerId) tournament.winnerId = winnerId;

  const atomic = kv.atomic()
    .check(res)
    .set([KV_PREFIXES.TOURNAMENTS, tournamentId], tournament);

  if (phase === "finished") {
    atomic.delete([KV_PREFIXES.TOURNAMENTS_ACTIVE, tournamentId]);
  } else {
    atomic.set([KV_PREFIXES.TOURNAMENTS_ACTIVE, tournamentId], tournament);
  }

  const result = await atomic.commit();
  return result.ok;
}

export function calculatePrizePool(entryFee: number, teamCount: number): number {
  return Math.floor(entryFee * teamCount * 0.9);
}
