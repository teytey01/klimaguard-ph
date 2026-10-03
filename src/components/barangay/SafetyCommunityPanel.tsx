"use client";

import { useState } from "react";

import { Icon, useLanguage } from "@/components/common";
import { BARANGAY_HOTLINE, SAFETY_STEPS } from "@/lib/barangay";
import { smsProvider } from "@/lib/sms";
import type { IBarangayView, IHazardAlert } from "@/types";
import BarangayCard from "./BarangayCard";
import { useBarangayOps } from "./BarangayOpsProvider";

export interface ISafetyCommunityPanelProps {
  barangay: string;
  alert: IHazardAlert | null;
  onSelectView: (view: IBarangayView) => void;
}

/**
 * M4 Safety + community management (one compact panel): resident alert
 * broadcast template (simulated SMS, audited) and the community evacuation
 * / post-disaster DANA guide steps.
 */
export default function SafetyCommunityPanel({
  barangay,
  alert,
  onSelectView,
}: ISafetyCommunityPanelProps) {
  const { t } = useLanguage();
  const { state, update } = useBarangayOps();
  const center = state.centers.find((c) => c.active)?.name ?? state.centers[0]?.name ?? "";
  const template = alert
    ? t("brgy.safety.templateAlert", {
        signal: alert.signalLevel,
        typhoon: alert.typhoonName,
        barangay,
        center,
        hotline: BARANGAY_HOTLINE,
      })
    : t("brgy.safety.templateNormal", { barangay, center, hotline: BARANGAY_HOTLINE });

  // null = untouched → follows the live template (alert / language changes).
  const [draft, setDraft] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "sent" | "empty">("idle");
  const message = draft ?? template;

  function broadcast(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) {
      setStatus("empty");
      return;
    }
    const target = t("brgy.safety.targetFlood");
    smsProvider.send([target], message.trim(), "hazard-alert", `Barangay ${barangay} BDRRMC`);
    update((s) => ({ ...s }), {
      what: t("brgy.audit.broadcast", { target }),
      category: "safety",
    });
    setStatus("sent");
  }

  return (
    <BarangayCard
      title={t("brgy.safety.title")}
      icon="broadcast"
      tone={alert ? "alert" : "normal"}
      source={t("brgy.source.ops", { barangay })}
    >
      <form onSubmit={broadcast}>
        <label className="block text-xs font-medium text-cmd-muted">
          {t("brgy.safety.broadcastTitle")} → {t("brgy.safety.targetFlood")}
          <textarea
            value={message}
            onChange={(e) => {
              setStatus("idle");
              setDraft(e.target.value.slice(0, 480));
            }}
            rows={4}
            className="mt-1 w-full rounded-lg border border-black/10 bg-cmd-tile p-3 text-sm text-cmd-heading focus:border-teal focus:outline-none focus-visible:ring-2 focus-visible:ring-teal dark:border-white/15"
          />
        </label>
        {status === "empty" ? (
          <p role="alert" className="text-xs text-alert">
            {t("brgy.safety.empty")}
          </p>
        ) : status === "sent" ? (
          <p role="status" className="text-xs text-teal">
            {t("brgy.safety.sent")}
          </p>
        ) : null}
        <button
          type="submit"
          className={`mt-2 inline-flex min-h-[44px] items-center gap-2 rounded-lg px-4 text-sm font-semibold text-white hover:opacity-90 ${
            alert ? "bg-alert" : "bg-teal"
          }`}
        >
          <Icon name="broadcast" size={16} />
          {t("brgy.safety.send")}
        </button>
      </form>

      <p className="mt-4 text-[11px] font-semibold uppercase text-cmd-muted">
        {t("brgy.safety.evacGuide")} / {t("brgy.safety.danaGuide")}
      </p>
      <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm text-cmd-heading">
        {SAFETY_STEPS.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <button
        type="button"
        onClick={() => onSelectView("drrm")}
        className="mt-3 min-h-[44px] rounded-lg border border-teal/40 px-4 text-sm font-semibold text-teal"
      >
        {t("brgy.safety.openDana")}
      </button>
    </BarangayCard>
  );
}
