import { Handlers } from "$fresh/server.ts";
import { createTournament, listActiveTournaments, listAllTournaments } from "../../../lib/tournament/tournament.ts";

export const handler: Handlers = {
  async GET(req) {
    const all = new URL(req.url).searchParams.get("all") === "true";
    const tournaments = all ? await listAllTournaments() : await listActiveTournaments();
    return Response.json({ tournaments });
  },

  async POST(req) {
    const body = await req.json();
    const { name, description, mode, maxTeams, entryFee, scheduledAt } = body;
    if (!name || !mode || !maxTeams || !entryFee || !scheduledAt) {
      return Response.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }
    const tournament = await createTournament({
      name,
      description: description || "",
      mode,
      maxTeams,
      entryFee,
      scheduledAt: new Date(scheduledAt),
    });
    return Response.json({ ok: true, tournament }, { status: 201 });
  },
};
