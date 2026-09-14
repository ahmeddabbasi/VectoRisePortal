"use client";

import { useEffect, useState } from "react";
import { FunnelChart, StageBarChart } from "@/components/Charts";
import { FilterBar } from "@/components/FilterBar";
import { PageHeader } from "@/components/PageHeader";
import { api, Filters } from "@/lib/api";

export default function PipelinePage() {
  const [filters, setFilters] = useState<Filters>({ employee: "all", category: "all" });
  const [categories, setCategories] = useState<string[]>([]);
  const [pipeline, setPipeline] = useState<any>(null);

  useEffect(() => {
    api.categories().then((r) => setCategories(r.categories));
  }, []);

  useEffect(() => {
    api.pipeline(filters).then(setPipeline).catch(() => setPipeline(null));
  }, [filters]);

  const stageData = Object.entries(pipeline?.stage_distribution || {}).map(([stage, count]) => ({
    stage,
    count: count as number,
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="Pipeline" description="Current lead stage distribution and funnel view." />
      <FilterBar filters={filters} onChange={setFilters} categories={categories} />
      <div className="grid gap-4 xl:grid-cols-2">
        <FunnelChart data={pipeline?.funnel || []} />
        <StageBarChart data={stageData.sort((a, b) => b.count - a.count)} />
      </div>
    </div>
  );
}
