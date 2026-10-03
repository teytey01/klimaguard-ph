import { NextResponse } from "next/server";

import { hashMobile, maskMobile } from "@/lib/auth/crypto";
import { issueOtp } from "@/lib/auth/otp";
import { ERR_SERVER, jsonError, readJson } from "@/lib/auth/http";
import { normalizePhMobile } from "@/lib/sms";

interface IOtpRequest {
  mobile?: unknown;
}

/**
 * POST /api/auth/otp — issue a simulated 6-digit OTP for a PH mobile number.
 * No SMS is actually sent (demo code 123456). Honors the 3-attempt lockout.
 */
export async function POST(request: Request) {
  try {
    const body = await readJson<IOtpRequest>(request);
    const mobile =
      typeof body?.mobile === "string" ? normalizePhMobile(body.mobile) : null;
    if (!mobile) {
      return jsonError(
        "Maglagay ng tamang numero ng telepono sa Pilipinas (hal. 917 123 4567).",
        400,
      );
    }

    const result = issueOtp(hashMobile(mobile));
    if (!result.ok) {
      return jsonError(
        `Masyadong maraming maling subok. Subukan ulit pagkalipas ng ${Math.ceil(
          result.retryAfterSec / 60,
        )} minuto.`,
        429,
      );
    }

    return NextResponse.json({ sent: true, to: maskMobile(mobile), simulated: true });
  } catch {
    return jsonError(ERR_SERVER, 500);
  }
}
