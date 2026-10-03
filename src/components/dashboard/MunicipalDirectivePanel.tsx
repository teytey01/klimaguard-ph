"use client";

import { useState } from "react";
import { Icon, useLanguage } from "@/components/common";
import { MUN_SOURCE } from "@/lib/dashboard/dashboardData";
import type { IMunStoreResult } from "@/lib/dashboard/municipalStore";
import { MUN_BTN_PRIMARY, MUN_CHIP, MUN_TONE_CHIP } from "@/lib/dashboard/munUi";
import { useMunicipalStore } from "@/lib/dashboard/useMunicipalStore";
import type { IMunDirectiveStatus } from "@/types";
import MunSection from "./MunSection";
import MunFeedback from "./MunFeedback";

export type IMunicipalDirectivePanelProps = Record<string, never>;

const TONE: Record<IMunDirectiveStatus, keyof typeof MUN_TONE_CHIP> = {
  enforced: "critical",
  signed: "good",
  "in-progress": "caution",
  pending: "info",
};

/** Resolution No. 04 directives + the "Broadcast Municipal SitRep Update" action. */
export default function MunicipalDirectivePanel() {
  const { t } = useLanguage();
  const { state, actions } = useMunicipalStore();
  const [result, setResult] = useState<IMunStoreResult | null>(null);

  const success =
    result && result.ok
      ? t("mun.status.broadcastSent", { count: result.count ?? 0, time: result.info ?? "" })
      : undefined;

  return (
    <MunSection title={t("mun.sec.directive")} icon="scroll" source={MUN_SOURCE}>
      <ul className="space-y-2">
        {state.directives.map((d) => (
          <li key={d.id} className="rounded-lg bg-cmd-tile p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-cmd-heading">{d.title}</p>
              <span className={`${MUN_CHIP} ${MUN_TONE_CHIP[TONE[d.status]]}`}>{d.badge}</span>
            </div>
            <p className="mt-1 text-xs text-cmd-muted">{d.detail}</p>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => setResult(actions.broadcastSitrep())}
        className={`${MUN_BTN_PRIMARY} mt-4 w-full`}
      >
        <Icon name="broadcast" size={16} />
        {t("mun.action.broadcast")}
      </button>
      <MunFeedback result={result} successText={success} />
    </MunSection>
  );
}
