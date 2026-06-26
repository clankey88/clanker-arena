import { CardDefinition } from "../lib/decks/card-definitions.ts";

export const CARD_DEFINITIONS: Record<string, CardDefinition> = {
  "card_vision_flat": {
    id: "card_vision_flat",
    name: "Enhanced Optics",
    effect: "Boosts vision slightly for 15 seconds.",
    durationMs: 15000,
    cooldownMs: 30000,
    stackable: false,
    effects: [{ effectCategory: "stat_buff", stat: "vision", amount: 5, modifierType: "flat" }]
  },
  "card_vision_mult": {
    id: "card_vision_mult",
    name: "Tactical Radar",
    effect: "Increases vision by 50% for 10 seconds.",
    durationMs: 10000,
    cooldownMs: 40000,
    stackable: false,
    effects: [{ effectCategory: "stat_buff", stat: "vision", amount: 1.5, modifierType: "multiplier" }]
  },
  "card_thinking_flat": {
    id: "card_thinking_flat",
    name: "Predictive Algorithms",
    effect: "Increases thinking by 5 for 15 seconds.",
    durationMs: 15000,
    cooldownMs: 30000,
    stackable: true,
    effects: [{ effectCategory: "stat_buff", stat: "thinking", amount: 5, modifierType: "flat" }]
  },
  "card_thinking_mult": {
    id: "card_thinking_mult",
    name: "Overclock CPU",
    effect: "Doubles thinking for 8 seconds.",
    durationMs: 8000,
    cooldownMs: 45000,
    stackable: false,
    effects: [{ effectCategory: "stat_buff", stat: "thinking", amount: 2.0, modifierType: "multiplier" }]
  },
  "card_combat_flat": {
    id: "card_combat_flat",
    name: "Heavy Caliber",
    effect: "Increases combat effectiveness by 10 for 10 seconds.",
    durationMs: 10000,
    cooldownMs: 35000,
    stackable: false,
    effects: [{ effectCategory: "stat_buff", stat: "combat", amount: 10, modifierType: "flat" }]
  },
  "card_combat_mult": {
    id: "card_combat_mult",
    name: "Adrenaline Surge",
    effect: "Increases combat by 50% for 5 seconds.",
    durationMs: 5000,
    cooldownMs: 25000,
    stackable: true,
    effects: [{ effectCategory: "stat_buff", stat: "combat", amount: 1.5, modifierType: "multiplier" }]
  },
  "card_movement_flat": {
    id: "card_movement_flat",
    name: "Speed Boost",
    effect: "Increases movement speed by 15 for 8 seconds.",
    durationMs: 8000,
    cooldownMs: 30000,
    stackable: false,
    effects: [{ effectCategory: "stat_buff", stat: "movement", amount: 15, modifierType: "flat" }]
  },
  "card_movement_mult": {
    id: "card_movement_mult",
    name: "Nitro Injector",
    effect: "Doubles movement speed for 3 seconds.",
    durationMs: 3000,
    cooldownMs: 50000,
    stackable: false,
    effects: [{ effectCategory: "stat_buff", stat: "movement", amount: 2.0, modifierType: "multiplier" }]
  },
  "card_heal_small": {
    id: "card_heal_small",
    name: "Quick Fix",
    effect: "Instantly heals the bot for 25 HP.",
    cooldownMs: 20000,
    stackable: true,
    effects: [{ effectCategory: "instant", amount: 25, instantAction: "heal" }]
  },
  "card_heal_large": {
    id: "card_heal_large",
    name: "Emergency Repair",
    effect: "Instantly heals the bot for 75 HP.",
    cooldownMs: 60000,
    stackable: true,
    effects: [{ effectCategory: "instant", amount: 75, instantAction: "heal" }]
  },
  "card_shield": {
    id: "card_shield",
    name: "Energy Shield",
    effect: "Applies a 50 HP shield instantly.",
    cooldownMs: 45000,
    stackable: false,
    effects: [{ effectCategory: "instant", amount: 50, instantAction: "shield" }]
  },
  "card_emp": {
    id: "card_emp",
    name: "EMP Blast",
    effect: "Triggers an EMP blast from the bot.",
    cooldownMs: 90000,
    stackable: false,
    effects: [{ effectCategory: "instant", amount: 1, instantAction: "emp" }]
  },
  "card_sniper_stance": {
    id: "card_sniper_stance",
    name: "Sniper Stance",
    effect: "Increases vision by 50% and combat by 20%, but reduces movement by 10 for 10 seconds.",
    durationMs: 10000,
    cooldownMs: 40000,
    stackable: false,
    effects: [
      { effectCategory: "stat_buff", stat: "vision", amount: 1.5, modifierType: "multiplier" },
      { effectCategory: "stat_buff", stat: "combat", amount: 1.2, modifierType: "multiplier" },
      { effectCategory: "stat_buff", stat: "movement", amount: -10, modifierType: "flat" }
    ]
  },
  "card_berserker": {
    id: "card_berserker",
    name: "Berserker Mode",
    effect: "Doubles combat but halves thinking for 8 seconds.",
    durationMs: 8000,
    cooldownMs: 45000,
    stackable: false,
    effects: [
      { effectCategory: "stat_buff", stat: "combat", amount: 2.0, modifierType: "multiplier" },
      { effectCategory: "stat_buff", stat: "thinking", amount: 0.5, modifierType: "multiplier" }
    ]
  },
  "card_jack_of_trades": {
    id: "card_jack_of_trades",
    name: "Jack of All Trades",
    effect: "Slightly boosts all stats (+3) for 15 seconds.",
    durationMs: 15000,
    cooldownMs: 60000,
    stackable: false,
    effects: [
      { effectCategory: "stat_buff", stat: "vision", amount: 3, modifierType: "flat" },
      { effectCategory: "stat_buff", stat: "thinking", amount: 3, modifierType: "flat" },
      { effectCategory: "stat_buff", stat: "combat", amount: 3, modifierType: "flat" },
      { effectCategory: "stat_buff", stat: "movement", amount: 3, modifierType: "flat" }
    ]
  }
};
