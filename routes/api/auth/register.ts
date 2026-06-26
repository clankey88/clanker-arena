// TICKET T-005: Secure user registration endpoint
import { Handlers } from "$fresh/server.ts";
import { registerUser } from "../../../lib/models/user/index.ts";
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
      
      const result = await registerUser(username, password);
      
      if (!result.user) {
        return Response.json(
          { ok: false, error: result.error || "Registration failed" },
          { status: 400 }
        );
      }
      
      // Don't return password hash
      const { passwordHash, ...safeUser } = result.user;
      
      return Response.json(
        { ok: true, user: safeUser },
        { status: 201 }
      );
    } catch (error) {
      console.error("Registration error:", error);
      return Response.json(
        { ok: false, error: "Internal server error" },
        { status: 500 }
      );
    }
  },
};
