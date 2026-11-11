"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { api } from "@/lib/api";
import { formatDateISO, getMonday } from "@/lib/dates";

export default function AdminSchedulesPage() {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [changes, setChanges] = useState<any[]>([]);
  const [weekStart, setWeekStart] = useState(formatDateISO(getMonday()));
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const [schedRows, changeRows] = await Promise.all([
      api.hrmSchedules({ week_start: weekStart }),
      api.scheduleChanges("pending"),
    ]);
    setSchedules(schedRows);
    setChanges(changeRows);
  }

  useEffect(() => { load(); }, [weekStart]);

  async function lockSchedules() {
    const res = await api.lockSchedules();
    setMessage(`Locked ${res.locked_count} schedule entries.`);
    await load();
  }

  async function runJobs() {
    const res = await api.runDailyJobs();
    setMessage(`Jobs complete: ${res.schedules_locked} schedules locked.`);
    await load();
  }

  async function reviewChange(id: number, status: string) {
    await api.reviewScheduleChange(id, { status, admin_response: status === "approved" ? "Approved" : "Rejected" });
    await load();
  }

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Admin" title="Schedule Management" description="View employee schedules, lock submissions, and review change requests." />
      {message ? <p className="text-sm text-brand">{message}</p> : null}
      <div className="flex flex-wrap gap-3">
        <input type="date" className="input" value={weekStart} onChange={(e) => setWeekStart(e.target.value)} />
        <button type="button" className="btn-secondary" onClick={lockSchedules}>Lock Expired Schedules</button>
        <button type="button" className="btn-secondary" onClick={runJobs}>Run Daily Jobs</button>
      </div>
      <DataTable>
          <thead className="table-head">
            <tr>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Day</th>
              <th className="px-4 py-3">Hours</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {schedules.map((s) => (
              <tr key={s.id} className="table-row">
                <td className="px-4 py-3">{s.employee_name || `#${s.employee_id}`}</td>
                <td className="px-4 py-3">Day {s.day_of_week + 1}</td>
                <td className="px-4 py-3">{s.start_time?.slice(0, 5)} – {s.end_time?.slice(0, 5)}</td>
                <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      <div className="space-y-4">
        <h2 className="font-display text-lg">Pending Change Requests</h2>
        {changes.map((c) => (
          <div key={c.id} className="card p-4">
            <p className="font-medium">{c.employee_name} — {c.reason}</p>
            <p className="text-sm text-muted-foreground">{c.proposed_changes}</p>
            <div className="mt-3 flex gap-2">
              <button type="button" className="btn-primary text-xs" onClick={() => reviewChange(c.id, "approved")}>Approve</button>
              <button type="button" className="btn-secondary text-xs" onClick={() => reviewChange(c.id, "rejected")}>Reject</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
