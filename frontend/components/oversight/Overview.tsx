"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { downloadCsv, api } from "@/lib/api";
import { EmptyNote, Initials, LoadError, PageSkeleton } from "@/components/oversight/Chrome";
import { percent, queryString, rating, when } from "@/components/oversight/format";

export function Overview({ base }: { base: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const focus = params.get("focus") || "";
  const search = params.get("q") || "";
  const sort = params.get("sort") || "name";
  const direction = params.get("direction") || "asc";
  const page = Number(params.get("page") || "1");
  const dateFrom = params.get("from") || "";
  const dateTo = params.get("to") || "";
  const [draft, setDraft] = useState(search);
  const [summary, setSummary] = useState<any>(null);
  const [teams, setTeams] = useState<any>(null);
  const [trends, setTrends] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => { setDraft(search); }, [search]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (draft !== search) replace({ q: draft, page: 1 });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [draft]);

  function replace(next: Record<string, string | number | null>) {
    const query = queryString({
      focus: next.focus ?? focus,
      q: next.q ?? search,
      sort: next.sort ?? sort,
      direction: next.direction ?? direction,
      page: next.page ?? page,
      from: next.from ?? dateFrom,
      to: next.to ?? dateTo,
    });
    router.replace(`${base}${query}`);
  }

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    const teamQuery = queryString({ focus, search, sort, direction, page, page_size: 25, date_from: dateFrom, date_to: dateTo });
    const trendQuery = queryString({ date_from: dateFrom, date_to: dateTo });
    Promise.all([api.oversightSummary(), api.oversightTeams(teamQuery), api.oversightTrends(trendQuery)])
      .then(([summaryData, teamData, trendData]) => {
        if (!active) return;
        setSummary(summaryData);
        setTeams(teamData);
        setTrends(trendData);
      })
      .catch((err: Error) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [focus, search, sort, direction, page, dateFrom, dateTo, attempt]);

  function toggleSort(column: string) {
    replace({ sort: column, direction: sort === column && direction === "asc" ? "desc" : "asc", page: 1 });
  }

  const cards = summary ? [
    ["Employees without a lead", summary.employees_without_lead, "unassigned"],
    ["Overdue tasks", summary.overdue_tasks, "overdue"],
    ["Pending reviews", summary.pending_reviews, "pending"],
    ["Inactive teams", summary.inactive_teams, "inactive"],
    ["Total teams", summary.teams, ""],
  ] : [];

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Oversight" title="Team oversight" description="What team leads and their people are doing. Dates use UTC." action={
        <button type="button" className="btn-secondary" onClick={() => downloadCsv(`/api/oversight/export/teams.csv${queryString({ search, sort, direction, date_from: dateFrom, date_to: dateTo, focus })}`, "teams.csv")}>Export CSV</button>
      } />
      {loading && !summary ? <PageSkeleton /> : null}
      {error ? <LoadError message={error} onRetry={() => setAttempt((value) => value + 1)} /> : null}
      {summary ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {cards.map(([label, value, nextFocus]) => (
              <button key={String(label)} type="button" className="card p-4 text-left" onClick={() => replace({ focus: String(nextFocus), page: 1 })}>
                <p className="kpi-label">{label}</p>
                <p className="mt-2 font-display text-2xl">{value}</p>
              </button>
            ))}
          </div>
          {summary.employees_without_lead > 0 ? (
            <p className="text-sm"><button type="button" className="underline" onClick={() => replace({ focus: "unassigned", page: 1 })}>{summary.employees_without_lead} employees have no team lead</button></p>
          ) : null}
          <div className="card grid gap-3 p-4 md:grid-cols-4">
            <input className="input" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Search team leads" aria-label="Search team leads" />
            <input className="input" type="date" value={dateFrom} onChange={(event) => replace({ from: event.target.value, page: 1 })} aria-label="From date" />
            <input className="input" type="date" value={dateTo} onChange={(event) => replace({ to: event.target.value, page: 1 })} aria-label="To date" />
            <Link className="btn-secondary text-center" href={`${base}/hierarchy`}>Org tree</Link>
          </div>
          {focus === "unassigned" ? <Unassigned people={summary.unassigned || []} base={base} /> : <TeamTable base={base} teams={teams} sort={sort} onSort={toggleSort} page={page} onPage={(next) => replace({ page: next })} />}
          <Trends trends={trends} />
        </>
      ) : null}
    </div>
  );
}

function TeamTable({ base, teams, sort, onSort, page, onPage }: { base: string; teams: any; sort: string; onSort: (column: string) => void; page: number; onPage: (page: number) => void }) {
  if (!teams) return null;
  if (!teams.items.length) return <EmptyNote>No teams match this view.</EmptyNote>;
  const columns = [["name", "Name"], ["team_size", "Team size"], ["open_tasks", "Open"], ["overdue_tasks", "Overdue"], ["on_time_rate", "On-time"], ["pending_reviews", "Pending reviews"], ["average_rating", "Average rating"], ["last_activity", "Last activity"]];
  return (
    <div className="space-y-3">
      <DataTable minWidth="64rem">
        <thead>
          <tr>{columns.map(([key, label]) => <th key={key} className="px-4 py-3 text-left"><button type="button" className="text-xs uppercase tracking-wide" onClick={() => onSort(key)}>{label}{sort === key ? " •" : ""}</button></th>)}</tr>
        </thead>
        <tbody>
          {teams.items.map((team: any) => {
            const activity = when(team.last_activity);
            return (
              <tr key={team.id}>
                <td className="px-4 py-3"><Link className="inline-flex items-center gap-2" href={`${base}/teams/${team.id}`}><Initials name={team.name} />{team.name}</Link></td>
                <td className="px-4 py-3">{team.team_size}</td>
                <td className="px-4 py-3">{team.open_tasks}</td>
                <td className="px-4 py-3">{team.overdue_tasks > 0 ? <span className="rounded bg-red-100 px-2 py-1 text-xs text-red-800">Overdue {team.overdue_tasks}</span> : "0"}</td>
                <td className="px-4 py-3">{percent(team.on_time_rate)}</td>
                <td className="px-4 py-3">{team.overdue_reviews > 0 ? <span className="rounded bg-amber-100 px-2 py-1 text-xs text-amber-900">Review waiting {team.pending_reviews}</span> : team.pending_reviews}</td>
                <td className="px-4 py-3">{rating(team.average_rating)}</td>
                <td className="px-4 py-3"><span title={activity.exact}>{team.inactive ? `Inactive, ${activity.label}` : activity.label}</span></td>
              </tr>
            );
          })}
        </tbody>
      </DataTable>
      <div className="flex items-center gap-3 text-sm">
        <button type="button" className="btn-secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</button>
        <span>Page {teams.page} of {Math.max(1, Math.ceil(teams.total / teams.page_size))}</span>
        <button type="button" className="btn-secondary" disabled={page * teams.page_size >= teams.total} onClick={() => onPage(page + 1)}>Next</button>
      </div>
    </div>
  );
}

function Unassigned({ people, base }: { people: any[]; base: string }) {
  if (!people.length) return <EmptyNote>Every employee has a team lead.</EmptyNote>;
  return (
    <ul className="card divide-y divide-ink/10">
      {people.map((person) => (
        <li key={person.id}><Link className="flex items-center gap-3 px-4 py-3 text-sm" href={`${base}/employees/${person.id}`}><Initials name={person.name} /><span>{person.name}<br /><span className="text-xs text-muted-foreground">{person.job_title || "No designation"}</span></span></Link></li>
      ))}
    </ul>
  );
}

function Trends({ trends }: { trends: any }) {
  const weeks = trends?.weeks || [];
  return (
    <div className="card space-y-4 p-6">
      <h2 className="font-display text-lg">Trends</h2>
      {!weeks.length ? <EmptyNote>No tasks in this date range.</EmptyNote> : (
        <>
          <p className="text-sm text-muted-foreground">{weeks.map((week: any) => `${week.week}: ${week.created} created, ${week.completed} completed, on-time ${percent(week.on_time_rate)}, overdue ${week.overdue}`).join(". ")}</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeks}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" label={{ value: "Week", position: "insideBottom", offset: -2 }} />
                <YAxis allowDecimals={false} label={{ value: "Tasks", angle: -90, position: "insideLeft" }} />
                <Tooltip />
                <Legend />
                <Line dataKey="created" name="Created" stroke="#1f6f5b" />
                <Line dataKey="completed" name="Completed" stroke="#355c7d" />
                <Line dataKey="overdue" name="Overdue" stroke="#9b3a3a" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeks.map((week: any) => ({ ...week, on_time: week.on_time_rate == null ? null : Math.round(week.on_time_rate * 1000) / 10 }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" label={{ value: "Week", position: "insideBottom", offset: -2 }} />
                <YAxis unit="%" label={{ value: "On-time %", angle: -90, position: "insideLeft" }} />
                <Tooltip />
                <Legend />
                <Line dataKey="on_time" name="On-time rate" stroke="#355c7d" connectNulls={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
