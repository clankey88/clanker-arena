import { kv } from "../../../utils/kv.ts";
import { KV_PREFIXES, saveUser, getUser } from "../../../utils/kv_helpers.ts";
import { User } from "../../../types/index.ts";

export { saveUser, getUser };

export async function registerUser(username: string): Promise<User | null> {
  const existing = await kv.get<string>([KV_PREFIXES.USERS_BY_USERNAME, username]);
  if (existing.value) return null;

  const id = crypto.randomUUID();
  const user: User = {
    id,
    username,
    balance: 0,
    createdAt: new Date()
  };
  
  const success = await saveUser(user);
  if (!success) return null;
  return user;
}

export async function loginUser(username: string): Promise<User | null> {
  const idRes = await kv.get<string>([KV_PREFIXES.USERS_BY_USERNAME, username]);
  if (!idRes.value) return null;
  return await getUser(idRes.value);
}

export async function createSession(userId: string): Promise<string> {
  const sessionId = crypto.randomUUID();
  await kv.set(["sessions", sessionId], userId, { expireIn: 1000 * 60 * 60 * 24 });
  return sessionId;
}

export async function getSessionUser(sessionId: string): Promise<User | null> {
  const res = await kv.get<string>(["sessions", sessionId]);
  if (!res.value) return null;
  return await getUser(res.value);
}
