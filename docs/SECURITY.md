# Security Documentation - Clanker Arena

## Overview

This document outlines the security measures implemented in Clanker Arena to protect user data, prevent unauthorized access, and ensure secure operations.

## Authentication System (TICKET T-005)

### OAuth Providers

Clanker Arena supports multiple OAuth providers for seamless authentication:

- **Google** - OAuth 2.0
- **Facebook** - OAuth 2.0
- **Discord** - OAuth 2.0
- **Twitch** - OAuth 2.0
- **Telegram** - Widget-based authentication

**OAuth Flow:**
1. User clicks "Login with [Provider]" button
2. User is redirected to provider's authorization page
3. After authorization, provider redirects back with authorization code
4. Server exchanges code for access token
5. Server fetches user info from provider
6. User account is created or linked
7. Session is created and user is logged in

**Security Features:**
- State parameter with nonce for CSRF protection
- Secure cookie storage for OAuth state
- Automatic account linking via email
- Support for multiple OAuth accounts per user

**Configuration:**
Set environment variables for each provider:
```
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
FACEBOOK_CLIENT_ID=your_client_id
FACEBOOK_CLIENT_SECRET=your_client_secret
DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret
TWITCH_CLIENT_ID=your_client_id
TWITCH_CLIENT_SECRET=your_client_secret
TELEGRAM_BOT_TOKEN=your_bot_token
APP_URL=https://your-domain.com
```

**Telegram Widget Setup:**
Telegram uses a different authentication flow via the Telegram Login Widget:

1. Create a bot via [@BotFather](https://t.me/botfather)
2. Set the bot's domain using `/setdomain` command
3. Add the Telegram Login Widget to your frontend:
```html
<script async src="https://telegram.org/js/telegram-widget.js?22" 
        data-telegram-login="YOUR_BOT_USERNAME" 
        data-size="large" 
        data-onauth="onTelegramAuth(user)" 
        data-request-access="write"></script>
```
4. Handle the callback by sending auth data to `/api/auth/callback/telegram`

### Password Security (Local Authentication)

- **Hashing Algorithm**: PBKDF2 with SHA-256
- **Iterations**: 100,000 (industry standard for PBKDF2)
- **Salt**: 16 bytes of cryptographically secure random data per password
- **Hash Length**: 32 bytes
- **Storage**: Salt + hash combined and base64 encoded

### Password Requirements

- Minimum length: 8 characters
- Maximum length: 128 characters
- Must contain at least one number
- Must contain at least one letter

### Session Management

- **Session ID**: Cryptographically secure UUID
- **Storage**: Deno KV with automatic expiration
- **Expiration**: 7 days
- **Cookie Settings**:
  - HttpOnly: Yes (prevents XSS access)
  - SameSite: Strict (prevents CSRF)
  - Secure: Yes (production only, requires HTTPS)
  - Path: /

## API Security

### Authentication Middleware

All protected endpoints use the `requireAuth` middleware which:
1. Validates session cookie
2. Retrieves user from session
3. Attaches user to request context
4. Returns 401 if authentication fails

**Usage:**
```typescript
import { requireAuth, AuthState } from "../lib/security/middleware.ts";

export const handler: Handlers<AuthState> = {
  async GET(req, ctx) {
    const authResponse = await requireAuth(req, ctx);
    if (authResponse.status === 401) {
      return authResponse;
    }
    // User is authenticated, access via ctx.state.user
  }
};
```

### Rate Limiting

Rate limiting is implemented to prevent abuse:

- **Auth endpoints**: 20 requests per minute
- **Balance queries**: 100 requests per minute
- **Balance modifications**: 20 requests per minute
- **General API**: Configurable per endpoint

**Implementation:**
```typescript
import { rateLimit } from "../lib/security/middleware.ts";

// Apply rate limiting (100 requests per minute)
const rateLimitResponse = await rateLimit(100, 60000)(req, ctx);
if (rateLimitResponse.status === 429) {
  return rateLimitResponse;
}
```

### CSRF Protection

Cross-Site Request Forgery protection for state-changing operations:

- **Token Generation**: 32 bytes of cryptographically secure random data
- **Storage**: Secure cookie + required in request header
- **Validation**: Required for POST, PUT, DELETE, PATCH requests
- **Header Name**: `X-CSRF-Token`

**Client-side usage:**
```javascript
// Get CSRF token from cookie or login response
const csrfToken = getCookie('csrf_token');

// Include in request headers
fetch('/api/endpoint', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken
  },
  body: JSON.stringify(data)
});
```

### Input Validation

All user inputs are validated:

1. **Username**:
   - Length: 3-30 characters
   - Pattern: Alphanumeric and underscore only
   - Case-insensitive storage

2. **Amounts**:
   - Must be positive numbers
   - Maximum limits enforced (e.g., 1,000,000 for user operations)
   - Type checking

3. **IDs**:
   - UUID format validation
   - Existence checks before operations

## Security Headers

The following security headers are automatically applied to all responses:

- **X-Frame-Options**: DENY (prevents clickjacking)
- **X-Content-Type-Options**: nosniff (prevents MIME sniffing)
- **X-XSS-Protection**: 1; mode=block (enables XSS filter)
- **Referrer-Policy**: strict-origin-when-cross-origin
- **Content-Security-Policy**: Restricts resource loading
- **Strict-Transport-Security**: max-age=31536000 (HTTPS only)
- **Permissions-Policy**: Restricts browser features

## WebSocket Security

WebSocket connections are secured:

1. **Authentication**: Session validation before upgrade
2. **User Context**: User ID attached to connection
3. **Message Validation**: All messages are validated
4. **Authorization**: Actions verified against user permissions
5. **Error Handling**: Graceful error responses without leaking info

## Admin Endpoints

Admin-only endpoints have additional security:

1. **Role Checking**: Verify admin status before operations
2. **Audit Logging**: All admin actions should be logged (TODO)
3. **Higher Limits**: Separate limits for admin operations
4. **CSRF Protection**: Required for all state changes

**Current Implementation:**
```typescript
// TODO: Replace with database-backed role system
const ADMIN_USER_IDS = new Set([
  // Add admin user IDs here
]);
```

## Best Practices for Developers

### 1. Never Expose Sensitive Data

```typescript
// ❌ BAD: Exposing password hash
return Response.json({ user });

// ✅ GOOD: Remove sensitive fields
const { passwordHash, ...safeUser } = user;
return Response.json({ user: safeUser });
```

### 2. Always Validate Input

```typescript
// ❌ BAD: No validation
const { amount } = await req.json();
await addBalance(userId, amount);

// ✅ GOOD: Validate before use
const { amount } = await req.json();
if (typeof amount !== "number" || amount <= 0 || amount > 1000000) {
  return Response.json({ error: "Invalid amount" }, { status: 400 });
}
await addBalance(userId, amount);
```

### 3. Use Middleware Consistently

```typescript
// ✅ GOOD: Apply all relevant middleware
const rateLimitResponse = await rateLimit(100, 60000)(req, ctx);
if (rateLimitResponse.status === 429) return rateLimitResponse;

const authResponse = await requireAuth(req, ctx);
if (authResponse.status === 401) return authResponse;

const csrfResponse = await validateCSRFToken(req, ctx);
if (csrfResponse.status === 403) return csrfResponse;
```

### 4. Handle Errors Securely

```typescript
// ❌ BAD: Exposing internal errors
catch (error) {
  return Response.json({ error: error.message });
}

// ✅ GOOD: Generic error message, log details
catch (error) {
  console.error("Operation failed:", error);
  return Response.json({ error: "Internal server error" }, { status: 500 });
}
```

## Security Checklist for New Endpoints

- [ ] Authentication required? Apply `requireAuth` middleware
- [ ] Rate limiting needed? Apply `rateLimit` middleware
- [ ] State-changing operation? Apply `validateCSRFToken` middleware
- [ ] Input validation implemented?
- [ ] Sensitive data filtered from responses?
- [ ] Error handling doesn't leak information?
- [ ] Authorization checks for resource access?
- [ ] Logging for audit trail?

## OAuth API Endpoints

### Initiate OAuth Flow
```
GET /api/auth/oauth/[provider]?returnTo=/dashboard
```
Redirects user to OAuth provider's authorization page.

**Providers:** `google`, `facebook`, `discord`, `twitch`

**Query Parameters:**
- `returnTo` (optional): URL to redirect after successful authentication

### OAuth Callback
```
GET /api/auth/callback/[provider]?code=...&state=...
```
Handles OAuth callback from provider. Automatically creates/links user account and establishes session.

**Response:** Redirects to `returnTo` URL or home page

### Telegram Callback
```
POST /api/auth/callback/telegram
```
Handles Telegram widget authentication. Verifies auth data using HMAC-SHA256 with bot token.

**Request Body:**
```json
{
  "id": 123456789,
  "first_name": "John",
  "last_name": "Doe",
  "username": "johndoe",
  "photo_url": "https://...",
  "auth_date": 1234567890,
  "hash": "abc123..."
}
```

**Response:** JSON with user data and session cookies

**Security:**
- Verifies HMAC-SHA256 signature using bot token
- Checks auth_date is within 5 minutes
- No email provided by Telegram (optional field)

## User Model with OAuth

```typescript
interface User {
  id: string;
  username: string;
  passwordHash?: string; // Optional for OAuth-only users
  email?: string;
  avatarUrl?: string;
  oauthAccounts: OAuthAccount[];
  balance: number;
  createdAt: Date;
}

interface OAuthAccount {
  provider: "google" | "facebook" | "discord" | "twitch";
  providerId: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
}
```

## Account Linking

Users can link multiple OAuth providers to a single account:

1. **Email-based linking**: If an OAuth account uses an email that matches an existing user, the OAuth account is automatically linked
2. **Multiple providers**: Users can have both local password authentication and multiple OAuth providers
3. **Primary authentication**: Users can choose their preferred login method

## Known Limitations & TODOs

1. **Admin Role System**: Currently uses hardcoded user IDs. Should be replaced with database-backed role system.
2. **Rate Limiting Storage**: Uses in-memory storage. Should use Deno KV for distributed deployments.
3. **Audit Logging**: Not yet implemented for admin actions.
4. **2FA**: Two-factor authentication not yet implemented.
5. **Password Reset**: Secure password reset flow not yet implemented.
6. **Account Lockout**: Automatic lockout after failed login attempts not yet implemented.
7. **OAuth Token Refresh**: Access token refresh not yet implemented (sessions handle re-authentication).
8. **Account Unlinking**: UI for unlinking OAuth providers not yet implemented.

## Incident Response

If a security issue is discovered:

1. **Assess Impact**: Determine scope and severity
2. **Contain**: Disable affected endpoints if necessary
3. **Fix**: Implement and test fix
4. **Deploy**: Deploy fix to production immediately
5. **Notify**: Inform affected users if data was compromised
6. **Document**: Update this document with lessons learned

## Security Updates

This document should be updated whenever:
- New security features are added
- Security vulnerabilities are fixed
- Best practices change
- New threats are identified

## Payments and Ads Security

### Stripe Integration

**Shop Purchase Security:**
- All payments processed via Stripe (PCI DSS compliant)
- Fixed item prices (no arbitrary amounts)
- Webhook signature verification required
- Event deduplication prevents double-processing
- HTTPS required in production
- Rate limiting: 20 purchases/min
- Users can only buy from shop (no direct deposits)

**Payout Security:**
- Balance deducted immediately upon request
- Admin review required for processing
- Minimum/maximum limits enforced ($10-$10,000)
- User authentication required
- CSRF protection on all endpoints
- Rate limiting: 5 payouts/hour

### Mondiad Ads

**Ad Security:**
- Daily limit: 50 ads per user (prevents abuse)
- Minimum watch time enforcement
- Impression tracking and validation
- Rate limiting: 30 requests/minute
- User authentication required
- Reward only on completion

**Abuse Prevention:**
- Watch time validation
- Completion rate tracking
- Daily limits per user
- IP-based rate limiting
- Event deduplication

For detailed payment and ads documentation, see [PAYMENTS_AND_ADS.md](./PAYMENTS_AND_ADS.md).

Last Updated: 2026-06-26
