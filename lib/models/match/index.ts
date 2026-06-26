import { kv } from "../../../utils/kv.ts";
import { KV_PREFIXES, listActiveMatches } from "../../../utils/kv_helpers.ts";
import { Match } from "../../../types/index.ts";

export { listActiveMatches };

export async function getMatch(id: string): Promise<Match | null> {
  const res = await kv.get<Match>([KV_PREFIXES.MATCHES, id]);
  return res.value;
}

export async function saveMatch(match: Match): Promise<void> {
  const atomic = kv.atomic().set([KV_PREFIXES.MATCHES, match.id], match);
  
  if (match.status === "active" || match.status === "waiting") {
    atomic.set([KV_PREFIXES.ACTIVE_MATCHES, match.id], match);
  } else {
    atomic.delete([KV_PREFIXES.ACTIVE_MATCHES, match.id]);
  }
  
  await atomic.commit();
}

export async function createMatch(mode: Match["mode"], participants: string[]): Promise<Match> {
  const match: Match = {
    id: crypto.randomUUID(),
    mode,
    status: "waiting",
    participants,
    createdAt: new Date()
  };
  await saveMatch(match);
  return match;
}

export async function updateMatchStatus(matchId: string, status: Match["status"], winnerId?: string): Promise<boolean> {
  const match = await getMatch(matchId);
  if (!match) return false;
  
  match.status = status;
  if (winnerId) {
    match.winnerId = winnerId;
  }
  await saveMatch(match);
  return true;
}
