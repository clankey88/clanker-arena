// TICKET T-005: Secured WebSocket endpoint with authentication
import { Handlers } from "$fresh/server.ts";
import { roomManager } from "../../../../lib/ws/room-manager.ts";
import { broadcastCardPlayFeedback } from "../../../../lib/ws/match-broadcaster.ts";
import { getMatch } from "../../../../lib/models/match/index.ts";
import { getBot } from "../../../../lib/models/bot/index.ts";
import { getSessionUser } from "../../../../lib/models/user/index.ts";

interface ClientMessage {
  type: "join" | "leave" | "play_card" | "ping";
  backerBotId?: string;
  cardId?: string;
}

export const handler: Handlers = {
  async GET(req, ctx) {
    const matchId = ctx.params.id;

    if (req.headers.get("upgrade") !== "websocket") {
      return new Response(null, { status: 501 });
    }

    // SECURITY: Validate session before upgrading to WebSocket
    const cookies = req.headers.get("cookie");
    if (!cookies) {
      return new Response("Unauthorized: No session", { status: 401 });
    }

    const sessionCookie = cookies.split(";").find((c) => c.trim().startsWith("session_id="));
    if (!sessionCookie) {
      return new Response("Unauthorized: No session", { status: 401 });
    }

    const sessionId = sessionCookie.split("=")[1];
    const user = await getSessionUser(sessionId);
    
    if (!user) {
      return new Response("Unauthorized: Invalid session", { status: 401 });
    }

    const match = await getMatch(matchId);
    if (!match) {
      return new Response("Match not found", { status: 404 });
    }

    const { socket, response } = Deno.upgradeWebSocket(req);

    socket.onopen = () => {
      console.log(`[WS] Connection opened for match ${matchId} by user ${user.id}`);
    };

    socket.onmessage = async (event) => {
      try {
        const msg: ClientMessage = JSON.parse(event.data);

        switch (msg.type) {
          case "join": {
            // User is already authenticated via session
            roomManager.join(matchId, user.id, socket, msg.backerBotId);
            socket.send(JSON.stringify({
              type: "joined",
              matchId,
              userId: user.id,
              backerBotId: msg.backerBotId,
            }));
            break;
          }

          case "leave": {
            roomManager.leave(matchId, user.id);
            socket.send(JSON.stringify({
              type: "left",
              matchId,
              userId: user.id,
            }));
            break;
          }

          case "play_card": {
            if (!msg.cardId || !msg.backerBotId) {
              socket.send(JSON.stringify({
                type: "error",
                message: "cardId and backerBotId required",
              }));
              return;
            }

            // SECURITY: Validate that the user is backing this bot
            const bot = await getBot(msg.backerBotId);
            if (!bot) {
              broadcastCardPlayFeedback(
                matchId, user.id, msg.backerBotId, msg.cardId,
                false, "Bot not found",
              );
              return;
            }

            // TODO: Add validation that user is actually backing this bot in this match
            // This should check the match state to ensure user.id is the backer of msg.backerBotId

            broadcastCardPlayFeedback(
              matchId, user.id, msg.backerBotId, msg.cardId,
              true, "Card played",
            );

            socket.send(JSON.stringify({
              type: "card_played",
              matchId,
              userId: user.id,
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
        console.error(`[WS] Error processing message for user ${user.id}:`, err);
        socket.send(JSON.stringify({
          type: "error",
          message: `Invalid message: ${err instanceof Error ? err.message : String(err)}`,
        }));
      }
    };

    socket.onclose = () => {
      console.log(`[WS] Connection closed for match ${matchId} by user ${user.id}`);
      roomManager.leave(matchId, user.id);
    };

    socket.onerror = (err) => {
      console.error(`[WS] Error on match ${matchId} for user ${user.id}:`, err);
    };

    return response;
  },
};