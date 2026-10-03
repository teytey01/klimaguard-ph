"use client";

import { useEffect, useState } from "react";

import { Icon, useLanguage } from "@/components/common";
import { useAlerts, useLocation, useWeather } from "@/hooks";
import { describeWeather } from "@/lib/utils/weatherCodes";
import BudgetTracker from "@/components/transparency/BudgetTracker";
import ProjectTracker from "@/components/transparency/ProjectTracker";
import { ChatWidget } from "@/components/chat";
import CropDamageRiskCard from "@/components/agriculture/CropDamageRiskCard";
import FarmSafetyTab from "@/components/agriculture/FarmSafetyTab";
import { assessCropDamageRisk } from "@/lib/agriculture/farmHazard";
import ResidentSidebar from "./ResidentSidebar";
import FamilyKitTab from "./FamilyKitTab";
import ReportsTab from "./ReportsTab";
import {
  RESIDENT_TABS,
  DEMO_EVAC,
  type IResidentTab,
} from "@/lib/resident/residentData";
import type { IHotline, ITransparencyData, IUserRole } from "@/types";

export interface IResidentDashboardProps {
  /** Resident's barangay (from onboarding); defaults to San Roque. */
  barangay?: string;
  /** The signed-in user's role (drives the sidebar highlight). */
  role?: IUserRole;
  /** The signed-in user's name (shown in the sidebar). */
  name?: string;
}

const DEFAULT_HOTLINES: IHotline[] = [
  { label: "Emergency Hotline", number: "911", tel: "tel:911" },
  { label: "Philippine Red Cross", number: "143", tel: "tel:143" },
  {
    label: "NDRRMC",
    number: "(02) 8911-1406",
    tel: "tel:+6328911406",
  },
  {
    label: "PAGASA",
    number: "(02) 8284-0800",
    tel: "tel:+6328284080",
  },
];

/**
 * Resident dashboard (view-only consumer role). A left sidebar plus seven
 * working top tabs — Panahon, Mga Babala, Evacuation, Family Kit, Hotlines,
 * Relief Status, Barangay Chat — wired to the real weather/alerts hooks and
 * the transparency view. Respects the resident access matrix (no M5/M6/M7/M10).
 * Theme-aware and Filipino-first.
 */
export default function ResidentDashboard({
  barangay = "San Roque",
  role = "resident",
  name,
}: IResidentDashboardProps) {
  const { t } = useLanguage();
  const [tab, setTab] = useState<IResidentTab>("weather");

  const { location } = useLocation();
  const { data: weather } = useWeather(location);
  const { state: alertState } = useAlerts();
  const isFarmer = role === "farmer";

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <ResidentSidebar
        activeTab={tab}
        onSelectTab={setTab}
        barangay={barangay}
        role={role}
        name={name}
      />

      <div className="min-w-0 flex-1">
        <p className="mb-3 text-sm text-cmd-muted">{t("res.intro")}</p>

        {/* Top action tabs */}
        <div
          role="tablist"
          aria-label="Resident actions"
          className="flex gap-1 overflow-x-auto rounded-xl bg-cmd-surface p-1.5"
        >
          {RESIDENT_TABS.filter((tabDef) => !tabDef.roles || tabDef.roles.includes(role)).map((tabDef) => {
            const isActive = tab === tabDef.id;
            return (
              <button
                key={tabDef.id}
                role="tab"
                aria-selected={isActive}
                type="button"
                onClick={() => setTab(tabDef.id)}
                className={`flex min-h-[44px] shrink-0 flex-col items-center justify-center gap-1 rounded-lg px-4 py-2 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-teal text-white"
                    : "text-cmd-muted hover:bg-cmd-tile hover:text-cmd-heading"
                }`}
              >
                <Icon name={tabDef.icon} size={18} />
                {t(tabDef.labelKey)}
              </button>
            );
          })}
        </div>

        {/* Tab panels */}
        <div className="mt-4">
          {tab === "weather" ? (
            <WeatherTab weather={weather} />
          ) : tab === "alerts" ? (
            <div className="space-y-4">
              <AlertsTab alertState={alertState} barangay={barangay} />
              {/* M3 farmer-only: crop damage risk + livestock protection. */}
              {isFarmer ? (
                <CropDamageRiskCard
                  risk={assessCropDamageRisk({
                    alert: alertState?.hasActiveHazard ? alertState.alert : null,
                    current: weather?.current,
                    forecast: weather?.forecast,
                  })}
                />
              ) : null}
            </div>
          ) : tab === "evacuation" ? (
            <EvacuationTab barangay={barangay} />
          ) : tab === "farmSafety" && isFarmer ? (
            <FarmSafetyTab />
          ) : tab === "familyKit" ? (
            <FamilyKitTab />
          ) : tab === "hotlines" ? (
            <HotlinesTab hotlines={alertState?.hotlines ?? []} />
          ) : tab === "relief" ? (
            <ReliefTab barangay={barangay} />
          ) : tab === "reports" ? (
            <ReportsTab />
          ) : (
            <ChatTab />
          )}
        </div>
      </div>
    </div>
  );
}

// --- Weather tab (M2) ---

function WeatherTab({
  weather,
}: {
  weather: ReturnType<typeof useWeather>["data"];
}) {
  const { t } = useLanguage();
  const current = weather?.current;
  const desc = current ? describeWeather(current.weatherCode) : null;
  const rain = current?.rainChance ?? 0;
  const rainSafe = rain < 40;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <section className="rounded-xl bg-cmd-surface p-5">
        <div className="flex items-start justify-between">
          <h2 className="text-sm font-semibold text-cmd-muted">
            {t("res.weather.condition")}
          </h2>
          <span className="text-teal">
            <Icon name="sun" size={20} />
          </span>
        </div>
        <p className="mt-3 text-4xl font-bold text-cmd-heading">
          {current ? `${Math.round(current.temperatureC)}°C` : "—"}
        </p>
        <p className="mt-1 text-sm text-cmd-muted">
          {desc ? `${desc.label} ${desc.emoji}` : ""}
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-cmd-tile p-3">
            <dt className="text-xs text-cmd-muted">{t("res.weather.humidity")}</dt>
            <dd className="mt-1 text-lg font-semibold text-cmd-heading">
              {current ? `${current.humidity}%` : "—"}
            </dd>
          </div>
          <div className="rounded-lg bg-cmd-tile p-3">
            <dt className="text-xs text-cmd-muted">{t("res.weather.wind")}</dt>
            <dd className="mt-1 text-lg font-semibold text-cmd-heading">
              {current ? `${Math.round(current.windSpeedKmh)} km/h` : "—"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl bg-cmd-surface p-5">
        <div className="flex items-start justify-between">
          <h2 className="text-sm font-semibold text-cmd-muted">
            {t("res.weather.rainTitle")}
          </h2>
          <span className="text-teal">
            <Icon name="water" size={20} />
          </span>
        </div>
        <p className="mt-3 text-4xl font-bold text-teal">{rain}%</p>
        <p className="mt-3 rounded-lg bg-cmd-tile p-3 text-sm text-cmd-heading">
          {rainSafe ? t("res.weather.rainSafe") : t("res.weather.rainCaution")}
        </p>
        <p className="mt-3 text-right text-xs text-cmd-muted">
          {t("res.weather.source")}
        </p>
      </section>
    </div>
  );
}

// --- Alerts tab (M3) ---

function AlertsTab({
  alertState,
  barangay,
}: {
  alertState: ReturnType<typeof useAlerts>["state"];
  barangay: string;
}) {
  const { t } = useLanguage();
  const alert = alertState?.alert ?? null;
  const hasHazard = Boolean(alertState?.hasActiveHazard && alert);

  return (
    <section className="rounded-xl bg-cmd-surface p-5">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-cmd-heading">
          <span className={hasHazard ? "text-alert" : "text-teal"}>
            <Icon name={hasHazard ? "alert-triangle" : "shield"} size={18} />
          </span>
          {t("res.alerts.communityTitle")}
        </h2>
      </div>

      {hasHazard && alert ? (
        <div className="mt-3 rounded-lg border border-alert/40 bg-alert/5 p-4">
          <p className="text-2xl font-bold text-alert">
            Signal No. {alert.signalLevel} — {alert.typhoonName}
          </p>
          <p className="mt-1 text-sm text-cmd-muted">
            {alert.affectedAreas.join(", ")}
          </p>
        </div>
      ) : (
        <div className="mt-3">
          <p className="text-3xl font-bold text-cmd-heading">
            0 {t("res.alerts.activeWarnings")}
          </p>
          <p className="mt-1 text-sm text-cmd-muted">
            {t("res.alerts.noWarningsDetail", { barangay: `Brgy. ${barangay}` })}
          </p>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between rounded-lg bg-cmd-tile p-3">
        <span className="flex items-center gap-2 text-xs text-cmd-muted">
          <Icon name="radio" size={14} />
          {t("res.alerts.radarSync", { time: "10 min" })}
        </span>
        <span className="rounded bg-teal/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-teal">
          {t("res.alerts.updated")}
        </span>
      </div>
    </section>
  );
}

// --- Evacuation tab (M3/M4) ---

function EvacuationTab({ barangay }: { barangay: string }) {
  const { t } = useLanguage();
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <section className="rounded-xl bg-cmd-surface p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-cmd-heading">
          <span className="text-teal">
            <Icon name="location" size={18} />
          </span>
          {t("res.evac.title")}
        </h2>
        <p className="mt-3 text-lg font-bold text-cmd-heading">
          {DEMO_EVAC.name}
        </p>
        <span className="mt-1 inline-block rounded bg-teal/15 px-2 py-0.5 text-[10px] font-bold uppercase text-teal">
          {t("res.evac.openReady")}
        </span>
        <p className="mt-3 text-sm text-cmd-muted">
          {t("res.evac.distance", {
            meters: DEMO_EVAC.meters,
            minutes: DEMO_EVAC.minutes,
          })}
        </p>
        <p className="mt-1 text-sm text-cmd-muted">
          {t("res.evac.route", { route: DEMO_EVAC.route })}
        </p>
        <p className="mt-1 text-sm text-cmd-muted">
          {t("res.evac.capacity")}: {DEMO_EVAC.capacity}
        </p>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            `${DEMO_EVAC.name}, ${barangay}, Laguna`,
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-teal px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
        >
          <Icon name="map" size={16} />
          {t("res.evac.viewMap")}
        </a>
      </section>

      <section className="overflow-hidden rounded-xl bg-cmd-surface p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-cmd-heading">
          <span className="text-teal">
            <Icon name="map" size={18} />
          </span>
          {t("res.evac.locationTitle")}
        </h2>
        <div className="mt-3 h-56 overflow-hidden rounded-lg border border-black/10 dark:border-white/10">
          <iframe
            title="Evacuation map"
            src="https://www.openstreetmap.org/export/embed.html?bbox=121.085%2C14.131%2C121.245%2C14.291&layer=mapnik&marker=14.2117%2C121.1653"
            className="h-full w-full"
            loading="lazy"
          />
        </div>
      </section>
    </div>
  );
}

// --- Hotlines tab (M4) ---

function HotlinesTab({ hotlines }: { hotlines: IHotline[] }) {
  const { t } = useLanguage();
  const list = hotlines.length > 0 ? hotlines : DEFAULT_HOTLINES;

  return (
    <section className="rounded-xl bg-alert p-5 text-white">
      <h2 className="text-base font-bold">{t("res.hotlines.title")}</h2>
      <p className="mt-1 text-sm text-white/90">{t("res.hotlines.subtitle")}</p>
      <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {list.map((h) => (
          <li key={h.label}>
            <a
              href={h.tel}
              className="flex min-h-[44px] items-center justify-between gap-2 rounded-lg bg-white px-4 py-3 text-alert"
            >
              <span className="text-sm font-bold">{h.label}</span>
              <span className="text-sm font-semibold">{h.number}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

// --- Relief tab (M11 view-only) ---

/**
 * DRRM budget for the viewer's own municipality, from the database. The server
 * picks the municipality from the session, so there is nothing to spoof here.
 */
function ReliefTab({ barangay }: { barangay: string }) {
  const { t } = useLanguage();
  const [data, setData] = useState<ITransparencyData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const res = await fetch("/api/db/transparency", { cache: "no-store" });
        const body = (await res.json().catch(() => null)) as
          | (ITransparencyData & { error?: string })
          | null;
        if (!active) {
          return;
        }
        if (!res.ok || !body || body.error) {
          setError(body?.error ?? t("res.reports.loadError"));
        } else {
          setData(body);
        }
      } catch {
        if (active) {
          setError(t("res.reports.loadError"));
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [t]);

  return (
    <section className="space-y-4">
      {/* Per-project local tracker first: "where did the money go, per project". */}
      <ProjectTracker initialBarangay={barangay} />
      <div>
        <h2 className="text-base font-semibold text-cmd-heading">
          {t("res.relief.title")}
        </h2>
        <p className="text-sm text-cmd-muted">{t("res.relief.subtitle")}</p>
      </div>
      {data ? (
        <BudgetTracker data={data} context="resident" />
      ) : error ? (
        <p className="rounded-xl bg-cmd-surface p-5 text-sm text-cmd-muted">{error}</p>
      ) : (
        <div className="h-48 animate-pulse rounded-xl bg-cmd-tile" aria-hidden="true" />
      )}
    </section>
  );
}

// --- Chat tab (M1) ---

function ChatTab() {
  // ChatWidget has its own bounded height + internal scroll.
  return <ChatWidget revealOnMount />;
}
