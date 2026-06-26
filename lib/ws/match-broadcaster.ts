import { EngineState, EngineEvent, MatchResult } from "../../engine/core.ts";
import { roomManager } from "./room-manager.ts";

interface StateSnapshot {
  type: "state_snapshot";
  matchId: string;
  tick: number;
  bots: Array<{
    id: string;
    x: number;
    y: number;
    health: number;
    maxHealth: number;
    score: number;
    kills: number;
    isDead: boolean;
  }>;
  timeRemaining: number;
  modeState: any;
}

interface MatchEvent {
  type: "match_event";
  matchId: string;
  event: EngineEvent;
}

interface MatchEnd {
  type: "match_end";
  matchId: string;
  winnerId: string | null;
  botScores: Record<string, number>;
}

interface CardPlayFeedback {
  type: "card_played";
  matchId: string;
  userId: string;
  botId: string;
  cardId: string;
  success: boolean;
  message?: string;
}

type BroadcastMessage = StateSnapshot | MatchEvent | MatchEnd | CardPlayFeedback;

export function broadcastStateSnapshot(matchId: string, state: EngineState): void {
  const snapshot: StateSnapshot = {
    type: "state_snapshot",
    matchId,
    tick: state.tickCount,
    bots: state.bots.map((b) => ({
      id: b.id,
      x: b.x,
      y: b.y,
      health: b.health,
      maxHealth: b.maxHealth,
      score: b.score,
      kills: b.kills,
      isDead: b.isDead,
    })),
    timeRemaining: state.timeRemaining,
    modeState: state.modeState,
  };
  roomManager.broadcast(matchId, snapshot);
}

export function broadcastEngineEvent(matchId: string, event: EngineEvent): void {
  const msg: MatchEvent = {
    type: "match_event",
    matchId,
    event,
  };
  roomManager.broadcast(matchId, msg);
}

export function broadcastMatchEnd(matchId: string, result: MatchResult): void {
  const msg: MatchEnd = {
    type: "match_end",
    matchId,
    winnerId: result.winnerId,
    botScores: result.botScores,
  };
  roomManager.broadcast(matchId, msg);
}

export function broadcastCardPlayFeedback(
  matchId: string,
  userId: string,
  botId: string,
  cardId: string,
  success: boolean,
  message?: string,
): void {
  const msg: CardPlayFeedback = {
    type: "card_played",
    matchId,
    userId,
    botId,
    cardId,
    success,
    message,
  };
  roomManager.broadcast(matchId, msg);
}
