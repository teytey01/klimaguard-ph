"use client";

import { useLanguage } from "@/components/common";
import { MUN_BARANGAY_COUNT, MUN_LOCATION, MUN_SOURCE } from "@/lib/dashboard/dashboardData";
import { formatCount } from "@/lib/dashboard/municipalFormat";
import { MUN_TABLE_WRAP, MUN_TD, MUN_TH } from "@/lib/dashboard/munUi";
import { useMunicipalStore } from "@/lib/dashboard/useMunicipalStore";
import MunSection from "./MunSection";

export type IMunLocationPanelProps = Record<string, never>;

/** M8 Location (background): municipal scope + featured barangay roster. */
export default function MunLocationPanel() {
  const { t } = useLanguage();
  const { state } = useMunicipalStore();
  return (
    <MunSection title={t("mun.sec.scope")} icon="location" source={MUN_SOURCE}>
      <p className="text-sm text-cmd-heading">
        <span className="font-semibold">
          {MUN_LOCATION.name}, {MUN_LOCATION.province} ({MUN_LOCATION.region})
        </span>{" "}
        · {MUN_BARANGAY_COUNT} barangay · {MUN_LOCATION.lat}N {MUN_LOCATION.lon}E · {t("mun.misc.bgActive")}
      </p>
      <p className="mt-1 text-xs text-cmd-muted">
        {t("mun.misc.locationNote")} {t("mun.misc.scopeNote")}
      </p>
      <h3 className="mt-3 text-xs font-bold uppercase text-cmd-muted">{t("mun.sec.roster")}</h3>
      <div className={`${MUN_TABLE_WRAP} mt-1`}>
        <table className="w-full min-w-[420px]">
          <thead className="bg-cmd-tile">
            <tr>
              <th className={MUN_TH}>{t("mun.f.barangay")}</th>
              <th className={MUN_TH}>{t("mun.col.setting")}</th>
              <th className={MUN_TH}>{t("mun.col.population")}</th>
              <th className={MUN_TH}>{t("mun.col.coords")}</th>
            </tr>
          </thead>
          <tbody>
            {state.barangays.map((b) => (
              <tr key={b.id} className="border-t border-black/5 dark:border-white/5">
                <td className={MUN_TD}>{b.name}</td>
                <td className={MUN_TD}>{t(`mun.setting.${b.setting}` as const)}</td>
                <td className={MUN_TD}>{formatCount(b.population)}</td>
                <td className={MUN_TD}>
                  {b.lat.toFixed(3)}, {b.lon.toFixed(3)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </MunSection>
  );
}
