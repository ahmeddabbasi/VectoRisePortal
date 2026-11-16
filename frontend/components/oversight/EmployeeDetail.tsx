"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { api } from "@/lib/api";
import { EmptyNote, LoadError, MetricTile, PageSkeleton } from "@/components/oversight/Chrome";
import { percent, rating, when } from "@/components/oversight/format";

export function EmployeeDetail({ base, employeeId }: { base: string; employeeId: number }) {
  const [person, setPerson] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setError(null);
    api.oversightEmployee(employeeId).then((data) => { if (active) setPerson(data); }).catch((err: Error) => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [employeeId, attempt]);
  if (error) return <LoadError message={error} onRetry={() => setAttempt((value) => value + 1)} />;
  if (!person) return <PageSkeleton />;
  const metrics = person.metrics || {};
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Employee" title={person.employee.name} description={person.employee.job_title || "No designation"} />
      <p className="text-sm">Team leads: {person.team_leads?.length ? person.team_leads.map((lead: any) => <Link key={lead.id} className="mr-3 underline" href={`${base}/teams/${lead.id}`}>{lead.name}</Link>) : "No team lead"}</p>
      <p className="text-sm">Manager: {person.managers?.length ? person.managers.map((manager: any) => manager.name).join(", ") : "No manager"}</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile label="Open" value={metrics.open_tasks ?? 0} />
        <MetricTile label="Overdue" value={metrics.overdue_tasks ?? 0} />
        <MetricTile label="On-time" value={percent(metrics.on_time_rate)} />
        <MetricTile label="Average rating" value={rating(metrics.average_rating)} />
        <MetricTile label="Documents" value={metrics.documents_uploaded ?? 0} />
      </div>
      <section className="space-y-3">
        <h2 className="font-display text-lg">Tasks</h2>
        {!person.tasks?.length ? <EmptyNote>No tasks yet.</EmptyNote> : person.tasks.map((task: any) => <p key={task.id} className="text-sm">{task.title} — {task.status} — {task.due_date || "No deadline"}</p>)}
      </section>
      <section className="space-y-3">
        <h2 className="font-display text-lg">Documents</h2>
        {!person.documents?.length ? <EmptyNote>No documents uploaded.</EmptyNote> : person.documents.map((doc: any) => <p key={doc.id} className="text-sm">{doc.name} for {doc.task_title}</p>)}
      </section>
      <section className="space-y-3">
        <h2 className="font-display text-lg">Reviews received</h2>
        {!person.reviews?.tasks?.length && !person.reviews?.performance?.length ? <EmptyNote>No reviews yet.</EmptyNote> : null}
        {person.reviews?.tasks?.map((review: any) => <p key={review.id} className="text-sm">{review.title}: {review.status}{review.rating ? `, ${review.rating}` : ""}</p>)}
        {person.reviews?.performance?.map((review: any) => <p key={review.id} className="text-sm">Performance score {review.score}</p>)}
      </section>
      <section className="space-y-3">
        <h2 className="font-display text-lg">Assignment history</h2>
        <p className="text-sm text-muted-foreground">History is recorded from {person.launch_at || "the oversight launch"}. Earlier removals are not listed. Rows marked historical were rebuilt from assignments that still exist.</p>
        {!person.assignments?.length ? <EmptyNote>No assignment changes are on record yet.</EmptyNote> : person.assignments.map((item: any) => <p key={item.id} className="text-sm">{item.sentence}{item.historical ? " (historical)" : ""}</p>)}
      </section>
      <section className="space-y-3">
        <h2 className="font-display text-lg">Activity</h2>
        {!person.activity?.items?.length ? <EmptyNote>No activity yet.</EmptyNote> : person.activity.items.map((item: any) => {
          const stamp = when(item.created_at);
          return <p key={item.id} className="text-sm" title={stamp.exact}>{item.sentence} — {stamp.label}</p>;
        })}
      </section>
    </div>
  );
}
