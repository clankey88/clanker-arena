import { RouteContext } from "$fresh/server.ts";
import { getMatch } from "../../lib/models/match/index.ts";
import ArenaViewer from "../../islands/arena-viewer.tsx";

export default async function ArenaPage(_req: Request, ctx: RouteContext) {
  const matchId = ctx.params.id;
  const match = await getMatch(matchId);

  if (!match) {
    return (
      <div class="p-8 text-center">
        <h1 class="text-2xl font-bold text-red-500">Match not found</h1>
        <p class="text-gray-400 mt-2">No match exists with id: {matchId}</p>
      </div>
    );
  }

  const userId = crypto.randomUUID().slice(0, 8);

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <ArenaViewer matchId={matchId} userId={userId} matchData={match} />
    </div>
  );
}
