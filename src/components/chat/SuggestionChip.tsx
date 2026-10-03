import type { ISuggestion } from "@/types";

export interface ISuggestionChipProps {
  suggestion: ISuggestion;
  onSelect: (suggestion: ISuggestion) => void;
}

export default function SuggestionChip({
  suggestion,
  onSelect,
}: ISuggestionChipProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(suggestion)}
      className="rounded-full border border-teal bg-transparent px-4 py-1.5 text-sm font-medium text-teal transition-colors hover:bg-teal hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
    >
      {suggestion.label}
    </button>
  );
}
