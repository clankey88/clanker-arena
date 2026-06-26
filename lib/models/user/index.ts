import { kv } from "../../../utils/kv.ts";
import { KV_PREFIXES, saveUser as saveUserHelper, getUser } from "../../../utils/kv_helpers.ts";
import { User } from "../../../types/index.ts";
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
  
  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return { user: null, error: "Invalid username or password" };
  }
  
  return { user };
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