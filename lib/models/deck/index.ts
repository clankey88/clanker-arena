import { kv } from "../../../utils/kv.ts";
import { KV_PREFIXES } from "../../../utils/kv_helpers.ts";
import { Deck } from "../../../types/index.ts";

export async function getDeck(userId: string, deckId: string): Promise<Deck | null> {
  const res = await kv.get<Deck>([KV_PREFIXES.DECKS, userId, deckId]);
  return res.value;
}

export async function saveDeck(deck: Deck): Promise<void> {
  await kv.set([KV_PREFIXES.DECKS, deck.userId, deck.id], deck);
}

export async function listUserDecks(userId: string): Promise<Deck[]> {
  const iter = kv.list<Deck>({ prefix: [KV_PREFIXES.DECKS, userId] });
  const decks: Deck[] = [];
  for await (const res of iter) {
    decks.push(res.value);
  }
  return decks;
}

export async function createDeck(userId: string, cards: string[]): Promise<Deck> {
  const deck: Deck = {
    id: crypto.randomUUID(),
    userId,
    cards
  };
  await saveDeck(deck);
  return deck;
}
