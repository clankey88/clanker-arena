import { EngineState, EngineEvent, PRNG } from "../core.ts";

export interface KothState {
  hill: { x: number, y: number, radius: number, ownerId: string | null, captureProgress: number };
}

export const kothMode = {
  init(state: EngineState, rng: PRNG): KothState {
    return {
      hill: { x: state.mapWidth / 2, y: state.mapHeight / 2, radius: 20, ownerId: null, captureProgress: 0 }
    };
  },
  
  tick(state: EngineState, rng: PRNG, emit: (e: EngineEvent) => void, timeStep: number): boolean {
    const modeState = state.modeState as KothState;
    const hill = modeState.hill;
    
    const botsInHill = state.bots.filter(b => {
       if (b.isDead) return false;
       const dx = b.x - hill.x;
       const dy = b.y - hill.y;
       return Math.sqrt(dx*dx + dy*dy) <= hill.radius;
    });
    
    if (botsInHill.length === 1) {
       const bot = botsInHill[0];
       if (hill.ownerId !== bot.id) {
          hill.captureProgress += timeStep * 10;
          if (hill.captureProgress >= 100) {
             hill.ownerId = bot.id;
             hill.captureProgress = 0;
             emit({ type: "hill_captured", botId: bot.id });
          }
       } else {
          bot.score += timeStep * 10; 
       }
    } else if (botsInHill.length === 0) {
       if (hill.captureProgress > 0) {
          hill.captureProgress -= timeStep * 5;
          if (hill.captureProgress < 0) hill.captureProgress = 0;
       } else if (hill.ownerId) {
          const owner = state.bots.find(b => b.id === hill.ownerId);
          if (owner) owner.score += timeStep * 5;
       }
    }
    
    return false;
  }
}
