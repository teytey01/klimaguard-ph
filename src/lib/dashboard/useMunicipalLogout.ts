"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/common/AuthProvider";

/**
 * Log out of the municipal command center: end the server session, clear the
 * onboarding draft, and return to /signin. Shared by the sidebar + Settings.
 */
export function useMunicipalLogout(): () => Promise<void> {
  const router = useRouter();
  const { signOut } = useAuth();

  return useCallback(async () => {
    await signOut();
    try {
      window.localStorage.removeItem("klimaguard-onboarding");
    } catch {
      // ignore storage failures (privacy mode)
    }
    router.replace("/signin");
  }, [router, signOut]);
}
