import { kv } from "../../../utils/kv.ts";
import { KV_PREFIXES } from "../../../utils/kv_helpers.ts";
import { AI_Template } from "../../../types/index.ts";

export async function getAITemplate(id: string): Promise<AI_Template | null> {
  const res = await kv.get<AI_Template>([KV_PREFIXES.AI_TEMPLATES, id]);
  return res.value;
}

export async function saveAITemplate(template: AI_Template): Promise<void> {
  await kv.set([KV_PREFIXES.AI_TEMPLATES, template.id], template);
}

export async function listAITemplates(): Promise<AI_Template[]> {
  const iter = kv.list<AI_Template>({ prefix: [KV_PREFIXES.AI_TEMPLATES] });
  const templates: AI_Template[] = [];
  for await (const res of iter) {
    templates.push(res.value);
  }
  return templates;
}

export async function seedAITemplates(): Promise<void> {
  const templates: AI_Template[] = [
    { id: "t1", name: "Striker", archetype: "assassin", baseStats: { vision: 5, thinking: 4, combat: 8, movement: 7 } },
    { id: "t2", name: "Defender", archetype: "tank", baseStats: { vision: 3, thinking: 5, combat: 6, movement: 3 } },
    { id: "t3", name: "Scout", archetype: "scout", baseStats: { vision: 9, thinking: 6, combat: 3, movement: 8 } },
    { id: "t4", name: "Sniper", archetype: "marksman", baseStats: { vision: 8, thinking: 5, combat: 7, movement: 4 } },
    { id: "t5", name: "Brawler", archetype: "fighter", baseStats: { vision: 4, thinking: 3, combat: 9, movement: 5 } },
    { id: "t6", name: "Tactician", archetype: "support", baseStats: { vision: 7, thinking: 9, combat: 4, movement: 4 } },
  ];
  
  for (const t of templates) {
    await saveAITemplate(t);
  }
}
