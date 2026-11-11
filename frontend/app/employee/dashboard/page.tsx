"use client";

import Link from "next/link";
import { useState } from "react";
import { KpiGrid } from "@/components/KpiGrid";
import { PageHeader } from "@/components/PageHeader";
import { KpiSkeleton } from "@/components/InlineSkeleton";
import { StatusBadge } from "@/components/StatusBadge";
import { RuleViolationAlert } from "@/components/RuleViolationAlert";
import { api } from "@/lib/api";
import { getApiError, type ViolationDetail } from "@/lib/violations";
import { useApiQuery } from "@/lib/useApiQuery";

export default function EmployeeDashboardPage() {
  const { data, setData } = useApiQuery(
    () => api.employeeDashboard(),
    () => api.getCached("/api/employee/dashboard"),
  );
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<ViolationDetail | null>(null);

  async function handleCheckIn() {
    setLoading(true);
    setAlert(null);
    try {
      const result = await api.checkIn();
      const refreshed = await api.employeeDashboard();
      setData(refreshed);
      if (result?.notice) setAlert(result.notice);
    } catch (err) {
      const { violation } = getApiError(err);
      if (violation) setAlert(violation);
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckOut() {
    setLoading(true);
    setAlert(null);
    try {
      const result = await api.checkOut();
      const refreshed = await api.employeeDashboard();
      setData(refreshed);
      if (result?.notice) setAlert(result.notice);
    } catch (err) {
      const { violation } = getApiError(err);
      if (violation) setAlert(violation);
    } finally {
      setLoading(false);
    }
  }

  const attendance = data?.attendance || {};
  const tasks = data?.tasks || {};
  const tasksToday = data?.tasks_today || [];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Employee"
        title={`Welcome, ${data?.employee?.name || "Team Member"}`}
        description={data ? `Today is ${data.date}. Track attendance, tasks, and performance.` : "Loading your dashboard..."}
      />

      {!data ? (
        <>
          <div className="card h-28 animate-pulse rounded-2xl bg-black/[0.03]" />
          <KpiSkeleton count={4} />
        </>
      ) : null}

      {alert ? <RuleViolationAlert violation={alert} onDismiss={() => setAlert(null)} /> : null}

      {data ? <div className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="kpi-label">Attendance Status</p>
            <div className="mt-2 flex items-center gap-3">
              <StatusBadge status={attendance.status || "incomplete"} />
              <span className="text-sm text-muted-foreground">
                {data.is_checked_in ? "Currently working" : attendance.check_in_at ? "Checked out" : "Not checked in"}
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            {!data.is_checked_in && !attendance.check_out_at ? (
              <button className="btn-primary" onClick={handleCheckIn} disabled={loading}>Check In</button>
            ) : null}
            {data.is_checked_in ? (
              <button className="btn-secondary" onClick={handleCheckOut} disabled={loading}>Check Out</button>
            ) : null}
          </div>
        </div>
      </div> : null}

      {data ? <KpiGrid
        items={[
          { label: "Tasks Due Today", value: tasks.due_today ?? 0 },
          { label: "Completed", value: tasks.completed ?? 0 },
          { label: "Pending", value: tasks.pending ?? 0 },
          { label: "Overdue", value: tasks.overdue ?? 0 },
        ]}
      /> : null}

      {data ? (
        <section className="card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg">Today&apos;s Tasks</h2>
            <Link href="/employee/tasks" className="text-sm text-brand hover:underline">
              View all tasks
            </Link>
          </div>
          {tasksToday.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No tasks due today. You&apos;re all caught up.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {tasksToday.map((task: any) => (
                <li key={task.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink/10 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{task.title}</p>
                    {task.description ? (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{task.description}</p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <StatusBadge status={task.status} />
                      <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        {task.priority}
                      </span>
                      {task.progress > 0 ? (
                        <span className="text-xs text-muted-foreground">{task.progress}% complete</span>
                      ) : null}
                    </div>
                  </div>
                  <Link href="/employee/tasks" className="btn-secondary shrink-0 text-xs">
                    Open
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {data?.notifications?.length ? (
        <section className="card p-6">
          <h2 className="font-display text-lg">Notifications</h2>
          <ul className="mt-4 space-y-3">
            {data.notifications.map((n: any) => (
              <li key={n.id} className="rounded-xl border border-ink/10 p-3">
                <p className="font-medium">{n.title}</p>
                <p className="text-sm text-muted-foreground">{n.message}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
