import { RouteContext } from "$fresh/server.ts";
import TeamManager from "../../islands/tournament/team-manager.tsx";
import BracketViewer from "../../islands/tournament/bracket-viewer.tsx";

export default function TournamentDetailPage(_req: Request, ctx: RouteContext) {
  const tournamentId = ctx.params.id;

  return (
    <div class="min-h-screen bg-gradient-to-b from-[#0d1530] to-[#1b2340] text-white p-6">
      <div class="max-w-5xl mx-auto">
        <div id="tournament-header">
          <div class="text-center py-8 text-[#9aa3c9]">Loading tournament...</div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <TeamManager tournamentId={tournamentId} />
          <div>
            <BracketViewer tournamentId={tournamentId} />
          </div>
        </div>

        <a href="/tournament" class="inline-block mt-6 text-sm text-[#9aa3c9] hover:text-white transition">
          &larr; Back to Tournaments
        </a>
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `
            (async function() {
              try {
                const res = await fetch('/api/tournament/${tournamentId}');
                const data = await res.json();
                if (!data.tournament) {
                  document.getElementById('tournament-header').innerHTML = '<div class="text-center py-8 text-[#ff7a7a]">Tournament not found</div>';
                  return;
                }
                const t = data.tournament;
                const phaseColors = { registration: '#4ecdc4', active: '#ffd23f', finished: '#ff7a7a' };
                document.getElementById('tournament-header').innerHTML =
                  '<div class="flex justify-between items-start">' +
                  '<div><h1 class="text-3xl font-bold text-[#ffd23f] font-[\\'Baloo 2\\']">' + t.name + '</h1>' +
                  '<p class="text-[#9aa3c9] mt-1">' + (t.description || '') + '</p></div>' +
                  '<div class="text-right"><div class="text-xs font-bold uppercase px-3 py-1 rounded-full inline-block" style="background:' + phaseColors[t.phase] + '22; color:' + phaseColors[t.phase] + '">' + t.phase + '</div>' +
                  '<div class="text-sm mt-2">Prize: <span class="text-[#ffd23f] font-bold">' + t.prizePool.toLocaleString() + '</span> credits</div>' +
                  '<div class="text-xs text-[#9aa3c9]">Entry: ' + t.entryFee + ' credits &middot; ' + t.mode + ' mode</div></div>' +
                  '</div>';
              } catch {}
            })();
          `,
        }}
      />
    </div>
  );
}
