import { Match } from "../../types/index.ts";

interface RoomConnection {
  ws: WebSocket;
  userId: string;
  backerBotId?: string;
  joinedAt: number;
}

interface Room {
  matchId: string;
  connections: Map<string, RoomConnection>;
}

export class RoomManager {
  private rooms: Map<string, Room> = new Map();

  join(matchId: string, userId: string, ws: WebSocket, backerBotId?: string): void {
    let room = this.rooms.get(matchId);
    if (!room) {
      room = { matchId, connections: new Map() };
      this.rooms.set(matchId, room);
    }

    if (room.connections.has(userId)) {
      const existing = room.connections.get(userId)!;
      try { existing.ws.close(1000, "replaced"); } catch { /* ignore */ }
      room.connections.delete(userId);
    }

    room.connections.set(userId, { ws, userId, backerBotId, joinedAt: Date.now() });

    ws.onclose = () => {
      room?.connections.delete(userId);
      if (room && room.connections.size === 0) {
        this.rooms.delete(matchId);
      }
    };
  }

  leave(matchId: string, userId: string): void {
    const room = this.rooms.get(matchId);
    if (!room) return;
    room.connections.delete(userId);
    if (room.connections.size === 0) {
      this.rooms.delete(matchId);
    }
  }

  broadcast(matchId: string, message: object): void {
    const room = this.rooms.get(matchId);
    if (!room) return;
    const data = JSON.stringify(message);
    for (const conn of room.connections.values()) {
      try {
        if (conn.ws.readyState === WebSocket.OPEN) {
          conn.ws.send(data);
        }
      } catch { /* ignore */ }
    }
  }

  broadcastToBacker(matchId: string, botId: string, message: object): void {
    const room = this.rooms.get(matchId);
    if (!room) return;
    const data = JSON.stringify(message);
    for (const conn of room.connections.values()) {
      if (conn.backerBotId !== botId) continue;
      try {
        if (conn.ws.readyState === WebSocket.OPEN) {
          conn.ws.send(data);
        }
      } catch { /* ignore */ }
    }
  }

  getRoomSize(matchId: string): number {
    return this.rooms.get(matchId)?.connections.size ?? 0;
  }

  getConnectedUserIds(matchId: string): string[] {
    const room = this.rooms.get(matchId);
    if (!room) return [];
    return Array.from(room.connections.keys());
  }

  getBackerBotMap(matchId: string): Map<string, string> {
    const room = this.rooms.get(matchId);
    if (!room) return new Map();
    const map = new Map<string, string>();
    for (const conn of room.connections.values()) {
      if (conn.backerBotId) {
        map.set(conn.userId, conn.backerBotId);
      }
    }
    return map;
  }
}

export const roomManager = new RoomManager();
