// Server-only Amazon Quick chat agent client.
//
// This module reads server-only env vars and (when configured) will make a
// SigV4-signed server-side AWS request. It MUST NOT be imported by any client
// component — only the /api/chat route handler imports it. No `'use client'`.

import { buildCropAdvisoryById, DEMO_ADVISORY_INPUT } from "@/lib/agriculture";
import { CHAT_FALLBACK_MESSAGE } from "@/lib/constants";
import {
  getTransparencyData,
  toTransparencyEmbed,
} from "@/lib/transparency";
import type { IChatResponse } from "@/types";

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

/**
 * Deterministic Filipino-persona replies — the current demo path used while
 * no Amazon Quick endpoint/credentials are configured. Moved here verbatim
 * from the route handler.
 */
function buildReply(message: string): IChatResponse {
  const text = message.trim().toLowerCase();
  const isWeatherQuestion =
    text.includes("panahon") ||
    text.includes("ulan") ||
    text.includes("weather") ||
    text.includes("init") ||
    text.includes("bagyo");

  if (isWeatherQuestion) {
    return {
      reply:
        "Narito ang panahon sa Calamba, Laguna ngayon. Maghanda pa rin ng payong! 🌤️",
      suggestion: {
        id: "ask-forecast",
        label: "Ano ang forecast bukas?",
      },
      embed: {
        kind: "weather",
        data: {
          location: "Calamba, Laguna",
          summary: "Maaraw na may pana-panahong ulap",
          temperatureC: 31,
          source: "Open-Meteo",
        },
      },
    };
  }

  // Silent Farmer-context detection (M5). Builds an advisory from the
  // deterministic offline seed (buildReply is synchronous, no live weather)
  // and attaches it to the existing `crop` embed so EmbedCard keeps working.
  const isAgriQuestion = AGRI_KEYWORDS.some((kw) => text.includes(kw));
  if (isAgriQuestion) {
    const advisory = buildCropAdvisoryById(pickCropId(text), DEMO_ADVISORY_INPUT);
    const advice = `${advisory.suitabilityLabel} — ${advisory.action}`;
    return {
      reply: `${advisory.emoji} ${advisory.crop}: ${advice} ${advisory.planting.message}`,
      suggestion: {
        id: "ask-planting",
        label: "Okay bang magtanim ng palay ngayon?",
      },
      embed: {
        kind: "crop",
        data: {
          crop: advisory.crop,
          advice,
          source: advisory.source,
        },
      },
    };
  }

  const isTransparencyQuestion =
    text.includes("drrm") ||
    text.includes("pondo") ||
    text.includes("budget") ||
    text.includes("badyet") ||
    text.includes("funds") ||
    text.includes("napunta") ||
    text.includes("coa") ||
    text.includes("dbm");

  if (isTransparencyQuestion) {
    const province = detectProvince(text) ?? "Leyte";
    const data = getTransparencyData(province);
    const embedData = toTransparencyEmbed(data);

    const isComparison =
      text.includes(" vs ") ||
      text.includes("versus") ||
      // two distinct known provinces mentioned
      TRANSPARENCY_PROVINCES.filter((p) => text.includes(p)).length >= 2;

    // TODO(M11): a full dual-province comparison embed is not implemented yet.
    // For now we acknowledge the comparison in the reply and return a single
    // province embed. Figures only — no political commentary (G03).
    const reply = isComparison
      ? `Narito muna ang DRRM pondo ng ${data.province}. Para sa paghahambing ng dalawang probinsya, tingnan ang BudgetTracker sa Transparency. 📊`
      : `Narito ang DRRM pondo ng ${data.province}. Nakalaan at nagastos ayon sa opisyal na datos. 📊`;

    return {
      reply,
      suggestion: {
        id: "ask-drrm-category",
        label: "Saan napunta ang pondo kada kategorya?",
      },
      embed: {
        kind: "transparency",
        data: embedData,
      },
    };
  }

  return {
    reply:
      "Nandito ako para tumulong sa panahon, babala sa panganib, at payo sa pagsasaka. Ano ang gusto mong malaman? 🌦️",
    suggestion: {
      id: "ask-weather",
      label: "Kumusta ang panahon ngayon?",
    },
  };
}

/**
 * Ask the KlimaGuard agent. When Amazon Quick is not configured (blank env),
 * returns the deterministic demo replies above. When configured, this is where
 * the real server-side Amazon Quick call goes.
 */
export async function askKlimaAgent(message: string): Promise<IChatResponse> {
  const endpoint = process.env.QUICK_AGENT_ENDPOINT ?? "";
  const agentId = process.env.QUICK_AGENT_ID ?? "";
  const region = process.env.AWS_REGION ?? "";

  const isConfigured =
    endpoint.length > 0 && agentId.length > 0 && region.length > 0;

  if (!isConfigured) {
    // Demo path: no AWS call, deterministic Filipino replies.
    return buildReply(message);
  }

  try {
    // TODO(Amazon Quick): make the real server-side call here. This MUST be a
    // SigV4-signed AWS request executed on the server using credentials from
    // the server-only env vars above — no secret, token, or signature may ever
    // be exposed to the client. Build the request against `endpoint` for
    // `agentId` in `region`, send `message`, and map the response into an
    // IChatResponse (reply + optional suggestion/embed). SigV4 is intentionally
    // not implemented yet; until it is, fall through to the fallback below.
    return { reply: CHAT_FALLBACK_MESSAGE };
  } catch {
    // Any failure in the real-call path degrades gracefully to Filipino text.
    return { reply: CHAT_FALLBACK_MESSAGE };
  }
}
