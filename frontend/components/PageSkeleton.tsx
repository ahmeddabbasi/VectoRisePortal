export function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="space-y-2">
        <div className="h-3 w-24 rounded bg-black/5" />
        <div className="h-8 w-64 rounded bg-black/5" />
        <div className="h-4 w-96 max-w-full rounded bg-black/5" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card h-24 rounded-2xl bg-black/[0.03]" />
        ))}
      </div>
      <div className="card h-64 rounded-2xl bg-black/[0.03]" />
    </div>
  );
}
