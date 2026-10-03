"use client";

import { useEffect, useState } from "react";

import { Icon, useLanguage } from "@/components/common";
import { FARM_SAFETY_SECTIONS } from "@/lib/agriculture/farmHazard";
import { progressWidthClass } from "@/lib/utils/progressWidth";

export interface IFarmSafetyTabProps {
  className?: string;
}

const STORAGE_KEY = "klimaguard-farm-safety";

/**
 * Farmer-only M4 safety advisor: crop protection steps, livestock evacuation
 * guide, and farm equipment securing checklist. Progress persists locally.
 */
export default function FarmSafetyTab({ className }: IFarmSafetyTabProps) {
  const { language } = useLanguage();
  const fil = language === "fil";
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let restored: Record<string, boolean> = {};
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        restored = JSON.parse(raw) as Record<string, boolean>;
      }
    } catch {
      restored = {};
    }
    let active = true;
    void Promise.resolve().then(() => {
      if (active) {
        setChecked(restored);
        setReady(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  function toggle(id: string) {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Best-effort persistence.
      }
      return next;
    });
  }

  function reset() {
    setChecked({});
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  return (
    <div className={`space-y-4 ${className ?? ""}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-cmd-muted">
          {fil
            ? "Gabay sa kaligtasan ng bukid, hayop at kagamitan bago at habang may bagyo."
            : "Safety guide for your farm, animals and equipment before and during a storm."}
        </p>
        <button
          type="button"
          onClick={reset}
          className="min-h-[44px] rounded-lg px-3 text-xs font-medium text-teal hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-teal"
        >
          {fil ? "I-reset ang checklist" : "Reset checklist"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {FARM_SAFETY_SECTIONS.map((section) => {
          const done = section.items.filter((item) => ready && checked[item.id]).length;
          const pct = Math.round((done / section.items.length) * 100);
          return (
            <section key={section.id} className="flex flex-col rounded-xl bg-cmd-surface p-5">
              <header className="flex items-start gap-3">
                <span className="rounded-lg bg-teal/15 p-2 text-teal">
                  <Icon name={section.icon} size={20} />
                </span>
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-cmd-heading">{section.title[language]}</h2>
                  <p className="text-xs text-cmd-muted">{section.subtitle[language]}</p>
                </div>
              </header>

              <div className="mt-3">
                <div className="flex justify-between text-xs text-cmd-muted">
                  <span>
                    {done}/{section.items.length} {fil ? "tapos" : "done"}
                  </span>
                  <span>{pct}%</span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-cmd-tile">
                  <div
                    className={`h-full rounded-full bg-teal ${progressWidthClass(pct)}`}
                    role="progressbar"
                    aria-valuenow={pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${section.title[language]}: ${pct}%`}
                  />
                </div>
              </div>

              <ul className="mt-3 space-y-2">
                {section.items.map((item) => {
                  const isChecked = ready && Boolean(checked[item.id]);
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => toggle(item.id)}
                        aria-pressed={isChecked}
                        className={`flex min-h-[44px] w-full items-start gap-3 rounded-lg border p-3 text-left text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal ${
                          isChecked
                            ? "border-teal/40 bg-teal/10 text-cmd-heading"
                            : "border-black/10 bg-cmd-tile text-cmd-heading hover:border-teal/40 dark:border-white/10"
                        }`}
                      >
                        <span
                          className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border ${
                            isChecked ? "border-teal bg-teal text-white" : "border-cmd-muted/50 text-transparent"
                          }`}
                        >
                          <Icon name="check" size={13} />
                        </span>
                        <span className="font-sans">{item.text[language]}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      <p className="text-right text-xs text-cmd-muted">
        {fil ? "Gabay mula sa DA, PhilRice at Bureau of Animal Industry (demo)" : "Guidance from DA, PhilRice and Bureau of Animal Industry (demo)"}
      </p>
    </div>
  );
}
