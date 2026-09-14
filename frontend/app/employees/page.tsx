"use client";

import { useEffect, useState } from "react";
import { EmployeeCompareChart } from "@/components/Charts";
import { FilterBar } from "@/components/FilterBar";
import { PageHeader } from "@/components/PageHeader";
import { api, DEFAULT_PERIOD, Filters } from "@/lib/api";

export default function EmployeesPage() {
  const [filters, setFilters] = useState<Filters>({ period: DEFAULT_PERIOD, category: "all" });
  const [categories, setCategories] = useState<string[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [targets, setTargets] = useState<any[]>([]);

  useEffect(() => {
    api.categories().then((r) => setCategories(r.categories));
    api.targets().then(setTargets).catch(() => setTargets([]));
  }, []);

  useEffect(() => {
    api.employeePerformance(filters.period).then(setRows).catch(() => setRows([]));
  }, [filters]);

  return (
    <div className="space-y-6">
      <PageHeader title="Employee Performance" description="Volume and outcomes by employee." />
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
              <div className="h-1.5 rounded-full bg-[rgba(28,138,242,0.12)]">
                <div className="h-1.5 rounded-full bg-[var(--blue)]" style={{ width: `${Math.min(t.percentage, 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
