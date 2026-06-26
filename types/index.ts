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
  weapons: string[];
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

// ---- Economy ----
export type TransactionType =
  | "daily_reward"
  | "match_entry"
  | "match_payout"
  | "tournament_entry"
  | "tournament_payout"
  | "purchase"
  | "admin_grant"
  | "credit_sink";

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  createdAt: Date;
}

export interface DailyRewardRecord {
  userId: string;
  lastClaimDate: string; // YYYY-MM-DD
  streak: number;
}

export interface RealMoneyLedger {
  id: string;
  userId: string;
  tournamentId: string;
  amount: number;
  status: "pending" | "approved" | "paid" | "rejected";
  adminNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ---- Tournaments ----
export type TournamentPhase = "registration" | "active" | "finished";
export type TournamentMode = "solo" | "team";

export interface Tournament {
  id: string;
  name: string;
  description: string;
  mode: TournamentMode;
  phase: TournamentPhase;
  maxTeams: number;
  entryFee: number;
  prizePool: number;
  scheduledAt: Date;
  createdAt: Date;
  winnerId?: string;
}

export interface Team {
  id: string;
  tournamentId: string;
  name: string;
  captainId: string;
  memberIds: string[];
  joinCode: string;
  seed: number;
  createdAt: Date;
}

export interface BracketSlot {
  round: number;
  position: number;
  teamAId: string | null;
  teamBId: string | null;
  winnerId: string | null;
  matchId: string | null;
}
