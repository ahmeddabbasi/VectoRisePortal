"use client";

import { useEffect, useState } from "react";
import { CategoryCompareChart } from "@/components/Charts";
import { FilterBar } from "@/components/FilterBar";
import { PageHeader } from "@/components/PageHeader";
import { api, DEFAULT_PERIOD, Filters } from "@/lib/api";

export default function AnalyticsPage() {
  const [filters, setFilters] = useState<Filters>({ period: DEFAULT_PERIOD, employee: "all", category: "all" });
  const [categories, setCategories] = useState<string[]>([]);
  const [conversion, setConversion] = useState<any>(null);
  const [categoriesPerf, setCategoriesPerf] = useState<any[]>([]);

  useEffect(() => {
    api.categories().then((r) => setCategories(r.categories));
  }, []);

  useEffect(() => {
    Promise.all([
      api.conversion(filters),
      fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/reports/summary?period=${filters.period || DEFAULT_PERIOD}`)
        .then((r) => r.json())
        .then((r) => r.categories),
    ]).then(([conv, cats]) => {
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
    <div className="space-y-6">
      <PageHeader title="Analytics" description="Conversion rates and category performance." />
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
