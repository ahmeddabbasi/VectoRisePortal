"use client";

import { useEffect, useState } from "react";
import { CategoryCompareChart } from "@/components/charts-dynamic";
import { useCategories } from "@/components/CategoriesProvider";
import { FilterBar } from "@/components/FilterBar";
import { PageHeader } from "@/components/PageHeader";
import { api, DEFAULT_PERIOD, Filters } from "@/lib/api";

const DEFAULT_FILTERS: Filters = { period: DEFAULT_PERIOD, employee: "all", category: "all" };

export default function AnalyticsPage() {
  const categories = useCategories();
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [conversion, setConversion] = useState<any>(() => api.getCached(api.paths.conversion(DEFAULT_FILTERS)));
  const [categoriesPerf, setCategoriesPerf] = useState<any[]>(
    () => api.getCached<any>(api.paths.summary(DEFAULT_FILTERS))?.categories ?? []
  );

  useEffect(() => {
    Promise.all([api.conversion(filters), api.summary(filters).then((r) => r.categories)]).then(([conv, cats]) => {
      setConversion(conv);
      setCategoriesPerf(cats || []);
    });
  }, [filters]);

  const metrics = [
    ["Contact → Reply", conversion?.contact_to_reply],
    ["Reply → Meeting", conversion?.reply_to_meeting],
    ["Meeting → Opportunity", conversion?.meeting_to_opportunity],
    ["Opportunity → Closed", conversion?.opportunity_to_closed],
    ["Lead → Meeting", conversion?.lead_to_meeting],
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="06 / Signal"
        title="Conversion"
        accent="analytics."
        description="Conversion rates and category performance."
      />
      <FilterBar filters={filters} onChange={setFilters} categories={categories} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {metrics.map(([label, value]) => (
          <div key={label as string} className="card p-4">
            <p className="kpi-label">{label}</p>
            <p className="mt-2 text-2xl font-semibold">{value ?? "—"}%</p>
          </div>
        ))}
      </div>
      <CategoryCompareChart data={categoriesPerf} />
    </div>
  );
}
