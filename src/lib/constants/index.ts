// shared constants

import type { IChatLanguage } from "@/types";

/** Fallback shown when the agent cannot answer, per UI language. */
export const CHAT_FALLBACK_MESSAGES: Record<IChatLanguage, string> = {
  fil: "Pasensya na, hindi ko pa nakukuha ang data. I-try ulit mamaya!",
  en: "Sorry, I couldn't get the data right now. Please try again later!",
};

/** Agent greeting shown on first load, per UI language. */
export const CHAT_GREETINGS: Record<IChatLanguage, string> = {
  fil: "Kumusta! Ako si KlimaGuard 🌤️ Anong gusto mong malaman ngayon?",
  en: "Hi! I'm KlimaGuard 🌤️ What would you like to know today?",
};

/** Filipino-first defaults (kept for existing imports). */
export const CHAT_FALLBACK_MESSAGE = CHAT_FALLBACK_MESSAGES.fil;
export const CHAT_GREETING = CHAT_GREETINGS.fil;
