"use client";

import { ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";
import { ActivityTrendChart, CategoryCompareChart, EmployeeCompareChart, FunnelChart, StageBarChart } from "@/components/charts-dynamic";
import { useCategories } from "@/components/CategoriesProvider";
import { FilterBar } from "@/components/FilterBar";
import { KpiCard } from "@/components/KpiCard";
import { PageHeader } from "@/components/PageHeader";
import { api, DEFAULT_PERIOD, Filters } from "@/lib/api";

const DEFAULT_FILTERS: Filters = { period: DEFAULT_PERIOD, employee: "all", category: "all" };

export default function DashboardPage() {
  const categories = useCategories();
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [overview, setOverview] = useState<any>(() => api.getCached(api.paths.overview(DEFAULT_FILTERS)));
  const [activity, setActivity] = useState<any[]>(() => api.getCached<{ series: any[] }>(api.paths.activity(DEFAULT_FILTERS))?.series ?? []);
  const [pipeline, setPipeline] = useState<any>(() => api.getCached(api.paths.pipeline(DEFAULT_FILTERS)));
  const [employees, setEmployees] = useState<any[]>(() => api.getCached<any>(api.paths.summary(DEFAULT_FILTERS))?.employees ?? []);
  const [categoriesPerf, setCategoriesPerf] = useState<any[]>(() => api.getCached<any>(api.paths.summary(DEFAULT_FILTERS))?.categories ?? []);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    api.overview(filters).then(setOverview).catch((e) => setError(e.message));
    api.activity(filters).then((act) => setActivity(act.series || [])).catch(() => setActivity([]));
    api.pipeline(filters).then(setPipeline).catch(() => setPipeline(null));
    api
      .summary(filters)
      .then((summary) => {
        setEmployees(summary.employees || []);
        setCategoriesPerf(summary.categories || []);
      })
      .catch(() => {
        setEmployees([]);
        setCategoriesPerf([]);
      });
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
    <div className="space-y-8">
      <PageHeader
        eyebrow="01 / Operations"
        title="Lead activity"
        accent="dashboard."
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
          <button onClick={handleSync} disabled={syncing} className="btn-primary sheen">
            {syncing ? "Syncing..." : "Sync now"}
            <ArrowUpRight size={14} />
          </button>
        }
      />

      <FilterBar filters={filters} onChange={setFilters} categories={categories} />

      {error ? <div className="card p-5 text-destructive">Failed to load dashboard: {error}</div> : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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

      <div className="section-rule" />

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
