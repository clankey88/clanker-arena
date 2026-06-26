import { kv } from "../../../utils/kv.ts";
import { KV_PREFIXES } from "../../../utils/kv_helpers.ts";
import { Card } from "../../../types/index.ts";

export async function getCard(id: string): Promise<Card | null> {
  const res = await kv.get<Card>([KV_PREFIXES.CARDS, id]);
  return res.value;
}

export async function saveCard(card: Card): Promise<void> {
  await kv.set([KV_PREFIXES.CARDS, card.id], card);
}

export async function listAllCards(): Promise<Card[]> {
  const iter = kv.list<Card>({ prefix: [KV_PREFIXES.CARDS] });
  const cards: Card[] = [];
  for await (const res of iter) {
    cards.push(res.value);
  }
  return cards;
}
