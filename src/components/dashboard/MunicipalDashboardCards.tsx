"use client";

import type { ReactNode } from "react";
import { Icon, useLanguage } from "@/components/common";
import type { IconName } from "@/components/common/Icon";
import { useAlerts, useWeather } from "@/hooks";
import {
  MUN_COMPLIANCE_INDICATORS,
  MUN_LOCATION,
  MUN_SOURCE,
} from "@/lib/dashboard/dashboardData";
import {
  averageCompliance,
  complianceRanking,
  fundSummary,
  pendingDeadlines,
  riskRanking,
  totalAffectedHouseholds,
  totalAtRiskResidents,
} from "@/lib/dashboard/municipalSelectors";
import { formatCount, formatPhpShort } from "@/lib/dashboard/municipalFormat";
import { MUN_BTN_SMALL, MUN_CHIP, MUN_TONE_CHIP } from "@/lib/dashboard/munUi";
import { useMunicipalStore } from "@/lib/dashboard/useMunicipalStore";
import { describeWeather } from "@/lib/utils/weatherCodes";
import type { IMunModuleTab } from "@/types";
import MunBar from "./MunBar";

export interface IMunicipalDashboardCardsProps {
  onNavigate: (tab: IMunModuleTab) => void;
}

const CARD = "flex flex-col rounded-xl border border-black/5 bg-cmd-surface p-4 shadow-sm dark:border-white/5";

/** Card heading (plain render helper, not a component). */
function cardHead(icon: IconName, title: string): ReactNode {
  return (
    <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-cmd-muted">
      <span className="text-teal">
        <Icon name={icon} size={16} />
      </span>
      {title}
    </h3>
  );
}

/**
 * The Municipal Official home dashboard cards (v6 matrix §2): weather, rain %,
 * active alerts, location, DRRM fund, compliance scorecard, pending deadlines,
 * municipal-wide affected population, all-barangay compliance, cross-barangay
 * comparison. Weather is live (Calamba); the rest derives from the store.
 */
export default function MunicipalDashboardCards({ onNavigate }: IMunicipalDashboardCardsProps) {
  const { t } = useLanguage();
  const { state } = useMunicipalStore();
  const { data: weather, isLoading, error, refetch } = useWeather(MUN_LOCATION);
  const { state: alertState } = useAlerts();

  const fund = fundSummary();
  const deadlines = pendingDeadlines(state).slice(0, 3);
  const ranking = complianceRanking(state);
  const topRisk = riskRanking(state).slice(0, 5);
  const passed = MUN_COMPLIANCE_INDICATORS.filter((i) => i.pass).length;
  const liveAlerts = alertState?.hasActiveHazard ? 1 : 0;
  const activeAlerts = liveAlerts + (state.emergencyActive ? 1 : 0);
  const current = weather?.current;
  const desc = current ? describeWeather(current.weatherCode) : null;

  const weatherBody: ReactNode = isLoading && !weather ? (
    <div className="mt-3 space-y-2" aria-hidden="true">
      <div className="h-8 w-24 animate-pulse rounded bg-cmd-tile" />
      <div className="h-4 w-32 animate-pulse rounded bg-cmd-tile" />
    </div>
  ) : error && !weather ? (
    <div className="mt-3">
      <p className="text-sm text-cmd-heading">{error}</p>
      <button type="button" onClick={refetch} className={`${MUN_BTN_SMALL} mt-2`}>
        {t("mun.action.retry")}
      </button>
    </div>
  ) : null;

  return (
    <section aria-label={t("mun.tab.overview")}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className={CARD}>
          {cardHead("sun", t("mun.card.weather"))}
          {weatherBody ?? (
            <>
              <p className="mt-3 text-3xl font-bold text-cmd-heading">
                {current ? `${Math.round(current.temperatureC)}°C` : "—"}
              </p>
              <p className="text-sm text-cmd-muted">{desc ? `${desc.label} ${desc.emoji}` : ""}</p>
            </>
          )}
          <p className="mt-auto pt-2 text-[10px] text-cmd-muted">Open-Meteo / PAGASA</p>
        </article>

        <article className={CARD}>
          {cardHead("water", t("mun.card.rain"))}
          {weatherBody ?? (
            <>
              <p className="mt-3 text-3xl font-bold text-teal">{current ? `${current.rainChance}%` : "—"}</p>
              <MunBar pct={current?.rainChance ?? 0} label={t("mun.card.rain")} />
            </>
          )}
          <p className="mt-auto pt-2 text-[10px] text-cmd-muted">Open-Meteo</p>
        </article>

        <article className={CARD}>
          {cardHead("alert-triangle", t("mun.card.alerts"))}
          <p className={`mt-3 text-3xl font-bold ${activeAlerts > 0 ? "text-alert" : "text-teal"}`}>
            {activeAlerts}
          </p>
          <p className="text-sm text-cmd-muted">
            {activeAlerts > 0
              ? t("mun.card.alertsDetail", { count: activeAlerts, level: state.emergencyLevel })
              : t("mun.card.noAlerts")}
          </p>
          <button type="button" onClick={() => onNavigate("m3")} className={`${MUN_BTN_SMALL} mt-auto self-start`}>
            {t("mun.action.viewAll")}
          </button>
        </article>

        <article className={CARD}>
          {cardHead("location", t("mun.card.location"))}
          <p className="mt-3 text-lg font-bold text-cmd-heading">
            {MUN_LOCATION.name}, {MUN_LOCATION.province}
          </p>
          <p className="text-sm text-cmd-muted">{t("mun.card.barangays")}</p>
          <p className="mt-auto pt-2 text-[10px] text-cmd-muted">
            {MUN_LOCATION.lat}N {MUN_LOCATION.lon}E
          </p>
        </article>

        <article className={CARD}>
          {cardHead("chart", t("mun.card.fund"))}
          <p className="mt-3 text-3xl font-bold text-teal">{fund.pct}%</p>
          <MunBar pct={fund.pct} label={t("mun.card.fund")} />
          <p className="mt-2 text-xs text-cmd-muted">
            {formatPhpShort(fund.spent)} / {formatPhpShort(fund.allocated)} · QRF {formatPhpShort(fund.qrf)}
          </p>
        </article>

        <article className={CARD}>
          {cardHead("check", t("mun.card.compliance"))}
          <p className="mt-3 text-3xl font-bold text-cmd-heading">
            {passed}/{MUN_COMPLIANCE_INDICATORS.length}
          </p>
          <p className="text-sm text-cmd-muted">
            {t("mun.card.passed", { pass: passed, total: MUN_COMPLIANCE_INDICATORS.length })}
          </p>
          <p className="text-xs text-cmd-muted">{t("mun.card.avgBrgy", { score: averageCompliance(state) })}</p>
        </article>

        <article className={CARD}>
          {cardHead("calendar", t("mun.card.deadlines"))}
          <ul className="mt-3 space-y-2">
            {deadlines.map((d) => (
              <li key={d.id} className="flex items-start justify-between gap-2 text-xs">
                <span className="text-cmd-heading">
                  {d.title}
                  <span className="block text-cmd-muted">
                    {d.scope === "municipal" ? t("mun.deadline.municipal") : `Brgy. ${d.scope}`}
                  </span>
                </span>
                <span
                  className={`${MUN_CHIP} shrink-0 ${MUN_TONE_CHIP[d.badge === "overdue" || d.badge === "7" ? "critical" : "caution"]}`}
                >
                  {t(`mun.deadline.${d.badge}` as const)}
                </span>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => onNavigate("m6")} className={`${MUN_BTN_SMALL} mt-auto self-start`}>
            {t("mun.action.viewAll")}
          </button>
        </article>

        <article className={CARD}>
          {cardHead("users", t("mun.card.affected"))}
          <p className="mt-3 text-3xl font-bold text-cmd-heading">
            {formatCount(totalAffectedHouseholds(state))}
          </p>
          <p className="text-sm text-cmd-muted">{t("mun.card.households")}</p>
          <p className="text-xs text-cmd-muted">
            {t("mun.card.residentsAtRisk", { count: formatCount(totalAtRiskResidents(state)) })}
          </p>
        </article>

        <article className={`${CARD} sm:col-span-2`}>
          {cardHead("check", t("mun.card.allCompliance"))}
          <div className="mt-3 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase text-teal">{t("mun.card.top")}</p>
              <ul className="mt-1 space-y-1">
                {ranking.slice(0, 3).map((b) => (
                  <li key={b.id} className="flex justify-between text-xs text-cmd-heading">
                    <span>{b.name}</span>
                    <span className="font-semibold">{b.complianceScore}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-alert">{t("mun.card.bottom")}</p>
              <ul className="mt-1 space-y-1">
                {ranking.slice(-3).reverse().map((b) => (
                  <li key={b.id} className="flex justify-between text-xs text-cmd-heading">
                    <span>{b.name}</span>
                    <span className="font-semibold">{b.complianceScore}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <button type="button" onClick={() => onNavigate("m10")} className={`${MUN_BTN_SMALL} mt-3 self-start`}>
            {t("mun.action.viewAll")}
          </button>
        </article>

        <article className={`${CARD} sm:col-span-2`}>
          {cardHead("chart", t("mun.card.comparison"))}
          <ul className="mt-3 space-y-2">
            {topRisk.map((b) => (
              <li key={b.id}>
                <div className="flex justify-between text-xs text-cmd-heading">
                  <span>{b.name}</span>
                  <span className="font-semibold">{b.riskIndex.toFixed(1)}/10</span>
                </div>
                <MunBar pct={b.riskIndex * 10} label={`${b.name} ${b.riskIndex}/10`} tone={b.riskIndex >= 7 ? "alert" : "accent"} />
              </li>
            ))}
          </ul>
        </article>
      </div>
      <p className="mt-2 text-right text-[11px] text-cmd-muted">{MUN_SOURCE}</p>
    </section>
  );
}
