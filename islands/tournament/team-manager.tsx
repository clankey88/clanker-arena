import { useState, useEffect } from "preact/hooks";

interface Team {
  id: string;
  name: string;
  captainId: string;
  memberIds: string[];
  joinCode: string;
}

export default function TeamManager({ tournamentId }: { tournamentId: string }) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamName, setTeamName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [userId] = useState(() => crypto.randomUUID().slice(0, 8));
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(`/api/tournament/${tournamentId}/team`)
      .then((r) => r.json())
      .then((data) => setTeams(data.teams || []))
      .catch(() => {});
  }, [tournamentId]);

  async function handleCreate() {
    if (!teamName.trim()) return;
    setMessage("");
    try {
      const res = await fetch(`/api/tournament/${tournamentId}/team`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", name: teamName, captainId: userId }),
      });
      const data = await res.json();
      if (data.ok) {
        setTeams([...teams, data.team]);
        setTeamName("");
        setMessage(`Team created! Join code: ${data.team.joinCode}`);
      } else {
        setMessage(data.error || "Failed to create team");
      }
    } catch {
      setMessage("Error creating team");
    }
  }

  async function handleJoin() {
    if (!joinCode.trim()) return;
    setMessage("");
    try {
      const res = await fetch(`/api/tournament/${tournamentId}/team`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join", joinCode, userId }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessage("Joined team!");
        const teamsRes = await fetch(`/api/tournament/${tournamentId}/team`);
        const teamsData = await teamsRes.json();
        setTeams(teamsData.teams || []);
        setJoinCode("");
      } else {
        setMessage(data.error || "Failed to join");
      }
    } catch {
      setMessage("Error joining team");
    }
  }

  return (
    <div class="bg-[#171b34ee] border-2 border-[#0b0e1f] rounded-xl p-5 shadow-lg">
      <h2 class="text-xl font-bold text-[#ffd23f] font-[\'Baloo_2\'] mb-4">TEAMS</h2>

      <div class="mb-4 space-y-2">
        <input
          value={teamName}
          onInput={(e) => setTeamName(e.currentTarget.value)}
          placeholder="New team name"
          class="w-full bg-[#0d1530] border border-[#0b0e1f] rounded-lg px-3 py-2 text-sm text-white"
        />
        <button
          onClick={handleCreate}
          disabled={!teamName.trim()}
          class="w-full bg-[#4ecdc4] text-[#171b34] font-bold py-2 rounded-lg hover:bg-[#6ee0d8] disabled:opacity-40 transition text-sm"
        >
          CREATE TEAM
        </button>
      </div>

      <div class="mb-4 space-y-2">
        <input
          value={joinCode}
          onInput={(e) => setJoinCode(e.currentTarget.value)}
          placeholder="Join code"
          class="w-full bg-[#0d1530] border border-[#0b0e1f] rounded-lg px-3 py-2 text-sm text-white"
        />
        <button
          onClick={handleJoin}
          disabled={!joinCode.trim()}
          class="w-full bg-[#ffd23f] text-[#171b34] font-bold py-2 rounded-lg hover:bg-[#ffe066] disabled:opacity-40 transition text-sm"
        >
          JOIN TEAM
        </button>
      </div>

      {message && <div class="text-xs mb-3" style={{ color: message.includes("Error") || message.includes("Failed") ? "#ff7a7a" : "#7cff8a" }}>{message}</div>}

      <div class="space-y-2 max-h-64 overflow-y-auto">
        {teams.length === 0 && <div class="text-sm text-[#9aa3c9] text-center py-4">No teams yet</div>}
        {teams.map((team) => (
          <div key={team.id} class="bg-[#0d1530] rounded-lg p-3">
            <div class="flex justify-between items-center">
              <div>
                <div class="font-medium text-sm">{team.name}</div>
                <div class="text-xs text-[#9aa3c9]">{team.memberIds.length} member{team.memberIds.length !== 1 ? "s" : ""}</div>
              </div>
              <div class="text-xs bg-[#ffffff11] px-2 py-1 rounded font-mono">{team.joinCode}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
