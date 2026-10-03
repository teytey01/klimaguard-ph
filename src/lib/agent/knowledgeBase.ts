// Server-only knowledge-base loader + Filipino system-prompt builder.
//
// Reads the markdown docs in ./knowledge, concatenates them in filename order
// (00-, 10-, 20-, ...), and builds the system prompt sent to the LLM. The KB
// is small enough to inline into every request — no vector store needed.
//
// MUST NOT be imported by any client component — only the server-side agent
// client (and, through it, the /api/chat route) uses this.

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

/** Default location context, sourced from env with a Calamba fallback. */
function defaultLocationLine(): string {
  const location = process.env.NEXT_PUBLIC_DEFAULT_LOCATION ?? "Calamba, Laguna";
  const region = process.env.NEXT_PUBLIC_DEFAULT_REGION ?? "CALABARZON";
  return `Default na lokasyon kung walang binanggit: ${location} (rehiyong ${region}).`;
}

/** Absolute path to the knowledge folder, resolved from this module. */
const KNOWLEDGE_DIR = path.join(process.cwd(), "src", "lib", "agent", "knowledge");

/** Cache the concatenated KB text so we read from disk only once per process. */
let cachedKnowledge: string | null = null;

/**
 * Load and concatenate all markdown docs in the knowledge folder, ordered by
 * filename so the numeric prefixes (00-, 10-, ...) control priority. Cached
 * after the first successful read. Returns an empty string if the folder is
 * missing or unreadable — the caller still has the persona preamble.
 */
export async function loadKnowledge(): Promise<string> {
  if (cachedKnowledge !== null) {
    return cachedKnowledge;
  }

  try {
    const entries = await readdir(KNOWLEDGE_DIR);
    const mdFiles = entries
      .filter((name) => name.endsWith(".md"))
      .sort((a, b) => a.localeCompare(b));

    const docs = await Promise.all(
      mdFiles.map(async (name) => {
        const contents = await readFile(path.join(KNOWLEDGE_DIR, name), "utf8");
        return `\n\n===== ${name} =====\n${contents.trim()}`;
      }),
    );

    cachedKnowledge = docs.join("\n");
    return cachedKnowledge;
  } catch {
    // No KB on disk — degrade to persona-only. Never throw into the chat path.
    cachedKnowledge = "";
    return cachedKnowledge;
  }
}

/**
 * Build the full system prompt: a short runtime preamble (default location,
 * answer discipline) plus the knowledge base documents. The persona and
 * guardrails themselves live in the KB docs so they are editable without code
 * changes.
 */
export async function buildSystemPrompt(): Promise<string> {
  const knowledge = await loadKnowledge();

  return [
    "Ikaw ang KlimaGuard chat agent. Sundin ang persona at mga patakaran sa ibaba.",
    defaultLocationLine(),
    "Sumagot nang maikli, Filipino muna, at naaaksyunan. Huwag mag-imbento ng datos.",
    "Kung ang tanong ay wala sa saklaw ng klima/panahon/panganib/DRRM/pagsasaka, magalang na tumanggi ayon sa guardrail G01.",
    "",
    "Narito ang iyong knowledge base:",
    knowledge,
  ].join("\n");
}
