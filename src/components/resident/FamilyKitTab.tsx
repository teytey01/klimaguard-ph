"use client";

import { useEffect, useState } from "react";
import { Icon, useLanguage } from "@/components/common";
import { FAMILY_KIT_ITEMS } from "@/lib/resident/residentData";

export interface IFamilyKitTabProps {
  className?: string;
}

const STORAGE_KEY = "klimaguard-family-kit";

/**
 * M4 go-bag / family emergency kit checklist. Interactive, persisted to
 * localStorage so a resident's progress survives reloads. Filipino-first.
 */
export default function FamilyKitTab({ className }: IFamilyKitTabProps) {
  const { t } = useLanguage();
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
        // ignore storage failures
      }
      return next;
    });
  }

  const doneCount = FAMILY_KIT_ITEMS.filter((i) => checked[i.id]).length;
  const total = FAMILY_KIT_ITEMS.length;
  const pct = Math.round((doneCount / total) * 100);

  return (
    <section className={`rounded-xl bg-cmd-surface p-5 ${className ?? ""}`}>
      <header className="flex items-start gap-3">
        <span className="mt-0.5 rounded-lg bg-teal/15 p-2 text-teal">
          <Icon name="box" size={20} />
        </span>
        <div className="flex-1">
          <h2 className="text-base font-semibold text-cmd-heading">
            {t("res.kit.title")}
          </h2>
          <p className="mt-1 text-sm text-cmd-muted">{t("res.kit.subtitle")}</p>
        </div>
      </header>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-cmd-muted">
          <span>{t("res.kit.progress", { done: doneCount, total })}</span>
          <span>{pct}%</span>
        </div>
        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-cmd-tile">
          <div
            className="h-full rounded-full bg-teal transition-all"
            style={{ width: `${pct}%` }}
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>

      <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {FAMILY_KIT_ITEMS.map((item) => {
          const isChecked = ready && Boolean(checked[item.id]);
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => toggle(item.id)}
                aria-pressed={isChecked}
                className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left text-sm transition-colors ${
                  isChecked
                    ? "border-teal/40 bg-teal/10 text-cmd-heading"
                    : "border-black/10 bg-cmd-tile text-cmd-heading hover:border-teal/40 dark:border-white/10"
                }`}
              >
                <span
                  className={`flex size-5 shrink-0 items-center justify-center rounded border ${
                    isChecked
                      ? "border-teal bg-teal text-white"
                      : "border-cmd-muted/50 text-transparent"
                  }`}
                >
                  <Icon name="check" size={13} />
                </span>
                {t(item.labelKey)}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
