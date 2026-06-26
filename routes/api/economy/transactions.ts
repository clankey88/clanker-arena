import { Handlers } from "$fresh/server.ts";
import { getTransactions } from "../../../lib/economy/transactions.ts";

export const handler: Handlers = {
  async GET(req) {
    const userId = new URL(req.url).searchParams.get("userId");
    const limit = parseInt(new URL(req.url).searchParams.get("limit") || "50");
    if (!userId) return new Response("Missing userId", { status: 400 });
    const txs = await getTransactions(userId, limit);
    return Response.json({ transactions: txs });
  },
};
