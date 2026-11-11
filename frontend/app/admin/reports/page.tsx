"use client";
import { HrmAttendanceBarChart } from "@/components/charts-dynamic";
import { DataTable } from "@/components/DataTable";
import { KpiGrid } from "@/components/KpiGrid";
import { PageHeader } from "@/components/PageHeader";
import { KpiSkeleton } from "@/components/InlineSkeleton";
import { api } from "@/lib/api";
import { useApiQuery } from "@/lib/useApiQuery";

export default function AdminReportsPage() {
  const { data, setData } = useApiQuery(
    () => Promise.all([api.hrmReports(), api.performanceScores(), api.adminEmployees()]).then(([reports, scores, employees]) => ({ reports, scores, employees })),
    () => {
      const reports = api.getCached<any>("/api/hrm/reports");
      const scores = api.getCached<any[]>("/api/admin/performance/scores");
      const employees = api.getCached<any[]>("/api/admin/employees");
      return reports && scores && employees ? { reports, scores, employees } : null;
    },
  );
  const reports = data?.reports;
  const scores = data?.scores ?? [];
  const employees = data?.employees ?? [];

  async function calculateFor(employeeId: number) {
    await api.calculatePerformance(employeeId);
    const nextScores = await api.performanceScores();
    if (data) setData({ ...data, scores: nextScores });
  }

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Admin" title="HRM Reports" description="Attendance trends, task completion, and performance analytics." />
      {!reports ? (
        <KpiSkeleton count={4} />
      ) : (
        <>
          <KpiGrid items={[
            { label: "Active Employees", value: reports.employee_count },
            { label: "Total Tasks", value: reports.task_stats?.total ?? 0 },
            { label: "Completed", value: reports.task_stats?.completed ?? 0 },
            { label: "Overdue", value: reports.task_stats?.overdue ?? 0 },
          ]} />
          <div className="card p-6">
            <h2 className="mb-4 font-display text-lg">Attendance Trend (7 days)</h2>
            <div className="h-64">
              <HrmAttendanceBarChart data={reports.attendance_trend || []} />
            </div>
          </div>
          <div className="card p-6">
            <h2 className="mb-4 font-display text-lg">Performance Scores</h2>
            <div className="mb-4 flex flex-wrap gap-2">
              {employees.map((e) => (
                <button key={e.id} type="button" className="btn-secondary text-xs" onClick={() => calculateFor(e.id)}>Calculate: {e.name}</button>
              ))}
            </div>
            <DataTable minWidth="28rem">
              <thead className="table-head">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Period End</th>
                  <th className="px-4 py-3">Score</th>
                </tr>
              </thead>
              <tbody>
                {scores.map((s) => (
                  <tr key={s.id} className="table-row">
                    <td className="px-4 py-3">{s.employee_name}</td>
                    <td className="px-4 py-3">{s.period_end}</td>
                    <td className="px-4 py-3 font-semibold">{s.total_score?.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </div>
        </>
      )}
    </div>
  );
}
