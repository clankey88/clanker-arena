import { Handlers } from "$fresh/server.ts";
import { createTeam, joinTeamByCode, listTournamentTeams } from "../../../../lib/tournament/team.ts";

export const handler: Handlers = {
  async GET(_req, ctx) {
    const teams = await listTournamentTeams(ctx.params.id);
    return Response.json({ teams });
  },

  async POST(req, ctx) {
    const tournamentId = ctx.params.id;
    const body = await req.json();
    const { action, name, captainId, joinCode, userId } = body;

    if (action === "create") {
      if (!name || !captainId) {
        return Response.json({ ok: false, error: "Missing name or captainId" }, { status: 400 });
      }
      const team = await createTeam(tournamentId, name, captainId);
      if (!team) return Response.json({ ok: false, error: "Could not create team" }, { status: 400 });
      return Response.json({ ok: true, team }, { status: 201 });
    }

    if (action === "join") {
      if (!joinCode || !userId) {
        return Response.json({ ok: false, error: "Missing joinCode or userId" }, { status: 400 });
      }
      const result = await joinTeamByCode(joinCode, userId, tournamentId);
      if (!result.ok) return Response.json(result, { status: 400 });
      return Response.json({ ok: true });
    }

    return Response.json({ ok: false, error: "Invalid action" }, { status: 400 });
  },
};
