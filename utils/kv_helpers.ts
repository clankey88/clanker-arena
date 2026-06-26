import { kv } from "./kv.ts";
import { User, Bot, Match, Deck, Card, AI_Template } from "../types/index.ts";

export const KV_PREFIXES = {
  USERS: "users",
  USERS_BY_USERNAME: "users_by_username",
  BOTS: "bots",
  BOTS_BY_PROVIDER: "bots_by_provider",
  BOT_POOL: "bot_pool",
  AI_TEMPLATES: "ai_templates",
  MATCHES: "matches",
  ACTIVE_MATCHES: "active_matches",
  DECKS: "decks",
  CARDS: "cards",
} as const;

// Helper to save a user
export async function saveUser(user: User) {
  const res = await kv.atomic()
    .check({ key: [KV_PREFIXES.USERS, user.id], versionstamp: null })
    .set([KV_PREFIXES.USERS, user.id], user)
    .set([KV_PREFIXES.USERS_BY_USERNAME, user.username], user.id)
    .commit();
  return res.ok;
}

// Helper to get a user
export async function getUser(id: string): Promise<User | null> {
  const res = await kv.get<User>([KV_PREFIXES.USERS, id]);
  return res.value;
}

// Helper to get a bot
export async function getBot(id: string): Promise<Bot | null> {
  const res = await kv.get<Bot>([KV_PREFIXES.BOTS, id]);
  return res.value;
}

// Helper to list active matches
export async function listActiveMatches(): Promise<Match[]> {
  const iter = kv.list<Match>({ prefix: [KV_PREFIXES.ACTIVE_MATCHES] });
  const matches: Match[] = [];
  for await (const res of iter) {
    matches.push(res.value);
  }
  return matches;
}
