// TICKET T-005: Authentication and security middleware
import { MiddlewareHandlerContext } from "$fresh/server.ts";
import { getSessionUser } from "../models/user/index.ts";
import { User } from "../../types/index.ts";

export interface AuthState {
  user?: User;
}

// Rate limiting store (in-memory for now, should use KV in production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

// TICKET T-005: Rate limiting middleware
export function rateLimit(maxRequests: number, windowMs: number) {
  return async function rateLimitMiddleware(
    req: Request,
    ctx: MiddlewareHandlerContext<AuthState>
  ) {
    const ip = ctx.remoteAddr?.hostname || "unknown";
    const now = Date.now();
    
    const key = `${ip}:${new URL(req.url).pathname}`;
    const record = rateLimitStore.get(key);
    
    if (record && record.resetAt > now) {
      if (record.count >= maxRequests) {
        return new Response("Too many requests", {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((record.resetAt - now) / 1000)),
            "X-RateLimit-Limit": String(maxRequests),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(record.resetAt),
          },
        });
      }
      record.count++;
    } else {
      rateLimitStore.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
    }
    
    // Cleanup old entries periodically
    if (Math.random() < 0.01) {
      for (const [k, v] of rateLimitStore.entries()) {
        if (v.resetAt < now) {
          rateLimitStore.delete(k);
        }
      }
    }
    
    return await ctx.next();
  };
}

// TICKET T-005: Authentication middleware
export async function requireAuth(
  req: Request,
  ctx: MiddlewareHandlerContext<AuthState>
) {
  const sessionId = getCookie(req, "session_id");
  
  if (!sessionId) {
    return new Response("Unauthorized", {
      status: 401,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
  
  const user = await getSessionUser(sessionId);
  
  if (!user) {
    return new Response("Unauthorized", {
      status: 401,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
  
  ctx.state.user = user;
  return await ctx.next();
}

// TICKET T-005: Optional authentication (doesn't block if not authenticated)
export async function optionalAuth(
  req: Request,
  ctx: MiddlewareHandlerContext<AuthState>
) {
  const sessionId = getCookie(req, "session_id");
  
  if (sessionId) {
    const user = await getSessionUser(sessionId);
    if (user) {
      ctx.state.user = user;
    }
  }
  
  return await ctx.next();
}

// TICKET T-005: Security headers middleware
export async function securityHeaders(
  req: Request,
  ctx: MiddlewareHandlerContext
) {
  const response = await ctx.next();
  
  const headers = new Headers(response.headers);
  
  // Prevent clickjacking
  headers.set("X-Frame-Options", "DENY");
  
  // Prevent MIME type sniffing
  headers.set("X-Content-Type-Options", "nosniff");
  
  // Enable XSS protection
  headers.set("X-XSS-Protection", "1; mode=block");
  
  // Referrer policy
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  
  // Content Security Policy
  headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' ws: wss:;"
  );
  
  // Strict Transport Security (HTTPS only)
  if (new URL(req.url).protocol === "https:") {
    headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  
  // Permissions Policy
  headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// TICKET T-005: CSRF token generation and validation
const CSRF_TOKEN_LENGTH = 32;

export function generateCSRFToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(CSRF_TOKEN_LENGTH));
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

export async function validateCSRFToken(
  req: Request,
  ctx: MiddlewareHandlerContext<AuthState>
): Promise<Response> {
  // Only validate for state-changing methods
  if (!["POST", "PUT", "DELETE", "PATCH"].includes(req.method)) {
    return await ctx.next();
  }
  
  const sessionToken = getCookie(req, "csrf_token");
  const headerToken = req.headers.get("X-CSRF-Token");
  
  if (!sessionToken || !headerToken || sessionToken !== headerToken) {
    return new Response("Invalid CSRF token", {
      status: 403,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
  
  return await ctx.next();
}

// Helper function to get cookie value
function getCookie(req: Request, name: string): string | undefined {
  const cookies = req.headers.get("cookie");
  if (!cookies) return undefined;
  
  const cookie = cookies.split(";").find((c) => c.trim().startsWith(`${name}=`));
  return cookie?.split("=")[1];
}

// Helper function to set secure cookie
export function setSecureCookie(
  name: string,
  value: string,
  maxAge: number = 60 * 60 * 24 * 7 // 7 days default
): string {
  const isProduction = Deno.env.get("DENO_ENV") === "production";
  
  return `${name}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${
    isProduction ? "; Secure" : ""
  }`;
}

// Helper to delete cookie
export function deleteCookie(name: string): string {
  return `${name}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`;
}
