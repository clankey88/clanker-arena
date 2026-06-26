import { kv } from "../../utils/kv.ts";
import { KV_PREFIXES } from "../../utils/kv_helpers.ts";
import type { Team } from "../../types/index.ts";

export async function createTeam(
  tournamentId: string,
  name: string,
  captainId: string,
): Promise<Team | null> {
  const tournamentRes = await kv.get([KV_PREFIXES.TOURNAMENTS, tournamentId]);
  if (!tournamentRes.value) return null;

  const existingTeams = await listTournamentTeams(tournamentId);
  if (existingTeams.length >= 15) return null;

  const team: Team = {
    id: crypto.randomUUID(),
    tournamentId,
    name,
    captainId,
    memberIds: [captainId],
    joinCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
    seed: existingTeams.length + 1,
    createdAt: new Date(),
  };

  const atomic = kv.atomic()
    .set([KV_PREFIXES.TOURNAMENTS_TEAMS, tournamentId, team.id], team)
    .set([KV_PREFIXES.TOURNAMENTS_TEAMS_BY_TEAM, team.id], { tournamentId, teamId: team.id });
  await atomic.commit();
  return team;
}

export async function getTeam(teamId: string): Promise<Team | null> {
  const ref = await kv.get<{ tournamentId: string; teamId: string }>(
    [KV_PREFIXES.TOURNAMENTS_TEAMS_BY_TEAM, teamId],
  );
  if (!ref.value) return null;
  const res = await kv.get<Team>([KV_PREFIXES.TOURNAMENTS_TEAMS, ref.value.tournamentId, teamId]);
  return res.value;
}

export async function joinTeamByCode(
  joinCode: string,
  userId: string,
  tournamentId: string,
): Promise<{ ok: boolean; error?: string }> {
  const iter = kv.list<Team>({ prefix: [KV_PREFIXES.TOURNAMENTS_TEAMS, tournamentId] });
  for await (const res of iter) {
    const team = res.value;
    if (team.joinCode !== joinCode) continue;
    if (team.memberIds.includes(userId)) {
      return { ok: false, error: "Already in this team" };
    }
    if (team.memberIds.length >= 4) {
      return { ok: false, error: "Team is full" };
    }
    team.memberIds.push(userId);
    await kv.set([KV_PREFIXES.TOURNAMENTS_TEAMS, tournamentId, team.id], team);
    return { ok: true };
  }
  return { ok: false, error: "Invalid join code" };
}

export async function listTournamentTeams(tournamentId: string): Promise<Team[]> {
  const iter = kv.list<Team>({ prefix: [KV_PREFIXES.TOURNAMENTS_TEAMS, tournamentId] });
  const teams: Team[] = [];
  for await (const res of iter) {
    teams.push(res.value);
  }
  return teams;
}
