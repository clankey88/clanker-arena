import { kv } from "../../../utils/kv.ts";
import { KV_PREFIXES, getUser } from "../../../utils/kv_helpers.ts";
import { User, OAuthProvider, OAuthAccount } from "../../../types/index.ts";
import { hashPassword, verifyPassword, validatePassword } from "../../security/password.ts";

export { getUser };

// TICKET T-005: Secure user registration with password hashing
export async function registerUser(username: string, password: string): Promise<{ user: User | null; error?: string }> {
  // Validate username
  if (!username || username.length < 3 || username.length > 30) {
    return { user: null, error: "Username must be between 3 and 30 characters" };
  }
  
  // Sanitize username (alphanumeric and underscore only)
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { user: null, error: "Username can only contain letters, numbers, and underscores" };
  }
  
  // Validate password
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return { user: null, error: passwordValidation.error };
  }
  
  // Check if username already exists
  const existing = await kv.get<string>([KV_PREFIXES.USERS_BY_USERNAME, username.toLowerCase()]);
  if (existing.value) {
    return { user: null, error: "Username already exists" };
  }

  const id = crypto.randomUUID();
  const passwordHash = await hashPassword(password);
  
  const user: User = {
    id,
    username,
    passwordHash,
    oauthAccounts: [],
    balance: 0,
    createdAt: new Date()
  };
  
  // Use atomic operation to ensure consistency
  const result = await kv.atomic()
    .check({ key: [KV_PREFIXES.USERS, id], versionstamp: null })
    .check({ key: [KV_PREFIXES.USERS_BY_USERNAME, username.toLowerCase()], versionstamp: null })
    .set([KV_PREFIXES.USERS, id], user)
    .set([KV_PREFIXES.USERS_BY_USERNAME, username.toLowerCase()], id)
    .commit();
    
  if (!result.ok) {
    return { user: null, error: "Failed to create user" };
  }
  
  return { user };
}

// TICKET T-005: Secure login with password verification
export async function loginUser(username: string, password: string): Promise<{ user: User | null; error?: string }> {
  if (!username || !password) {
    return { user: null, error: "Username and password are required" };
  }
  
  const idRes = await kv.get<string>([KV_PREFIXES.USERS_BY_USERNAME, username.toLowerCase()]);
  if (!idRes.value) {
    return { user: null, error: "Invalid username or password" };
  }
  
  const user = await getUser(idRes.value);
  if (!user) {
    return { user: null, error: "Invalid username or password" };
  }
  
  if (!user.passwordHash) {
    return { user: null, error: "This account uses OAuth login. Please use the appropriate login button." };
  }
  
  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return { user: null, error: "Invalid username or password" };
  }
  
  return { user };
}

// TICKET T-005: OAuth user creation or login
export async function findOrCreateOAuthUser(
  provider: OAuthProvider,
  providerId: string,
  email?: string,
  displayName?: string,
  avatarUrl?: string
): Promise<{ user: User | null; error?: string; isNewUser: boolean }> {
  // Check if OAuth account already exists
  const existingUserId = await kv.get<string>([
    "oauth_accounts",
    provider,
    providerId,
  ]);
  
  if (existingUserId.value) {
    const user = await getUser(existingUserId.value);
    if (user) {
      return { user, isNewUser: false };
    }
  }
  
  // Check if email already exists (link to existing account)
  if (email) {
    const emailUserId = await kv.get<string>(["users_by_email", email.toLowerCase()]);
    if (emailUserId.value) {
      const user = await getUser(emailUserId.value);
      if (user) {
        // Link OAuth account to existing user
        const oauthAccount: OAuthAccount = {
          provider,
          providerId,
          email,
          displayName,
          avatarUrl,
        };
        
        user.oauthAccounts.push(oauthAccount);
        
        const result = await kv.atomic()
          .set([KV_PREFIXES.USERS, user.id], user)
          .set(["oauth_accounts", provider, providerId], user.id)
          .commit();
        
        if (!result.ok) {
          return { user: null, error: "Failed to link OAuth account", isNewUser: false };
        }
        
        return { user, isNewUser: false };
      }
    }
  }
  
  // Create new user
  const id = crypto.randomUUID();
  const username = await generateUniqueUsername(displayName || `${provider}_user`);
  
  const oauthAccount: OAuthAccount = {
    provider,
    providerId,
    email,
    displayName,
    avatarUrl,
  };
  
  const user: User = {
    id,
    username,
    email,
    avatarUrl,
    oauthAccounts: [oauthAccount],
    balance: 0,
    createdAt: new Date(),
  };
  
  const atomic = kv.atomic()
    .check({ key: [KV_PREFIXES.USERS, id], versionstamp: null })
    .check({ key: [KV_PREFIXES.USERS_BY_USERNAME, username.toLowerCase()], versionstamp: null })
    .set([KV_PREFIXES.USERS, id], user)
    .set([KV_PREFIXES.USERS_BY_USERNAME, username.toLowerCase()], id)
    .set(["oauth_accounts", provider, providerId], id);
  
  if (email) {
    atomic.set(["users_by_email", email.toLowerCase()], id);
  }
  
  const result = await atomic.commit();
  
  if (!result.ok) {
    return { user: null, error: "Failed to create user", isNewUser: false };
  }
  
  return { user, isNewUser: true };
}

// Helper to generate unique username
async function generateUniqueUsername(baseName: string): Promise<string> {
  // Sanitize base name
  let sanitized = baseName
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .substring(0, 20);
  
  if (!sanitized || sanitized.length < 3) {
    sanitized = "user";
  }
  
  // Try base name first
  let username = sanitized;
  let exists = await kv.get([KV_PREFIXES.USERS_BY_USERNAME, username]);
  
  // Add numbers until we find a unique username
  let counter = 1;
  while (exists.value) {
    username = `${sanitized}${counter}`;
    exists = await kv.get([KV_PREFIXES.USERS_BY_USERNAME, username]);
    counter++;
    
    if (counter > 9999) {
      // Fallback to UUID if we can't find a unique username
      username = `user_${crypto.randomUUID().substring(0, 8)}`;
      break;
    }
  }
  
  return username;
}

// TICKET T-005: Secure session management with expiration
export async function createSession(userId: string): Promise<string> {
  const sessionId = crypto.randomUUID();
  // Session expires in 7 days
  await kv.set(["sessions", sessionId], userId, { expireIn: 1000 * 60 * 60 * 24 * 7 });
  return sessionId;
}

export async function getSessionUser(sessionId: string): Promise<User | null> {
  if (!sessionId) return null;
  
  const res = await kv.get<string>(["sessions", sessionId]);
  if (!res.value) return null;
  
  return await getUser(res.value);
}

export async function deleteSession(sessionId: string): Promise<void> {
  await kv.delete(["sessions", sessionId]);
}

// Helper to get user without exposing password hash
export async function getUserSafe(id: string): Promise<Omit<User, 'passwordHash'> | null> {
  const user = await getUser(id);
  if (!user) return null;
  
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}
