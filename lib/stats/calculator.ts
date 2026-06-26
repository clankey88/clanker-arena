import { Bot } from "../models/bot/index.ts";
import { Stats } from "../../types/index.ts";
import { MatchContext, ActiveEffect } from "./modifiers.ts";

// Helper to calculate upgrade impact.
// Assuming upgrades are strings like 'combat_+10' or 'vision_*1.2'
function getUpgradeModifiers(upgrades: string[], stat: keyof Stats): { flat: number; multiplier: number } {
  let flat = 0;
  let multiplier = 1;

  for (const upgrade of upgrades) {
    // Example format expected: "vision_flat_10" or "combat_multiplier_1.5"
    const parts = upgrade.split("_");
    if (parts.length >= 3 && parts[0] === stat) {
      const type = parts[1];
      const val = parseFloat(parts[2]);
      if (!isNaN(val)) {
        if (type === "flat") flat += val;
        if (type === "multiplier") multiplier *= val;
      }
    }
  }

  return { flat, multiplier };
}

export function calculateStats(bot: Bot & { baseStats?: Stats }, matchContext?: MatchContext): Stats {
  // If baseStats is not provided directly on the bot, we fall back to effectiveStats as base,
  // though the ideal usage passes a bot object populated with baseStats.
  const base: Stats = bot.baseStats || {
    vision: 10,
    thinking: 10,
    combat: 10,
    movement: 10,
  };

  const finalStats: Stats = { ...base };

  const statsKeys: (keyof Stats)[] = ["vision", "thinking", "combat", "movement"];

  for (const stat of statsKeys) {
    // 1. Apply upgrades
    const upgradeMods = getUpgradeModifiers(bot.upgrades || [], stat);
    let flatMod = upgradeMods.flat;
    let multMod = upgradeMods.multiplier;

    // 2. Apply active deck effects
    if (matchContext && matchContext.activeEffects) {
      const currentTime = matchContext.currentTime;
      
      // Filter valid effects for this stat
      const validEffects = matchContext.activeEffects.filter(effect => {
        if (effect.botId !== bot.id) return false;
        if (effect.stat !== stat) return false;
        
        // Check if expired
        if (effect.durationMs !== undefined) {
          if (currentTime > effect.appliedAt + effect.durationMs) {
            return false;
          }
        }
        return true;
      });

      // Handle stacking rules: group by cardId if not stackable
      const processedEffects: ActiveEffect[] = [];
      const seenUnstackable = new Set<string>();

      // Sort by newest first to keep the latest unstackable effect
      validEffects.sort((a, b) => b.appliedAt - a.appliedAt);

      for (const effect of validEffects) {
        if (!effect.stackable) {
          if (seenUnstackable.has(effect.cardId)) {
            continue; // Skip this effect, we already have a newer one from this card
          }
          seenUnstackable.add(effect.cardId);
        }
        processedEffects.push(effect);
      }

      // Apply processed effects
      for (const effect of processedEffects) {
        if (effect.type === "flat") {
          flatMod += effect.amount;
        } else if (effect.type === "multiplier") {
          multMod *= effect.amount; // multipliers compound
        }
      }
    }

    // 3. Final calculation
    finalStats[stat] = (base[stat] + flatMod) * multMod;
    
    // Ensure stats don't drop below a minimum threshold (e.g., 1)
    if (finalStats[stat] < 1) {
      finalStats[stat] = 1;
    }
  }

  return finalStats;
}
