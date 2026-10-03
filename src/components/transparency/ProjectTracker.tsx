"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Icon, useLanguage } from "@/components/common";
import ProjectCard from "@/components/transparency/ProjectCard";
import ProjectDetail from "@/components/transparency/ProjectDetail";
import { PROJECT_STATUS_LABELS } from "@/lib/transparency/localProjects";
import type { ILocalProject, ILocalProjectsResponse, IProjectStatus } from "@/types";

export interface IProjectTrackerProps {
  /** Pre-select a barangay filter (e.g. the resident's own barangay). */
  initialBarangay?: string;
  className?: string;
}

const peso = new Intl.NumberFormat("fil-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

const ALL = "";

/**
 * M11 per-project transparency tracker for one locality. Lists every local
 * climate/DRRM project as a card (filterable by barangay and status) and
 * opens a full per-project detail view. Data comes from /api/transparency
 * (demo data, clearly labelled).
 */
export default function ProjectTracker({ initialBarangay, className }: IProjectTrackerProps) {
  const { t } = useLanguage();
  const [data, setData] = useState<ILocalProjectsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [barangay, setBarangay] = useState<string>(ALL);
  const [status, setStatus] = useState<IProjectStatus | typeof ALL>(ALL);
  const [selected, setSelected] = useState<ILocalProject | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const res = await fetch("/api/transparency");
        const body = (await res.json().catch(() => null)) as
          | (ILocalProjectsResponse & { error?: string })
          | null;
        if (!active) {
          return;
        }
        if (!res.ok || !body || body.error) {
          setError(body?.error ?? t("transparency.loadError"));
          return;
        }
        setError(null);
        setData(body);
        // Only pre-filter when the barangay actually has projects.
        if (initialBarangay && body.barangays.includes(initialBarangay)) {
          setBarangay(initialBarangay);
        }
      } catch {
        if (active) {
          setError(t("transparency.loadError"));
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [reloadKey, initialBarangay, t]);

  const retry = useCallback(() => {
    setError(null);
    setData(null);
    setReloadKey((key) => key + 1);
  }, []);

  const visible = useMemo(
    () =>
      (data?.projects ?? []).filter(
        (p) => (barangay === ALL || p.barangay === barangay) && (status === ALL || p.status === status),
      ),
    [data, barangay, status],
  );

  const totals = useMemo(
    () => ({
      budget: visible.reduce((sum, p) => sum + p.approvedBudget, 0),
      disbursed: visible.reduce((sum, p) => sum + p.disbursed, 0),
    }),
    [visible],
  );

  return (
    <section className={`w-full rounded-xl bg-cmd-surface p-5 ${className ?? ""}`}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-base font-semibold text-cmd-heading">
            <span className="text-teal">
              <Icon name="building" size={18} />
            </span>
            {t("transparency.projectsTitle", {
              place: data
                ? `${data.municipality}, ${data.province}`
                : t("transparency.projectsPlaceFallback"),
            })}
          </h2>
          <p className="mt-1 text-sm text-cmd-muted">
            {t("transparency.subtitle")}
          </p>
        </div>
        <span className="rounded-full bg-amber-500/20 px-2.5 py-1 font-ui text-[11px] font-semibold text-amber-800 dark:text-amber-300">
          {t("transparency.demoBadge")}
        </span>
      </header>

      {error ? (
        <div className="mt-5 rounded-lg bg-cmd-tile p-5 text-center">
          <p className="text-sm text-cmd-heading">{error}</p>
          <button
            type="button"
            onClick={retry}
            className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-white hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal"
          >
            Subukan ulit
          </button>
        </div>
      ) : !data ? (
        <div className="mt-5 space-y-3" aria-hidden="true">
          <div className="h-10 animate-pulse rounded-lg bg-cmd-tile" />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {[0, 1, 2, 3].map((n) => (
              <div key={n} className="h-36 animate-pulse rounded-xl bg-cmd-tile" />
            ))}
          </div>
        </div>
      ) : selected ? (
        <div className="mt-5">
          <ProjectDetail project={selected} source={data.source} onBack={() => setSelected(null)} />
        </div>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs text-cmd-muted">Barangay</span>
              <select
                value={barangay}
                onChange={(event) => setBarangay(event.target.value)}
                className="mt-1 min-h-[44px] w-full rounded-lg bg-cmd-tile px-3 text-sm text-cmd-heading focus:outline-none focus-visible:ring-2 focus-visible:ring-teal"
              >
                <option value={ALL}>{t("transparency.filterAllBarangay")}</option>
                {data.barangays.map((b) => (
                  <option key={b} value={b}>
                    Brgy. {b}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-cmd-muted">Kalagayan</span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as IProjectStatus | typeof ALL)}
                className="mt-1 min-h-[44px] w-full rounded-lg bg-cmd-tile px-3 text-sm text-cmd-heading focus:outline-none focus-visible:ring-2 focus-visible:ring-teal"
              >
                <option value={ALL}>{t("transparency.filterAllStatus")}</option>
                {(Object.keys(PROJECT_STATUS_LABELS) as IProjectStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {PROJECT_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-cmd-tile p-3">
              <dt className="text-xs text-cmd-muted">Proyekto</dt>
              <dd className="mt-1 text-base font-semibold text-cmd-heading">{visible.length}</dd>
            </div>
            <div className="rounded-lg bg-cmd-tile p-3">
              <dt className="text-xs text-cmd-muted">{t("transparency.totalBudget")}</dt>
              <dd className="mt-1 text-sm font-semibold text-cmd-heading">{peso.format(totals.budget)}</dd>
            </div>
            <div className="rounded-lg bg-cmd-tile p-3">
              <dt className="text-xs text-cmd-muted">Nailabas</dt>
              <dd className="mt-1 text-sm font-semibold text-teal">{peso.format(totals.disbursed)}</dd>
            </div>
          </dl>

          {visible.length === 0 ? (
            <div className="mt-4 rounded-lg bg-cmd-tile p-5 text-center">
              <p className="text-sm text-cmd-heading">{t("transparency.emptyTitle")}</p>
              <p className="mt-1 text-xs text-cmd-muted">
                {t("transparency.emptyHint")}
              </p>
            </div>
          ) : (
            <ul className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              {visible.map((project) => (
                <li key={project.id}>
                  <ProjectCard project={project} onSelect={setSelected} />
                </li>
              ))}
            </ul>
          )}

          <p className="mt-4 text-right text-xs text-cmd-muted">{data.source}</p>
        </>
      )}
    </section>
  );
}
