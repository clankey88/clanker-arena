import { Bot, Match } from "../types/index.ts";
import { frontsMode } from "./modes/fronts.ts";
import { kothMode } from "./modes/koth.ts";
import { ffaMode } from "./modes/ffa.ts";
import { behave } from "./ai/behavior.ts";

export interface EngineBot {
  id: string;
  stats: Bot["effectiveStats"];
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  targetX: number;
  targetY: number;
  score: number;
  kills: number;
  isDead: boolean;
  respawnTimer: number;
  cooldown: number;
}

export interface EngineState {
  matchId: string;
  mode: Match["mode"];
  bots: EngineBot[];
  timeRemaining: number;
  modeState: any; 
  mapWidth: number;
  mapHeight: number;
  tickCount: number;
}

export interface MatchResult {
  winnerId: string | null;
  botScores: Record<string, number>;
}

export interface EngineEvent {
  type: string;
  [key: string]: any;
}

export type EventCallback = (event: EngineEvent, stateSnapshot: EngineState) => void;

export class PRNG {
  private m_w: number;
  private m_z: number;

  constructor(seed: number) {
    this.m_w = Math.floor(seed);
    this.m_z = 987654321;
  }

  next(): number {
    this.m_z = (36969 * (this.m_z & 65535) + (this.m_z >> 16)) & 0xffffffff;
    this.m_w = (18000 * (this.m_w & 65535) + (this.m_w >> 16)) & 0xffffffff;
    let result = ((this.m_z << 16) + this.m_w) & 0xffffffff;
    result /= 4294967296;
    return result + 0.5;
  }

  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
}

export async function runMatch(
  initialState: EngineState,
  seed: number,
  onEvent?: EventCallback,
  tickMs: number = 100, // Real-time delay between ticks (0 for instant)
  timeStep: number = 0.1 // Simulation time elapsed per tick in seconds
): Promise<MatchResult> {
  const rng = new PRNG(seed);
  const state: EngineState = { ...initialState };
  state.bots = initialState.bots.map((b) => ({ ...b }));

  if (state.mode === "Fronts") {
    state.modeState = frontsMode.init(state, rng);
  } else if (state.mode === "King of the Hill") {
    state.modeState = kothMode.init(state, rng);
  } else if (state.mode === "Free-for-All") {
    state.modeState = ffaMode.init(state, rng);
  }

  let matchOver = false;

  const runTick = () => {
    state.tickCount++;
    state.timeRemaining -= timeStep;

    const emit = (e: EngineEvent) => {
      if (onEvent) onEvent(e, state);
    };

    // 1. Process respawns
    for (const bot of state.bots) {
      if (bot.isDead) {
        bot.respawnTimer -= timeStep;
        if (bot.respawnTimer <= 0 && state.mode !== "Free-for-All") {
          bot.isDead = false;
          bot.health = bot.maxHealth;
          bot.x = rng.range(0, state.mapWidth);
          bot.y = rng.range(0, state.mapHeight);
          emit({ type: "respawn", botId: bot.id });
        }
      } else {
         if (bot.cooldown > 0) bot.cooldown -= timeStep;
      }
    }

    // 2. AI Behavior & Movement
    for (const bot of state.bots) {
      if (bot.isDead) continue;
      behave(bot, state, rng, emit, timeStep);
    }

    // 3. Mode specific logic
    if (state.mode === "Fronts") {
      matchOver = frontsMode.tick(state, rng, emit, timeStep);
    } else if (state.mode === "King of the Hill") {
      matchOver = kothMode.tick(state, rng, emit, timeStep);
    } else if (state.mode === "Free-for-All") {
      matchOver = ffaMode.tick(state, rng, emit, timeStep);
    }

    if (state.timeRemaining <= 0) {
      matchOver = true;
    }
  };

  const finishMatch = (): MatchResult => {
    let winnerId: string | null = null;
    let maxScore = -1;
    const botScores: Record<string, number> = {};
    for (const bot of state.bots) {
       botScores[bot.id] = bot.score;
       if (bot.score > maxScore) {
         maxScore = bot.score;
         winnerId = bot.id;
       }
    }
    
    if (state.mode === "Free-for-All") {
       const alive = state.bots.filter(b => !b.isDead);
       if (alive.length === 1) {
         winnerId = alive[0].id;
       } else if (alive.length === 0) {
         winnerId = null;
       }
    }

    if (onEvent) onEvent({ type: "match_end", winnerId }, state);
    return { winnerId, botScores };
  };

  if (tickMs === 0) {
    while (!matchOver) {
      runTick();
    }
    return Promise.resolve(finishMatch());
  } else {
    return new Promise((resolve) => {
      const timer = setInterval(() => {
        runTick();
        if (matchOver) {
          clearInterval(timer);
          resolve(finishMatch());
        }
      }, tickMs);
    });
  }
}
