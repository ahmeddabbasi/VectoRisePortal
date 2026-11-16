"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { api, downloadCsv } from "@/lib/api";
import { EmptyNote, LoadError, PageSkeleton } from "@/components/oversight/Chrome";
import { queryString, when } from "@/components/oversight/format";

const ACTIONS = ["", "task_created", "task_completed", "task_status_changed", "task_deadline_changed", "task_note_changed", "document_uploaded", "document_removed", "task_review_submitted", "performance_review_submitted", "team_lead_assigned", "team_lead_removed", "login"];

export function ActivityFeed({ base }: { base: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const action = params.get("action") || "";
  const actor = params.get("actor") || "";
  const lead = params.get("lead") || "";
  const employee = params.get("employee") || "";
  const page = Number(params.get("page") || "1");
  const dateFrom = params.get("from") || "";
  const dateTo = params.get("to") || "";
  const [feed, setFeed] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  function replace(next: Record<string, string | number>) {
    router.replace(`${base}/activity${queryString({ action: next.action ?? action, actor: next.actor ?? actor, lead: next.lead ?? lead, employee: next.employee ?? employee, page: next.page ?? page, from: next.from ?? dateFrom, to: next.to ?? dateTo })}`);
  }

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.oversightActivity(queryString({ action_type: action, actor_id: actor, team_lead_id: lead, employee_id: employee, page, page_size: 25, date_from: dateFrom, date_to: dateTo }))
      .then((data) => { if (active) setFeed(data); })
      .catch((err: Error) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [action, actor, lead, employee, page, dateFrom, dateTo, attempt]);

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Oversight" title="Activity" description="A readable history of team work. Dates use UTC." action={
        <button type="button" className="btn-secondary" onClick={() => downloadCsv(`/api/oversight/export/activity.csv${queryString({ action_type: action, actor_id: actor, team_lead_id: lead, employee_id: employee, date_from: dateFrom, date_to: dateTo })}`, "activity.csv")}>Export CSV</button>
      } />
      <div className="grid gap-3 md:grid-cols-3">
        <input className="input" inputMode="numeric" value={actor} aria-label="Actor user id" placeholder="Actor user id" onChange={(event) => replace({ actor: event.target.value.replace(/\D/g, ""), page: 1 })} />
        <input className="input" inputMode="numeric" value={lead} aria-label="Team lead employee id" placeholder="Team lead employee id" onChange={(event) => replace({ lead: event.target.value.replace(/\D/g, ""), page: 1 })} />
        <input className="input" inputMode="numeric" value={employee} aria-label="Employee id" placeholder="Employee id" onChange={(event) => replace({ employee: event.target.value.replace(/\D/g, ""), page: 1 })} />
        <select className="input" value={action} aria-label="Action type" onChange={(event) => replace({ action: event.target.value, page: 1 })}>
          {ACTIONS.map((item) => <option key={item || "all"} value={item}>{item ? item.split("_").join(" ") : "All actions"}</option>)}
        </select>
        <input className="input" type="date" value={dateFrom} aria-label="From date" onChange={(event) => replace({ from: event.target.value, page: 1 })} />
        <input className="input" type="date" value={dateTo} aria-label="To date" onChange={(event) => replace({ to: event.target.value, page: 1 })} />
      </div>
      {loading && !feed ? <PageSkeleton /> : null}
      {error ? <LoadError message={error} onRetry={() => setAttempt((value) => value + 1)} /> : null}
      {feed && !feed.items.length ? <EmptyNote>No activity matches these filters.</EmptyNote> : null}
      <ul className="space-y-3">
        {feed?.items?.map((item: any) => {
          const stamp = when(item.created_at);
          return (
            <li key={item.id} className="card p-4 text-sm">
              <p>{item.sentence} {item.historical ? <span className="ml-2 rounded bg-ink/10 px-2 py-0.5 text-xs">Historical</span> : null}</p>
              <p className="text-xs text-muted-foreground" title={stamp.exact}>{stamp.label}</p>
              <p className="mt-2 space-x-3">
                {item.target_employee_id ? <Link className="underline" href={`${base}/employees/${item.target_employee_id}`}>{item.target_name || "Employee"}</Link> : null}
                {item.team_lead_id ? <Link className="underline" href={`${base}/teams/${item.team_lead_id}`}>Team</Link> : null}
              </p>
            </li>
          );
        })}
      </ul>
      {feed ? (
        <div className="flex gap-3 text-sm">
          <button type="button" className="btn-secondary" disabled={page <= 1} onClick={() => replace({ page: page - 1 })}>Previous</button>
          <span>Page {feed.page}</span>
          <button type="button" className="btn-secondary" disabled={page * feed.page_size >= feed.total} onClick={() => replace({ page: page + 1 })}>Next</button>
        </div>
      ) : null}
    </div>
  );
}
