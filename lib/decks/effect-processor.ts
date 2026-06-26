import { Bot } from "../models/bot/index.ts";
import { Card } from "../../types/index.ts";
import { MatchContext, ActiveEffect } from "../stats/modifiers.ts";
import { CARD_DEFINITIONS } from "../../data/cards.ts";

export interface ProcessResult {
  success: boolean;
  message?: string;
  instantActions?: string[]; // to be handled by the engine, e.g., ["heal:50", "shield:20"]
}

/**
 * Process a card played during a match.
 * Applies stat buffs to the match context and returns instant actions for the engine to execute.
 */
export function processCard(card: Card, bot: Bot, matchContext: MatchContext): ProcessResult {
  const cardDef = CARD_DEFINITIONS[card.id];
  if (!cardDef) {
    return { success: false, message: "Card definition not found" };
  }

  const result: ProcessResult = {
    success: true,
    instantActions: []
  };

  const newIdBase = `${card.id}_${matchContext.currentTime}_${Math.random().toString(36).substring(2, 9)}`;

  for (let i = 0; i < cardDef.effects.length; i++) {
    const effectDef = cardDef.effects[i];
    
    if (effectDef.effectCategory === "stat_buff" && effectDef.stat && effectDef.modifierType) {
      const activeEffect: ActiveEffect = {
        id: `${newIdBase}_${i}`,
        cardId: card.id,
        botId: bot.id,
        stat: effectDef.stat,
        amount: effectDef.amount,
        type: effectDef.modifierType,
        appliedAt: matchContext.currentTime,
        durationMs: cardDef.durationMs,
        stackable: cardDef.stackable
      };
      
      // If it's not stackable, the calculator will filter out older effects,
      // but we just push it to the active effects list here.
      matchContext.activeEffects.push(activeEffect);
      
    } else if (effectDef.effectCategory === "instant" && effectDef.instantAction) {
      // Pass instant actions to the engine
      result.instantActions!.push(`${effectDef.instantAction}:${effectDef.amount}`);
    }
  }

  return result;
}
