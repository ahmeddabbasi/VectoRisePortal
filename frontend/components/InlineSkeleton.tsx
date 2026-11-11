export function KpiSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid animate-pulse gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card h-24 rounded-2xl bg-black/[0.03]" />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="card animate-pulse overflow-hidden">
      <div className="border-b border-ink/10 px-4 py-3">
        <div className="h-4 w-32 rounded bg-black/5" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 border-b border-ink/5 px-4 py-3">
          <div className="h-4 flex-1 rounded bg-black/[0.04]" />
          <div className="h-4 w-24 rounded bg-black/[0.04]" />
          <div className="h-4 w-16 rounded bg-black/[0.04]" />
        </div>
      ))}
    </div>
  );
}
