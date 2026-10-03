import Icon from "@/components/common/Icon";
import type { IMunSiteTile } from "@/lib/dashboard/dashboardData";

export interface IMunicipalSiteTileProps {
  tile: IMunSiteTile;
}

/**
 * "Photo-style" field tile from the Stitch design, drawn with a brand
 * gradient + large icon (no external images). Readable in both themes.
 */
export default function MunicipalSiteTile({ tile }: IMunicipalSiteTileProps) {
  return (
    <article
      className={`relative flex h-32 overflow-hidden rounded-xl bg-gradient-to-br ${tile.gradient} p-4 text-white shadow-sm`}
    >
      <span className="absolute -right-3 -bottom-4 text-white/20" aria-hidden="true">
        <Icon name={tile.icon} size={96} />
      </span>
      <div className="relative mt-auto">
        <p className="text-sm font-bold">{tile.title}</p>
        <span className="mt-1 inline-flex items-center gap-1 rounded bg-black/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
          <span className="inline-block size-1.5 animate-pulse rounded-full bg-white" />
          {tile.status}
        </span>
      </div>
    </article>
  );
}
