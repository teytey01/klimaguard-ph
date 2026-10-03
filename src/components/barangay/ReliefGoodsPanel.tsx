"use client";

import { useState } from "react";

import { useLanguage } from "@/components/common";
import {
  addDistribution,
  manilaTime,
  percent,
  PUROK_OPTIONS,
  RELIEF_LABEL_KEY,
  setReliefQty,
  widthClass,
} from "@/lib/barangay";
import type { IBarangayReliefId } from "@/types";
import type { ITranslationKey } from "@/lib/i18n";
import BarangayCard from "./BarangayCard";
import { newBarangayId, useBarangayOps } from "./BarangayOpsProvider";

export interface IReliefGoodsPanelProps {
  barangay: string;
}

const FIELD_CLASS =
  "mt-1 min-h-[44px] w-full rounded-lg border border-black/10 bg-cmd-tile px-3 text-sm text-cmd-heading focus:border-teal focus:outline-none focus-visible:ring-2 focus-visible:ring-teal dark:border-white/15";

/** M7: barangay relief inventory (editable) + relief distribution tracker. */
export default function ReliefGoodsPanel({ barangay }: IReliefGoodsPanelProps) {
  const { t } = useLanguage();
  const { state, update, actor } = useBarangayOps();
  const source = t("brgy.source.ops", { barangay });

  // Inventory drafts (string inputs), keyed by relief id.
  const [qty, setQty] = useState<Record<IBarangayReliefId, string>>(() => ({
    food: "",
    water: "",
    firstAid: "",
  }));
  const [savedMsg, setSavedMsg] = useState(false);

  // Distribution form.
  const [purok, setPurok] = useState(state.population[0]?.purok ?? PUROK_OPTIONS[2]);
  const [served, setServed] = useState("");
  const [target, setTarget] = useState(
    String(state.population.find((p) => p.purok === purok)?.families ?? ""),
  );
  const [packs, setPacks] = useState("");
  const [distError, setDistError] = useState<ITranslationKey | null>(null);

  function saveCount(e: React.FormEvent) {
    e.preventDefault();
    for (const item of state.relief) {
      const raw = qty[item.id];
      if (raw.trim() === "") {
        continue;
      }
      const n = Number(raw);
      if (!Number.isFinite(n) || n < 0 || n === item.quantity) {
        continue;
      }
      update((s, at) => setReliefQty(s, item.id, n, actor, at), {
        what: t("brgy.audit.relief", { item: t(RELIEF_LABEL_KEY[item.id]), qty: Math.round(n) }),
        category: "relief",
      });
    }
    setQty({ food: "", water: "", firstAid: "" });
    setSavedMsg(true);
  }

  function recordDistribution(e: React.FormEvent) {
    e.preventDefault();
    const input = {
      purok,
      familiesServed: Number(served),
      familiesTarget: Number(target),
      packsGiven: Number(packs),
    };
    // Validate against the current state first so the error can be shown.
    const check = addDistribution(state, input, new Date(), "check");
    if (check.error) {
      setDistError(check.error === "stock" ? "brgy.relief.errStock" : "brgy.relief.errInvalid");
      return;
    }
    setDistError(null);
    const id = newBarangayId();
    update((s, at) => addDistribution(s, input, at, id).state, {
      what: t("brgy.audit.distribution", {
        packs: Math.round(input.packsGiven),
        families: Math.round(input.familiesServed),
        purok,
      }),
      category: "relief",
    });
    setServed("");
    setPacks("");
  }

  const totalServed = state.distributions.reduce((s, d) => s + d.familiesServed, 0);
  const needed = state.population.reduce((s, p) => s + p.families, 0);

  // Per-purok progress (latest target per purok, summed served).
  const byPurok = new Map<string, { served: number; target: number }>();
  for (const d of [...state.distributions].reverse()) {
    const cur = byPurok.get(d.purok) ?? { served: 0, target: d.familiesTarget };
    byPurok.set(d.purok, { served: cur.served + d.familiesServed, target: d.familiesTarget });
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <BarangayCard title={t("brgy.relief.title")} icon="warehouse" source={source}>
        <p className="text-sm text-cmd-muted">{t("brgy.relief.subtitle")}</p>
        <form onSubmit={saveCount} className="mt-3 space-y-2">
          {state.relief.map((item) => (
            <label
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-cmd-tile px-3 py-2"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-cmd-heading">
                  {t(RELIEF_LABEL_KEY[item.id])}
                </span>
                <span className="block text-xs text-cmd-muted">
                  {item.quantity} {item.unit} · {item.note}
                </span>
              </span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={qty[item.id]}
                placeholder={String(item.quantity)}
                onChange={(e) => {
                  setSavedMsg(false);
                  setQty((q) => ({ ...q, [item.id]: e.target.value }));
                }}
                aria-label={t(RELIEF_LABEL_KEY[item.id])}
                className="min-h-[44px] w-28 rounded-lg border border-black/10 bg-cmd-surface px-3 text-sm text-cmd-heading focus:border-teal focus:outline-none focus-visible:ring-2 focus-visible:ring-teal dark:border-white/15"
              />
            </label>
          ))}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="submit"
              className="min-h-[44px] rounded-lg bg-teal px-4 text-sm font-semibold text-white hover:opacity-90"
            >
              {t("brgy.relief.save")}
            </button>
            {savedMsg ? (
              <span role="status" className="text-sm text-teal">
                {t("brgy.saved")}
              </span>
            ) : null}
          </div>
        </form>
        <p className="mt-3 text-xs text-cmd-muted">
          {t("brgy.ops.lastCount", {
            by: state.stockCount.by,
            time: manilaTime(state.stockCount.at),
          })}
        </p>
      </BarangayCard>

      <BarangayCard title={t("brgy.relief.distTitle")} icon="box" source={source}>
        <p className="text-sm font-medium text-teal">
          {t("brgy.relief.totalServed", { served: totalServed, needed })}
        </p>
        <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-cmd-tile">
          <div className={`h-full rounded-full bg-teal ${widthClass(percent(totalServed, needed))}`} />
        </div>

        <form onSubmit={recordDistribution} className="mt-4 grid grid-cols-2 gap-2" noValidate>
          <label className="col-span-2 text-xs font-medium text-cmd-muted">
            {t("brgy.dispatch.purok")}
            <select
              value={purok}
              onChange={(e) => {
                setPurok(e.target.value);
                const fam = state.population.find((p) => p.purok === e.target.value)?.families;
                if (fam) {
                  setTarget(String(fam));
                }
              }}
              className={FIELD_CLASS}
            >
              {PUROK_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-cmd-muted">
            {t("brgy.relief.served")}
            <input type="number" min={1} value={served} onChange={(e) => setServed(e.target.value)} className={FIELD_CLASS} />
          </label>
          <label className="text-xs font-medium text-cmd-muted">
            {t("brgy.relief.target")}
            <input type="number" min={1} value={target} onChange={(e) => setTarget(e.target.value)} className={FIELD_CLASS} />
          </label>
          <label className="col-span-2 text-xs font-medium text-cmd-muted">
            {t("brgy.relief.packs")}
            <input type="number" min={1} value={packs} onChange={(e) => setPacks(e.target.value)} className={FIELD_CLASS} />
          </label>
          {distError ? (
            <p role="alert" className="col-span-2 text-xs text-alert">
              {t(distError)}
            </p>
          ) : null}
          <button
            type="submit"
            className="col-span-2 min-h-[44px] rounded-lg bg-teal px-4 text-sm font-semibold text-white hover:opacity-90"
          >
            {t("brgy.relief.add")}
          </button>
        </form>

        {byPurok.size === 0 ? (
          <p className="mt-4 text-sm text-cmd-muted">{t("brgy.relief.empty")}</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {[...byPurok.entries()].map(([name, v]) => {
              const pct = percent(v.served, v.target);
              return (
                <li key={name} className="rounded-lg bg-cmd-tile px-3 py-2">
                  <p className="flex justify-between text-sm text-cmd-heading">
                    <span>{name}</span>
                    <span>
                      {v.served}/{v.target} · {pct}%
                    </span>
                  </p>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-cmd-surface">
                    <div className={`h-full rounded-full bg-teal ${widthClass(pct)}`} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </BarangayCard>
    </div>
  );
}
