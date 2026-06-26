// TICKET T-005: Implement secure password hashing
// Using Web Crypto API for password hashing (PBKDF2)

const ITERATIONS = 100000;
const HASH_LENGTH = 32;
const SALT_LENGTH = 16;

export async function hashPassword(password: string): Promise<string> {
  // Generate random salt
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  
  // Convert password to bytes
  const encoder = new TextEncoder();
  const passwordBytes = encoder.encode(password);
  
  // Import password as key
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    passwordBytes,
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  
  // Derive key using PBKDF2
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: ITERATIONS,
      hash: "SHA-256"
    },
    keyMaterial,
    HASH_LENGTH * 8
  );
  
  // Combine salt and hash
  const hashArray = new Uint8Array(hashBuffer);
  const combined = new Uint8Array(SALT_LENGTH + HASH_LENGTH);
  combined.set(salt);
  combined.set(hashArray, SALT_LENGTH);
  
  // Convert to base64
  return btoa(String.fromCharCode(...combined));
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    // Decode base64
    const combined = Uint8Array.from(atob(hashedPassword), c => c.charCodeAt(0));
    
    // Extract salt and hash
    const salt = combined.slice(0, SALT_LENGTH);
    const storedHash = combined.slice(SALT_LENGTH);
    
    // Convert password to bytes
    const encoder = new TextEncoder();
    const passwordBytes = encoder.encode(password);
    
    // Import password as key
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      passwordBytes,
      "PBKDF2",
      false,
      ["deriveBits"]
    );
    
    // Derive key using same salt
    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: ITERATIONS,
        hash: "SHA-256"
      },
      keyMaterial,
      HASH_LENGTH * 8
    );
    
    const computedHash = new Uint8Array(hashBuffer);
    
    // Constant-time comparison
    if (computedHash.length !== storedHash.length) return false;
    
    let result = 0;
    for (let i = 0; i < computedHash.length; i++) {
      result |= computedHash[i] ^ storedHash[i];
    }
    
    return result === 0;
  } catch {
    return false;
  }
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || password.length < 8) {
    return { valid: false, error: "Password must be at least 8 characters long" };
  }
  
  if (password.length > 128) {
    return { valid: false, error: "Password must be less than 128 characters" };
  }
  
  // Check for at least one number
  if (!/\d/.test(password)) {
    return { valid: false, error: "Password must contain at least one number" };
  }
  
  // Check for at least one letter
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, error: "Password must contain at least one letter" };
  }
  
  return { valid: true };
}
