import { ChatWidget } from "@/components/chat";
import { WeatherPanel } from "@/components/weather";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-app-bg md:flex-row">
      <section className="w-full overflow-y-auto p-4 md:w-[40%] md:max-w-[40%]">
        <WeatherPanel />
      </section>
      <ChatWidget />
    </div>
  );
}
