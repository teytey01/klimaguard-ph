"use client";

import { useLanguage } from "@/components/common";
import SmsBroadcastLog from "@/components/common/SmsBroadcastLog";
import { ChatWidget } from "@/components/chat";
import type { ITranslationKey } from "@/lib/i18n";
import { MUN_SOURCE } from "@/lib/dashboard/dashboardData";
import { pendingDeadlines, reportCounts } from "@/lib/dashboard/municipalSelectors";
import { MUN_CHIP, MUN_TONE_CHIP } from "@/lib/dashboard/munUi";
import { useMunicipalStore } from "@/lib/dashboard/useMunicipalStore";
import MunSection from "./MunSection";

export type IMunChatPanelProps = Record<string, never>;

const NOTIFS: ITranslationKey[] = [
  "mun.notif.typhoon",
  "mun.notif.digest",
  "mun.notif.health",
  "mun.notif.heat",
  "mun.notif.checklist",
  "mun.notif.dana",
  "mun.notif.deadline",
  "mun.notif.budget",
  "mun.notif.report",
  "mun.notif.coordination",
];

/** M1 KlimaChat + the SMS broadcast log + the 10 municipal auto-notifications. */
export default function MunChatPanel() {
  const { t } = useLanguage();
  const { state } = useMunicipalStore();
  const counts = reportCounts(state);
  const soon = pendingDeadlines(state).filter((d) => d.badge !== "later").length;

  const badge: Partial<Record<ITranslationKey, string>> = {
    "mun.notif.typhoon": state.emergencyActive ? `LVL ${state.emergencyLevel}` : "—",
    "mun.notif.deadline": String(soon),
    "mun.notif.report": String(counts.open),
  };

  return (
    <div className="space-y-5">
      <MunSection title={t("mun.sec.chat")} icon="broadcast" source="KlimaChat · PAGASA / NDRRMC / DA">
        <p className="mb-3 text-xs text-cmd-muted">{t("mun.misc.chatHint")}</p>
        {/* Mobile: chat (own bounded height) above the SMS log. md+: side by side at 560px. */}
        <div className="flex flex-col gap-4 md:h-[560px] md:flex-row">
          <ChatWidget revealOnMount className="md:h-full md:min-h-0 md:w-3/5" />
          <SmsBroadcastLog className="max-h-80 min-h-0 overflow-y-auto md:max-h-none md:flex-1" />
        </div>
      </MunSection>

      <MunSection title={t("mun.sec.notifications")} icon="radio" source={MUN_SOURCE}>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {NOTIFS.map((key) => (
            <li key={key} className="flex items-center justify-between gap-2 rounded-lg bg-cmd-tile p-3 text-sm text-cmd-heading">
              <span>{t(key)}</span>
              <span className={`${MUN_CHIP} shrink-0 ${MUN_TONE_CHIP.good}`}>
                {badge[key] ?? t("mun.notif.active")}
              </span>
            </li>
          ))}
        </ul>
      </MunSection>
    </div>
  );
}
