import { RouteContext } from "$fresh/server.ts";
import DailyClaim from "../../islands/economy/daily-claim.tsx";

export default function EconomyPage(_req: Request, _ctx: RouteContext) {
  const userId = crypto.randomUUID().slice(0, 8);

  return (
    <div class="min-h-screen bg-gradient-to-b from-[#0d1530] to-[#1b2340] text-white p-6">
      <div class="max-w-4xl mx-auto">
        <h1 class="text-3xl font-bold text-[#ffd23f] font-[\'Baloo_2\'] mb-6">ECONOMY</h1>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div class="bg-[#171b34ee] border-2 border-[#0b0e1f] rounded-xl p-5 shadow-lg">
            <div class="text-sm text-[#9aa3c9] uppercase tracking-wider mb-1">Your Balance</div>
            <div id="balance-display" class="text-3xl font-bold text-[#ffd23f] font-[\'Baloo_2\']">Loading...</div>
          </div>
          <div class="bg-[#171b34ee] border-2 border-[#0b0e1f] rounded-xl p-5 shadow-lg">
            <DailyClaim userId={userId} />
          </div>
          <div class="bg-[#171b34ee] border-2 border-[#0b0e1f] rounded-xl p-5 shadow-lg">
            <div class="text-sm text-[#9aa3c9] uppercase tracking-wider mb-1">Quick Actions</div>
            <div class="space-y-2 mt-3">
              <a href="/tournament" class="block text-center bg-[#ffd23f] text-[#171b34] font-bold py-2 px-4 rounded-lg hover:bg-[#ffe066] transition">
                VIEW TOURNAMENTS
              </a>
              <a href="/" class="block text-center bg-[#ffffff22] text-white font-bold py-2 px-4 rounded-lg hover:bg-[#ffffff33] transition">
                BACK TO ARENA
              </a>
            </div>
          </div>
        </div>

        <div class="bg-[#171b34ee] border-2 border-[#0b0e1f] rounded-xl p-5 shadow-lg">
          <h2 class="text-xl font-bold text-[#ffd23f] font-[\'Baloo_2\'] mb-4">TRANSACTION HISTORY</h2>
          <div id="tx-list" class="text-sm text-[#9aa3c9]">Loading transactions...</div>
        </div>
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `
            (async function() {
              const userId = "${userId}";
              try {
                const [balRes, txRes] = await Promise.all([
                  fetch('/api/economy/balance?userId=' + userId),
                  fetch('/api/economy/transactions?userId=' + userId + '&limit=20')
                ]);
                const bal = await balRes.json();
                const txData = await txRes.json();
                document.getElementById('balance-display').textContent = bal.balance.toLocaleString() + ' CREDITS';
                const txList = document.getElementById('tx-list');
                if (txData.transactions.length === 0) {
                  txList.innerHTML = '<div class="text-center py-4 opacity-60">No transactions yet</div>';
                } else {
                  txList.innerHTML = txData.transactions.map(tx => {
                    const sign = tx.amount > 0 ? '+' : '';
                    const color = tx.amount > 0 ? '#7cff8a' : '#ff7a7a';
                    return '<div class="flex justify-between items-center py-2 border-b border-[#ffffff0a]">' +
                      '<div><div class="text-white font-medium">' + tx.description + '</div>' +
                      '<div class="text-xs opacity-50">' + new Date(tx.createdAt).toLocaleString() + '</div></div>' +
                      '<div class="font-bold" style="color:' + color + '">' + sign + tx.amount + '</div>' +
                      '</div>';
                  }).join('');
                }
              } catch {}
            })();
          `,
        }}
      />
    </div>
  );
}
