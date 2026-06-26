import { Handlers } from "$fresh/server.ts";
import { getBracket, generateBracket } from "../../../../lib/tournament/bracket.ts";
import { listTournamentTeams } from "../../../../lib/tournament/team.ts";

export const handler: Handlers = {
  async GET(_req, ctx) {
    const bracket = await getBracket(ctx.params.id);
    return Response.json({ bracket });
  },

  async POST(req, ctx) {
    const tournamentId = ctx.params.id;
    const teams = await listTournamentTeams(tournamentId);
    if (teams.length < 2) {
      return Response.json({ ok: false, error: "Need at least 2 teams" }, { status: 400 });
    }
    const bracket = await generateBracket(
      tournamentId,
      teams.map((t) => t.id),
    );
    return Response.json({ ok: true, bracket }, { status: 201 });
  },
};
