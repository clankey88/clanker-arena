import { RouteContext } from "$fresh/server.ts";

export default function TournamentListPage(_req: Request, _ctx: RouteContext) {
  return (
    <div class="min-h-screen bg-gradient-to-b from-[#0d1530] to-[#1b2340] text-white p-6">
      <div class="max-w-4xl mx-auto">
        <div class="flex justify-between items-center mb-6">
          <h1 class="text-3xl font-bold text-[#ffd23f] font-[\'Baloo_2\']">TOURNAMENTS</h1>
          <a href="/tournament/create" class="bg-[#ffd23f] text-[#171b34] font-bold py-2 px-4 rounded-lg hover:bg-[#ffe066] transition text-sm">
            + CREATE
          </a>
        </div>

        <div id="tournament-list" class="space-y-4">
          <div class="text-center py-8 text-[#9aa3c9]">Loading tournaments...</div>
        </div>

        <a href="/economy" class="inline-block mt-6 text-sm text-[#9aa3c9] hover:text-white transition">
          &larr; Back to Economy
        </a>
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `
            (async function() {
              try {
                const res = await fetch('/api/tournament?all=true');
                const data = await res.json();
                const list = document.getElementById('tournament-list');
                if (data.tournaments.length === 0) {
                  list.innerHTML = '<div class="text-center py-8 text-[#9aa3c9] bg-[#171b34ee] border-2 border-[#0b0e1f] rounded-xl">No tournaments yet</div>';
                  return;
                }
                list.innerHTML = data.tournaments.map(t => {
                  const phaseColors = { registration: '#4ecdc4', active: '#ffd23f', finished: '#ff7a7a' };
                  const color = phaseColors[t.phase] || '#9aa3c9';
                  return '<a href="/tournament/' + t.id + '" class="block bg-[#171b34ee] border-2 border-[#0b0e1f] rounded-xl p-5 hover:border-[#ffd23f44] transition">' +
                    '<div class="flex justify-between items-start">' +
                    '<div><div class="text-lg font-bold font-[\\'Baloo 2\\']">' + t.name + '</div>' +
                    '<div class="text-sm text-[#9aa3c9] mt-1">' + (t.description || '') + '</div></div>' +
                    '<div class="text-xs font-bold uppercase px-3 py-1 rounded-full" style="background:' + color + '22; color:' + color + '">' + t.phase + '</div>' +
                    '</div>' +
                    '<div class="flex gap-4 mt-3 text-xs text-[#9aa3c9]">' +
                    '<span>Mode: ' + t.mode + '</span>' +
                    '<span>Prize: ' + t.prizePool.toLocaleString() + ' credits</span>' +
                    '<span>Entry: ' + t.entryFee + ' credits</span>' +
                    '</div>' +
                    '</a>';
                }).join('');
              } catch {}
            })();
          `,
        }}
      />
    </div>
  );
}
