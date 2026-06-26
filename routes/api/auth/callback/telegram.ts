// TICKET T-005: Telegram widget-based authentication callback
import { Handlers } from "$fresh/server.ts";
import { verifyTelegramAuth, parseTelegramAuthData, TelegramAuthData } from "../../../../lib/security/oauth.ts";
import { findOrCreateOAuthUser, createSession } from "../../../../lib/models/user/index.ts";
import { setSecureCookie, generateCSRFToken } from "../../../../lib/security/middleware.ts";

export const handler: Handlers = {
  async POST(req) {
    try {
      const body = await req.json();
      const authData = body as TelegramAuthData;
      
      // Validate required fields
      if (!authData.id || !authData.first_name || !authData.auth_date || !authData.hash) {
        return Response.json(
          { ok: false, error: "Missing required Telegram auth data" },
          { status: 400 }
        );
      }
      
      // Check auth data is not too old (5 minutes)
      const authAge = Date.now() / 1000 - authData.auth_date;
      if (authAge > 300) {
        return Response.json(
          { ok: false, error: "Telegram auth data expired" },
          { status: 400 }
        );
      }
      
      // Get bot token
      const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
      if (!botToken) {
        return Response.json(
          { ok: false, error: "Telegram authentication not configured" },
          { status: 503 }
        );
      }
      
      // Verify Telegram auth data
      const isValid = await verifyTelegramAuth(authData, botToken);
      if (!isValid) {
        return Response.json(
          { ok: false, error: "Invalid Telegram authentication" },
          { status: 401 }
        );
      }
      
      // Parse user info
      const userInfo = parseTelegramAuthData(authData);
      
      // Find or create user
      const result = await findOrCreateOAuthUser(
        "telegram",
        userInfo.id,
        undefined, // Telegram doesn't provide email
        userInfo.name,
        userInfo.avatarUrl
      );
      
      if (!result.user) {
        return Response.json(
          { ok: false, error: result.error || "Failed to authenticate" },
          { status: 500 }
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
        JSON.stringify({
          ok: true,
          user: safeUser,
          csrfToken,
          isNewUser: result.isNewUser,
        }),
        { status: 200, headers }
      );
    } catch (error) {
      console.error("Telegram auth callback error:", error);
      return Response.json(
        { ok: false, error: "Authentication failed" },
        { status: 500 }
      );
    }
  },
};
