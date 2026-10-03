import { NextResponse } from "next/server";

// Small JSON helpers shared by the auth + data Route Handlers.

/** Filipino-first error response with an HTTP status. */
export function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/** Parse a JSON body, returning null on malformed input instead of throwing. */
export async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

/** Trim a string field and cap its length; non-strings become "". */
export function cleanText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export const ERR_UNAUTHENTICATED = "Kailangan mong mag-sign in muna.";
export const ERR_FORBIDDEN = "Wala kang pahintulot para dito.";
export const ERR_BAD_REQUEST = "May kulang o maling impormasyon sa request.";
export const ERR_SERVER = "May problema sa server. Pakisubukan ulit.";
