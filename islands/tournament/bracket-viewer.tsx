import { useState, useEffect } from "preact/hooks";

interface BracketSlot {
  round: number;
  position: number;
  teamAId: string | null;
  teamBId: string | null;
  winnerId: string | null;
  matchId: string | null;
}

export default function BracketViewer({ tournamentId }: { tournamentId: string }) {
  const [bracket, setBracket] = useState<BracketSlot[]>([]);
  const [teamNames, setTeamNames] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.all([
      fetch(`/api/tournament/${tournamentId}/bracket`).then((r) => r.json()),
      fetch(`/api/tournament/${tournamentId}/team`).then((r) => r.json()),
    ]).then(([bracketData, teamData]) => {
      setBracket(bracketData.bracket || []);
      const names: Record<string, string> = {};
      for (const t of teamData.teams || []) {
        names[t.id] = t.name;
      }
      setTeamNames(names);
    }).catch(() => {});
  }, [tournamentId]);

  async function handleGenerate() {
    const res = await fetch(`/api/tournament/${tournamentId}/bracket`, { method: "POST" });
    const data = await res.json();
    if (data.ok) setBracket(data.bracket);
  }

  const rounds = [...new Set(bracket.map((s) => s.round))].sort((a, b) => a - b);

  return (
    <div>
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold text-[#ffd23f] font-[\'Baloo_2\']">BRACKET</h2>
        <button
          onClick={handleGenerate}
          class="bg-[#ffd23f] text-[#171b34] font-bold text-xs px-3 py-1 rounded-lg hover:bg-[#ffe066] transition"
        >
          {bracket.length === 0 ? "GENERATE" : "RE-GENERATE"}
        </button>
      </div>

      {bracket.length === 0
        ? (
          <div class="bg-[#171b34ee] border-2 border-[#0b0e1f] rounded-xl p-8 text-center">
            <div class="text-[#9aa3c9] text-sm">No bracket generated yet</div>
            <div class="text-xs text-[#9aa3c9] mt-1">Create teams first, then generate the bracket</div>
          </div>
        )
        : (
          <div class="space-y-4">
            {rounds.map((round) => (
              <div key={round} class="bg-[#171b34ee] border-2 border-[#0b0e1f] rounded-xl p-4">
                <div class="text-xs font-bold text-[#ffd23f] uppercase tracking-wider mb-2">Round {round}</div>
                {bracket
                  .filter((s) => s.round === round)
                  .map((slot, i) => (
                    <div key={i} class="flex items-center gap-3 py-2 border-b border-[#ffffff0a] last:border-0">
                      <div class="flex-1 text-sm" style={{
                        opacity: slot.winnerId === slot.teamAId ? 1 : 0.5,
                        color: slot.winnerId === slot.teamAId ? "#7cff8a" : "#fff",
                      }}>
                        {slot.teamAId ? (teamNames[slot.teamAId] || "Team " + slot.teamAId.slice(0, 6)) : "---"}
                      </div>
                      <div class="text-xs text-[#9aa3c9] font-bold">VS</div>
                      <div class="flex-1 text-sm text-right" style={{
                        opacity: slot.winnerId === slot.teamBId ? 1 : 0.5,
                        color: slot.winnerId === slot.teamBId ? "#7cff8a" : "#fff",
                      }}>
                        {slot.teamBId ? (teamNames[slot.teamBId] || "Team " + slot.teamBId.slice(0, 6)) : "---"}
                      </div>
                      {slot.winnerId && <div class="text-xs text-[#ffd23f] ml-2 font-bold">WINNER</div>}
                    </div>
                  ))}
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
