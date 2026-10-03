// Presentational three-dot typing indicator shown while awaiting the agent.
// Rendered inside the client ChatWidget; no own interactivity.

export interface ITypingIndicatorProps {
  className?: string;
}

export default function TypingIndicator({ className }: ITypingIndicatorProps) {
  return (
    <div className={`flex justify-start ${className ?? ""}`}>
      <div
        className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-teal px-4 py-3"
        aria-label="Nagta-type si KlimaGuard"
        role="status"
      >
        <span className="h-2 w-2 animate-typing-dot rounded-full bg-white [animation-delay:0ms]" />
        <span className="h-2 w-2 animate-typing-dot rounded-full bg-white [animation-delay:150ms]" />
        <span className="h-2 w-2 animate-typing-dot rounded-full bg-white [animation-delay:300ms]" />
      </div>
    </div>
  );
}
