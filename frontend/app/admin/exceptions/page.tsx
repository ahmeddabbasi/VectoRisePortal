"use client";

import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { PageSkeleton } from "@/components/PageSkeleton";
import { StatusBadge } from "@/components/StatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { api } from "@/lib/api";
import { useApiQuery } from "@/lib/useApiQuery";

export default function AdminExceptionsPage() {
  const [filter, setFilter] = useState("open");
  const exceptionPath = `/api/hrm/exceptions${filter === "all" ? "" : `?status=${filter}`}`;
  const { data: items, loading, setData } = useApiQuery(
    () => api.hrmExceptions(filter === "all" ? undefined : filter),
    () => api.getCached<any[]>(exceptionPath),
    [filter],
  );
  const [responding, setResponding] = useState<number | null>(null);
  const [response, setResponse] = useState("");

  async function load() {
    setData(await api.hrmExceptions(filter === "all" ? undefined : filter));
  }

  async function resolve(id: number, status: string) {
    await api.resolveException(id, { status, admin_response: response });
    setResponding(null);
    setResponse("");
    await load();
  }

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Admin" title="Exception Management" description="Review and resolve attendance, schedule, and task exceptions." />
      <div className="flex gap-2">
        {["open", "under_review", "resolved", "all"].map((s) => (
          <button key={s} type="button" className={`btn-secondary text-xs capitalize ${filter === s ? "ring-2 ring-brand" : ""}`} onClick={() => setFilter(s)}>{s.replace("_", " ")}</button>
        ))}
      </div>
      {!items && loading ? <PageSkeleton /> : null}
      {(items ?? []).length === 0 && !loading ? <EmptyState title="No exceptions" description="No exceptions match this filter." /> : null}
      {(items ?? []).map((item) => (
        <div key={item.id} className="card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-display text-lg">{item.title}</p>
              <p className="text-sm text-muted-foreground">{item.employee_name || `Employee #${item.employee_id}`} · {item.exception_type.replace(/_/g, " ")}</p>
            </div>
            <StatusBadge status={item.status} />
          </div>
          <p className="mt-2 text-sm">{item.description}</p>
          {item.employee_explanation ? <p className="mt-2 text-sm italic">Employee: {item.employee_explanation}</p> : null}
          {responding === item.id ? (
            <div className="mt-4 space-y-2">
              <textarea className="input w-full min-h-20" placeholder="Admin response" value={response} onChange={(e) => setResponse(e.target.value)} />
              <div className="flex gap-2">
                <button type="button" className="btn-primary text-xs" onClick={() => resolve(item.id, "approved")}>Approve</button>
                <button type="button" className="btn-secondary text-xs" onClick={() => resolve(item.id, "rejected")}>Reject</button>
                <button type="button" className="btn-secondary text-xs" onClick={() => resolve(item.id, "resolved")}>Resolve</button>
              </div>
            </div>
          ) : item.status !== "resolved" ? (
            <button type="button" className="btn-secondary mt-4 text-xs" onClick={() => setResponding(item.id)}>Review</button>
          ) : null}
        </div>
      ))}
    </div>
  );
}
