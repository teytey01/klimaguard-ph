import { NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { hashMobile, maskMobile } from "@/lib/auth/crypto";
import { checkOtp } from "@/lib/auth/otp";
import { createSession, toPublicSession } from "@/lib/auth/session";
import { cleanText, ERR_SERVER, jsonError, readJson } from "@/lib/auth/http";
import { normalizePhMobile } from "@/lib/sms";
import { DEFAULT_ONBOARDING } from "@/lib/onboarding/onboardingData";

interface IVerifyRequest {
  mobile?: unknown;
  code?: unknown;
  name?: unknown;
}

const OTP_ERRORS: Record<string, { message: string; status: number }> = {
  invalid: { message: "Maling code. Pakisubukan muli.", status: 401 },
  expired: { message: "Nag-expire na ang code. Humingi ng bago.", status: 401 },
  "not-issued": { message: "Humingi muna ng verification code.", status: 400 },
  locked: {
    message: "Masyadong maraming maling subok. Subukan ulit pagkalipas ng 15 minuto.",
    status: 429,
  },
};

/**
 * POST /api/auth/verify — resident self sign-up / sign-in. Verifies the
 * simulated OTP, upserts the resident by HMAC'd mobile (raw number is never
 * stored), and sets the HTTP-only session cookie.
 */
export async function POST(request: Request) {
  try {
    const body = await readJson<IVerifyRequest>(request);
    const mobile =
      typeof body?.mobile === "string" ? normalizePhMobile(body.mobile) : null;
    const code = cleanText(body?.code, 6);
    const name = cleanText(body?.name, 80);

    if (!mobile || code.length !== 6 || name.length < 2) {
      return jsonError("Kumpletuhin ang pangalan, numero, at 6-digit code.", 400);
    }

    const mobileHash = hashMobile(mobile);
    const otp = checkOtp(mobileHash, code);
    if (!otp.ok) {
      const err = OTP_ERRORS[otp.reason];
      return jsonError(err.message, err.status);
    }

    // Default scope until onboarding saves the resident's chosen barangay.
    const user = await prisma.user.upsert({
      where: { mobileHash },
      update: { name },
      create: {
        role: "resident",
        mobileHash,
        mobileMasked: maskMobile(mobile),
        name,
        ...DEFAULT_ONBOARDING.location,
      },
    });

    await createSession(user.id);
    return NextResponse.json({ session: toPublicSession(user) });
  } catch {
    return jsonError(ERR_SERVER, 500);
  }
}
