"use client";

import Link from "next/link";

type Person = { id: number; name: string; job_title?: string | null };

function People({ rows, empty }: { rows: Person[]; empty: string }) {
  if (!rows.length) return <p className="mt-1 text-sm text-muted-foreground">{empty}</p>;
  return (
    <ul className="mt-2 space-y-2">
      {rows.map((person) => (
        <li key={person.id}>
          <Link href={`/employee/people/${person.id}`} className="text-sm text-brand hover:underline">
            {person.name}
          </Link>
          <p className="text-xs text-muted-foreground">{person.job_title || "No designation"}</p>
        </li>
      ))}
    </ul>
  );
}

export function TeamHierarchy({
  summary,
  showEmptyReports = true,
}: {
  summary: { team_leads?: Person[]; direct_reports?: Person[] } | null;
  showEmptyReports?: boolean;
}) {
  if (!summary) return null;
  const leads = summary.team_leads ?? [];
  const reports = summary.direct_reports ?? [];
  if (!leads.length && !reports.length && !showEmptyReports) return null;
  return (
    <div className="card space-y-4 p-6">
      <h2 className="font-display text-lg">Your team</h2>
      {leads.length || showEmptyReports ? (
        <div>
          <p className="kpi-label">Your team lead</p>
          <People rows={leads} empty="No team lead assigned." />
        </div>
      ) : null}
      {reports.length || showEmptyReports ? (
        <div>
          <p className="kpi-label">People you lead</p>
          <People rows={reports} empty="You are not leading anyone." />
        </div>
      ) : null}
    </div>
  );
}
