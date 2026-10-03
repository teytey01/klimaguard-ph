// Server-only Groq client (native fetch, OpenAI-compatible Chat Completions).
//
// Sends the system prompt (persona + retrieved knowledge) plus a short chat
// history to Groq and returns the plain-text reply, or null on any failure so
// the caller can fall back gracefully to a Filipino message. MUST stay
// server-side — it reads the server-only GROQ_API_KEY.

import type { IChatHistoryTurn } from "@/types";

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

/**
 * Default model; override with GROQ_MODEL. Llama 3.x on Groq moved to the
 * Enterprise tier, so the default targets a current self-serve production
 * model (see https://console.groq.com/docs/models).
 */
const DEFAULT_MODEL = "openai/gpt-oss-120b";

/** Minimal shape of the Chat Completions response we read. */
interface IGroqResponse {
  choices?: Array<{
    message?: { content?: string | null };
    finish_reason?: string;
  }>;
}

interface IGroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/** Transient upstream statuses worth an automatic retry. */
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503]);
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 700;

/** True when a Groq API key is present in the environment. */
export function isGroqConfigured(): boolean {
  return (process.env.GROQ_API_KEY ?? "").trim().length > 0;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Longest we'll wait on a rate limit before falling back (keeps chat snappy). */
const MAX_RATE_LIMIT_WAIT_MS = 8_000;

/**
 * How long to wait before retrying. On 429, honor Groq's `retry-after`
 * header or the "try again in Xs" hint (free tier is token-per-minute
 * limited); return null when the wait is too long so we fall back instead.
 */
function retryWaitMs(response: Response, errorBody: string, attempt: number): number | null {
  if (response.status !== 429) {
    return RETRY_DELAY_MS * attempt;
  }
  const header = Number.parseFloat(response.headers.get("retry-after") ?? "");
  const hint = /try again in ([\d.]+)\s*(ms|s)/i.exec(errorBody);
  let seconds = Number.isFinite(header) ? header : 0;
  if (hint) {
    seconds = hint[2].toLowerCase() === "ms" ? Number(hint[1]) / 1000 : Number(hint[1]);
  }
  const waitMs = Math.ceil(Math.max(seconds, 1) * 1000) + 250;
  return waitMs <= MAX_RATE_LIMIT_WAIT_MS ? waitMs : null;
}

/** Reasoning models (gpt-oss, qwen3) accept a reasoning_effort knob. */
function isReasoningModel(model: string): boolean {
  return model.startsWith("openai/gpt-oss") || model.startsWith("qwen/");
}

/**
 * Ask Groq for a completion. Returns the trimmed reply text, or null if
 * unconfigured, on HTTP error, or on an empty response. Never throws.
 */
export async function generateReply(
  systemPrompt: string,
  userMessage: string,
  history: IChatHistoryTurn[] = [],
): Promise<string | null> {
  const apiKey = (process.env.GROQ_API_KEY ?? "").trim();
  if (apiKey.length === 0) {
    return null;
  }

  const model = (process.env.GROQ_MODEL ?? "").trim() || DEFAULT_MODEL;

  const messages: IGroqMessage[] = [
    { role: "system", content: systemPrompt },
    ...history.map<IGroqMessage>((turn) => ({
      role: turn.role === "user" ? "user" : "assistant",
      content: turn.content,
    })),
    { role: "user", content: userMessage },
  ];

  const body: Record<string, unknown> = {
    model,
    messages,
    temperature: 0.5,
    // Reasoning tokens count toward this budget, so leave headroom.
    max_completion_tokens: 700,
  };
  if (isReasoningModel(model)) {
    body.reasoning_effort = model.startsWith("qwen/") ? "none" : "low";
  }

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(GROQ_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        // Chat is interactive; don't let a stalled upstream hang the request.
        signal: AbortSignal.timeout(15_000),
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "");
        console.error(
          `[groqClient] HTTP ${response.status} from ${model} ` +
            `(attempt ${attempt}/${MAX_ATTEMPTS}): ${errorBody.slice(0, 300)}`,
        );
        if (RETRYABLE_STATUSES.has(response.status) && attempt < MAX_ATTEMPTS) {
          const waitMs = retryWaitMs(response, errorBody, attempt);
          if (waitMs !== null) {
            await delay(waitMs);
            continue;
          }
        }
        return null;
      }

      const data = (await response.json()) as IGroqResponse;
      const text = data.choices?.[0]?.message?.content?.trim() ?? "";

      if (text.length === 0) {
        const finishReason = data.choices?.[0]?.finish_reason ?? "UNKNOWN";
        console.error(
          `[groqClient] empty completion from ${model} (finish_reason=${finishReason})`,
        );
        return null;
      }

      return text;
    } catch (error) {
      console.error(
        `[groqClient] request failed (attempt ${attempt}/${MAX_ATTEMPTS}):`,
        error,
      );
      if (attempt < MAX_ATTEMPTS) {
        await delay(RETRY_DELAY_MS * attempt);
        continue;
      }
      return null;
    }
  }

  return null;
}
