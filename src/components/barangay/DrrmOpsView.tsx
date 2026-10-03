"use client";

import { Icon, useLanguage } from "@/components/common";
import AffectedPopulationPanel from "./AffectedPopulationPanel";
import DanaFormPanel from "./DanaFormPanel";
import PreDisasterChecklistPanel from "./PreDisasterChecklistPanel";
import QrfTrackerPanel from "./QrfTrackerPanel";

export interface IDrrmOpsViewProps {
  barangay: string;
  municipality: string;
  emergency: boolean;
}

/**
 * M3/M7 barangay DRRM operations: pre-disaster checklist, DANA (3-hour
 * deadline → SitRep UP to MDRRMC), affected population, and QRF. No
 * all-BDRRMC coordination or consolidated municipal DANA (municipal-only).
 */
export default function DrrmOpsView({ barangay, municipality, emergency }: IDrrmOpsViewProps) {
  const { t } = useLanguage();
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-cmd-heading">{t("brgy.drrm.title")}</h2>
        <p className="mt-1 flex items-start gap-1.5 text-sm text-cmd-muted">
          <span className="mt-0.5 text-teal">
            <Icon name="lock" size={14} />
          </span>
          {t("brgy.drrm.scopeNote")}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <PreDisasterChecklistPanel barangay={barangay} emergency={emergency} />
        <DanaFormPanel barangay={barangay} municipality={municipality} />
        <AffectedPopulationPanel barangay={barangay} />
        <QrfTrackerPanel barangay={barangay} />
      </div>
    </div>
  );
}
