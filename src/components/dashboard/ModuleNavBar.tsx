"use client";

import { useState } from "react";
import type { IModuleNavItem } from "@/types";
import Icon from "@/components/common/Icon";

export interface IModuleNavBarProps {
  modules: IModuleNavItem[];
  /** Called when a module tab is activated. */
  onSelect?: (moduleId: string) => void;
  /** Controlled active tab id. When omitted, the bar tracks it internally. */
  activeId?: string;
  /** Hide the "M#" id prefix (labels already carry it). */
  hideIds?: boolean;
  /** Accessible label for the nav landmark. */
  ariaLabel?: string;
}

function tabClasses(item: IModuleNavItem, isActive: boolean): string {
  if (isActive) {
    return "bg-cmd-accent text-cmd-accent-text";
  }
  if (item.kind === "planning") {
    return "bg-cmd-planning text-cmd-planning-text hover:opacity-90";
  }
  return "bg-cmd-tile text-cmd-heading hover:opacity-90";
}

/**
 * The full 11-module municipal navigation bar (Figma node 8:33). Horizontally
 * scrollable on narrow viewports (mobile-first); the active tab is amber,
 * planning modules (M6/M7/M10) are brown, operations modules are slate.
 * Client component — tracks the active tab locally.
 */
export default function ModuleNavBar({
  modules,
  onSelect,
  activeId: controlledId,
  hideIds = false,
  ariaLabel = "Nabigasyon ng mga module ng munisipyo",
}: IModuleNavBarProps) {
  const initial = modules.find((m) => m.active)?.id ?? modules[0]?.id ?? "";
  const [internalId, setInternalId] = useState(initial);
  const activeId = controlledId ?? internalId;

  function handleSelect(moduleId: string): void {
    setInternalId(moduleId);
    onSelect?.(moduleId);
  }

  return (
    <nav
      aria-label={ariaLabel}
      className="rounded-xl bg-cmd-surface p-4 shadow-sm print:hidden"
    >
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="shrink-0 px-2 text-xs font-bold uppercase tracking-wide text-cmd-muted">
          Mga Module:
        </span>
        <ul className="flex items-center gap-2">
          {modules.map((item) => {
            const isActive = item.id === activeId;
            return (
              <li key={item.id} className="shrink-0">
                <button
                  type="button"
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => handleSelect(item.id)}
                  className={`flex min-h-[44px] items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold whitespace-nowrap transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cmd-accent ${tabClasses(item, isActive)}`}
                >
                  <Icon name={item.icon} size={14} />
                  {hideIds ? item.label : `${item.id} ${item.label}`}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
