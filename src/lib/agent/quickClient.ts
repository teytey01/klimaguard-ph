// Server-only KlimaChat agent.
//
// Flow per message:
// 1. EMERGENCY check first — if the user describes an active emergency, return
//    a deterministic, action-first reply with hotlines immediately (no LLM
//    call, no latency). Safety overrides everything.
// 2. Otherwise, if GROQ_API_KEY is set, ask Groq with the persona + core KB +
//    the knowledgeFiles/ chunks most relevant to the question + recent history.
// 3. If Groq is unconfigured or fails, fall back to deterministic demo replies
//    so the chat never breaks.
// Every reply (LLM and fallback) follows the user's EN/FIL language choice.
// MUST NOT be imported by client components.

import { generateReply, isGroqConfigured } from "@/lib/agent/groqClient";
import { buildSystemPrompt } from "@/lib/agent/knowledgeBase";
import { buildCropAdvisoryById, DEMO_ADVISORY_INPUT } from "@/lib/agriculture";
import { getPagasaTenDayDays, PAGASA_TENDAY_META } from "@/lib/api/pagasaTenDay";
import { CHAT_FALLBACK_MESSAGES } from "@/lib/constants";
import {
  findBarangayInText,
  getLocalProjects,
  localProjectsDigest,
  toLocalProjectsEmbed,
} from "@/lib/transparency";
import type {
  IChatHistoryTurn,
  IChatLanguage,
  IChatResponse,
  IMessageEmbed,
  ISuggestion,
} from "@/types";

/** Max prior turns forwarded to the LLM (keeps the prompt small/fast). */
const MAX_HISTORY_TURNS = 8;
const MAX_TURN_CHARS = 1200;

// Phrases that signal an ACTIVE emergency → bypass normal flow (FIL + EN).
const EMERGENCY_KEYWORDS = [
  "saklolo",
  "tulungan nyo",
  "tulungan niyo",
  "tulong po",
  "emergency",
  "nalulunod",
  "lumulubog",
  "naiipit",
  "na-trap",
  "trapped",
  "stranded",
  "sunog",
  "nasusunog",
  "lindol ngayon",
  "gumuho",
  "landslide",
  "nasugatan",
  "sugatan",
  "walang malay",
  "hindi makahinga",
  "baha na sa loob",
  "pataas ang baha",
  "tumataas ang tubig",
  "rescue",
  "drowning",
  "on fire",
  "injured",
  "unconscious",
  "can't breathe",
  "cannot breathe",
  "water is rising",
  "flood inside",
];

function isEmergency(text: string): boolean {
  return EMERGENCY_KEYWORDS.some((kw) => text.includes(kw));
}

function buildEmergencyReply(lang: IChatLanguage): IChatResponse {
  const en = lang === "en";
  return {
    reply: (en
      ? [
          "🚨 **Your safety comes first right now.**",
          "1. **Call 911 immediately** (or Red Cross 143).",
          "2. Move away from danger — go to higher ground if flooding, get outside if there's a fire.",
          "3. Give your exact location (barangay, street, landmark).",
          "4. Stay with your family and wait for rescuers.",
        ]
      : [
          "🚨 **Unahin ang kaligtasan mo ngayon.**",
          "1. **Tumawag agad sa 911** (o Red Cross 143).",
          "2. Lumayo sa panganib — umakyat sa mataas na lugar kung baha, lumabas kung sunog.",
          "3. Sabihin ang eksaktong lokasyon mo (barangay, kalye, palatandaan).",
          "4. Manatili kasama ang pamilya at hintayin ang rescuer.",
        ]
    ).join("\n"),
    suggestion: {
      id: "ask-evac",
      label: en ? "Where is the nearest evacuation center?" : "Saan ang pinakamalapit na evacuation center?",
    },
    embed: {
      kind: "alert",
      data: {
        title: en ? "Emergency — Call 911" : "Emergency — Tumawag sa 911",
        message: "NDRRMC: (02) 8911-1406 · Red Cross: 143 · Emergency: 911",
        severity: "emergency",
        source: "NDRRMC",
      },
    },
  };
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
  "crop",
  "planting",
  "harvest",
];

const TRANSPARENCY_KEYWORDS = [
  "drrm",
  "pondo",
  "budget",
  "badyet",
  "funds",
  "napunta",
  "proyekto",
  "project",
  "contractor",
  "kontratista",
  "transparency",
  "dike",
  "drainage",
  "evacuation center",
  "coa",
  "dbm",
];

const WEATHER_KEYWORDS = ["panahon", "ulan", "weather", "init", "bagyo", "rain", "typhoon", "forecast", "hot"];

/** Pick the most relevant PH crop id from the message text. */
function pickCropId(text: string): string {
  if (text.includes("niyog") || text.includes("coconut")) {
    return "niyog";
  }
  if (text.includes("gabi") || text.includes("taro")) {
    return "gabi";
  }
  if (text.includes("kamote") || text.includes("gulay") || text.includes("vegetable")) {
    return "kamote";
  }
  return "palay";
}

type IChatIntent = "weather" | "agri" | "transparency" | "general";

function detectIntent(text: string): IChatIntent {
  if (TRANSPARENCY_KEYWORDS.some((kw) => text.includes(kw))) {
    return "transparency";
  }
  if (WEATHER_KEYWORDS.some((kw) => text.includes(kw))) {
    return "weather";
  }
  if (AGRI_KEYWORDS.some((kw) => text.includes(kw))) {
    return "agri";
  }
  return "general";
}

const SUGGESTIONS: Record<IChatIntent, Record<IChatLanguage, ISuggestion>> = {
  weather: {
    fil: { id: "ask-forecast", label: "Ano ang forecast bukas?" },
    en: { id: "ask-forecast", label: "What's the forecast tomorrow?" },
  },
  agri: {
    fil: { id: "ask-planting", label: "Okay bang magtanim ng palay ngayon?" },
    en: { id: "ask-planting", label: "Is it a good time to plant rice?" },
  },
  transparency: {
    fil: { id: "ask-delayed", label: "Aling proyekto ang naantala?" },
    en: { id: "ask-delayed", label: "Which projects are delayed?" },
  },
  general: {
    fil: { id: "ask-weather", label: "Kumusta ang panahon ngayon?" },
    en: { id: "ask-weather", label: "How's the weather today?" },
  },
};

/** Inline embed card matching the message intent (undefined for general). */
function embedForMessage(text: string, intent: IChatIntent, lang: IChatLanguage): IMessageEmbed | undefined {
  if (intent === "weather") {
    return {
      kind: "weather",
      data: {
        location: "Calamba, Laguna",
        summary: lang === "en" ? "Sunny with passing clouds" : "Maaraw na may pana-panahong ulap",
        temperatureC: 31,
        source: "Open-Meteo",
      },
    };
  }

  if (intent === "agri") {
    const advisory = buildCropAdvisoryById(pickCropId(text), DEMO_ADVISORY_INPUT);
    return {
      kind: "crop",
      data: {
        crop: advisory.crop,
        advice: `${advisory.suitabilityLabel} — ${advisory.action}`,
        source: advisory.source,
      },
    };
  }

  if (intent === "transparency") {
    return { kind: "transparency", data: toLocalProjectsEmbed(findBarangayInText(text)) };
  }

  return undefined;
}

/** Deterministic replies — used when Groq is unconfigured/failing. */
function buildReply(message: string, lang: IChatLanguage): IChatResponse {
  const text = message.trim().toLowerCase();
  const intent = detectIntent(text);
  const en = lang === "en";

  let reply: string;
  switch (intent) {
    case "weather":
      reply = en
        ? "Here's the weather in Calamba, Laguna right now (source: Open-Meteo). Bring an umbrella just in case! 🌤️"
        : "Narito ang panahon sa Calamba, Laguna ngayon (source: Open-Meteo). Maghanda pa rin ng payong! 🌤️";
      break;
    case "agri": {
      const advisory = buildCropAdvisoryById(pickCropId(text), DEMO_ADVISORY_INPUT);
      // Advisory rule text is authored in Filipino; English mode gets a short
      // English lead-in plus the card.
      reply = en
        ? `${advisory.emoji} Here's today's advisory for ${advisory.crop} — see the card below. Check the forecast before planting or spraying.`
        : `${advisory.emoji} ${advisory.crop}: ${advisory.suitabilityLabel} — ${advisory.action} ${advisory.planting.message}`;
      break;
    }
    case "transparency": {
      const barangay = findBarangayInText(text);
      const data = getLocalProjects({ barangay });
      const place = barangay ? `Brgy. ${barangay}` : `${data.municipality}, ${data.province}`;
      const names = data.projects
        .slice(0, 3)
        .map((p) => `• ${p.name} (${p.progressPct}%)`)
        .join("\n");
      // Figures only — no political commentary (G03).
      reply = en
        ? `There are ${data.projects.length} climate/DRRM projects in ${place} (demo data):\n${names}\nSee each project in Transparency. 📊`
        : `May ${data.projects.length} climate/DRRM na proyekto sa ${place} (halimbawang datos):\n${names}\nTingnan ang bawat proyekto sa Transparency. 📊`;
      break;
    }
    default:
      reply = en
        ? "I'm here to help with weather, hazard alerts, farming advice, and LGU projects. What would you like to know? 🌦️"
        : "Nandito ako para tumulong sa panahon, babala sa panganib, payo sa pagsasaka, at mga proyekto ng LGU. Ano ang gusto mong malaman? 🌦️";
  }

  return { reply, suggestion: SUGGESTIONS[intent][lang], embed: embedForMessage(text, intent, lang) };
}

/** Keep only well-formed, recent, size-capped history turns. */
function sanitizeHistory(history: unknown): IChatHistoryTurn[] {
  if (!Array.isArray(history)) {
    return [];
  }
  return history
    .filter(
      (turn): turn is IChatHistoryTurn =>
        typeof turn === "object" &&
        turn !== null &&
        ((turn as IChatHistoryTurn).role === "user" ||
          (turn as IChatHistoryTurn).role === "agent") &&
        typeof (turn as IChatHistoryTurn).content === "string",
    )
    .slice(-MAX_HISTORY_TURNS)
    .map((turn) => ({ role: turn.role, content: turn.content.slice(0, MAX_TURN_CHARS) }));
}

/** Compact PAGASA TenDay table for the default location (Calamba). */
function tenDayDigest(): string {
  const days = getPagasaTenDayDays({ lat: 14.2117, lon: 121.1653 });
  if (days.length === 0) {
    return "## 10-DAY FORECAST\n(Walang valid na PAGASA TenDay ngayon — sabihing tingnan ang weather card; huwag mag-imbento ng numero.)";
  }
  const rows = days.map(
    (d) =>
      `- ${d.date}: ${d.rainfallDesc}, ${d.cloudDesc}; ${d.lowC}–${d.highC}°C (mean ${d.meanC}°C); ulan ${d.rainfallMm} mm/day; humidity ${d.humidity}%; hangin ${d.windMs} m/s`,
  );
  return [
    `## 10-DAY FORECAST — PAGASA 10-Day Climate Forecast, ${PAGASA_TENDAY_META.location} (issued ${PAGASA_TENDAY_META.issued}, valid until ${PAGASA_TENDAY_META.validUntil}, ${PAGASA_TENDAY_META.model})`,
    "Gamitin ang mga numerong ito para sa forecast at banggitin ang source na \"PAGASA TenDay\". mm/day = dami ng ulan, hindi tsansa.",
    ...rows,
  ].join("\n");
}

/** Normalize an untrusted language value; Filipino is the default. */
export function toChatLanguage(value: unknown): IChatLanguage {
  return value === "en" ? "en" : "fil";
}

/** Ask the KlimaGuard agent. Never throws. */
export async function askKlimaAgent(
  message: string,
  history: unknown = [],
  language: IChatLanguage = "fil",
): Promise<IChatResponse> {
  const text = message.trim().toLowerCase();

  // 1. Safety overrides everything.
  if (isEmergency(text)) {
    return buildEmergencyReply(language);
  }

  // 2. No key → deterministic demo replies, no network call.
  if (!isGroqConfigured()) {
    return buildReply(message, language);
  }

  try {
    const intent = detectIntent(text);
    const basePrompt = await buildSystemPrompt(message, language);
    // Give the model the live project list when the question is about funds.
    // Ground weather/farm answers in the PAGASA TenDay figures (not guesses).
    const systemPrompt =
      intent === "transparency"
        ? `${basePrompt}\n\n## LOKAL NA PROYEKTO\n${localProjectsDigest()}`
        : intent === "weather" || intent === "agri"
          ? `${basePrompt}\n\n${tenDayDigest()}`
          : basePrompt;

    const reply = await generateReply(systemPrompt, message, sanitizeHistory(history));

    // Groq failed/empty → keep the chat useful with the deterministic reply.
    if (reply === null) {
      return buildReply(message, language);
    }

    return {
      reply,
      suggestion: SUGGESTIONS[intent][language],
      embed: embedForMessage(text, intent, language),
    };
  } catch {
    return { reply: CHAT_FALLBACK_MESSAGES[language] };
  }
}
