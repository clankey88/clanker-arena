import { RouteContext } from "$fresh/server.ts";

export default function CreateTournamentPage(_req: Request, _ctx: RouteContext) {
  return (
    <div class="min-h-screen bg-gradient-to-b from-[#0d1530] to-[#1b2340] text-white p-6">
      <div class="max-w-xl mx-auto">
        <h1 class="text-3xl font-bold text-[#ffd23f] font-[\'Baloo_2\'] mb-6">CREATE TOURNAMENT</h1>

        <form
          class="bg-[#171b34ee] border-2 border-[#0b0e1f] rounded-xl p-6 space-y-4"
          onSubmit="handleCreate(event)"
        >
          <div>
            <label class="block text-sm text-[#9aa3c9] mb-1">Tournament Name</label>
            <input name="name" required class="w-full bg-[#0d1530] border border-[#0b0e1f] rounded-lg px-4 py-2 text-white" />
          </div>
          <div>
            <label class="block text-sm text-[#9aa3c9] mb-1">Description</label>
            <textarea name="description" rows={3} class="w-full bg-[#0d1530] border border-[#0b0e1f] rounded-lg px-4 py-2 text-white"></textarea>
          </div>
          <div>
            <label class="block text-sm text-[#9aa3c9] mb-1">Mode</label>
            <select name="mode" class="w-full bg-[#0d1530] border border-[#0b0e1f] rounded-lg px-4 py-2 text-white">
              <option value="solo">Solo</option>
              <option value="team">Team (4v4)</option>
            </select>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm text-[#9aa3c9] mb-1">Max Teams</label>
              <input name="maxTeams" type="number" value="8" min="2" max="32" required class="w-full bg-[#0d1530] border border-[#0b0e1f] rounded-lg px-4 py-2 text-white" />
            </div>
            <div>
              <label class="block text-sm text-[#9aa3c9] mb-1">Entry Fee (credits)</label>
              <input name="entryFee" type="number" value="100" min="0" required class="w-full bg-[#0d1530] border border-[#0b0e1f] rounded-lg px-4 py-2 text-white" />
            </div>
          </div>
          <div>
            <label class="block text-sm text-[#9aa3c9] mb-1">Scheduled Date</label>
            <input name="scheduledAt" type="datetime-local" required class="w-full bg-[#0d1530] border border-[#0b0e1f] rounded-lg px-4 py-2 text-white" />
          </div>
          <button type="submit" class="w-full bg-[#ffd23f] text-[#171b34] font-bold py-3 px-4 rounded-lg hover:bg-[#ffe066] transition text-lg">
            CREATE TOURNAMENT
          </button>
        </form>

        <a href="/tournament" class="inline-block mt-4 text-sm text-[#9aa3c9] hover:text-white transition">
          &larr; Back to Tournaments
        </a>
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `
            async function handleCreate(e) {
              e.preventDefault();
              const form = e.target;
              const data = Object.fromEntries(new FormData(form));
              data.maxTeams = parseInt(data.maxTeams);
              data.entryFee = parseInt(data.entryFee);
              data.scheduledAt = new Date(data.scheduledAt).toISOString();
              try {
                const res = await fetch('/api/tournament', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(data),
                });
                const result = await res.json();
                if (result.ok) {
                  window.location.href = '/tournament/' + result.tournament.id;
                } else {
                  alert('Error: ' + (result.error || 'Unknown'));
                }
              } catch (err) {
                alert('Error: ' + err.message);
              }
            }
          `,
        }}
      />
    </div>
  );
}
