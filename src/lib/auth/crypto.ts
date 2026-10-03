import {
  createHash,
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

// Server-only crypto helpers. No external dependencies (node:crypto only).

function authSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not set.");
  }
  return secret;
}

/** SHA-256 hex digest. Used for session token storage (tokens are random). */
export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/**
 * Keyed one-way hash for mobile numbers. A plain hash of a PH mobile number is
 * brute-forceable (small keyspace), so we HMAC with the server secret — a
 * leaked database alone cannot be reversed into phone numbers.
 */
export function hashMobile(normalizedMobile: string): string {
  return createHmac("sha256", authSecret()).update(normalizedMobile).digest("hex");
}

/** Opaque random session token (base64url, 256 bits). */
export function randomToken(): string {
  return randomBytes(32).toString("base64url");
}

const SCRYPT_KEYLEN = 64;

/** Hash a password as "scrypt$<saltHex>$<hashHex>". */
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, SCRYPT_KEYLEN);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

/** Constant-time password check against a stored scrypt hash. */
export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) {
    return false;
  }
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** Mask a normalized "+63XXXXXXXXXX" mobile for display: "+63 917 ••• 4567". */
export function maskMobile(normalizedMobile: string): string {
  const m = normalizedMobile.match(/^\+63(\d{3})\d{3}(\d{4})$/);
  return m ? `+63 ${m[1]} ••• ${m[2]}` : "+63 ••• ••• ••••";
}
