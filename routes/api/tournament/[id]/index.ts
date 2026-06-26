import { Handlers } from "$fresh/server.ts";
import { getTournament, updateTournamentPhase } from "../../../../lib/tournament/tournament.ts";

export const handler: Handlers = {
  async GET(_req, ctx) {
    const tournament = await getTournament(ctx.params.id);
    if (!tournament) return new Response("Not found", { status: 404 });
    return Response.json({ tournament });
  },

  async PATCH(req, ctx) {
    const body = await req.json();
    const { phase, winnerId } = body;
    if (phase) {
      const ok = await updateTournamentPhase(ctx.params.id, phase, winnerId);
      if (!ok) return new Response("Not found", { status: 404 });
    }
    const tournament = await getTournament(ctx.params.id);
    return Response.json({ ok: true, tournament });
  },
};
