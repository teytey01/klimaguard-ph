import { NextResponse } from "next/server";

import { askKlimaAgent, toChatLanguage } from "@/lib/agent/quickClient";
import { CHAT_FALLBACK_MESSAGES } from "@/lib/constants";
import type { IChatRequest, IChatResponse } from "@/types";

// The knowledge base reads markdown from disk, so this must run on Node.js.
export const runtime = "nodejs";

const MAX_MESSAGE_CHARS = 2000;

/**
 * KlimaChat Route Handler. Delegates to the server-only `askKlimaAgent`
 * (emergency override → Groq + knowledge base → deterministic fallback),
 * replying in the user's selected language. The GROQ_API_KEY never leaves
 * the server.
 */
export async function POST(request: Request): Promise<NextResponse<IChatResponse>> {
  let language = toChatLanguage(undefined);
  try {
    const body = (await request.json()) as Partial<IChatRequest>;
    language = toChatLanguage(body.language);
    const message =
      typeof body.message === "string" ? body.message.slice(0, MAX_MESSAGE_CHARS) : "";

    if (message.trim().length === 0) {
      return NextResponse.json(
        {
          reply:
            language === "en"
              ? "What would you like to ask? Just type it here. 🙂"
              : "Ano ang gusto mong itanong? I-type lang dito. 🙂",
        },
        { status: 400 },
      );
    }

    const payload = await askKlimaAgent(message, body.history, language);
    return NextResponse.json(payload);
  } catch {
    return NextResponse.json({ reply: CHAT_FALLBACK_MESSAGES[language] }, { status: 500 });
  }
}
