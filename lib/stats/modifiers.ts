import { Stats } from "../../types/index.ts";

export type StatCategory = keyof Stats;
export type EffectType = "flat" | "multiplier" | "instant";

export interface ActiveEffect {
  id: string;
  cardId: string;
  botId: string;
  stat?: StatCategory;
  amount: number;
  type: EffectType;
  appliedAt: number;
  durationMs?: number; // undefined if permanent for the match
  stackable: boolean;
}

export interface MatchContext {
  activeEffects: ActiveEffect[];
  currentTime: number; // Unix timestamp or match time in ms
}
