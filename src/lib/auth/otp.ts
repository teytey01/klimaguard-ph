// Simulated OTP store (server memory, demo-grade). Implements the doc's rules:
// 5-minute expiry, 3 failed attempts → 15-minute lockout. The code itself is the
// fixed demo code; nothing is sent over a real SMS gateway.

export const DEMO_OTP_CODE = "123456";

const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 3;
const LOCKOUT_MS = 15 * 60 * 1000;

interface IOtpEntry {
  expiresAt: number;
  attempts: number;
  lockedUntil: number;
}

// Keyed by the HMAC'd mobile hash so raw numbers never sit in memory maps.
const globalForOtp = globalThis as unknown as {
  otpStore: Map<string, IOtpEntry> | undefined;
};
const store: Map<string, IOtpEntry> =
  globalForOtp.otpStore ?? new Map<string, IOtpEntry>();
globalForOtp.otpStore = store;

export type IOtpIssueResult =
  | { ok: true }
  | { ok: false; reason: "locked"; retryAfterSec: number };

/** Issue (or re-issue) an OTP for a mobile hash. Respects an active lockout. */
export function issueOtp(mobileHash: string): IOtpIssueResult {
  const now = Date.now();
  const existing = store.get(mobileHash);
  if (existing && existing.lockedUntil > now) {
    return {
      ok: false,
      reason: "locked",
      retryAfterSec: Math.ceil((existing.lockedUntil - now) / 1000),
    };
  }
  store.set(mobileHash, { expiresAt: now + OTP_TTL_MS, attempts: 0, lockedUntil: 0 });
  return { ok: true };
}

export type IOtpVerifyResult =
  | { ok: true }
  | { ok: false; reason: "invalid" | "expired" | "not-issued" | "locked" };

/** Check a code. Consumes the OTP on success; counts failures toward lockout. */
export function checkOtp(mobileHash: string, code: string): IOtpVerifyResult {
  const now = Date.now();
  const entry = store.get(mobileHash);
  if (!entry) {
    return { ok: false, reason: "not-issued" };
  }
  if (entry.lockedUntil > now) {
    return { ok: false, reason: "locked" };
  }
  if (entry.expiresAt < now) {
    store.delete(mobileHash);
    return { ok: false, reason: "expired" };
  }
  if (code.trim() !== DEMO_OTP_CODE) {
    entry.attempts += 1;
    if (entry.attempts >= MAX_ATTEMPTS) {
      entry.lockedUntil = now + LOCKOUT_MS;
      return { ok: false, reason: "locked" };
    }
    return { ok: false, reason: "invalid" };
  }
  store.delete(mobileHash);
  return { ok: true };
}
