type Props = {
  label: string;
  value: number | string;
  hint?: string;
};

export function KpiCard({ label, value, hint }: Props) {
  return (
    <div className="card p-4">
      <p className="kpi-label">{label}</p>
      <p className="kpi-value mt-2">{value}</p>
      {hint ? <p className="mt-1 text-xs text-[var(--muted)]">{hint}</p> : null}
    </div>
  );
}
