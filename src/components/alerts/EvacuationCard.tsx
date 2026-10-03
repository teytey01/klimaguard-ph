import type { IEvacuationCenter } from "@/types";

export interface IEvacuationCardProps {
  center: IEvacuationCenter;
}

export function EvacuationCard({ center }: IEvacuationCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 text-gray-800 shadow-sm dark:border-white/10 dark:bg-[#16263D] dark:text-[#F7FAFC]">
      <h3 className="text-base font-bold text-[#1A365D] dark:text-[#F7FAFC]">
        {center.name}
      </h3>
      <dl className="mt-3 space-y-2 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="font-semibold text-[#38B2AC]">Layo</dt>
          <dd>{center.distance}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="font-semibold text-[#38B2AC]">Kapasidad</dt>
          <dd>{center.capacity}</dd>
        </div>
      </dl>
      <a
        href={center.directionsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md bg-[#38B2AC] px-4 py-2 text-sm font-semibold text-white"
      >
        Direksyon
      </a>
    </div>
  );
}
