"use client";

import { useState } from "react";
import { KpiGrid } from "@/components/KpiGrid";
import { DataTable } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { PageSkeleton } from "@/components/PageSkeleton";
import { StatusBadge } from "@/components/StatusBadge";
import { api } from "@/lib/api";
import { useApiQuery } from "@/lib/useApiQuery";

export default function AdminAttendancePage() {
  const { data, loading, setData } = useApiQuery(
    () => Promise.all([api.hrmAttendance(), api.hrmAttendanceList()]).then(([summary, records]) => ({ summary, records })),
    () => {
      const summary = api.getCached<any>("/api/hrm/attendance/summary");
      const records = api.getCached<any[]>("/api/hrm/attendance");
      return summary && records ? { summary, records } : null;
    },
  );
  const summary = data?.summary;
  const records = data?.records ?? [];
  const [editing, setEditing] = useState<any | null>(null);
  const [reason, setReason] = useState("");

  async function saveCorrection() {
    if (!editing) return;
    await api.correctAttendance(editing.id, {
      check_in_at: editing.check_in_at || null,
      check_out_at: editing.check_out_at || null,
      status: editing.status,
      reason,
    });
    setEditing(null);
    setReason("");
    const nextRecords = await api.hrmAttendanceList();
    if (data) setData({ ...data, records: nextRecords });
  }

  if (!data && loading) return <PageSkeleton />;

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Admin" title="Attendance Oversight" description="Monitor check-ins, correct records, and review daily attendance." />
      {summary ? (
        <KpiGrid items={[
          { label: "Present", value: summary.present },
          { label: "Absent", value: summary.absent },
          { label: "Late", value: summary.late },
          { label: "Missing Checkout", value: summary.missing_checkout },
        ]} />
      ) : null}
      <DataTable>
          <thead className="table-head">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Check In</th>
              <th className="px-4 py-3">Check Out</th>
              <th className="px-4 py-3">Minutes</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id} className="table-row">
                <td className="px-4 py-3">{r.work_date}</td>
                <td className="px-4 py-3">{r.employee_name || `#${r.employee_id}`}</td>
                <td className="px-4 py-3">{r.check_in_at ? new Date(r.check_in_at).toLocaleTimeString() : "—"}</td>
                <td className="px-4 py-3">{r.check_out_at ? new Date(r.check_out_at).toLocaleTimeString() : "—"}</td>
                <td className="px-4 py-3">{r.total_minutes ?? "—"}</td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                <td className="px-4 py-3">
                  <button type="button" className="tap-target text-xs text-brand" onClick={() => setEditing({ ...r, status: r.status })}>Correct</button>
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      {editing ? (
        <div className="card space-y-4 p-6">
          <h2 className="font-display text-lg">Correct Attendance — {editing.employee_name}</h2>
          <select className="input" value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
            {["on_time", "late", "incomplete", "absent", "early"].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <textarea className="input w-full min-h-20" placeholder="Reason for correction (audit log)" value={reason} onChange={(e) => setReason(e.target.value)} />
          <div className="flex gap-2">
            <button type="button" className="btn-primary" onClick={saveCorrection}>Save Correction</button>
            <button type="button" className="btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
