import type {
  IHazardAlert,
  ISmsBroadcast,
  ISmsKind,
} from "@/types";

// Simulated SMS layer. No real messages are dispatched — the "provider" logs
// to an in-memory store that the UI subscribes to (SMS Broadcast Log). To go
// live later, swap `mockProvider` for a Semaphore/Twilio client implementing
// the same `ISmsProvider` interface; nothing else changes.

/** The demo OTP code. Any-code-accepts is intentional for the hackathon. */
export const DEMO_OTP_CODE = "123456";

/** Attribution constants. */
export const SMS_SOURCE_SYSTEM = "KlimaGuard PH";
export const SMS_SOURCE_NDRRMC = "NDRRMC";

/** A pluggable SMS provider. The mock logs; a real one would dispatch. */
export interface ISmsProvider {
  send: (
    recipients: string[],
    message: string,
    kind: ISmsKind,
    source: string,
  ) => ISmsBroadcast;
}

// --- In-memory broadcast log + pub/sub (client-side, demo-grade) ---

let broadcasts: ISmsBroadcast[] = [];
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

/** Subscribe to broadcast-log changes. Returns an unsubscribe function. */
export function subscribeBroadcasts(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Current broadcast log (most recent first). */
export function getBroadcasts(): ISmsBroadcast[] {
  return broadcasts;
}

/** Clear the log (used by the UI "clear" affordance / tests). */
export function clearBroadcasts(): void {
  broadcasts = [];
  emit();
}

function makeId(): string {
  return `sms_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** The mock provider: records the message instead of sending it. */
export const mockProvider: ISmsProvider = {
  send(recipients, message, kind, source) {
    const entry: ISmsBroadcast = {
      id: makeId(),
      kind,
      recipients,
      message,
      sentAt: new Date().toISOString(),
      source,
    };
    broadcasts = [entry, ...broadcasts].slice(0, 50); // cap the log
    emit();
    return entry;
  },
};

/** The active provider. Point this at a real client to go live. */
export const smsProvider: ISmsProvider = mockProvider;

// --- Phone number helpers ---

/**
 * Normalize a PH mobile number to "+63XXXXXXXXXX". Accepts "09XXXXXXXXX",
 * "9XXXXXXXXX", "+639XXXXXXXXX", with spaces/dashes. Returns null if invalid.
 */
export function normalizePhMobile(input: string): string | null {
  const digits = input.replace(/[^\d+]/g, "");
  let local: string | null = null;
  if (/^\+639\d{9}$/.test(digits)) {
    local = digits.slice(3);
  } else if (/^639\d{9}$/.test(digits)) {
    local = digits.slice(2);
  } else if (/^09\d{9}$/.test(digits)) {
    local = digits.slice(1);
  } else if (/^9\d{9}$/.test(digits)) {
    local = digits;
  }
  return local ? `+63${local}` : null;
}

/** Display form: "+63 917 123 4567". */
export function formatPhMobile(normalized: string): string {
  const m = normalized.match(/^\+63(\d{3})(\d{3})(\d{4})$/);
  if (!m) {
    return normalized;
  }
  return `+63 ${m[1]} ${m[2]} ${m[3]}`;
}

// --- OTP (simulated) ---

/** "Send" an OTP: logs a simulated SMS. Returns the broadcast entry. */
export function sendOtp(mobile: string): ISmsBroadcast {
  const message = `Ang iyong KlimaGuard PH verification code ay ${DEMO_OTP_CODE}. Huwag ibahagi sa iba. (Demo)`;
  return smsProvider.send([mobile], message, "otp", SMS_SOURCE_SYSTEM);
}

/** Verify an OTP against the demo code. */
export function verifyOtp(code: string): boolean {
  return code.trim() === DEMO_OTP_CODE;
}

// --- Hazard alert broadcast ---

/** Build the Filipino hazard SMS body (≤160 chars where possible). */
export function buildHazardSms(alert: IHazardAlert): string {
  const areas = alert.affectedAreas.slice(0, 3).join(", ");
  return (
    `SIGNAL #${alert.signalLevel} ${alert.typhoonName}. ` +
    `Apektado: ${areas}. Lumikas na sa pinakamalapit na evacuation center. ` +
    `Tumawag 911. -${SMS_SOURCE_NDRRMC}`
  );
}

/**
 * Simulate broadcasting a hazard alert to the registered residents whose
 * barangay/municipality intersects the alert's affected areas. Falls back to
 * the single session number when no roster is provided (demo).
 */
export function broadcastHazardAlert(
  alert: IHazardAlert,
  recipients: string[],
): ISmsBroadcast {
  const message = buildHazardSms(alert);
  const targets = recipients.length > 0 ? recipients : ["(walang nakarehistrong numero)"];
  return smsProvider.send(targets, message, "hazard-alert", SMS_SOURCE_NDRRMC);
}

/**
 * Filter a resident roster to those in the alert's affected areas (match by
 * barangay or municipality name, case-insensitive substring).
 */
export function targetRecipients(
  roster: { mobile: string; barangay: string; municipality: string }[],
  alert: IHazardAlert,
): string[] {
  const areas = alert.affectedAreas.map((a) => a.toLowerCase());
  return roster
    .filter((r) =>
      areas.some(
        (area) =>
          area.includes(r.barangay.toLowerCase()) ||
          area.includes(r.municipality.toLowerCase()) ||
          r.barangay.toLowerCase().includes(area) ||
          r.municipality.toLowerCase().includes(area),
      ),
    )
    .map((r) => r.mobile);
}
