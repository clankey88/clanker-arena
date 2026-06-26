import { EngineState, EngineEvent, PRNG } from "../core.ts";

export interface FfaState {
  stormRadius: number;
  stormCenter: { x: number, y: number };
}

export const ffaMode = {
  init(state: EngineState, rng: PRNG): FfaState {
    return {
       stormRadius: Math.max(state.mapWidth, state.mapHeight),
       stormCenter: { x: state.mapWidth / 2, y: state.mapHeight / 2 }
    };
  },
  
  tick(state: EngineState, rng: PRNG, emit: (e: EngineEvent) => void, timeStep: number): boolean {
    const modeState = state.modeState as FfaState;
    
    modeState.stormRadius -= timeStep * 1.5; 
    if (modeState.stormRadius < 0) modeState.stormRadius = 0;
    
    let aliveCount = 0;
    for (const bot of state.bots) {
       if (bot.isDead) continue;
       aliveCount++;
       
       const dx = bot.x - modeState.stormCenter.x;
       const dy = bot.y - modeState.stormCenter.y;
       const dist = Math.sqrt(dx*dx + dy*dy);
       if (dist > modeState.stormRadius) {
          bot.health -= timeStep * 10;
          if (bot.health <= 0) {
             bot.health = 0;
             bot.isDead = true;
             emit({ type: "kill", killerId: "storm", victimId: bot.id });
             aliveCount--;
          }
       }
    }
    
    if (aliveCount <= 1) {
       return true; 
    }
    return false;
  }
}
