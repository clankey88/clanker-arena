import { useSignal, useComputed } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";

interface MatchConnectionProps {
  matchId: string;
  userId: string;
  backerBotId?: string;
}

export default function MatchConnection(
  { matchId, userId, backerBotId }: MatchConnectionProps,
) {
  const wsRef = useRef<WebSocket | null>(null);
  const connected = useSignal(false);
  const error = useSignal<string | null>(null);
  const lastSnapshot = useSignal<any>(null);
  const events = useSignal<any[]>([]);
  const cardCooldowns = useSignal<Record<string, number>>({});
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const protocol = useComputed(() =>
    window.location.protocol === "https:" ? "wss:" : "ws:"
  );

  const connect = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const url = `${protocol.value}//${window.location.host}/api/ws/match/${matchId}`;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        connected.value = true;
        error.value = null;
        reconnectAttempts.current = 0;

        ws.send(JSON.stringify({
          type: "join",
          userId,
          backerBotId,
        }));

        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }));
          }
        }, 30000);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          switch (msg.type) {
            case "state_snapshot":
              lastSnapshot.value = msg;
              break;
            case "match_event":
              events.value = [...events.value.slice(-50), msg.event];
              break;
            case "match_end":
              lastSnapshot.value = { ...lastSnapshot.value, matchEnd: msg };
              break;
            case "card_played":
              if (msg.success && msg.cardId) {
                cardCooldowns.value = {
                  ...cardCooldowns.value,
                  [msg.cardId]: Date.now() + 30000,
                };
              }
              break;
            case "error":
              error.value = msg.message;
              break;
          }
        } catch { /* ignore malformed */ }
      };

      ws.onclose = () => {
        connected.value = false;
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);
          setTimeout(connect, delay);
        } else {
          error.value = "Connection lost. Please refresh.";
        }
      };

      ws.onerror = () => {
        error.value = "WebSocket error";
      };
    } catch (err) {
      error.value = `Connection failed: ${err instanceof Error ? err.message : String(err)}`;
    }
  };

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
    };
  }, [matchId, userId]);

  const statusColor = connected.value ? "bg-green-500" : "bg-red-500";

  return (
    <div class="flex flex-col gap-4 p-4 bg-gray-900 text-white rounded-lg">
      <div class="flex items-center gap-2">
        <span class={`w-3 h-3 rounded-full ${statusColor}`} />
        <span class="text-sm font-mono">
          {connected.value ? "Connected" : "Disconnected"}
        </span>
      </div>

      {error.value && (
        <div class="bg-red-900/50 border border-red-500 rounded px-3 py-2 text-sm">
          {error.value}
        </div>
      )}

      {!connected.value && !error.value && (
        <button
          onClick={connect}
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium"
        >
          Reconnect
        </button>
      )}

      <div class="text-xs font-mono text-gray-400">
        <div>Match: {matchId.slice(0, 8)}...</div>
        <div>User: {userId.slice(0, 8)}...</div>
        {backerBotId && <div>Backing: {backerBotId.slice(0, 8)}...</div>}
        <div>Events: {events.value.length}</div>
      </div>
    </div>
  );
}
