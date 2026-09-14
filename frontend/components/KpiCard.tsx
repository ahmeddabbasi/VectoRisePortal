type Props = {
  label: string;
  value: number | string;
  hint?: string;
};

export function KpiCard({ label, value, hint }: Props) {
  return (
    <div className="card p-5">
      <p className="kpi-label">{label}</p>
      <p className="kpi-value mt-3">{value}</p>
      {hint ? <p className="mt-2 text-sm text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
