"use client";

import dynamic from "next/dynamic";

function ChartPlaceholder({ className = "h-80" }: { className?: string }) {
  return <div className={`card bg-card/90 ${className}`} aria-hidden />;
}

export const ActivityTrendChart = dynamic(
  () => import("@/components/Charts").then((m) => m.ActivityTrendChart),
  { ssr: false, loading: () => <ChartPlaceholder className="h-[22rem]" /> }
);

export const StageBarChart = dynamic(
  () => import("@/components/Charts").then((m) => m.StageBarChart),
  { ssr: false, loading: () => <ChartPlaceholder /> }
);

export const FunnelChart = dynamic(
  () => import("@/components/Charts").then((m) => m.FunnelChart),
  { ssr: false, loading: () => <ChartPlaceholder /> }
);

export const EmployeeCompareChart = dynamic(
  () => import("@/components/Charts").then((m) => m.EmployeeCompareChart),
  { ssr: false, loading: () => <ChartPlaceholder /> }
);

export const CategoryCompareChart = dynamic(
  () => import("@/components/Charts").then((m) => m.CategoryCompareChart),
  { ssr: false, loading: () => <ChartPlaceholder /> }
);
