"use client";

import { DataTable } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { PageSkeleton } from "@/components/PageSkeleton";
import { StatusBadge } from "@/components/StatusBadge";
import { api } from "@/lib/api";
import { useCachedQuery } from "@/lib/useApiQuery";

export default function EmployeeAttendancePage() {
  const { data: records, loading } = useCachedQuery(
    "/api/employee/attendance",
    () => api.employeeAttendance(),
  );

  if (!records && loading) return <PageSkeleton />;

  const rows = records ?? [];

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Employee" title="Attendance & Timesheet" description="Your check-in history and working sessions." />
      <DataTable minWidth="32rem">
          <thead className="table-head">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Check In</th>
              <th className="px-4 py-3">Check Out</th>
              <th className="px-4 py-3">Minutes</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="table-row">
                <td className="px-4 py-3">{r.work_date}</td>
                <td className="px-4 py-3">{r.check_in_at ? new Date(r.check_in_at).toLocaleTimeString() : "—"}</td>
                <td className="px-4 py-3">{r.check_out_at ? new Date(r.check_out_at).toLocaleTimeString() : "—"}</td>
                <td className="px-4 py-3">{r.total_minutes ?? "—"}</td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
              </tr>
            ))}
          </tbody>
      </DataTable>
    </div>
  );
}
