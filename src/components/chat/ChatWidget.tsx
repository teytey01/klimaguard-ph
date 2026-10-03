"use client";

import { useEffect, useRef, useState } from "react";

import MessageBubble from "@/components/chat/MessageBubble";
import SuggestionChip from "@/components/chat/SuggestionChip";
import TypingIndicator from "@/components/chat/TypingIndicator";
import { useLanguage } from "@/components/common";
import { CHAT_FALLBACK_MESSAGES, CHAT_GREETINGS } from "@/lib/constants";
import type {
  IChatHistoryTurn,
  IChatLanguage,
  IChatResponse,
  IMessage,
  ISuggestion,
} from "@/types";

/** How many prior turns to send with each question. */
const HISTORY_TURNS = 8;
const GREETING_ID = "greeting";

export interface IChatWidgetProps {
  /**
   * Extra classes for the outer card. The widget has a bounded default height
   * (it never grows with the conversation — messages scroll inside); pass a
   * height class (e.g. `h-full`) to override it inside a sized parent.
   */
  className?: string;
  /**
   * When the chat is opened on purpose (a dashboard tab), scroll the page so
   * the typing field is on screen. Off by default so pages that show chat
   * below other content (home) don't jump on load.
   */
  revealOnMount?: boolean;
}

const UI_TEXT: Record<
  IChatLanguage,
  { tagline: string; label: string; placeholder: string; send: string; suggestion: string; log: string }
> = {
  fil: {
    tagline: "Iyong kasama sa panahon at kaligtasan",
    label: "Magtanong kay KlimaGuard",
    placeholder: "Magtanong tungkol sa panahon...",
    send: "Ipadala",
    suggestion: "Kumusta ang panahon ngayon?",
    log: "Usapan kay KlimaGuard",
  },
  en: {
    tagline: "Your weather and safety companion",
    label: "Ask KlimaGuard",
    placeholder: "Ask about the weather...",
    send: "Send",
    suggestion: "How's the weather today?",
    log: "Conversation with KlimaGuard",
  },
};

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createMessage(
  role: IMessage["role"],
  content: string,
  embed?: IMessage["embed"],
  id: string = createId(),
): IMessage {
  return { id, role, content, createdAt: new Date(), embed };
}

export default function ChatWidget({ className, revealOnMount = false }: IChatWidgetProps) {
  const { language } = useLanguage();
  const text = UI_TEXT[language];

  const [messages, setMessages] = useState<IMessage[]>(() => [
    createMessage("agent", CHAT_GREETINGS.fil, undefined, GREETING_ID),
  ]);
  const [suggestion, setSuggestion] = useState<ISuggestion | undefined>({
    id: "initial-weather",
    label: UI_TEXT.fil.suggestion,
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Bring the typing field on screen when the chat is opened from a tab.
  useEffect(() => {
    if (!revealOnMount) {
      return;
    }
    const form = formRef.current;
    if (form && form.getBoundingClientRect().bottom > window.innerHeight) {
      form.scrollIntoView({ block: "end", behavior: "smooth" });
    }
    inputRef.current?.focus({ preventScroll: true });
  }, [revealOnMount]);

  // Follow the EN/FIL toggle at render time: the greeting and the starter chip
  // are re-localized; earlier replies stay in the language they were written.
  const shownMessages = messages.map((m) =>
    m.id === GREETING_ID ? { ...m, content: CHAT_GREETINGS[language] } : m,
  );
  const shownSuggestion =
    suggestion?.id === "initial-weather" ? { ...suggestion, label: text.suggestion } : suggestion;

  // Keep the latest message in view — scrolls ONLY the message list, never the page.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [messages, isLoading]);

  async function sendMessage(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed || isLoading) {
      return;
    }

    // Recent turns (excluding the greeting) so the AI keeps context.
    const history: IChatHistoryTurn[] = messages
      .filter((m) => m.id !== GREETING_ID)
      .slice(-HISTORY_TURNS)
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, createMessage("user", trimmed)]);
    setSuggestion(undefined);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history, language }),
      });

      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
      }

      const data = (await res.json()) as IChatResponse;
      setMessages((prev) => [...prev, createMessage("agent", data.reply, data.embed)]);
      setSuggestion(data.suggestion);
    } catch {
      setMessages((prev) => [...prev, createMessage("agent", CHAT_FALLBACK_MESSAGES[language])]);
    } finally {
      setIsLoading(false);
      // preventScroll: refocusing must not jump the page on mobile.
      inputRef.current?.focus({ preventScroll: true });
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  const isSendDisabled = isLoading || input.trim().length === 0;

  return (
    <div
      // Height fits the visible screen (minus the sticky alert banner/header)
      // so the typing field isn't pushed below the fold; capped at 620px.
      className={`flex h-[min(calc(100dvh-9rem),620px)] min-h-[360px] w-full flex-col overflow-hidden rounded-xl bg-navy ${
        className ?? ""
      }`}
    >
      <header className="shrink-0 border-b border-white/10 px-4 py-3">
        <h2 className="truncate text-lg font-semibold text-white">KlimaGuard PH</h2>
        <p className="truncate text-xs text-[#A0AEC0]">{text.tagline}</p>
      </header>

      {/* min-h-0 lets this flex child shrink so it scrolls instead of growing. */}
      <div
        ref={scrollRef}
        role="log"
        aria-live="polite"
        aria-label={text.log}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-3 py-4 sm:px-4"
      >
        {shownMessages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {isLoading ? <TypingIndicator /> : null}

        {!isLoading && shownSuggestion ? (
          <div className="flex justify-start pt-1">
            <SuggestionChip suggestion={shownSuggestion} onSelect={(s) => void sendMessage(s.label)} />
          </div>
        ) : null}
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="shrink-0 scroll-mb-4 border-t border-white/10 px-3 py-3 sm:px-4">
        <div className="flex items-center gap-2">
          <label htmlFor="chat-input" className="sr-only">
            {text.label}
          </label>
          <input
            id="chat-input"
            ref={inputRef}
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={text.placeholder}
            autoComplete="off"
            enterKeyHint="send"
            // text-base on mobile prevents iOS zoom-on-focus.
            className="min-h-[44px] min-w-0 flex-1 rounded-full bg-white px-4 py-2.5 text-base text-gray-800 placeholder:text-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal sm:text-sm"
          />
          <button
            type="submit"
            disabled={isSendDisabled}
            className="min-h-[44px] shrink-0 rounded-full bg-teal px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#319795] focus:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-50 sm:px-5"
          >
            {text.send}
          </button>
        </div>
      </form>
    </div>
  );
}
