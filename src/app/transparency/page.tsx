import type { Metadata } from "next";

import { AppHeader, HotlineFooter } from "@/components/common";
import ProjectTracker from "@/components/transparency/ProjectTracker";

export const metadata: Metadata = {
  title: "Mga Proyekto sa Klima at DRRM — KlimaGuard PH",
  description:
    "Tingnan kada proyekto kung saan napupunta ang pondo para sa klima at kaligtasan sa inyong lugar.",
};

/** Public per-project transparency page (M11). No sign-in needed. */
export default function TransparencyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-surface-2">
      <AppHeader />
      <main className="flex-1 px-4 py-6 sm:px-6">
        <div className="mx-auto w-full max-w-5xl">
          <ProjectTracker />
        </div>
      </main>
      <HotlineFooter />
    </div>
  );
}
