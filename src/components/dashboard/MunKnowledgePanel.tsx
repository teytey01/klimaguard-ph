"use client";

import { Icon, useLanguage } from "@/components/common";
import { MUN_KNOWLEDGE_SOURCES } from "@/lib/dashboard/dashboardData";
import { MUN_BTN_SMALL } from "@/lib/dashboard/munUi";
import type { IMunModuleTab } from "@/types";
import MunSection from "./MunSection";

export interface IMunKnowledgePanelProps {
  onNavigate: (tab: IMunModuleTab) => void;
}

/** M9 Knowledge Base (background): source list + shortcut to KlimaChat. */
export default function MunKnowledgePanel({ onNavigate }: IMunKnowledgePanelProps) {
  const { t } = useLanguage();
  return (
    <MunSection title={t("mun.sec.kb")} icon="scroll" source="Pinagmulan: KlimaGuard knowledge base · Amazon Quick Spaces">
      <p className="text-sm text-cmd-heading">
        {t("mun.misc.bgActive")} — {t("mun.misc.kbNote")}
      </p>
      <ul className="mt-2 space-y-1">
        {MUN_KNOWLEDGE_SOURCES.map((s) => (
          <li key={s} className="flex items-center gap-2 rounded bg-cmd-tile px-3 py-2 text-sm text-cmd-heading">
            <span className="text-teal">
              <Icon name="check" size={14} />
            </span>
            {s}
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => onNavigate("m1")} className={`${MUN_BTN_SMALL} mt-3`}>
        <Icon name="broadcast" size={14} />
        {t("mun.action.ask")}
      </button>
    </MunSection>
  );
}
