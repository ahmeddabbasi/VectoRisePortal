import { KpiCard } from "@/components/KpiCard";

type Kpi = { label: string; value: string | number; hint?: string };

export function KpiGrid({ items }: { items: Kpi[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <KpiCard key={item.label} label={item.label} value={String(item.value)} hint={item.hint} />
      ))}
    </div>
  );
}
