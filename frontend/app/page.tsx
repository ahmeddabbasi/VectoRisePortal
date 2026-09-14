"use client";

import { useEffect, useState } from "react";
import { ActivityTrendChart, CategoryCompareChart, EmployeeCompareChart, FunnelChart, StageBarChart } from "@/components/Charts";
import { FilterBar } from "@/components/FilterBar";
import { KpiCard } from "@/components/KpiCard";
import { PageHeader } from "@/components/PageHeader";
import { api, DEFAULT_PERIOD, Filters } from "@/lib/api";

export default function DashboardPage() {
  const [filters, setFilters] = useState<Filters>({ period: DEFAULT_PERIOD, employee: "all", category: "all" });
  const [categories, setCategories] = useState<string[]>([]);
  const [overview, setOverview] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [pipeline, setPipeline] = useState<any>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [categoriesPerf, setCategoriesPerf] = useState<any[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.categories().then((r) => setCategories(r.categories)).catch(() => {});
  }, []);

  useEffect(() => {
    setError(null);
    Promise.all([
      api.overview(filters),
      api.activity(filters),
      api.pipeline(filters),
      api.employeePerformance(filters.period),
      api.categories().then(async () => {
        const summary = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/reports/summary${buildQs(filters)}`
        ).then((r) => r.json());
        return summary.categories;
      }),
    ])
      .then(([ov, act, pipe, empPerf, catPerf]) => {
        setOverview(ov);
        setActivity(act.series || []);
        setPipeline(pipe);
        setEmployees(empPerf || []);
        setCategoriesPerf(catPerf || []);
      })
      .catch((e) => setError(e.message));
  }, [filters]);

  async function handleSync() {
    setSyncing(true);
    try {
      await api.syncNow();
      setFilters({ ...filters });
    } finally {
      setSyncing(false);
    }
  }

  const stageData = Object.entries(overview?.stage_distribution || {}).map(([stage, count]) => ({
    stage,
    count: count as number,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operations Overview"
        title="Lead Activity Dashboard"
        description={
          <>
            Last sync: {overview?.sync?.last_sync_at ? new Date(overview.sync.last_sync_at).toLocaleString() : "Never"}
            {" · "}
            <span className={overview?.sync?.status === "success" ? "status-success" : "status-warning"}>
              {overview?.sync?.status || "pending"}
            </span>
          </>
        }
        action={
          <button onClick={handleSync} disabled={syncing} className="btn-primary">
            {syncing ? "Syncing..." : "Sync Now"}
          </button>
        }
      />

      <FilterBar filters={filters} onChange={setFilters} categories={categories} />

      {error ? <div className="card p-4 text-[var(--warning)]">Failed to load dashboard: {error}</div> : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total Leads" value={overview?.total_leads ?? "—"} />
        <KpiCard label="Leads Contacted" value={overview?.leads_contacted ?? "—"} />
        <KpiCard label="Initial Emails" value={overview?.initial_emails ?? "—"} />
        <KpiCard label="Follow-ups" value={overview?.follow_ups ?? "—"} />
        <KpiCard label="LinkedIn Outreach" value={overview?.linkedin_outreach ?? "—"} />
        <KpiCard label="Replies" value={overview?.replies ?? "—"} />
        <KpiCard label="Meetings" value={overview?.meetings ?? "—"} />
        <KpiCard label="Opportunities" value={overview?.opportunities ?? "—"} />
        <KpiCard label="Closed" value={overview?.closed ?? "—"} />
        <KpiCard label="Awaiting Reply" value={overview?.awaiting_reply ?? "—"} />
        <KpiCard label="Potential Duplicates" value={overview?.potential_duplicates ?? "—"} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <ActivityTrendChart data={activity} />
        <FunnelChart data={pipeline?.funnel || []} />
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <StageBarChart data={stageData.sort((a, b) => b.count - a.count)} />
        <EmployeeCompareChart data={employees} />
      </section>

      <CategoryCompareChart data={categoriesPerf} />
    </div>
  );
}

function buildQs(filters: Filters) {
  const q = new URLSearchParams();
  if (filters.period) q.set("period", filters.period);
  if (filters.employee && filters.employee !== "all") q.set("employee", filters.employee);
  if (filters.category && filters.category !== "all") q.set("category", filters.category);
  const s = q.toString();
  return s ? `?${s}` : "";
}
