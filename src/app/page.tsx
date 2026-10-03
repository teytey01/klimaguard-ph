"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { ChatWidget } from "@/components/chat";
import { WeatherPanel } from "@/components/weather";
import { AppHeader, HotlineFooter, useAuth } from "@/components/common";

/**
 * Home entry. Unauthenticated visitors are routed to the sign-in → onboarding
 * flow; verified users see the resident home (weather + chat) wrapped in the
 * shared app header/footer shell from the Stitch design.
 */
export default function Home() {
  const { session, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !session?.verified) {
      router.replace("/signin");
    }
  }, [ready, session, router]);

  // Avoid a flash of home content before the auth check resolves.
  if (!ready || !session?.verified) {
    return <div className="flex-1 bg-app-bg" aria-hidden="true" />;
  }

  return (
    <div className="flex min-h-dvh flex-col bg-app-bg">
      <AppHeader />
      {/* Mobile: weather then chat, stacked. md+: side by side; the chat card
          keeps a fixed height and scrolls internally, so it never stretches. */}
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 p-4 md:flex-row md:items-start">
        <section className="w-full min-w-0 md:w-2/5">
          <WeatherPanel />
        </section>
        <section className="w-full min-w-0 md:sticky md:top-4 md:w-3/5">
          {/* md+: fit beside the weather panel, leaving room for the alert
              banner, header and footer so the typing field stays visible. */}
          <ChatWidget className="md:h-[calc(100dvh-12rem)] md:max-h-[720px]" />
        </section>
      </main>
      <HotlineFooter />
    </div>
  );
}
