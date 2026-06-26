import { Card } from "../../types/index.ts";
import { StatCategory, EffectType } from "../stats/modifiers.ts";

export interface CardEffectDefinition {
  effectCategory: "stat_buff" | "instant";
  stat?: StatCategory;
  amount: number;
  modifierType?: EffectType;
  instantAction?: string;
}

export interface CardDefinition extends Card {
  stackable: boolean;
  effects: CardEffectDefinition[];
}
