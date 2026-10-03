// Server-only Google Gemini client (native fetch, no SDK).
//
// One-shot generateContent call: system prompt (persona + KB) as system
// instruction, the user's message as the sole content turn. Returns the plain
// text completion, or null on any failure so the caller can fall back
// gracefully to a Filipino message. MUST stay server-side — it reads the
// server-only GEMINI_API_KEY.

/**
 * Default model; override with GEMINI_MODEL if needed.
 * Note: gemini-2.5-flash is no longer served to newly created API keys, so the
 * default targets a current flash model.
 */
const DEFAULT_MODEL = "gemini-3.8-flash";

/** Minimal shape of the Gemini generateContent response we read. */
interface IGeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
}

/** Transient upstream statuses worth one automatic retry. */
const RETRYABLE_STATUSES = new Set([429, 500, 503]);

/** Max attempts (1 initial + retries) and backoff between them. */
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 700;

/** True when a Gemini API key is present in the environment. */
export function isGeminiConfigured(): boolean {
  return (process.env.GEMINI_API_KEY ?? "").length > 0;
}

/** Sleep helper for backoff between retries. */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Ask Gemini for a completion. `systemPrompt` carries the persona + knowledge
 * base; `userMessage` is the end user's question. Returns the trimmed reply
 * text, or null if unconfigured, on HTTP error, or on an empty/blocked
 * response. Never throws into the chat path.
 */
export async function generateReply(
  systemPrompt: string,
  userMessage: string,
): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY ?? "";
  if (apiKey.length === 0) {
    return null;
  }

  const model = process.env.GEMINI_MODEL ?? DEFAULT_MODEL;
  const endpoint =
    `https://generativelanguage.googleapis.com/v1beta/models/` +
    `${model}:generateContent`;

  const body = {
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: [
      {
        role: "user",
        parts: [{ text: userMessage }],
      },
    ],
    generationConfig: {
      temperature: 0.6,
      maxOutputTokens: 512,
    },
  };

  // Gemini's free tier returns transient 503 "high demand" / 429 rate limits;
  // retry those a couple of times before falling back to the Filipino message.
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify(body),
        // Chat is interactive; don't let a stalled upstream hang the request.
        signal: AbortSignal.timeout(15_000),
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "");
        console.error(
          `[geminiClient] HTTP ${response.status} from ${model} ` +
            `(attempt ${attempt}/${MAX_ATTEMPTS}): ${errorBody.slice(0, 300)}`,
        );
        if (RETRYABLE_STATUSES.has(response.status) && attempt < MAX_ATTEMPTS) {
          await delay(RETRY_DELAY_MS * attempt);
          continue;
        }
        return null;
      }

      const data = (await response.json()) as IGeminiResponse;
      const text = data.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? "")
        .join("")
        .trim();

      if (!text || text.length === 0) {
        // Empty usually means a safety block or a MAX_TOKENS cutoff with no text.
        const finishReason = data.candidates?.[0]?.finishReason ?? "UNKNOWN";
        console.error(
          `[geminiClient] empty completion from ${model} (finishReason=${finishReason})`,
        );
        return null;
      }

      return text;
    } catch (error) {
      // Network error, timeout, or malformed JSON. Retry once more if we can.
      console.error(
        `[geminiClient] request failed (attempt ${attempt}/${MAX_ATTEMPTS}):`,
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
