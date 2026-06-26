import { Handlers } from "$fresh/server.ts";
import { getDailyStatus, claimDailyReward } from "../../../lib/economy/daily.ts";

export const handler: Handlers = {
  async GET(req) {
    const userId = new URL(req.url).searchParams.get("userId");
    if (!userId) return new Response("Missing userId", { status: 400 });
    const status = await getDailyStatus(userId);
    return Response.json(status);
  },

  async POST(req) {
    const body = await req.json();
    const { userId } = body;
    if (!userId) return new Response("Missing userId", { status: 400 });
    const result = await claimDailyReward(userId);
    const statusCode = result.ok ? 200 : 400;
    return Response.json(result, { status: statusCode });
  },
};
