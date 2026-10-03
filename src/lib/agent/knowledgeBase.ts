// Server-only knowledge base for KlimaChat.
//
// Two layers:
// 1. CORE docs in src/lib/agent/knowledge/*.md (persona, weather, agri, DRRM,
//    guardrails). Small, always inlined into the system prompt.
// 2. USER docs in <project>/knowledgeFiles/*.md. Any markdown dropped there is
//    picked up automatically (no code change): files are chunked by heading,
//    indexed, and the most relevant chunks for each question are retrieved
//    with a dependency-free BM25 scorer, so large docs don't blow the token
//    budget. The index is rebuilt when a file is added/removed/modified.
//
// MUST NOT be imported by any client component — only the /api/chat route
// (via quickClient) uses this.

import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const CORE_DIR = path.join(process.cwd(), "src", "lib", "agent", "knowledge");
const USER_DIR = path.join(process.cwd(), "knowledgeFiles");

/** Re-check the user folder at most this often (ms). */
const RESCAN_INTERVAL_MS = 30_000;
/** Target chunk size (chars); sections are merged/split around this. */
const CHUNK_TARGET = 1200;
const CHUNK_MAX = 1800;
/** Retrieval budget per question. */
// Kept small so each request fits Groq's free-tier tokens-per-minute budget.
const TOP_K = 4;
const RETRIEVAL_CHAR_BUDGET = 3800;

interface IKnowledgeChunk {
  file: string;
  heading: string;
  text: string;
  tokens: string[];
  termFreq: Map<string, number>;
}

interface IKnowledgeIndex {
  signature: string;
  chunks: IKnowledgeChunk[];
  docFreq: Map<string, number>;
  avgLength: number;
}

let coreCache: string | null = null;
let indexCache: IKnowledgeIndex | null = null;
let lastScanAt = 0;

// Common Filipino + English function words that carry no topical signal.
const STOPWORDS = new Set([
  "ang", "ng", "sa", "na", "at", "ay", "mga", "ko", "mo", "ka", "ako", "ikaw",
  "siya", "kami", "tayo", "kayo", "sila", "ito", "iyan", "iyon", "dito", "doon",
  "po", "ba", "din", "rin", "lang", "naman", "pa", "nga", "kung", "para", "may",
  "mayroon", "wala", "hindi", "oo", "si", "ni", "kay", "nang", "pag", "kapag",
  "ano", "paano", "saan", "kailan", "bakit", "sino", "alin", "gaano",
  "the", "a", "an", "and", "or", "of", "to", "in", "on", "for", "is", "are",
  "was", "be", "it", "this", "that", "with", "as", "by", "at", "from", "what",
  "how", "who", "when", "where", "why", "which", "do", "does", "can", "i",
  "you", "we", "they", "my", "your", "me",
]);

/** Lowercase, strip accents/punctuation, drop stopwords and 1-char tokens. */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9ñ\s-]/g, " ")
    .split(/[\s-]+/)
    .filter((token) => token.length > 1 && !STOPWORDS.has(token));
}

/** Split a markdown document into roughly CHUNK_TARGET-sized sections. */
function chunkMarkdown(file: string, markdown: string): IKnowledgeChunk[] {
  const sections: Array<{ heading: string; body: string }> = [];
  let heading = file;
  let buffer: string[] = [];

  const flush = () => {
    const body = buffer.join("\n").trim();
    if (body.length > 0) {
      sections.push({ heading, body });
    }
    buffer = [];
  };

  for (const line of markdown.split(/\r?\n/)) {
    const match = /^#{1,4}\s+(.*)$/.exec(line);
    if (match) {
      flush();
      heading = match[1].trim() || heading;
    }
    buffer.push(line);
  }
  flush();

  // Merge tiny sections forward; split oversized ones on paragraph breaks.
  const pieces: Array<{ heading: string; text: string }> = [];
  let current: { heading: string; text: string } | null = null;

  for (const section of sections) {
    const paragraphs =
      section.body.length > CHUNK_MAX ? section.body.split(/\n\s*\n/) : [section.body];

    for (const paragraph of paragraphs) {
      if (current && current.text.length + paragraph.length + 2 <= CHUNK_TARGET) {
        current.text += `\n\n${paragraph}`;
      } else {
        if (current) {
          pieces.push(current);
        }
        current = { heading: section.heading, text: paragraph.slice(0, CHUNK_MAX) };
      }
    }
  }
  if (current) {
    pieces.push(current);
  }

  return pieces.map((piece) => {
    const tokens = tokenize(`${piece.heading} ${piece.text}`);
    const termFreq = new Map<string, number>();
    for (const token of tokens) {
      termFreq.set(token, (termFreq.get(token) ?? 0) + 1);
    }
    return { file, heading: piece.heading, text: piece.text, tokens, termFreq };
  });
}

/** List user markdown files with an mtime signature (detects add/edit/remove). */
async function listUserFiles(): Promise<{ files: string[]; signature: string }> {
  try {
    const entries = await readdir(USER_DIR);
    const files = entries
      .filter((name) => name.toLowerCase().endsWith(".md"))
      .sort((a, b) => a.localeCompare(b));
    const stamps = await Promise.all(
      files.map(async (name) => {
        const info = await stat(path.join(USER_DIR, name));
        return `${name}:${info.mtimeMs}:${info.size}`;
      }),
    );
    return { files, signature: stamps.join("|") };
  } catch {
    return { files: [], signature: "" };
  }
}

/** Build (or reuse) the BM25 index over knowledgeFiles/*.md. */
async function getIndex(): Promise<IKnowledgeIndex> {
  const now = Date.now();
  if (indexCache && now - lastScanAt < RESCAN_INTERVAL_MS) {
    return indexCache;
  }
  lastScanAt = now;

  const { files, signature } = await listUserFiles();
  if (indexCache && indexCache.signature === signature) {
    return indexCache;
  }

  const chunks: IKnowledgeChunk[] = [];
  for (const name of files) {
    try {
      const contents = await readFile(path.join(USER_DIR, name), "utf8");
      chunks.push(...chunkMarkdown(name, contents));
    } catch {
      // Skip unreadable files; never break the chat path.
    }
  }

  const docFreq = new Map<string, number>();
  let totalLength = 0;
  for (const chunk of chunks) {
    totalLength += chunk.tokens.length;
    for (const term of chunk.termFreq.keys()) {
      docFreq.set(term, (docFreq.get(term) ?? 0) + 1);
    }
  }

  indexCache = {
    signature,
    chunks,
    docFreq,
    avgLength: chunks.length > 0 ? totalLength / chunks.length : 0,
  };
  return indexCache;
}

/** Return the most relevant user-KB chunks for a question (BM25). */
export async function retrieveKnowledge(
  query: string,
): Promise<Array<{ file: string; heading: string; text: string }>> {
  const index = await getIndex();
  const queryTerms = Array.from(new Set(tokenize(query)));
  if (index.chunks.length === 0 || queryTerms.length === 0) {
    return [];
  }

  const k1 = 1.4;
  const b = 0.75;
  const n = index.chunks.length;

  const scored = index.chunks
    .map((chunk) => {
      let score = 0;
      for (const term of queryTerms) {
        const tf = chunk.termFreq.get(term) ?? 0;
        if (tf === 0) {
          continue;
        }
        const df = index.docFreq.get(term) ?? 0;
        const idf = Math.log(1 + (n - df + 0.5) / (df + 0.5));
        const norm = 1 - b + (b * chunk.tokens.length) / (index.avgLength || 1);
        score += idf * ((tf * (k1 + 1)) / (tf + k1 * norm));
      }
      return { chunk, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((x, y) => y.score - x.score);

  const results: Array<{ file: string; heading: string; text: string }> = [];
  let used = 0;
  for (const { chunk } of scored.slice(0, TOP_K)) {
    if (used + chunk.text.length > RETRIEVAL_CHAR_BUDGET) {
      break;
    }
    used += chunk.text.length;
    results.push({ file: chunk.file, heading: chunk.heading, text: chunk.text });
  }
  return results;
}

/** Load and concatenate the always-on core docs (cached per process). */
export async function loadKnowledge(): Promise<string> {
  if (coreCache !== null) {
    return coreCache;
  }
  try {
    const entries = await readdir(CORE_DIR);
    const mdFiles = entries
      .filter((name) => name.endsWith(".md"))
      .sort((a, b) => a.localeCompare(b));
    const docs = await Promise.all(
      mdFiles.map(async (name) => {
        const contents = await readFile(path.join(CORE_DIR, name), "utf8");
        return `\n\n===== ${name} =====\n${contents.trim()}`;
      }),
    );
    coreCache = docs.join("\n");
  } catch {
    coreCache = "";
  }
  return coreCache;
}

function defaultLocationLine(): string {
  const location = process.env.NEXT_PUBLIC_DEFAULT_LOCATION ?? "Calamba, Laguna";
  const region = process.env.NEXT_PUBLIC_DEFAULT_REGION ?? "CALABARZON";
  return `Default na lokasyon kung walang binanggit: ${location} (rehiyong ${region}).`;
}

/**
 * Build the full system prompt: runtime preamble + core docs + the user-KB
 * chunks most relevant to `question`.
 */
export async function buildSystemPrompt(
  question = "",
  language: "fil" | "en" = "fil",
): Promise<string> {
  const [core, retrieved] = await Promise.all([
    loadKnowledge(),
    retrieveKnowledge(question).catch(() => []),
  ]);

  const retrievedBlock =
    retrieved.length > 0
      ? retrieved
          .map((chunk) => `--- [${chunk.file} › ${chunk.heading}] ---\n${chunk.text}`)
          .join("\n\n")
      : "(Walang tugmang dokumento para sa tanong na ito.)";

  return [
    "Ikaw si KlimaGuard, ang AI katuwang ng KlimaGuard PH. Sundin ang persona at mga patakaran sa ibaba.",
    defaultLocationLine(),
    language === "en"
      ? "LANGUAGE RULE (highest priority): The user selected ENGLISH in the app. Reply ONLY in clear, simple English (Filipino place names and terms like barangay are fine), even though the knowledge base below is partly in Filipino. Be brief (2–5 sentences or a short list) with one clear action."
      : "PANUNTUNAN SA WIKA (pinakamahalaga): Pinili ng user ang FILIPINO sa app. Sumagot sa casual na Filipino (Taglish OK), maikli (2–5 pangungusap o maikling listahan), at may isang malinaw na aksyon.",
    "Unahin ang mga datos mula sa knowledge base. Kung wala roon ang sagot, sabihin nang tapat at huwag mag-imbento ng numero, pangalan, o petsa.",
    "Kapag may emergency (bagyo, baha, lindol, sunog, may nasugatan): unahin ang kaligtasan at ibigay ang hotline 911 bago ang iba pang paliwanag.",
    "Kapag nagbanggit ng datos ng panahon, laging banggitin ang source (Open-Meteo o PAGASA).",
    "Gumamit ng simpleng Markdown lamang (bold, listahan). Huwag gumamit ng table.",
    "",
    "## CORE KNOWLEDGE",
    core,
    "",
    "## MGA KAUGNAY NA DOKUMENTO (knowledgeFiles)",
    retrievedBlock,
  ].join("\n");
}
