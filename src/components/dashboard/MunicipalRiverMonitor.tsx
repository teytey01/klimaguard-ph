"use client";

import { Icon, useLanguage } from "@/components/common";
import {
  MUN_OSM_EMBED,
  MUN_OSM_LINK,
  MUN_SOURCE,
  MUN_STATION,
} from "@/lib/dashboard/dashboardData";
import { MUN_BTN_OUTLINE } from "@/lib/dashboard/munUi";
import MunSection from "./MunSection";
import MunBar from "./MunBar";

export type IMunicipalRiverMonitorProps = Record<string, never>;

/** OpenStreetMap embed of Calamba + the Real Bridge station card. */
export default function MunicipalRiverMonitor() {
  const { t } = useLanguage();
  return (
    <MunSection title={t("mun.sec.river")} icon="map" source={`${MUN_SOURCE} · © OpenStreetMap`}>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="h-64 overflow-hidden rounded-lg border border-black/10 lg:col-span-2 dark:border-white/10">
          <iframe
            title={t("mun.sec.river")}
            src={MUN_OSM_EMBED}
            className="h-full w-full"
            loading="lazy"
          />
        </div>
        <div className="flex flex-col gap-3 rounded-lg bg-cmd-tile p-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-cmd-muted">
            {t("mun.sec.station")}
          </p>
          <p className="flex items-center gap-2 text-sm font-semibold text-cmd-heading">
            <span className="text-teal">
              <Icon name="water" size={16} />
            </span>
            {MUN_STATION.name}
          </p>
          <p className="text-3xl font-bold text-teal">{MUN_STATION.hydraulicCapacityPct}%</p>
          <MunBar pct={MUN_STATION.hydraulicCapacityPct} label={MUN_STATION.name} />
          <p className="text-xs text-cmd-muted">
            {t("mun.sec.stationDetail", {
              pct: MUN_STATION.hydraulicCapacityPct,
              note: MUN_STATION.note,
            })}
          </p>
          <a href={MUN_OSM_LINK} target="_blank" rel="noopener noreferrer" className={MUN_BTN_OUTLINE}>
            <Icon name="map" size={16} />
            {t("mun.action.openMap")}
          </a>
        </div>
      </div>
    </MunSection>
  );
}
