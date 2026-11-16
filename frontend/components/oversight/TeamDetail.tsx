"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { DataTable } from "@/components/DataTable";
import { api, downloadCsv } from "@/lib/api";
import { EmptyNote, Initials, LoadError, MetricTile, PageSkeleton } from "@/components/oversight/Chrome";
import { days, percent, queryString, rating, when } from "@/components/oversight/format";

export function TeamDetail({ base, employeeId }: { base: string; employeeId: number }) {
  const params = useSearchParams();
  const router = useRouter();
  const tab = params.get("tab") || "members";
  const status = params.get("status") || "";
  const [team, setTeam] = useState<any>(null);
  const [tasks, setTasks] = useState<any>(null);
  const [reviews, setReviews] = useState<any>(null);
  const [activity, setActivity] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    Promise.all([
      api.oversightTeam(employeeId),
      api.oversightTeamTasks(employeeId, queryString({ status })),
      api.oversightTeamReviews(employeeId),
      api.oversightTeamActivity(employeeId, "?page_size=50"),
    ]).then(([teamData, taskData, reviewData, activityData]) => {
      if (!active) return;
      setTeam(teamData);
      setTasks(taskData);
      setReviews(reviewData);
      setActivity(activityData);
    }).catch((err: Error) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [employeeId, status, attempt]);

  function setTab(next: string) {
    router.replace(`${base}/teams/${employeeId}${queryString({ tab: next, status })}`);
  }

  if (loading && !team) return <PageSkeleton />;
  if (error) return <LoadError message={error} onRetry={() => setAttempt((value) => value + 1)} />;
  if (!team) return null;
  const metrics = team.metrics || {};
  const activityTime = when(metrics.last_activity);
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Team" title={team.employee.name} description={team.employee.job_title || "No designation"} action={
        <button type="button" className="btn-secondary" onClick={() => downloadCsv(`/api/oversight/export/teams/${employeeId}/tasks.csv`, "team-tasks.csv")}>Export tasks</button>
      } />
      <div className="flex items-center gap-3">
        <Initials name={team.employee.name} />
        <p className="text-sm">Manager: {team.managers?.length ? team.managers.map((manager: any) => <Link key={manager.id} className="underline" href={`${base}/employees/${manager.id}`}>{manager.name}</Link>) : "No manager"}</p>
        <p className="text-sm text-muted-foreground" title={activityTime.exact}>Last activity {activityTime.label}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricTile label="Team size" value={metrics.team_size ?? 0} />
        <MetricTile label="Open tasks" value={metrics.open_tasks ?? 0} />
        <MetricTile label="Overdue" value={metrics.overdue_tasks ?? 0} />
        <MetricTile label="On-time" value={percent(metrics.on_time_rate)} />
        <MetricTile label="Pending reviews" value={metrics.pending_reviews ?? 0} />
        <MetricTile label="Review turnaround" value={days(team.turnaround_days)} />
        <MetricTile label="Reviews due" value={metrics.reviews_due ?? "N/A"} />
        <MetricTile label="Average rating" value={rating(metrics.average_rating)} />
      </div>
      <div className="flex flex-wrap gap-2">
        {["members", "tasks", "reviews", "activity"].map((item) => (
          <button key={item} type="button" className={tab === item ? "btn-primary" : "btn-secondary"} onClick={() => setTab(item)}>{item[0].toUpperCase() + item.slice(1)}</button>
        ))}
      </div>
      {tab === "members" ? <Members base={base} people={team.members || []} /> : null}
      {tab === "tasks" ? <Tasks base={base} tasks={tasks} status={status} onStatus={(value) => router.replace(`${base}/teams/${employeeId}${queryString({ tab: "tasks", status: value })}`)} /> : null}
      {tab === "reviews" ? <Reviews reviews={reviews} /> : null}
      {tab === "activity" ? <ActivityList base={base} items={activity?.items || []} /> : null}
    </div>
  );
}

function Members({ base, people }: { base: string; people: any[] }) {
  if (!people.length) return <EmptyNote>This lead has no direct reports.</EmptyNote>;
  return (
    <ul className="card divide-y divide-ink/10">
      {people.map((person: any) => (
        <li key={person.id}><Link className="flex items-center justify-between gap-3 px-4 py-3 text-sm" href={`${base}/employees/${person.id}`}><span>{person.name}<span className="mt-1 block text-xs text-muted-foreground">{person.job_title || "No designation"}</span></span><span className="text-xs">{person.open_tasks || 0} open{person.overdue_tasks ? `, overdue ${person.overdue_tasks}` : ""}</span></Link></li>
      ))}
    </ul>
  );
}

function Tasks({ tasks, status, onStatus }: { base: string; tasks: any; status: string; onStatus: (status: string) => void }) {
  return (
    <div className="space-y-3">
      <label className="block text-sm">Status
        <select className="input mt-1" value={status} onChange={(event) => onStatus(event.target.value)}>
          <option value="">All</option>
          <option value="open">Open</option>
          <option value="overdue">Overdue</option>
          <option value="completed">Completed</option>
          <option value="blocked">Blocked</option>
        </select>
      </label>
      {!tasks?.items?.length ? <EmptyNote>No tasks match this filter.</EmptyNote> : (
        <DataTable>
          <thead><tr><th className="px-4 py-3 text-left">Task</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-left">Deadline</th></tr></thead>
          <tbody>
            {tasks.items.map((task: any) => (
              <tr key={task.id}>
                <td className="px-4 py-3">{task.title}</td>
                <td className="px-4 py-3">{task.overdue ? "Overdue" : task.status}</td>
                <td className="px-4 py-3">{task.due_date || "No deadline"}</td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      )}
    </div>
  );
}

function Reviews({ reviews }: { reviews: any }) {
  if (!reviews) return null;
  if (!reviews.tasks?.length && !reviews.performance?.length) return <EmptyNote>No reviews from this lead yet.</EmptyNote>;
  return (
    <div className="space-y-4">
      {reviews.tasks?.map((review: any) => <article key={review.id} className="card p-4 text-sm"><p className="font-medium">{review.title}</p><p>{review.status}{review.rating ? `, rated ${review.rating}` : ""}</p><p className="text-muted-foreground">{review.comment}</p></article>)}
      {reviews.performance?.map((review: any) => <article key={review.id} className="card p-4 text-sm"><p className="font-medium">Performance review, score {review.score}</p><p className="text-muted-foreground">{review.comment}</p></article>)}
    </div>
  );
}

function ActivityList({ base, items }: { base: string; items: any[] }) {
  if (!items.length) return <EmptyNote>No activity for this team yet.</EmptyNote>;
  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const stamp = when(item.created_at);
        return (
          <li key={item.id} className="card p-4 text-sm">
            <p>{item.sentence} {item.historical ? <span className="ml-2 rounded bg-ink/10 px-2 py-0.5 text-xs">Historical</span> : null}</p>
            <p className="text-xs text-muted-foreground" title={stamp.exact}>{stamp.label}</p>
            <p className="mt-1 space-x-3">
              {item.task_id ? <Link className="underline" href={`${base}/employees/${item.target_employee_id}`}>Task</Link> : null}
              {item.target_employee_id ? <Link className="underline" href={`${base}/employees/${item.target_employee_id}`}>{item.target_name || "Person"}</Link> : null}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
