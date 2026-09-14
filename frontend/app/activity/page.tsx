"use client";

import { useEffect, useState } from "react";
import { ActivityTrendChart } from "@/components/Charts";
import { FilterBar } from "@/components/FilterBar";
import { PageHeader } from "@/components/PageHeader";
import { api, DEFAULT_PERIOD, Filters } from "@/lib/api";

export default function ActivityPage() {
  const [filters, setFilters] = useState<Filters>({ period: DEFAULT_PERIOD, employee: "all", category: "all" });
  const [categories, setCategories] = useState<string[]>([]);
  const [series, setSeries] = useState<any[]>([]);

  useEffect(() => {
    api.categories().then((r) => setCategories(r.categories));
  }, []);

  useEffect(() => {
    api.activity(filters).then((r) => setSeries(r.series || [])).catch(() => setSeries([]));
  }, [filters]);

  return (
    <div className="space-y-6">
      <PageHeader title="Activity" description="Historical outreach volume over time." />
      <FilterBar filters={filters} onChange={setFilters} categories={categories} />
      <ActivityTrendChart data={series} />
    </div>
  );
}
