"use client";

import { useRouter } from "next/navigation";

import { Icon, useAuth, useLanguage } from "@/components/common";
import { BARANGAY_MODULES } from "@/lib/barangay";
import { ROLE_NAV } from "@/lib/resident/residentData";
import type { IBarangayView } from "@/types";

export interface IBarangaySidebarProps {
  activeView: IBarangayView;
  onSelectView: (view: IBarangayView) => void;
  barangay: string;
  /** The signed-in official's name — shown under the role. */
  name?: string;
}

/**
 * Left sidebar for the Barangay Official dashboard. Same pattern as the
 * Resident sidebar: the signed-in user's OWN role only (from the server
 * session, not switchable — other roles are never listed), the Active
 * Modules list for the barangay scope, log out, and the telemetry footer.
 */
export default function BarangaySidebar({
  activeView,
  onSelectView,
  barangay,
  name,
}: IBarangaySidebarProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const { signOut } = useAuth();

  async function onLogout() {
    // Ends the server session (deletes the DB row + clears the cookie).
    await signOut();
    try {
      window.localStorage.removeItem("klimaguard-onboarding");
    } catch {
      // ignore storage failures (privacy mode)
    }
    router.replace("/signin");
  }

  // Only the Barangay Official role — no Resident/Farmer/Municipal entries.
  const visibleRoles = ROLE_NAV.filter((r) => r.role === "barangay");

  return (
    <aside className="w-full shrink-0 rounded-xl bg-cmd-surface p-4 lg:w-64">
      <p className="text-[10px] font-bold uppercase tracking-wide text-cmd-muted">
        {t("res.operationalRole")}
      </p>
      <ul className="mt-2 space-y-1">
        {visibleRoles.map((r) => (
          <li key={r.role}>
            <div
              aria-current="page"
              className="flex w-full flex-col items-start gap-0.5 rounded-lg bg-teal px-3 py-2 text-sm text-white"
            >
              <span className="flex items-center gap-2">
                <Icon name={r.icon} size={16} />
                {t(r.labelKey)}
              </span>
              {name ? (
                <span className="pl-6 text-[11px] font-normal text-white/80">{name}</span>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] text-cmd-muted">
        {t("brgy.sidebar.scope", { barangay })}
      </p>

      <p className="mt-5 text-[10px] font-bold uppercase tracking-wide text-cmd-muted">
        {t("res.activeModules")}
      </p>
      <nav aria-label={t("res.activeModules")}>
        <ul className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-1">
          {BARANGAY_MODULES.map((m) => {
            const isActive = m.id === activeView;
            return (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => onSelectView(m.id)}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex min-h-[44px] w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal ${
                    isActive
                      ? "bg-cmd-tile font-semibold text-cmd-heading"
                      : "text-cmd-muted hover:bg-cmd-tile hover:text-cmd-heading"
                  }`}
                >
                  <Icon name={m.icon} size={16} />
                  {t(m.labelKey)}
                </button>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => void onLogout()}
              className="flex min-h-[44px] w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-cmd-muted transition-colors hover:bg-cmd-tile hover:text-cmd-heading focus:outline-none focus-visible:ring-2 focus-visible:ring-teal"
            >
              <Icon name="log-out" size={16} />
              {t("res.logout")}
            </button>
          </li>
        </ul>
      </nav>

      <div className="mt-5 rounded-lg border border-black/10 bg-cmd-tile p-3 dark:border-white/10">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wide text-cmd-muted">
            {t("res.telemetry")}
          </span>
          <span className="flex items-center gap-1 text-[10px] font-semibold text-teal">
            <span className="inline-block size-2 animate-pulse rounded-full bg-teal" />
            {t("res.online")}
          </span>
        </div>
        <p className="mt-1 truncate text-xs font-medium text-cmd-heading">Brgy. {barangay}</p>
      </div>
    </aside>
  );
}
