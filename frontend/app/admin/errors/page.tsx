"use client";

import { PageHeader } from "@/components/PageHeader";
import { api } from "@/lib/api";
import { useApiQuery } from "@/lib/useApiQuery";

export default function ErrorReportsPage() {
  const { data, loading } = useApiQuery(() => api.adminErrors(), () => api.getCached<any[]>("/api/admin/errors"));
  const rows = data ?? [];
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Admin" title="Error reports" description="Server errors recorded while people use the portal. Passwords and request bodies are not stored." />
      {loading && !data ? <p className="text-sm text-muted-foreground">Loading reports...</p> : null}
      <div className="card overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="table-head">
            <tr>
              {["When", "Status", "Request", "Message", "Account"].map((heading) => <th key={heading} className="px-4 py-3">{heading}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="table-row">
                <td className="px-4 py-3">{row.created_at ? new Date(row.created_at).toLocaleString() : "—"}</td>
                <td className="px-4 py-3">{row.status_code}</td>
                <td className="px-4 py-3">{row.method} {row.path}</td>
                <td className="px-4 py-3">{row.message}</td>
                <td className="px-4 py-3">{row.actor_email || "—"}</td>
              </tr>
            ))}
            {!rows.length && !loading ? <tr><td className="px-4 py-6 text-muted-foreground" colSpan={5}>No error reports yet.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
