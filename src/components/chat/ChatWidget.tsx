"use client";

import { useEffect, useRef, useState } from "react";

import MessageBubble from "@/components/chat/MessageBubble";
import SuggestionChip from "@/components/chat/SuggestionChip";
import TypingIndicator from "@/components/chat/TypingIndicator";
import { ThemeToggle } from "@/components/common";
import { CHAT_FALLBACK_MESSAGE, CHAT_GREETING } from "@/lib/constants";
import type { IChatResponse, IMessage, ISuggestion } from "@/types";

export interface IChatWidgetProps {
  className?: string;
}

const INITIAL_SUGGESTION: ISuggestion = {
  id: "initial-weather",
  label: "Kumusta ang panahon ngayon?",
};

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createMessage(
  role: IMessage["role"],
  content: string,
  embed?: IMessage["embed"],
): IMessage {
  return { id: createId(), role, content, createdAt: new Date(), embed };
}

export default function ChatWidget({ className }: IChatWidgetProps) {
  const [messages, setMessages] = useState<IMessage[]>(() => [
    createMessage("agent", CHAT_GREETING),
  ]);
  const [suggestion, setSuggestion] = useState<ISuggestion | undefined>(
    INITIAL_SUGGESTION,
  );
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isLoading]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isLoading) {
      return;
    }

    setMessages((prev) => [...prev, createMessage("user", trimmed)]);
    setSuggestion(undefined);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });

      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
      }

      const data = (await res.json()) as IChatResponse;
      setMessages((prev) => [
        ...prev,
        createMessage("agent", data.reply, data.embed),
      ]);
      setSuggestion(data.suggestion);
    } catch {
      setMessages((prev) => [
        ...prev,
        createMessage("agent", CHAT_FALLBACK_MESSAGE),
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  function handleSuggestionSelect(selected: ISuggestion) {
    void sendMessage(selected.label);
  }

  const isSendDisabled = isLoading || input.trim().length === 0;

  return (
    <div
      className={`flex h-full w-full flex-col bg-navy md:w-[60%] md:max-w-[60%] ${
        className ?? ""
      }`}
    >
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-white">KlimaGuard PH</h1>
          <p className="text-xs text-[#A0AEC0]">
            Iyong kasama sa panahon at kaligtasan
          </p>
        </div>
        <ThemeToggle />
      </header>

      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
      >
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {isLoading ? <TypingIndicator /> : null}

        {!isLoading && suggestion ? (
          <div className="flex justify-start pt-1">
            <SuggestionChip
              suggestion={suggestion}
              onSelect={handleSuggestionSelect}
            />
          </div>
        ) : null}
      </div>

      <form
        onSubmit={handleSubmit}
        className="shrink-0 border-t border-white/10 px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <label htmlFor="chat-input" className="sr-only">
            Magtanong kay KlimaGuard
          </label>
          <input
            id="chat-input"
            ref={inputRef}
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Magtanong tungkol sa panahon..."
            autoComplete="off"
            className="flex-1 rounded-full bg-white px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal"
          />
          <button
            type="submit"
            disabled={isSendDisabled}
            className="rounded-full bg-teal px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#319795] focus:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Ipadala
          </button>
        </div>
      </form>
    </div>
  );
}
