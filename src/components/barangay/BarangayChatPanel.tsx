"use client";

import { useLanguage } from "@/components/common";
import { ChatWidget } from "@/components/chat";

export type IBarangayChatPanelProps = Record<string, never>;

/** M1 KlimaChat inside the Barangay Official dashboard. */
export default function BarangayChatPanel() {
  const { t } = useLanguage();
  return (
    <section className="overflow-hidden rounded-xl bg-cmd-surface">
      <div className="px-4 pt-4">
        <h2 className="text-base font-semibold text-cmd-heading">{t("brgy.chat.title")}</h2>
        <p className="text-sm text-cmd-muted">{t("brgy.chat.subtitle")}</p>
      </div>
      <ChatWidget revealOnMount />
    </section>
  );
}
