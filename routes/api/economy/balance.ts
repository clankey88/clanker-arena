import { Handlers } from "$fresh/server.ts";
import { getBalance, addBalance, deductBalance } from "../../../lib/economy/balance.ts";

export const handler: Handlers = {
  async GET(req) {
    const userId = new URL(req.url).searchParams.get("userId");
    if (!userId) return new Response("Missing userId", { status: 400 });
    const balance = await getBalance(userId);
    return Response.json({ balance });
  },

  async POST(req) {
    const body = await req.json();
    const { userId, action, amount, description } = body;
    if (!userId || !action || !amount) {
      return Response.json({ ok: false, error: "Missing userId, action, or amount" }, { status: 400 });
    }
    if (action === "add") {
      const result = await addBalance(userId, amount, "admin_grant", description || "Admin grant");
      return Response.json(result);
    }
    if (action === "deduct") {
      const result = await deductBalance(userId, amount, "purchase", description || "Purchase");
      return Response.json(result);
    }
    return Response.json({ ok: false, error: "Invalid action" }, { status: 400 });
  },
};
