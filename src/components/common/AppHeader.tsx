"use client";

import Link from "next/link";
import { useAuth } from "@/components/common/AuthProvider";
import Icon from "@/components/common/Icon";
import { useLanguage } from "@/components/common/LanguageProvider";
import LanguageToggle from "@/components/common/LanguageToggle";
import ThemeToggle from "@/components/common/ThemeToggle";

export interface IAppHeaderProps {
  /** Optional slot rendered between the wordmark and the toggles. */
  children?: React.ReactNode;
}

/**
 * Top app bar matching the Stitch onboarding design: KlimaGuard PH wordmark
 * (teal "PH"), with the translate/EN-FIL language switch and theme toggle at
 * the right. Uses the dark command-center surface so it reads the same in
 * light and dark.
 */
export default function AppHeader({ children }: IAppHeaderProps) {
  const { session, ready } = useAuth();
  const { t } = useLanguage();
  // Officials = lgu | barangay (mirrors OFFICIAL_ROLES in the server-only
  // src/lib/auth/scope.ts; replicated inline to avoid importing server code).
  const isOfficial =
    ready && (session?.role === "lgu" || session?.role === "barangay");

  return (
    <header className="w-full border-b border-black/10 bg-cmd-surface dark:border-white/10">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-3 py-2 sm:gap-3 sm:px-6 sm:py-3">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-teal"
        >
          <span className="inline-flex size-7 items-center justify-center rounded-md bg-teal/15 text-teal">
            <Icon name="shield" size={18} />
          </span>
          <span className="truncate font-heading text-base font-bold text-cmd-heading">
            KlimaGuard <span className="text-teal">PH</span>
          </span>
        </Link>

        {children}

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {isOfficial ? (
            <Link
              href="/dashboard"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-2.5 font-ui text-sm font-semibold text-teal hover:bg-teal/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal sm:px-3"
            >
              <Icon name="command" size={18} />
              <span>{t("nav.dashboard")}</span>
            </Link>
          ) : null}
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
