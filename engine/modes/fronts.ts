import { EngineState, EngineEvent, PRNG } from "../core.ts";

export interface FrontsState {
  tiles: { x: number, y: number, ownerId: string | null }[];
  cols: number;
  rows: number;
}

export const frontsMode = {
  init(state: EngineState, rng: PRNG): FrontsState {
    const cols = 5;
    const rows = 5;
    const tiles = [];
    for(let x=0; x<cols; x++) {
      for(let y=0; y<rows; y++) {
        tiles.push({ x, y, ownerId: null });
      }
    }
    return { tiles, cols, rows };
  },
  
  tick(state: EngineState, rng: PRNG, emit: (e: EngineEvent) => void, timeStep: number): boolean {
    const modeState = state.modeState as FrontsState;
    const tileW = state.mapWidth / modeState.cols;
    const tileH = state.mapHeight / modeState.rows;
    
    for (const bot of state.bots) {
       if (bot.isDead) continue;
       const col = Math.floor(bot.x / tileW);
       const row = Math.floor(bot.y / tileH);
       if (col >= 0 && col < modeState.cols && row >= 0 && row < modeState.rows) {
          const tile = modeState.tiles.find(t => t.x === col && t.y === row);
          if (tile && tile.ownerId !== bot.id) {
             tile.ownerId = bot.id;
             emit({ type: "tile_captured", botId: bot.id, x: col, y: row });
          }
       }
    }
    
    for (const bot of state.bots) {
       const ownedCount = modeState.tiles.filter(t => t.ownerId === bot.id).length;
       bot.score += ownedCount * timeStep; 
    }
    
    return false;
  }
}
