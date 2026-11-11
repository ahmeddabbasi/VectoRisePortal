"use client";

import { DataTable } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { PageSkeleton } from "@/components/PageSkeleton";
import { api } from "@/lib/api";
import { useCachedQuery } from "@/lib/useApiQuery";

export default function AdminAuditPage() {
  const { data: logs, loading } = useCachedQuery("/api/admin/audit-logs", () => api.auditLogs());

  if (!logs && loading) return <PageSkeleton />;

  const rows = logs ?? [];

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Admin" title="Audit Log" description="Complete trail of system actions — append only, cannot be modified." />
      <DataTable minWidth="40rem">
        <thead className="table-head">
          <tr>
            <th className="px-4 py-3">Time</th>
            <th className="px-4 py-3">User</th>
            <th className="px-4 py-3">Action</th>
            <th className="px-4 py-3">Entity</th>
            <th className="px-4 py-3">Reason</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((log) => (
            <tr key={log.id} className="table-row">
              <td className="px-4 py-3 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
              <td className="px-4 py-3">{log.user_email || "—"}</td>
              <td className="px-4 py-3 font-mono-custom text-xs">{log.action}</td>
              <td className="px-4 py-3">{log.entity_type} #{log.entity_id ?? ""}</td>
              <td className="px-4 py-3">{log.reason || "—"}</td>
            </tr>
          ))}
        </tbody>
      </DataTable>
    </div>
  );
}
