"use client";

import { useEffect, useState } from "react";
import { EmployeeCompareChart } from "@/components/charts-dynamic";
import { useCategories } from "@/components/CategoriesProvider";
import { FilterBar } from "@/components/FilterBar";
import { PageHeader } from "@/components/PageHeader";
import { api, DEFAULT_PERIOD, Filters } from "@/lib/api";

const DEFAULT_FILTERS: Filters = { period: DEFAULT_PERIOD, category: "all" };

export default function EmployeesPage() {
  const categories = useCategories();
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [rows, setRows] = useState<any[]>(() => api.getCached<any>(api.paths.summary(DEFAULT_FILTERS))?.employees ?? []);
  const [targets, setTargets] = useState<any[]>(() => api.getCached(api.paths.targets()) ?? []);

  useEffect(() => {
    api.summary(filters).then((data) => setRows(data?.employees ?? [])).catch(() => setRows([]));
  }, [filters.period, filters.category, filters.employee]);

  useEffect(() => {
    api.targets().then(setTargets).catch(() => setTargets([]));
  }, []);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="03 / Team"
        title="Employee"
        accent="performance."
        description="Volume and outcomes by employee."
      />
      <FilterBar filters={filters} onChange={setFilters} categories={categories} />
      <EmployeeCompareChart data={rows} />
      <div className="card overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="table-head">
            <tr>
              {["Employee", "Leads", "Emails", "Follow-ups", "LinkedIn", "Replies", "Meetings", "Opportunities"].map((h) => (
                <th key={h} className="px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.employee} className="table-row">
                <td className="px-4 py-3 font-medium">{row.employee}</td>
                <td className="px-4 py-3">{row.leads}</td>
                <td className="px-4 py-3">{row.initial_emails}</td>
                <td className="px-4 py-3">{row.follow_ups}</td>
                <td className="px-4 py-3">{row.linkedin}</td>
                <td className="px-4 py-3">{row.replies}</td>
                <td className="px-4 py-3">{row.meetings}</td>
                <td className="px-4 py-3">{row.opportunities}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card p-4">
        <h3 className="chart-title mb-3">Target vs Actual (Today)</h3>
        <div className="space-y-3">
          {targets.map((t, i) => (
            <div key={i}>
              <div className="mb-1 flex justify-between text-sm">
                <span>{t.employee} · {t.activity_type.replaceAll("_", " ")}</span>
                <span>{t.actual}/{t.target} ({t.percentage}%)</span>
              </div>
              <div className="h-1.5 rounded-full bg-lavender/15">
                <div className="h-1.5 rounded-full bg-lavender" style={{ width: `${Math.min(t.percentage, 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
