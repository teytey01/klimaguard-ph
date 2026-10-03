"use client";

import { useEffect, useRef } from "react";
import type { IHotline } from "@/types";
import { useAlerts, useLocation, useWeather } from "@/hooks";
import { EvacuationCard } from "@/components/alerts";
import CropDamageRiskCard from "@/components/agriculture/CropDamageRiskCard";
import FarmSafetyTab from "@/components/agriculture/FarmSafetyTab";
import { assessCropDamageRisk } from "@/lib/agriculture/farmHazard";
import { SmsBroadcastLog, useAuth } from "@/components/common";
import { broadcastHazardAlert } from "@/lib/sms";

const FIL_DAYS = [
  "Linggo",
  "Lunes",
  "Martes",
  "Miyerkules",
  "Huwebes",
  "Biyernes",
  "Sabado",
] as const;

const FIL_MONTHS = [
  "Enero",
  "Pebrero",
  "Marso",
  "Abril",
  "Mayo",
  "Hunyo",
  "Hulyo",
  "Agosto",
  "Setyembre",
  "Oktubre",
  "Nobyembre",
  "Disyembre",
] as const;

function formatFilipinoDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const day = FIL_DAYS[date.getDay()];
  const month = FIL_MONTHS[date.getMonth()];
  return `${day}, ${month} ${date.getDate()}`;
}

function HotlinesSection({ hotlines }: { hotlines: IHotline[] }) {
  const list: IHotline[] =
    hotlines.length > 0
      ? hotlines
      : [
          { label: "Emergency Hotline", number: "911", tel: "tel:911" },
          { label: "Philippine Red Cross", number: "143", tel: "tel:143" },
          {
            label: "NDRRMC",
            number: "(02) 8911-1406 / 911-5061",
            tel: "tel:+6328911406",
          },
        ];

  return (
    <section
      aria-label="Mga hotline sa emergency"
      className="rounded-lg bg-[#E53E3E] p-4 text-white"
    >
      <h2 className="text-base font-bold">Mga Emergency Hotline</h2>
      <p className="mt-1 text-sm text-white/90">
        Tumawag agad kapag may panganib.
      </p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-3">
        {list.map((hotline) => (
          <li key={hotline.label}>
            <a
              href={hotline.tel}
              className="flex min-h-[44px] min-w-[44px] flex-col items-start justify-center rounded-md bg-white px-4 py-2 text-[#E53E3E]"
            >
              <span className="text-sm font-bold">{hotline.label}</span>
              <span className="text-sm">{hotline.number}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function AlertsSkeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      <div className="h-24 animate-pulse rounded-lg bg-gray-200 dark:bg-white/10" />
      <div className="h-16 animate-pulse rounded-lg bg-gray-200 dark:bg-white/10" />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="h-40 animate-pulse rounded-lg bg-gray-200 dark:bg-white/10" />
        <div className="h-40 animate-pulse rounded-lg bg-gray-200 dark:bg-white/10" />
      </div>
    </div>
  );
}

export default function AlertsPage() {
  const { state, loading, error, refetch } = useAlerts();
  // The masked number from the server session (never the raw number).
  const { session } = useAuth();
  const recipient = session?.mobile ?? "";
  const isFarmer = session?.role === "farmer";
  const { location } = useLocation();
  const { data: weather } = useWeather(location);

  const alert = state?.alert ?? null;
  const hasHazard = Boolean(state?.hasActiveHazard && alert);

  // Simulate an SMS broadcast once per distinct active hazard. The verified
  // resident's number (from the session) is the recipient; a real deployment
  // would target every registered resident in the affected barangays.
  const broadcastedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!hasHazard || !alert) {
      return;
    }
    const key = `${alert.typhoonName}-${alert.signalLevel}`;
    if (broadcastedFor.current === key) {
      return;
    }
    broadcastedFor.current = key;
    broadcastHazardAlert(alert, recipient ? [recipient] : []);
  }, [hasHazard, alert, recipient]);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
      <h1 className="text-2xl font-bold text-[#1A365D] dark:text-[#F7FAFC]">
        Mga Alerto at Kaligtasan
      </h1>

      {/* G07 safety priority: hotlines are always rendered first, independent
          of loading/error/hazard state. */}
      <div className="mt-4">
        <HotlinesSection hotlines={state?.hotlines ?? []} />
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-[#E53E3E]/40 bg-[#F7FAFC] p-4 text-gray-800 dark:bg-[#16263D] dark:text-[#F7FAFC]">
          <p className="text-sm">{error}</p>
          <button
            type="button"
            onClick={refetch}
            className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-md bg-[#38B2AC] px-4 py-2 text-sm font-semibold text-white"
          >
            Subukang muli
          </button>
        </div>
      )}

      <div className="mt-6">
        {loading && !state ? (
          <AlertsSkeleton />
        ) : hasHazard && alert ? (
          <div className="space-y-6">
            <section className="rounded-lg border border-[#E53E3E] bg-white p-4 text-gray-800 dark:bg-[#16263D] dark:text-[#F7FAFC]">
              <p className="text-lg font-bold text-[#E53E3E]">
                Signal No. {alert.signalLevel} — {alert.typhoonName}
              </p>
              <p className="mt-2 text-sm">
                Apektadong lugar: {alert.affectedAreas.join(", ")}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-[#A0AEC0]">
                Huling update: {formatFilipinoDate(alert.timestamp)}
              </p>
              <p className="mt-3 text-sm">
                Manatiling kalmado at handa. Sundin ang mga tagubilin ng inyong
                barangay at maghanda para lumikas kung kinakailangan.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#1A365D] dark:text-[#F7FAFC]">
                Mga Evacuation Center
              </h2>
              {state && state.evacuationCenters.length > 0 ? (
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  {state.evacuationCenters.map((center) => (
                    <EvacuationCard key={center.name} center={center} />
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-gray-600 dark:text-[#A0AEC0]">
                  Walang nakalistang evacuation center sa ngayon. Tumawag sa
                  inyong barangay para sa pinakamalapit na lilikasan.
                </p>
              )}
            </section>
          </div>
        ) : (
          <section className="rounded-lg bg-[#F7FAFC] p-6 text-gray-800 dark:bg-[#16263D] dark:text-[#F7FAFC]">
            <p className="text-base font-semibold">
              Walang aktibong babala sa ngayon ☀️
            </p>
            <p className="mt-2 text-sm text-gray-600 dark:text-[#A0AEC0]">
              Ligtas ang inyong lugar sa kasalukuyan. Manatiling handa — i-check
              ang pahinang ito paminsan-minsan at itabi ang mga numero ng
              emergency sa itaas.
            </p>
          </section>
        )}
      </div>

      {/* Farmer-only: M3 crop damage risk + livestock advisory, M4 farm safety. */}
      {isFarmer ? (
        <div className="mt-6 space-y-6">
          <CropDamageRiskCard
            risk={assessCropDamageRisk({
              alert: hasHazard ? alert : null,
              current: weather?.current,
              forecast: weather?.forecast,
            })}
          />
          <section>
            <h2 className="mb-3 text-lg font-bold text-[#1A365D] dark:text-[#F7FAFC]">
              Kaligtasan ng Bukid at Hayop
            </h2>
            <FarmSafetyTab />
          </section>
        </div>
      ) : null}

      {/* Simulated SMS broadcast log — shows what residents would receive. */}
      <div className="mt-6">
        <SmsBroadcastLog />
      </div>
    </main>
  );
}
