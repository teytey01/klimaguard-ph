"use client";

import { Icon, useLanguage } from "@/components/common";
import { useNow } from "@/hooks";
import {
  activeResponders,
  agoKey,
  BARANGAY_HOTLINE,
  CONNECTIVITY_ROWS,
  evacStatus,
  manilaTime,
  percent,
  RELIEF_LABEL_KEY,
  reportCounts,
  riverStatus,
  sparklinePoints,
  trendPerHour,
  widthClass,
} from "@/lib/barangay";
import type { IBarangayView } from "@/types";
import BarangayCard from "./BarangayCard";
import { useBarangayOps } from "./BarangayOpsProvider";

export interface IOperationsGridPanelProps {
  barangay: string;
  municipality: string;
  onSelectView: (view: IBarangayView) => void;
}

/**
 * The Stitch "Operations Grid": seven live cards derived from the barangay
 * ops state. Each card header jumps to its detailed tab.
 */
export default function OperationsGridPanel({
  barangay,
  municipality,
  onSelectView,
}: IOperationsGridPanelProps) {
  const { t } = useLanguage();
  const { state } = useBarangayOps();
  const now = useNow(5000);
  const source = t("brgy.source.ops", { barangay });

  // 1. Population at risk
  const atRisk = state.population.reduce((s, p) => s + p.individuals, 0);
  const vulnerable = state.population.reduce((s, p) => s + p.vulnerable, 0);
  const puroks = state.population.map((p) => p.purok.replace("Purok ", "")).join(" & ");

  // 2. Evacuation (primary active shelter + standby)
  const primary = state.centers.find((c) => c.active) ?? state.centers[0];
  const standby = state.centers.find((c) => !c.active);
  const evacPct = primary ? percent(primary.occupancy, primary.capacity) : 0;
  const primaryStatus = primary ? evacStatus(primary) : "standby";

  // 3. Teams
  const responders = activeResponders(state);
  const deployed = state.teams.filter((x) => x.status !== "standby").length;
  const onPatrol = state.teams.filter(
    (x) => x.status === "patrol" || x.status === "dispatched",
  ).length;

  // 4. River
  const river = state.river;
  const rStatus = riverStatus(river);
  const riverAlert = rStatus === "alert" || rStatus === "critical";
  const rate = trendPerHour(river.history.slice(-7));
  const ping = agoKey(river.lastPingAt, now);
  const levelPct = percent(river.levelM, river.criticalM);

  // 6. Reports
  const counts = reportCounts(state.reports);
  const latest = state.reports.slice(0, 2);

  const open = (view: IBarangayView, label: string) => ({
    onOpen: () => onSelectView(view),
    openLabel: t("brgy.openTab", { tab: label }),
  });

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {/* 1. Population at risk */}
      <BarangayCard
        title={t("brgy.ops.popTitle")}
        icon="users"
        badge={t("brgy.badge.monitored")}
        source={source}
        {...open("drrm", t("brgy.mod.drrm"))}
      >
        <p className="text-2xl font-bold text-cmd-heading">{atRisk.toLocaleString("en-PH")}</p>
        <p className="text-sm text-cmd-muted">
          {t("brgy.ops.popValue", {
            count: atRisk.toLocaleString("en-PH"),
            puroks: `Purok ${puroks}`,
          })}
        </p>
        <ul className="mt-3 space-y-2 text-sm">
          {state.population.map((p) => (
            <li key={p.purok} className="flex justify-between gap-2 rounded-lg bg-cmd-tile px-3 py-2">
              <span className="text-cmd-heading">
                {p.purok} ({p.label})
              </span>
              <span className="text-right text-cmd-muted">
                {t("brgy.ops.individuals", { count: p.individuals, families: p.families })}
              </span>
            </li>
          ))}
          <li className="flex justify-between gap-2 rounded-lg bg-cmd-tile px-3 py-2">
            <span className="text-cmd-heading">{t("brgy.ops.vulnerable")}</span>
            <span className="font-semibold text-teal">
              {t("brgy.ops.identified", { count: vulnerable })}
            </span>
          </li>
        </ul>
      </BarangayCard>

      {/* 2. Evacuation capacity */}
      <BarangayCard
        title={t("brgy.ops.evacTitle")}
        icon="home"
        badge={primaryStatus === "full" ? t("brgy.evac.status.full") : t("brgy.badge.activeShelter")}
        tone={primaryStatus === "full" ? "alert" : "normal"}
        source={source}
        {...open("evacuation", t("brgy.tab.evacuation"))}
      >
        {primary ? (
          <>
            <p className="text-2xl font-bold text-cmd-heading">
              {t("brgy.ops.full", { pct: evacPct })}
            </p>
            <p className="text-sm text-cmd-muted">
              {t("brgy.ops.occupied", { occ: primary.occupancy, cap: primary.capacity })} ·{" "}
              {primary.name} — {t("brgy.ops.designated")}
            </p>
            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-cmd-tile">
              <div
                role="progressbar"
                aria-valuenow={evacPct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={t("brgy.ops.evacTitle")}
                className={`h-full rounded-full ${
                  primaryStatus === "full"
                    ? "bg-alert"
                    : primaryStatus === "near-full"
                      ? "bg-cmd-accent"
                      : "bg-teal"
                } ${widthClass(evacPct)}`}
              />
            </div>
            <p className="mt-2 text-sm text-cmd-heading">
              {t("brgy.ops.remaining", { count: primary.capacity - primary.occupancy })}
            </p>
            {standby ? (
              <p className="mt-1 text-xs text-cmd-muted">
                {t("brgy.ops.standby", { name: standby.name, cap: standby.capacity })}
              </p>
            ) : null}
          </>
        ) : null}
      </BarangayCard>

      {/* 3. Response teams */}
      <BarangayCard
        title={t("brgy.ops.teamsTitle")}
        icon="shield"
        badge={t("brgy.badge.deployed")}
        source={source}
        {...open("tanod", t("brgy.tab.tanod"))}
      >
        <p className="text-2xl font-bold text-cmd-heading">
          {t("brgy.ops.teamsActive", { count: responders })}
        </p>
        <p className="text-sm text-cmd-muted">
          {t("brgy.ops.teamsDeployed", { deployed, patrol: onPatrol })}
        </p>
        <ul className="mt-3 space-y-1.5 text-sm">
          {state.teams.map((team) => (
            <li key={team.id} className="flex justify-between gap-2 rounded-lg bg-cmd-tile px-3 py-2">
              <span className="text-cmd-heading">
                {team.name} ({t("brgy.tanod.members", { count: team.members })})
              </span>
              <span className="truncate text-right text-cmd-muted">{team.assignment}</span>
            </li>
          ))}
        </ul>
      </BarangayCard>

      {/* 4. River telemetry */}
      <BarangayCard
        title={t("brgy.ops.riverTitle")}
        icon="water"
        badge={t("brgy.river.live", { id: river.id })}
        tone={riverAlert ? "alert" : "normal"}
        source={source}
        {...open("river", t("brgy.tab.river"))}
      >
        <p className={`text-2xl font-bold ${riverAlert ? "text-alert" : "text-cmd-heading"}`}>
          {river.levelM.toFixed(2)}m
        </p>
        <p className="text-sm text-cmd-muted">
          {t("brgy.ops.gauge")} · {t(`brgy.river.status.${rStatus}`)}
        </p>
        <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-cmd-tile">
          <div
            className={`h-full rounded-full ${
              riverAlert ? "bg-alert" : rStatus === "watch" ? "bg-cmd-accent" : "bg-teal"
            } ${widthClass(levelPct)}`}
          />
        </div>
        <div className="mt-1 flex flex-wrap justify-between gap-1 text-[10px] text-cmd-muted">
          <span>{t("brgy.river.thrNormal", { m: river.normalMaxM.toFixed(2) })}</span>
          <span>{t("brgy.river.thrAlert", { m: river.alertM.toFixed(2) })}</span>
          <span>{t("brgy.river.thrCritical", { m: river.criticalM.toFixed(2) })}</span>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-cmd-tile px-3 py-2">
          <span className="text-xs text-cmd-heading">
            {t("brgy.river.trend", { rate: `${rate >= 0 ? "+" : ""}${rate.toFixed(2)}` })}
          </span>
          <svg viewBox="0 0 80 24" className="h-6 w-20 shrink-0" aria-hidden="true">
            <polyline
              points={sparklinePoints(river.history.slice(-7), 80, 22)}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={riverAlert ? "text-alert" : "text-teal"}
            />
          </svg>
        </div>
        <p className="mt-2 text-xs text-cmd-muted">
          {t("brgy.river.station")}: {river.station} ·{" "}
          {t("brgy.river.ping", { ago: t(ping.key, { n: ping.n }) })}
        </p>
      </BarangayCard>

      {/* 5. Relief inventory */}
      <BarangayCard
        title={t("brgy.ops.reliefTitle")}
        icon="warehouse"
        badge={t("brgy.badge.onHand")}
        source={source}
        {...open("relief", t("brgy.tab.relief"))}
      >
        {state.relief.slice(0, 1).map((item) => (
          <div key={item.id}>
            <p className="text-2xl font-bold text-cmd-heading">
              {t("brgy.ops.packs", { count: item.quantity })}
            </p>
            <p className="text-sm text-cmd-muted">{item.note}</p>
          </div>
        ))}
        <ul className="mt-3 space-y-1.5 text-sm">
          {state.relief.slice(1).map((item) => (
            <li key={item.id} className="flex justify-between gap-2 rounded-lg bg-cmd-tile px-3 py-2">
              <span className="text-cmd-heading">{t(RELIEF_LABEL_KEY[item.id])}</span>
              <span className="text-right text-cmd-muted">
                {item.quantity} {item.unit} · {item.note}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-cmd-muted">
          {t("brgy.ops.lastCount", {
            by: state.stockCount.by,
            time: manilaTime(state.stockCount.at),
          })}
        </p>
      </BarangayCard>

      {/* 6. Incident reports */}
      <BarangayCard
        title={t("brgy.ops.reportsTitle")}
        icon="scroll"
        badge={t("brgy.badge.verified")}
        source={source}
        {...open("reports", t("brgy.tab.reports"))}
      >
        <p className="text-2xl font-bold text-cmd-heading">
          {t("brgy.ops.reportCounts", { resolved: counts.resolved, pending: counts.pending })}
        </p>
        <ul className="mt-3 space-y-2 text-sm">
          {latest.map((r) => {
            const ago = agoKey(r.resolvedAt ?? r.reportedAt, now);
            return (
              <li key={r.id} className="rounded-lg bg-cmd-tile px-3 py-2">
                <p className="font-medium text-cmd-heading">{r.title}</p>
                <p className="text-xs text-cmd-muted">
                  {r.location}
                  {r.response ? ` · ${r.response}` : ""} · {t(ago.key, { n: ago.n })}
                </p>
              </li>
            );
          })}
        </ul>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-cmd-muted">
          <Icon name="phone" size={12} />
          {t("brgy.ops.hotline", { number: BARANGAY_HOTLINE })}
        </p>
      </BarangayCard>

      {/* 7. Power & telecom */}
      <BarangayCard
        title={t("brgy.ops.connTitle")}
        icon="wifi"
        badge={t("brgy.badge.online")}
        source={source}
        className="md:col-span-2 xl:col-span-3"
      >
        <p className="text-2xl font-bold text-teal">{t("brgy.ops.connOnline")}</p>
        <ul className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2 xl:grid-cols-4">
          {CONNECTIVITY_ROWS.map((row) => (
            <li key={row.labelKey} className="rounded-lg bg-cmd-tile px-3 py-2">
              <p className="flex items-center justify-between gap-2">
                <span className="font-medium text-cmd-heading">{t(row.labelKey)}</span>
                <span className="text-xs font-bold text-teal">{row.value}</span>
              </p>
              <p className="text-xs text-cmd-muted">{t(row.detailKey, { municipality })}</p>
            </li>
          ))}
        </ul>
      </BarangayCard>
    </div>
  );
}
