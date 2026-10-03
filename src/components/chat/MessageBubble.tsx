import EmbedCard from "@/components/chat/EmbedCard";
import MarkdownText from "@/components/chat/MarkdownText";
import type { IMessage } from "@/types";

export interface IMessageBubbleProps {
  message: IMessage;
}

export default function MessageBubble({ message }: IMessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex items-end gap-2 ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      {!isUser ? (
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal text-xs font-bold text-white"
          aria-hidden="true"
        >
          KG
        </div>
      ) : null}
      <div className="max-w-[85%] md:max-w-[75%]">
        <div
          className={`rounded-2xl px-4 py-2.5 ${
            isUser
              ? "rounded-br-sm bg-card text-text"
              : "rounded-bl-sm bg-teal text-white"
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
              {message.content}
            </p>
          ) : (
            <MarkdownText text={message.content} />
          )}
        </div>
        {message.embed ? <EmbedCard embed={message.embed} /> : null}
      </div>
    </div>
  );
}
