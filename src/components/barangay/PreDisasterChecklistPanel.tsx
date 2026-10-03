"use client";

import { Icon, useLanguage } from "@/components/common";
import { useNow } from "@/hooks";
import {
  activateChecklist,
  agoKey,
  CHECKLIST_LABEL_KEY,
  percent,
  toggleChecklist,
  widthClass,
} from "@/lib/barangay";
import BarangayCard from "./BarangayCard";
import { useBarangayOps } from "./BarangayOpsProvider";

export interface IPreDisasterChecklistPanelProps {
  barangay: string;
  /** True while a hazard is active (emergency styling). */
  emergency: boolean;
}

/**
 * M3/M7 barangay pre-disaster checklist (RA 10121). Auto-activated by the
 * dashboard when a signal ≥2 is raised; can also be activated manually.
 */
export default function PreDisasterChecklistPanel({
  barangay,
  emergency,
}: IPreDisasterChecklistPanelProps) {
  const { t } = useLanguage();
  const { state, update } = useBarangayOps();
  const now = useNow(30_000);
  const done = state.checklist.filter((c) => c.done).length;
  const total = state.checklist.length;
  const activated = state.checklistActivatedAt;
  const ago = activated ? agoKey(activated, now) : null;

  return (
    <BarangayCard
      title={t("brgy.check.title")}
      icon="check"
      badge={t("brgy.check.progress", { done, total })}
      tone={emergency && done < total ? "alert" : "normal"}
      source={t("brgy.source.ops", { barangay })}
    >
      {activated && ago ? (
        <p className="text-xs font-medium text-teal">
          {t("brgy.check.activatedAt", { ago: t(ago.key, { n: ago.n }) })}
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm text-cmd-muted">{t("brgy.check.inactive")}</p>
          <button
            type="button"
            onClick={() =>
              update((s, at) => activateChecklist(s, at), {
                what: t("brgy.audit.checklistOn"),
                category: "drrm",
              })
            }
            className="min-h-[44px] rounded-lg bg-teal px-4 text-sm font-semibold text-white hover:opacity-90"
          >
            {t("brgy.check.activate")}
          </button>
        </div>
      )}

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-cmd-tile">
        <div className={`h-full rounded-full bg-teal ${widthClass(percent(done, total))}`} />
      </div>

      <ul className="mt-3 space-y-1.5">
        {state.checklist.map((item) => {
          const labelKey = CHECKLIST_LABEL_KEY[item.id];
          if (!labelKey) {
            return null;
          }
          const label = t(labelKey);
          return (
            <li key={item.id}>
              <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg bg-cmd-tile px-3 py-2 text-sm text-cmd-heading">
                <input
                  type="checkbox"
                  checked={item.done}
                  disabled={!activated}
                  onChange={() =>
                    update((s) => toggleChecklist(s, item.id), {
                      what: t("brgy.audit.checklistItem", {
                        item: label,
                        state: item.done ? t("brgy.notDone") : t("brgy.done"),
                      }),
                      category: "drrm",
                    })
                  }
                  className="size-5 shrink-0 accent-teal"
                />
                <span className={item.done ? "text-cmd-muted line-through" : ""}>{label}</span>
                {item.done ? (
                  <span className="ml-auto text-teal">
                    <Icon name="check" size={16} />
                  </span>
                ) : null}
              </label>
            </li>
          );
        })}
      </ul>
    </BarangayCard>
  );
}
