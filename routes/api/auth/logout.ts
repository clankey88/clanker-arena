// TICKET T-005: Secure user logout endpoint
import { Handlers } from "$fresh/server.ts";
import { deleteSession } from "../../../lib/models/user/index.ts";
import { deleteCookie } from "../../../lib/security/middleware.ts";

export const handler: Handlers = {
  async POST(req) {
    try {
      const cookies = req.headers.get("cookie");
      if (!cookies) {
        return Response.json(
          { ok: false, error: "No session found" },
          { status: 400 }
        );
      }
      
      const sessionCookie = cookies.split(";").find((c) => c.trim().startsWith("session_id="));
      if (!sessionCookie) {
        return Response.json(
          { ok: false, error: "No session found" },
          { status: 400 }
        );
      }
      
      const sessionId = sessionCookie.split("=")[1];
      
      // Delete session from KV
      await deleteSession(sessionId);
      
      const headers = new Headers();
      headers.append("Set-Cookie", deleteCookie("session_id"));
      headers.append("Set-Cookie", deleteCookie("csrf_token"));
      headers.set("Content-Type", "application/json");
      
      return new Response(
        JSON.stringify({ ok: true, message: "Logged out successfully" }),
        { status: 200, headers }
      );
    } catch (error) {
      console.error("Logout error:", error);
      return Response.json(
        { ok: false, error: "Internal server error" },
        { status: 500 }
      );
    }
  },
};
