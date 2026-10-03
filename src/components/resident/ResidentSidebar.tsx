"use client";

import { useRouter } from "next/navigation";
import { Icon, useAuth, useLanguage } from "@/components/common";
import { ROLE_NAV, RESIDENT_MODULES } from "@/lib/resident/residentData";
import type { IResidentTab } from "@/lib/resident/residentData";

import type { IUserRole } from "@/types";

export interface IResidentSidebarProps {
  activeTab: IResidentTab;
  onSelectTab: (tab: IResidentTab) => void;
  barangay: string;
  /** The signed-in user's role — highlighted in the role switcher. */
  role?: IUserRole;
  /** The signed-in user's name — shown with the active role. */
  name?: string;
}

/**
 * Left sidebar for the Resident dashboard: the signed-in user's own role (from
 * the server session — not switchable), the Active Modules list (jumps to the
 * matching tab), log out, and the telemetry status footer. Theme-aware.
 */
export default function ResidentSidebar({
  activeTab,
  onSelectTab,
  barangay,
  role = "resident",
  name,
}: IResidentSidebarProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const { signOut } = useAuth();

  async function onLogout() {
    // Ends the server session (deletes the DB row + clears the cookie).
    await signOut();
    try {
      // Also clear the onboarding draft so the next user starts fresh.
      window.localStorage.removeItem("klimaguard-onboarding");
    } catch {
      // ignore storage failures (privacy mode)
    }
    router.replace("/signin");
  }

  // A Farmer (like a Resident) is a single-role consumer per the KlimaGuard
  // Feature Access Matrix — only their own role is a valid view, so the role
  // switcher shows that role alone instead of exposing the other roles.
  const visibleRoles = ROLE_NAV.filter((r) => r.role === role);

  return (
    <aside className="w-full shrink-0 rounded-xl bg-cmd-surface p-4 lg:w-64">
      <p className="text-[10px] font-bold uppercase tracking-wide text-cmd-muted">
        {t("res.operationalRole")}
      </p>
      <ul className="mt-2 space-y-1">
        {visibleRoles.map((r) => (
          // The role is fixed by the account's server-side credentials, so it
          // is a label, not a switcher.
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
                <span className="pl-6 text-[11px] font-normal text-white/80">
                  {name}
                </span>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      {/* Mobile: the top tab bar already covers module navigation, so keep the
          sidebar compact (role + log out) and show the full list on lg+. */}
      <button
        type="button"
        onClick={onLogout}
        className="mt-2 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-black/10 px-3 py-2 text-sm text-cmd-muted hover:bg-cmd-tile hover:text-cmd-heading focus:outline-none focus-visible:ring-2 focus-visible:ring-teal lg:hidden dark:border-white/10"
      >
        <Icon name="log-out" size={16} />
        {t("res.logout")}
      </button>

      <p className="mt-5 hidden text-[10px] font-bold uppercase tracking-wide text-cmd-muted lg:block">
        {t("res.activeModules")}
      </p>
      <ul className="mt-2 hidden space-y-1 lg:block">
        {RESIDENT_MODULES.map((m) => {
          const isActive = m.tab === activeTab;
          return (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => onSelectTab(m.tab)}
                className={`flex min-h-[44px] w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-cmd-tile text-cmd-heading"
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
            onClick={onLogout}
            className="flex min-h-[44px] w-full items-center gap-2 rounded-lg px-3 py-2 pl-9 text-sm text-cmd-muted transition-colors hover:bg-cmd-tile hover:text-cmd-heading focus:outline-none focus-visible:ring-2 focus-visible:ring-teal"
          >
            <Icon name="log-out" size={16} />
            {t("res.logout")}
          </button>
        </li>
      </ul>

      <div className="mt-5 hidden rounded-lg border border-black/10 bg-cmd-tile p-3 lg:block dark:border-white/10">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wide text-cmd-muted">
            {t("res.telemetry")}
          </span>
          <span className="flex items-center gap-1 text-[10px] font-semibold text-teal">
            <span className="inline-block size-2 animate-pulse rounded-full bg-teal" />
            {t("res.online")}
          </span>
        </div>
        <p className="mt-1 truncate text-xs font-medium text-cmd-heading">
          Brgy. {barangay}
        </p>
      </div>
    </aside>
  );
}
