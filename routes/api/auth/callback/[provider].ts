// TICKET T-005: OAuth callback endpoint for all providers
import { Handlers } from "$fresh/server.ts";
import { OAuthProvider } from "../../../../types/index.ts";
import {
  parseOAuthState,
  exchangeCodeForToken,
  getUserInfo,
  isOAuthConfigured,
} from "../../../../lib/security/oauth.ts";
import { findOrCreateOAuthUser, createSession } from "../../../../lib/models/user/index.ts";
import { setSecureCookie, deleteCookie, generateCSRFToken } from "../../../../lib/security/middleware.ts";

export const handler: Handlers = {
  async GET(req, ctx) {
    const provider = ctx.params.provider as OAuthProvider;
    
    // Validate provider
    if (!["google", "facebook", "discord", "twitch"].includes(provider)) {
      return new Response("Invalid OAuth provider", { status: 400 });
    }
    
    // Check if provider is configured
    if (!isOAuthConfigured(provider)) {
      return Response.json(
        { ok: false, error: `${provider} OAuth is not configured` },
        { status: 503 }
      );
    }
    
    try {
      const url = new URL(req.url);
      const code = url.searchParams.get("code");
      const stateParam = url.searchParams.get("state");
      const error = url.searchParams.get("error");
      
      // Check for OAuth errors
      if (error) {
        console.error(`OAuth error from ${provider}:`, error);
        return new Response(null, {
          status: 302,
          headers: {
            Location: `/login?error=${encodeURIComponent(`OAuth error: ${error}`)}`,
          },
        });
      }
      
      if (!code || !stateParam) {
        return new Response(null, {
          status: 302,
          headers: {
            Location: "/login?error=missing_code_or_state",
          },
        });
      }
      
      // Validate state (CSRF protection)
      const cookies = req.headers.get("cookie");
      const stateCookie = cookies?.split(";").find((c) => c.trim().startsWith("oauth_state="));
      const storedState = stateCookie?.split("=")[1];
      
      if (!storedState || storedState !== stateParam) {
        console.error("OAuth state mismatch");
        return new Response(null, {
          status: 302,
          headers: {
            Location: "/login?error=invalid_state",
          },
        });
      }
      
      // Parse state to get return URL
      const state = parseOAuthState(stateParam);
      const returnTo = state?.returnTo || "/";
      
      // Exchange code for access token
      const tokenResponse = await exchangeCodeForToken(provider, code);
      
      // Get user info from provider
      const userInfo = await getUserInfo(provider, tokenResponse.access_token);
      
      // Find or create user
      const result = await findOrCreateOAuthUser(
        provider,
        userInfo.id,
        userInfo.email,
        userInfo.name,
        userInfo.avatarUrl
      );
      
      if (!result.user) {
        console.error("Failed to create/find OAuth user:", result.error);
        return new Response(null, {
          status: 302,
          headers: {
            Location: `/login?error=${encodeURIComponent(result.error || "Failed to authenticate")}`,
          },
        });
      }
      
      // Create session
      const sessionId = await createSession(result.user.id);
      
      // Generate CSRF token
      const csrfToken = generateCSRFToken();
      
      // Set cookies and redirect
      const headers = new Headers();
      headers.append("Set-Cookie", deleteCookie("oauth_state")); // Clear OAuth state
      headers.append("Set-Cookie", setSecureCookie("session_id", sessionId));
      headers.append("Set-Cookie", setSecureCookie("csrf_token", csrfToken));
      
      // Add welcome message for new users
      const redirectUrl = result.isNewUser
        ? `${returnTo}?welcome=true`
        : returnTo;
      
      headers.set("Location", redirectUrl);
      
      return new Response(null, {
        status: 302,
        headers,
      });
    } catch (error) {
      console.error(`OAuth callback error for ${provider}:`, error);
      return new Response(null, {
        status: 302,
        headers: {
          Location: `/login?error=${encodeURIComponent("Authentication failed")}`,
        },
      });
    }
  },
};
