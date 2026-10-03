import type { IReliefLogistics, IconName } from "@/types";
import Icon from "@/components/common/Icon";

export interface IReliefLogisticsPanelProps {
  relief: IReliefLogistics;
}

interface IReliefMetric {
  label: string;
  value: string;
  unit: string;
  icon: IconName;
}

/**
 * Strategic relief depot status (M5/M7 logistics & relief, municipal
 * warehouse view). Shows ready-to-deploy stocks with Filipino labels.
 */
export default function ReliefLogisticsPanel({
  relief,
}: IReliefLogisticsPanelProps) {
  const metrics: IReliefMetric[] = [
    {
      label: "Food Packs (Pagkain)",
      value: relief.foodPacks.toLocaleString("en-PH"),
      unit: "handa",
      icon: "box",
    },
    {
      label: "Panlinis ng Tubig",
      value: relief.waterCapacityLpd.toLocaleString("en-PH"),
      unit: "kits",
      icon: "water",
    },
    {
      label: "Pang-rescue na Yunit",
      value: relief.rescueUnits.toLocaleString("en-PH"),
      unit: "yunit",
      icon: "ambulance",
    },
    {
      label: "Bangkang Pang-rescue",
      value: relief.rescueBoats.toLocaleString("en-PH"),
      unit: "bangka",
      icon: "boat",
    },
  ];

  return (
    <section className="rounded-xl bg-cmd-surface p-5 shadow-sm">
      <header className="flex items-center gap-2">
        <span className="text-teal">
          <Icon name="warehouse" size={18} />
        </span>
        <h2 className="text-sm font-semibold text-cmd-heading">
          Strategic Relief Depot
        </h2>
      </header>

      <dl className="mt-4 grid grid-cols-2 gap-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-lg bg-cmd-tile p-3">
            <dt className="flex items-center gap-1.5 text-xs text-cmd-muted">
              <span className="text-teal">
                <Icon name={metric.icon} size={14} />
              </span>
              {metric.label}
            </dt>
            <dd className="mt-1 flex items-baseline gap-1">
              <span className="text-xl font-bold text-cmd-heading">
                {metric.value}
              </span>
              <span className="text-xs text-cmd-muted">{metric.unit}</span>
            </dd>
          </div>
        ))}
      </dl>

      <p className="mt-4 text-xs leading-relaxed text-cmd-muted">{relief.note}</p>
    </section>
  );
}
