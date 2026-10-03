// Server-only Amazon Quick chat agent client.
//
// This module reads server-only env vars and (when configured) will make a
// SigV4-signed server-side AWS request. It MUST NOT be imported by any client
// component — only the /api/chat route handler imports it. No `'use client'`.

import { generateReply, isGeminiConfigured } from "@/lib/agent/geminiClient";
import { buildSystemPrompt } from "@/lib/agent/knowledgeBase";
import { buildCropAdvisoryById, DEMO_ADVISORY_INPUT } from "@/lib/agriculture";
import { CHAT_FALLBACK_MESSAGE } from "@/lib/constants";
import {
  getTransparencyData,
  toTransparencyEmbed,
} from "@/lib/transparency";
import type { IChatResponse, IMessageEmbed, ISuggestion } from "@/types";

/** Known demo provinces we can resolve a DRRM dataset for. */
const TRANSPARENCY_PROVINCES = ["leyte", "samar"] as const;

/** Pick the first known province mentioned in the message, if any. */
function detectProvince(text: string): string | undefined {
  return TRANSPARENCY_PROVINCES.find((province) => text.includes(province));
}

// Agri keywords that silently activate the Farmer context (M5).
const AGRI_KEYWORDS = [
  "palay",
  "bigas",
  "tanim",
  "magtanim",
  "ani",
  "saka",
  "bukid",
  "niyog",
  "coconut",
  "gulay",
  "pananim",
  "peste",
  "pest",
  "rice",
  "farm",
  "planting",
  "harvest",
];

/** Pick the most relevant PH crop id from the message text. */
function pickCropId(text: string): string {
  if (text.includes("niyog") || text.includes("coconut")) {
    return "niyog";
  }
  if (text.includes("gabi")) {
    return "gabi";
  }
  if (text.includes("kamote") || text.includes("gulay")) {
    return "kamote";
  }
  return "palay";
}

/** Classify a message into one of the KlimaGuard intents (keyword-based). */
type IChatIntent = "weather" | "agri" | "transparency" | "general";

function detectIntent(text: string): IChatIntent {
  if (
    text.includes("panahon") ||
    text.includes("ulan") ||
    text.includes("weather") ||
    text.includes("init") ||
    text.includes("bagyo")
  ) {
    return "weather";
  }
  if (AGRI_KEYWORDS.some((kw) => text.includes(kw))) {
    return "agri";
  }
  if (
    text.includes("drrm") ||
    text.includes("pondo") ||
    text.includes("budget") ||
    text.includes("badyet") ||
    text.includes("funds") ||
    text.includes("napunta") ||
    text.includes("coa") ||
    text.includes("dbm")
  ) {
    return "transparency";
  }
  return "general";
}

/** The tappable suggestion ("One Action") that fits each intent. */
function suggestionForIntent(intent: IChatIntent): ISuggestion {
  switch (intent) {
    case "weather":
      return { id: "ask-forecast", label: "Ano ang forecast bukas?" };
    case "agri":
      return { id: "ask-planting", label: "Okay bang magtanim ng palay ngayon?" };
    case "transparency":
      return {
        id: "ask-drrm-category",
        label: "Saan napunta ang pondo kada kategorya?",
      };
    default:
      return { id: "ask-weather", label: "Kumusta ang panahon ngayon?" };
  }
}

/**
 * Build the inline embed card that matches a message's intent, reusing the
 * same deterministic seed data as the demo path. Returns undefined for the
 * general intent (no card). Shared by the demo and the live-LLM paths so the
 * weather/crop/transparency cards appear regardless of who wrote the reply.
 */
function embedForMessage(
  text: string,
  intent: IChatIntent,
): IMessageEmbed | undefined {
  if (intent === "weather") {
    return {
      kind: "weather",
      data: {
        location: "Calamba, Laguna",
        summary: "Maaraw na may pana-panahong ulap",
        temperatureC: 31,
        source: "Open-Meteo",
      },
    };
  }

  if (intent === "agri") {
    const advisory = buildCropAdvisoryById(pickCropId(text), DEMO_ADVISORY_INPUT);
    const advice = `${advisory.suitabilityLabel} — ${advisory.action}`;
    return {
      kind: "crop",
      data: { crop: advisory.crop, advice, source: advisory.source },
    };
  }

  if (intent === "transparency") {
    const province = detectProvince(text) ?? "Leyte";
    return { kind: "transparency", data: toTransparencyEmbed(getTransparencyData(province)) };
  }

  return undefined;
}

/**
 * Deterministic Filipino-persona replies — the demo path used while no LLM
 * key is configured. Builds the reply text, then attaches the shared
 * suggestion/embed for the detected intent.
 */
function buildReply(message: string): IChatResponse {
  const text = message.trim().toLowerCase();
  const intent = detectIntent(text);

  let reply: string;
  switch (intent) {
    case "weather":
      reply =
        "Narito ang panahon sa Calamba, Laguna ngayon. Maghanda pa rin ng payong! 🌤️";
      break;
    case "agri": {
      const advisory = buildCropAdvisoryById(pickCropId(text), DEMO_ADVISORY_INPUT);
      const advice = `${advisory.suitabilityLabel} — ${advisory.action}`;
      reply = `${advisory.emoji} ${advisory.crop}: ${advice} ${advisory.planting.message}`;
      break;
    }
    case "transparency": {
      const province = detectProvince(text) ?? "Leyte";
      const data = getTransparencyData(province);
      const isComparison =
        text.includes(" vs ") ||
        text.includes("versus") ||
        TRANSPARENCY_PROVINCES.filter((p) => text.includes(p)).length >= 2;
      // Figures only — no political commentary (G03).
      reply = isComparison
        ? `Narito muna ang DRRM pondo ng ${data.province}. Para sa paghahambing ng dalawang probinsya, tingnan ang BudgetTracker sa Transparency. 📊`
        : `Narito ang DRRM pondo ng ${data.province}. Nakalaan at nagastos ayon sa opisyal na datos. 📊`;
      break;
    }
    default:
      reply =
        "Nandito ako para tumulong sa panahon, babala sa panganib, at payo sa pagsasaka. Ano ang gusto mong malaman? 🌦️";
  }

  return {
    reply,
    suggestion: suggestionForIntent(intent),
    embed: embedForMessage(text, intent),
  };
}

/**
 * Ask the KlimaGuard agent.
 *
 * When a Gemini API key is configured, the reply text is generated by the LLM
 * using the Filipino persona + knowledge base (see geminiClient / knowledgeBase).
 * The keyword-based intent detection still runs to attach the matching inline
 * embed card and the "One Action" suggestion, so the weather/crop/transparency
 * cards keep working. When the LLM is unconfigured — or any call fails — the
 * deterministic Filipino demo replies are used, so the chat never breaks.
 */
export async function askKlimaAgent(message: string): Promise<IChatResponse> {
  // No key: deterministic Filipino demo replies, no network call.
  if (!isGeminiConfigured()) {
    return buildReply(message);
  }

  try {
    const systemPrompt = await buildSystemPrompt();
    const reply = await generateReply(systemPrompt, message);

    // Empty/blocked/failed LLM response → graceful Filipino fallback.
    if (reply === null) {
      return { reply: CHAT_FALLBACK_MESSAGE };
    }

    // Pair the LLM's intelligent reply with the matching card + suggestion.
    const text = message.trim().toLowerCase();
    const intent = detectIntent(text);
    return {
      reply,
      suggestion: suggestionForIntent(intent),
      embed: embedForMessage(text, intent),
    };
  } catch {
    // Any unexpected failure degrades gracefully to Filipino text.
    return { reply: CHAT_FALLBACK_MESSAGE };
  }
}
