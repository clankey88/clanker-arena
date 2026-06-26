// TICKET T-005: Secure user login endpoint
import { Handlers } from "$fresh/server.ts";
import { loginUser, createSession } from "../../../lib/models/user/index.ts";
import { setSecureCookie, generateCSRFToken } from "../../../lib/security/middleware.ts";

export const handler: Handlers = {
  async POST(req) {
    try {
      const body = await req.json();
      const { username, password } = body;
      
      if (!username || !password) {
        return Response.json(
          { ok: false, error: "Username and password are required" },
          { status: 400 }
        );
      }
      
      const result = await loginUser(username, password);
      
      if (!result.user) {
        return Response.json(
          { ok: false, error: result.error || "Login failed" },
          { status: 401 }
        );
      }
      
      // Create session
      const sessionId = await createSession(result.user.id);
      
      // Generate CSRF token
      const csrfToken = generateCSRFToken();
      
      // Don't return password hash
      const { passwordHash, ...safeUser } = result.user;
      
      const headers = new Headers();
      headers.append("Set-Cookie", setSecureCookie("session_id", sessionId));
      headers.append("Set-Cookie", setSecureCookie("csrf_token", csrfToken));
      headers.set("Content-Type", "application/json");
      
      return new Response(
        JSON.stringify({ ok: true, user: safeUser, csrfToken }),
        { status: 200, headers }
      );
    } catch (error) {
      console.error("Login error:", error);
      return Response.json(
        { ok: false, error: "Internal server error" },
        { status: 500 }
      );
    }
  },
};
