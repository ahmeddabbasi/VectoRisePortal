"use client";

import { useEffect, useState } from "react";
import { ActivityTrendChart } from "@/components/charts-dynamic";
import { useCategories } from "@/components/CategoriesProvider";
import { FilterBar } from "@/components/FilterBar";
import { PageHeader } from "@/components/PageHeader";
import { api, DEFAULT_PERIOD, Filters } from "@/lib/api";

const DEFAULT_FILTERS: Filters = { period: DEFAULT_PERIOD, employee: "all", category: "all" };

export default function ActivityPage() {
  const categories = useCategories();
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [series, setSeries] = useState<any[]>(
    () => api.getCached<{ series: any[] }>(api.paths.activity(DEFAULT_FILTERS))?.series ?? []
  );

  useEffect(() => {
    api.activity(filters).then((r) => setSeries(r.series || [])).catch(() => setSeries([]));
  }, [filters]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="05 / Signal"
        title="Outreach"
        accent="activity."
        description="Historical outreach volume over time."
      />
      <FilterBar filters={filters} onChange={setFilters} categories={categories} />
      <ActivityTrendChart data={series} />
    </div>
  );
}
