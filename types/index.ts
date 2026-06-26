/**
 * Core Types for Clanker Arena
 */

export interface Stats {
  vision: number;
  thinking: number;
  combat: number;
  movement: number;
}

export interface User {
  id: string;
  username: string;
  balance: number;
  createdAt: Date;
}

export interface AI_Template {
  id: string;
  name: string;
  baseStats: Stats;
  archetype: string;
}

export interface Bot {
  id: string;
  providerId: string;
  templateId: string;
  name: string;
  effectiveStats: Stats;
  upgrades: string[];
}

export interface Match {
  id: string;
  mode: "Fronts" | "King of the Hill" | "Free-for-All";
  status: "waiting" | "active" | "finished";
  participants: string[]; // bot ids
  winnerId?: string;
  createdAt: Date;
}

export interface Card {
  id: string;
  name: string;
  effect: string;
  durationMs?: number;
  cooldownMs: number;
}

export interface Deck {
  id: string;
  userId: string;
  cards: string[]; // card ids
}
