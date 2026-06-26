import { kv } from "../../../utils/kv.ts";
import { KV_PREFIXES, getBot } from "../../../utils/kv_helpers.ts";
import { Bot } from "../../../types/index.ts";
import { getAITemplate } from "../ai_template/index.ts";

export { getBot };
export type { Bot };

export async function saveBot(bot: Bot): Promise<void> {
  await kv.atomic()
    .set([KV_PREFIXES.BOTS, bot.id], bot)
    .set([KV_PREFIXES.BOTS_BY_PROVIDER, bot.providerId, bot.id], bot)
    .commit();
}

export async function createBot(providerId: string, templateId: string, name: string): Promise<Bot | null> {
  const template = await getAITemplate(templateId);
  if (!template) return null;
  
  const bot: Bot = {
    id: crypto.randomUUID(),
    providerId,
    templateId,
    name,
    effectiveStats: { ...template.baseStats },
    upgrades: []
  };
  
  await saveBot(bot);
  return bot;
}

export async function listBotsByProvider(providerId: string): Promise<Bot[]> {
  const iter = kv.list<Bot>({ prefix: [KV_PREFIXES.BOTS_BY_PROVIDER, providerId] });
  const bots: Bot[] = [];
  for await (const res of iter) {
    bots.push(res.value);
  }
  return bots;
}

export async function addBotToPool(botId: string): Promise<boolean> {
  const bot = await getBot(botId);
  if (!bot) return false;
  await kv.set([KV_PREFIXES.BOT_POOL, bot.id], bot);
  return true;
}

export async function removeBotFromPool(botId: string): Promise<void> {
  await kv.delete([KV_PREFIXES.BOT_POOL, botId]);
}

export async function getBotPool(): Promise<Bot[]> {
  const iter = kv.list<Bot>({ prefix: [KV_PREFIXES.BOT_POOL] });
  const bots: Bot[] = [];
  for await (const res of iter) {
    bots.push(res.value);
  }
  return bots;
}
