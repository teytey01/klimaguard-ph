"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { BarangayDashboard } from "@/components/barangay";
import { MunicipalCommandView } from "@/components/dashboard";
import { ResidentDashboard } from "@/components/resident";
import { AppHeader, HotlineFooter, useAuth } from "@/components/common";

/**
 * Role-aware dashboard. The role comes ONLY from the server session — never a
 * query param or localStorage — so a resident can't reach official views.
 * lgu → MDRRMO command center; barangay → Barangay Official dashboard (own
 * barangay only); resident/farmer → the tabbed Resident view. A `?role=` in
 * the URL is ignored entirely, so editing it can't switch dashboards.
 */
export default function DashboardPage() {
  const { session, ready } = useAuth();
  const router = useRouter();

  const needsOnboarding =
    (session?.role === "resident" || session?.role === "farmer") &&
    !session.onboarded;

  useEffect(() => {
    if (!ready) {
      return;
    }
    if (!session?.verified) {
      router.replace("/signin");
    } else if (needsOnboarding) {
      router.replace("/onboarding");
    }
  }, [ready, session, needsOnboarding, router]);

  if (!ready || !session?.verified || needsOnboarding) {
    return <div className="min-h-screen bg-surface-2" aria-hidden="true" />;
  }

  const role = session.role;
  const barangay = session.location?.barangay || session.location?.municipality || "";

  if (role === "lgu") {
    return <MunicipalCommandView name={session.name} />;
  }

  if (role === "barangay") {
    // Scope is the official's pre-assigned barangay from the server session.
    return (
      <div className="flex min-h-screen flex-col bg-surface-2">
        <AppHeader />
        <main className="flex-1 px-4 py-6 sm:px-6">
          <div className="mx-auto w-full max-w-7xl">
            <BarangayDashboard
              barangay={session.location?.barangay || "San Roque"}
              municipality={session.location?.municipality || "Santa Cruz"}
              province={session.location?.province || "Laguna"}
              name={session.name}
            />
          </div>
        </main>
        <HotlineFooter />
      </div>
    );
  }

  // Resident (default) — also the farmer view.
  return (
    <div className="flex min-h-screen flex-col bg-surface-2">
      <AppHeader />
      <main className="flex-1 px-4 py-6 sm:px-6">
        <div className="mx-auto w-full max-w-6xl">
          <ResidentDashboard
            barangay={barangay}
            role={role}
            name={session.name}
          />
        </div>
      </main>
      <HotlineFooter />
    </div>
  );
}
