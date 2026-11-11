"use client";

import { KpiGrid } from "@/components/KpiGrid";
import { PageHeader } from "@/components/PageHeader";
import { PageSkeleton } from "@/components/PageSkeleton";
import { api } from "@/lib/api";
import { useCachedQuery } from "@/lib/useApiQuery";

export default function EmployeePerformancePage() {
  const { data, loading } = useCachedQuery("/api/employee/performance", () => api.employeePerformance());

  if (!data && loading) return <PageSkeleton />;
  if (!data) return null;

  const latestScore = data.score_history?.[0];

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Employee" title="Performance Analytics" description="Objective metrics based on attendance, tasks, and schedule compliance." />
      <KpiGrid items={[
        { label: "Attendance Score", value: `${data.attendance_score ?? 0}%` },
        { label: "Task Score", value: `${data.task_score ?? 0}%` },
        { label: "Schedule Score", value: `${data.schedule_score ?? 0}%` },
        { label: "Latest Total Score", value: latestScore ? `${latestScore.total_score}%` : "—" },
      ]} />
      <div className="grid gap-6 md:grid-cols-2">
        <div className="card p-6">
          <h2 className="font-display text-lg">Task Metrics</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li>Assigned: {data.tasks?.assigned ?? 0}</li>
            <li>Completed: {data.tasks?.completed ?? 0}</li>
            <li>Overdue: {data.tasks?.overdue ?? 0}</li>
          </ul>
        </div>
        <div className="card p-6">
          <h2 className="font-display text-lg">Attendance Metrics</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li>On-time days: {data.attendance?.on_time ?? 0}</li>
            <li>Late days: {data.attendance?.late ?? 0}</li>
            <li>Incomplete: {data.attendance?.incomplete ?? 0}</li>
          </ul>
        </div>
      </div>
      {data.evaluations?.length ? (
        <div className="card p-6">
          <h2 className="font-display text-lg">HR Evaluations</h2>
          {data.evaluations.map((e: any, i: number) => (
            <div key={i} className="mt-4 border-t border-ink/10 pt-4">
              <p className="font-medium">Score: {e.score}%</p>
              <p className="text-sm text-muted-foreground">{e.comments}</p>
            </div>
          ))}
        </div>
      ) : null}
      {latestScore?.breakdown ? (
        <div className="card p-6">
          <h2 className="font-display text-lg">Score Breakdown</h2>
          <pre className="mt-4 overflow-auto text-xs">
            {JSON.stringify(
              typeof latestScore.breakdown === "string" ? JSON.parse(latestScore.breakdown) : latestScore.breakdown,
              null,
              2
            )}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
