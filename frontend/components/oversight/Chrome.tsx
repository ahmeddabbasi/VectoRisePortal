"use client";

import type { ReactNode } from "react";
import { KpiSkeleton, TableSkeleton } from "@/components/InlineSkeleton";

export function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="card space-y-3 p-6">
      <p className="text-sm text-red-700">{message}</p>
      <button type="button" className="btn-secondary" onClick={onRetry}>Retry</button>
    </div>
  );
}

export function EmptyNote({ children }: { children: ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

export function MetricTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card p-4">
      <p className="kpi-label">{label}</p>
      <p className="mt-2 font-display text-2xl">{value}</p>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <KpiSkeleton count={5} />
      <TableSkeleton rows={6} />
    </div>
  );
}

export function Initials({ name }: { name: string }) {
  const letters = name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-ink/10 text-xs font-display">{letters}</span>;
}
