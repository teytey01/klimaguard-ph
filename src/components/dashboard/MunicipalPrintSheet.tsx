"use client";

import { useLanguage } from "@/components/common";
import { MUN_AGENCIES, MUN_SOURCE } from "@/lib/dashboard/dashboardData";
import {
  barangayName,
  consolidatedDana,
  evacTotals,
  fundSummary,
  totalAffectedHouseholds,
} from "@/lib/dashboard/municipalSelectors";
import { formatCount, formatDateTimeManila, formatPhp, formatPhpShort } from "@/lib/dashboard/municipalFormat";
import { useMunicipalStore } from "@/lib/dashboard/useMunicipalStore";
import type { IMunPrintMode } from "@/types";

export interface IMunicipalPrintSheetProps {
  mode: IMunPrintMode;
}

const TH = "border border-black/40 px-2 py-1 text-left text-xs font-bold";
const TD = "border border-black/40 px-2 py-1 text-xs";

/**
 * Print-only sheet (hidden on screen, `print:block`): the consolidated DANA
 * Executive Report or the TOC operations summary, built from live state.
 * The user picks "Save as PDF" in the browser print dialog.
 */
export default function MunicipalPrintSheet({ mode }: IMunicipalPrintSheetProps) {
  const { t } = useLanguage();
  const { state, actor } = useMunicipalStore();
  if (mode === "none") {
    return null;
  }
  const dana = consolidatedDana(state);
  const evac = evacTotals(state);
  const fund = fundSummary();
  const stamp = t("mun.misc.printedAt", { time: formatDateTimeManila(new Date().toISOString()), who: actor });

  return (
    <div className="hidden bg-white p-6 text-black print:block">
      <h1 className="text-lg font-bold">{mode === "dana" ? t("mun.print.danaTitle") : t("mun.print.tocTitle")}</h1>
      <p className="text-xs">{stamp}</p>

      {mode === "dana" ? (
        <>
          <h2 className="mt-4 text-sm font-bold">{t("mun.print.summary")}</h2>
          <p className="text-sm">
            {t("mun.misc.reporting", { count: dana.reporting, total: state.dana.length })} ·{" "}
            {formatCount(dana.affectedFamilies)} {t("mun.col.families")} · {dana.casualties} nasawi/nasaktan ·{" "}
            {dana.housesDamaged} {t("mun.col.houses")} · Infra {formatPhp(dana.infraDamagePhp)} · Agri{" "}
            {formatPhp(dana.agriDamagePhp)}
          </p>
          <table className="mt-3 w-full border-collapse">
            <thead>
              <tr>
                <th className={TH}>{t("mun.f.barangay")}</th>
                <th className={TH}>{t("mun.f.status")}</th>
                <th className={TH}>{t("mun.col.families")}</th>
                <th className={TH}>{t("mun.col.houses")}</th>
                <th className={TH}>{t("mun.col.damage")}</th>
              </tr>
            </thead>
            <tbody>
              {state.dana.map((d) => (
                <tr key={d.barangayId}>
                  <td className={TD}>{barangayName(state, d.barangayId)}</td>
                  <td className={TD}>{t(`mun.dana.${d.status}` as const)}</td>
                  <td className={TD}>{d.affectedFamilies}</td>
                  <td className={TD}>{d.housesDamaged}</td>
                  <td className={TD}>{formatPhp(d.infraDamagePhp + d.agriDamagePhp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <>
          <h2 className="mt-4 text-sm font-bold">{t("mun.print.summary")}</h2>
          <ul className="list-disc pl-5 text-sm">
            <li>
              {t("mun.stat.affected")}: {formatCount(totalAffectedHouseholds(state))}
            </li>
            <li>
              {t("mun.stat.shelters")}: {evac.openCount}/{evac.total} · {evac.occupied}/{evac.capacity} ({evac.pct}%)
            </li>
            <li>
              LDRRMF: {fund.pct}% · {formatPhpShort(fund.spent)} / {formatPhpShort(fund.allocated)}
            </li>
            <li>
              {t("mun.misc.depot")}: {state.depot.foodPacks} {t("mun.f.foodPacks")} · {state.depot.waterKits} {t("mun.f.waterKits")}
            </li>
          </ul>
          <table className="mt-3 w-full border-collapse">
            <thead>
              <tr>
                <th className={TH}>{t("mun.col.center")}</th>
                <th className={TH}>{t("mun.f.barangay")}</th>
                <th className={TH}>{t("mun.col.occ")}</th>
                <th className={TH}>{t("mun.f.status")}</th>
              </tr>
            </thead>
            <tbody>
              {state.centers.map((c) => (
                <tr key={c.id}>
                  <td className={TD}>{c.name}</td>
                  <td className={TD}>{c.barangay}</td>
                  <td className={TD}>
                    {c.occupancy}/{c.capacity}
                  </td>
                  <td className={TD}>{t(`mun.evac.${c.status}` as const)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <h2 className="mt-4 text-sm font-bold">{t("mun.sec.directive")}</h2>
          <ul className="list-disc pl-5 text-sm">
            {state.directives.map((d) => (
              <li key={d.id}>
                {d.title} — {d.badge}: {d.detail}
              </li>
            ))}
          </ul>
          <h2 className="mt-4 text-sm font-bold">{t("mun.stat.uplink")}</h2>
          <ul className="list-disc pl-5 text-sm">
            {MUN_AGENCIES.map((a) => (
              <li key={a.agency}>
                {a.agency}: {a.detail}
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="mt-4 text-[10px]">{MUN_SOURCE}</p>
    </div>
  );
}
