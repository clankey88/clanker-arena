import { Handlers } from "$fresh/server.ts";
import { roomManager } from "../../../../lib/ws/room-manager.ts";
import { broadcastCardPlayFeedback } from "../../../../lib/ws/match-broadcaster.ts";
import { getMatch } from "../../../../lib/models/match/index.ts";
import { getBot } from "../../../../lib/models/bot/index.ts";

interface ClientMessage {
  type: "join" | "leave" | "play_card" | "ping";
  userId?: string;
  backerBotId?: string;
  cardId?: string;
}

export const handler: Handlers = {
  async GET(req, ctx) {
    const matchId = ctx.params.id;

    if (req.headers.get("upgrade") !== "websocket") {
      return new Response(null, { status: 501 });
    }

    const match = await getMatch(matchId);
    if (!match) {
      return new Response("Match not found", { status: 404 });
    }

    const { socket, response } = Deno.upgradeWebSocket(req);

    socket.onopen = () => {
      console.log(`[WS] Connection opened for match ${matchId}`);
    };

    socket.onmessage = async (event) => {
      try {
        const msg: ClientMessage = JSON.parse(event.data);

        switch (msg.type) {
          case "join": {
            if (!msg.userId) {
              socket.send(JSON.stringify({ type: "error", message: "userId required" }));
              return;
            }
            roomManager.join(matchId, msg.userId, socket, msg.backerBotId);
            socket.send(JSON.stringify({
              type: "joined",
              matchId,
              backerBotId: msg.backerBotId,
            }));
            break;
          }

          case "leave": {
            if (!msg.userId) {
              socket.send(JSON.stringify({ type: "error", message: "userId required" }));
              return;
            }
            roomManager.leave(matchId, msg.userId);
            break;
          }

          case "play_card": {
            if (!msg.userId || !msg.cardId || !msg.backerBotId) {
              socket.send(JSON.stringify({
                type: "error",
                message: "userId, cardId, and backerBotId required",
              }));
              return;
            }

            const bot = await getBot(msg.backerBotId);
            if (!bot) {
              broadcastCardPlayFeedback(
                matchId, msg.userId, msg.backerBotId, msg.cardId,
                false, "Bot not found",
              );
              return;
            }

            broadcastCardPlayFeedback(
              matchId, msg.userId, msg.backerBotId, msg.cardId,
              true, "Card played",
            );

            socket.send(JSON.stringify({
              type: "card_played",
              matchId,
              userId: msg.userId,
              botId: msg.backerBotId,
              cardId: msg.cardId,
              success: true,
            }));
            break;
          }

          case "ping": {
            socket.send(JSON.stringify({ type: "pong" }));
            break;
          }

          default: {
            socket.send(JSON.stringify({
              type: "error",
              message: `Unknown message type: ${msg.type}`,
            }));
          }
        }
      } catch (err) {
        socket.send(JSON.stringify({
          type: "error",
          message: `Invalid message: ${err instanceof Error ? err.message : String(err)}`,
        }));
      }
    };

    socket.onclose = () => {
      console.log(`[WS] Connection closed for match ${matchId}`);
    };

    socket.onerror = (err) => {
      console.error(`[WS] Error on match ${matchId}:`, err);
    };

    return response;
  },
};
