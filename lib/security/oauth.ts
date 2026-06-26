// TICKET T-005: OAuth provider integration
import { OAuthProvider } from "../../types/index.ts";

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  userInfoEndpoint: string;
  scope: string[];
  redirectUri: string;
}

// OAuth provider configurations
export const OAUTH_CONFIGS: Record<OAuthProvider, OAuthConfig | null> = {
  google: {
    clientId: Deno.env.get("GOOGLE_CLIENT_ID") || "",
    clientSecret: Deno.env.get("GOOGLE_CLIENT_SECRET") || "",
    authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenEndpoint: "https://oauth2.googleapis.com/token",
    userInfoEndpoint: "https://www.googleapis.com/oauth2/v2/userinfo",
    scope: ["openid", "email", "profile"],
    redirectUri: `${Deno.env.get("APP_URL") || "http://localhost:8000"}/api/auth/callback/google`,
  },
  facebook: {
    clientId: Deno.env.get("FACEBOOK_CLIENT_ID") || "",
    clientSecret: Deno.env.get("FACEBOOK_CLIENT_SECRET") || "",
    authorizationEndpoint: "https://www.facebook.com/v18.0/dialog/oauth",
    tokenEndpoint: "https://graph.facebook.com/v18.0/oauth/access_token",
    userInfoEndpoint: "https://graph.facebook.com/me?fields=id,name,email,picture",
    scope: ["email", "public_profile"],
    redirectUri: `${Deno.env.get("APP_URL") || "http://localhost:8000"}/api/auth/callback/facebook`,
  },
  discord: {
    clientId: Deno.env.get("DISCORD_CLIENT_ID") || "",
    clientSecret: Deno.env.get("DISCORD_CLIENT_SECRET") || "",
    authorizationEndpoint: "https://discord.com/api/oauth2/authorize",
    tokenEndpoint: "https://discord.com/api/oauth2/token",
    userInfoEndpoint: "https://discord.com/api/users/@me",
    scope: ["identify", "email"],
    redirectUri: `${Deno.env.get("APP_URL") || "http://localhost:8000"}/api/auth/callback/discord`,
  },
  twitch: {
    clientId: Deno.env.get("TWITCH_CLIENT_ID") || "",
    clientSecret: Deno.env.get("TWITCH_CLIENT_SECRET") || "",
    authorizationEndpoint: "https://id.twitch.tv/oauth2/authorize",
    tokenEndpoint: "https://id.twitch.tv/oauth2/token",
    userInfoEndpoint: "https://api.twitch.tv/helix/users",
    scope: ["user:read:email"],
    redirectUri: `${Deno.env.get("APP_URL") || "http://localhost:8000"}/api/auth/callback/twitch`,
  },
  telegram: {
    clientId: Deno.env.get("TELEGRAM_BOT_TOKEN") || "",
    clientSecret: Deno.env.get("TELEGRAM_BOT_TOKEN") || "", // Telegram uses bot token for both
    authorizationEndpoint: "https://oauth.telegram.org/auth",
    tokenEndpoint: "", // Telegram doesn't use token exchange
    userInfoEndpoint: "", // Telegram sends user data directly
    scope: [],
    redirectUri: `${Deno.env.get("APP_URL") || "http://localhost:8000"}/api/auth/callback/telegram`,
  },
  local: null, // Local authentication doesn't use OAuth
};

export interface OAuthState {
  provider: OAuthProvider;
  returnTo?: string;
  nonce: string;
}

export function generateOAuthState(provider: OAuthProvider, returnTo?: string): string {
  const state: OAuthState = {
    provider,
    returnTo,
    nonce: crypto.randomUUID(),
  };
  return btoa(JSON.stringify(state));
}

export function parseOAuthState(stateString: string): OAuthState | null {
  try {
    return JSON.parse(atob(stateString));
  } catch {
    return null;
  }
}

export function getAuthorizationUrl(provider: OAuthProvider, state: string): string {
  const config = OAUTH_CONFIGS[provider];
  if (!config) {
    throw new Error(`OAuth not configured for provider: ${provider}`);
  }

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: config.scope.join(" "),
    state,
  });

  return `${config.authorizationEndpoint}?${params.toString()}`;
}

export async function exchangeCodeForToken(
  provider: OAuthProvider,
  code: string
): Promise<{ access_token: string; token_type: string; expires_in?: number }> {
  const config = OAUTH_CONFIGS[provider];
  if (!config) {
    throw new Error(`OAuth not configured for provider: ${provider}`);
  }

  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: config.redirectUri,
  });

  const response = await fetch(config.tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  return await response.json();
}

export interface OAuthUserInfo {
  id: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
}

export async function getUserInfo(
  provider: OAuthProvider,
  accessToken: string
): Promise<OAuthUserInfo> {
  const config = OAUTH_CONFIGS[provider];
  if (!config) {
    throw new Error(`OAuth not configured for provider: ${provider}`);
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
  };

  // Twitch requires Client-ID header
  if (provider === "twitch") {
    headers["Client-ID"] = config.clientId;
  }

  const response = await fetch(config.userInfoEndpoint, {
    headers,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch user info: ${error}`);
  }

  const data = await response.json();

  // Normalize user info based on provider
  switch (provider) {
    case "google":
      return {
        id: data.id,
        email: data.email,
        name: data.name,
        avatarUrl: data.picture,
      };
    case "facebook":
      return {
        id: data.id,
        email: data.email,
        name: data.name,
        avatarUrl: data.picture?.data?.url,
      };
    case "discord":
      return {
        id: data.id,
        email: data.email,
        name: data.username,
        avatarUrl: data.avatar
          ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png`
          : undefined,
      };
    case "twitch":
      const user = data.data?.[0];
      return {
        id: user.id,
        email: user.email,
        name: user.display_name || user.login,
        avatarUrl: user.profile_image_url,
      };
    case "telegram":
      // Telegram data comes directly from widget, not from API
      throw new Error("Telegram user info should be validated via verifyTelegramAuth");
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

// Telegram-specific authentication verification
export interface TelegramAuthData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export function verifyTelegramAuth(authData: TelegramAuthData, botToken: string): boolean {
  const { hash, ...data } = authData;
  
  // Create data check string
  const dataCheckString = Object.keys(data)
    .sort()
    .map(key => `${key}=${data[key as keyof typeof data]}`)
    .join('\n');
  
  // Create secret key from bot token
  const encoder = new TextEncoder();
  const secretKey = encoder.encode(botToken);
  
  // Calculate hash using HMAC-SHA256
  return crypto.subtle.importKey(
    'raw',
    secretKey,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  ).then(key => 
    crypto.subtle.sign('HMAC', key, encoder.encode(dataCheckString))
  ).then(signature => {
    const computedHash = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    return computedHash === hash;
  }).catch(() => false);
}

export function parseTelegramAuthData(authData: TelegramAuthData): OAuthUserInfo {
  return {
    id: authData.id.toString(),
    name: `${authData.first_name}${authData.last_name ? ' ' + authData.last_name : ''}`,
    avatarUrl: authData.photo_url,
  };
}

export function isOAuthConfigured(provider: OAuthProvider): boolean {
  if (provider === "local") return true;
  const config = OAUTH_CONFIGS[provider];
  return !!(config && config.clientId && config.clientSecret);
}
