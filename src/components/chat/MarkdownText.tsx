import type { ReactNode } from "react";

export interface IMarkdownTextProps {
  text: string;
  className?: string;
}

/** Render inline **bold** / *italic* as React nodes (no HTML injection). */
function renderInline(line: string, keyPrefix: string): ReactNode[] {
  const parts = line.split(/(\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g);
  return parts
    .filter((part) => part.length > 0)
    .map((part, index) => {
      const key = `${keyPrefix}-${index}`;
      if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
        return <strong key={key}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
        return <em key={key}>{part.slice(1, -1)}</em>;
      }
      return <span key={key}>{part}</span>;
    });
}

/**
 * Minimal, safe Markdown for chat replies: paragraphs, `-`/`*`/`•` bullets,
 * `1.` numbered items, `#` headings (rendered as bold lines), and inline bold
 * and italic. Everything is plain React text, so model output can't inject HTML.
 */
export default function MarkdownText({ text, className }: IMarkdownTextProps) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");

  return (
    <div className={`space-y-1 break-words text-sm leading-relaxed ${className ?? ""}`}>
      {lines.map((raw, index) => {
        const key = `l${index}`;
        const line = raw.trimEnd();
        if (line.trim().length === 0) {
          return <div key={key} className="h-1" aria-hidden="true" />;
        }

        const heading = /^#{1,6}\s+(.*)$/.exec(line.trim());
        if (heading) {
          return (
            <p key={key} className="font-semibold">
              {renderInline(heading[1].replace(/\*\*/g, ""), key)}
            </p>
          );
        }

        const bullet = /^\s*[-*•]\s+(.*)$/.exec(line);
        if (bullet) {
          return (
            <p key={key} className="flex gap-2 pl-1">
              <span aria-hidden="true">•</span>
              <span>{renderInline(bullet[1], key)}</span>
            </p>
          );
        }

        const numbered = /^\s*(\d+)[.)]\s+(.*)$/.exec(line);
        if (numbered) {
          return (
            <p key={key} className="flex gap-2 pl-1">
              <span className="font-semibold">{numbered[1]}.</span>
              <span>{renderInline(numbered[2], key)}</span>
            </p>
          );
        }

        return <p key={key}>{renderInline(line, key)}</p>;
      })}
    </div>
  );
}
