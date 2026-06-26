// TICKET T-005: OAuth authorization endpoint for all providers
import { Handlers } from "$fresh/server.ts";
import { OAuthProvider } from "../../../../types/index.ts";
import { generateOAuthState, getAuthorizationUrl, isOAuthConfigured } from "../../../../lib/security/oauth.ts";
import { setSecureCookie } from "../../../../lib/security/middleware.ts";

export const handler: Handlers = {
  async GET(req, ctx) {
    const provider = ctx.params.provider as OAuthProvider;
    
    // Validate provider
    if (!["google", "facebook", "discord", "twitch", "telegram"].includes(provider)) {
      return new Response("Invalid OAuth provider", { status: 400 });
    }
    
    // Telegram uses widget-based auth, not redirect flow
    if (provider === "telegram") {
      return Response.json(
        { ok: false, error: "Telegram authentication uses widget-based flow. Use the Telegram Login Widget on the frontend." },
        { status: 400 }
      );
    }
    
    // Check if provider is configured
    if (!isOAuthConfigured(provider)) {
      return Response.json(
        { ok: false, error: `${provider} OAuth is not configured` },
        { status: 503 }
      );
    }
    
    try {
      // Get return URL from query params
      const url = new URL(req.url);
      const returnTo = url.searchParams.get("returnTo") || "/";
      
      // Generate state with nonce for CSRF protection
      const state = generateOAuthState(provider, returnTo);
      
      // Get authorization URL
      const authUrl = getAuthorizationUrl(provider, state);
      
      // Store state in cookie for validation in callback
      const headers = new Headers();
      headers.append("Set-Cookie", setSecureCookie("oauth_state", state, 600)); // 10 minutes
      headers.set("Location", authUrl);
      
      return new Response(null, {
        status: 302,
        headers,
      });
    } catch (error) {
      console.error(`OAuth authorization error for ${provider}:`, error);
      return Response.json(
        { ok: false, error: "Failed to initiate OAuth flow" },
        { status: 500 }
      );
    }
  },
};
