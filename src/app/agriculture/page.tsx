import { AgriculturePanel } from "@/components/agriculture";

export default function AgriculturePage() {
  return (
    <div className="flex flex-1 flex-col bg-app-bg">
      <section className="w-full overflow-y-auto p-4 md:max-w-2xl">
        <AgriculturePanel />
      </section>
    </div>
  );
}
