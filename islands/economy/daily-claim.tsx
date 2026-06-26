import { useState, useEffect } from "preact/hooks";

interface DailyStatus {
  canClaim: boolean;
  streak: number;
  nextReward: number;
  lastClaimDate: string | null;
}

export default function DailyClaim({ userId }: { userId: string }) {
  const [status, setStatus] = useState<DailyStatus | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(`/api/economy/daily?userId=${userId}`)
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => {});
  }, [userId]);

  async function handleClaim() {
    setClaiming(true);
    setMessage("");
    try {
      const res = await fetch("/api/economy/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessage(`Claimed ${data.amount} credits! (${data.streak} day streak)`);
        setStatus({ canClaim: false, streak: data.streak, nextReward: data.amount + 50, lastClaimDate: null });
      } else {
        setMessage(data.error || "Failed to claim");
      }
    } catch {
      setMessage("Error claiming reward");
    }
    setClaiming(false);
  }

  return (
    <div>
      <div class="text-sm text-[#9aa3c9] uppercase tracking-wider mb-1">Daily Reward</div>
      {status && (
        <>
          <div class="text-2xl font-bold text-[#ffd23f] font-[\'Baloo_2\']">
            {status.nextReward} CREDITS
          </div>
          <div class="text-xs text-[#9aa3c9] mt-1">
            Streak: {status.streak} day{status.streak !== 1 ? "s" : ""}
          </div>
          {status.canClaim
            ? (
              <button
                onClick={handleClaim}
                disabled={claiming}
                class="mt-3 w-full bg-[#4ecdc4] text-[#171b34] font-bold py-2 px-4 rounded-lg hover:bg-[#6ee0d8] disabled:opacity-40 transition text-sm"
              >
                {claiming ? "CLAIMING..." : "CLAIM"}
              </button>
            )
            : (
              <div class="mt-3 text-xs text-[#ffd23f] text-center py-2 bg-[#ffd23f11] rounded-lg">
                CLAIMED TODAY
              </div>
            )}
          {message && <div class="mt-2 text-xs text-center" style={{ color: message.includes("Error") ? "#ff7a7a" : "#7cff8a" }}>{message}</div>}
        </>
      )}
      {!status && <div class="text-sm text-[#9aa3c9] mt-2">Loading...</div>}
    </div>
  );
}
