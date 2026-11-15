"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { TaskDocuments } from "@/components/TaskDocuments";
import { TeamHierarchy } from "@/components/TeamHierarchy";
import { api } from "@/lib/api";

export default function MyTeamPage() {
  const [summary, setSummary] = useState<any>(null);
  const [memberId, setMemberId] = useState(0);
  const [tasks, setTasks] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [review, setReview] = useState({ taskId: 0, rating: "5", comments: "", status: "approved" });
  const [evaluation, setEvaluation] = useState({ period_start: "", period_end: "", score: "80", comments: "" });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = () => {
      api.teamSummary().then((data) => {
        if (!active) return;
        setSummary(data);
        setMemberId((current) => current || data.direct_reports?.[0]?.id || 0);
      }).catch((err: Error) => {
        if (active) setError(err.message);
      });
    };
    load();
    window.addEventListener("focus", load);
    return () => {
      active = false;
      window.removeEventListener("focus", load);
    };
  }, []);

  useEffect(() => {
    if (!memberId) {
      setTasks([]);
      return;
    }
    api.teamTasks(memberId).then(setTasks).catch((err: Error) => setError(err.message));
  }, [memberId]);

  async function assignTask() {
    if (!memberId || !title.trim()) return;
    setError(null);
    setMessage(null);
    try {
      await api.assignTeamTask(memberId, { title: title.trim(), due_date: dueDate || null, priority: "medium" });
      setTitle("");
      setTasks(await api.teamTasks(memberId));
      setMessage("Task assigned.");
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function submitReview() {
    const taskId = review.taskId || tasks[0]?.id;
    if (!taskId) return;
    setError(null);
    setMessage(null);
    try {
      await api.reviewTeamTask(taskId, {
        rating: Number(review.rating),
        comments: review.comments,
        status: review.status,
      });
      setMessage("Task review saved.");
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function submitEvaluation() {
    if (!memberId) return;
    setError(null);
    setMessage(null);
    try {
      await api.reviewTeamMember(memberId, {
        employee_id: memberId,
        period_start: evaluation.period_start,
        period_end: evaluation.period_end,
        score: Number(evaluation.score),
        comments: evaluation.comments,
      });
      setMessage("Performance review saved.");
    } catch (err: any) {
      setError(err.message);
    }
  }

  const reports = summary?.direct_reports ?? [];
  const leads = summary?.team_leads ?? [];
  const description = reports.length
    ? "Assign work, review documents, and record performance for people you lead."
    : leads.length
      ? "The team lead you report to."
      : "You are not on a team yet.";

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Employee" title="My team" description={description} />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {message ? <p className="text-sm text-brand">{message}</p> : null}
      <TeamHierarchy summary={summary} showEmptyReports={reports.length > 0} />
      {reports.length > 0 ? (
        <div className="card space-y-4 p-6">
          <label className="block text-sm">
            Team member
            <select className="input mt-1" value={memberId} onChange={(event) => setMemberId(Number(event.target.value))}>
              {reports.map((person: any) => (
                <option key={person.id} value={person.id}>{person.job_title ? `${person.name} — ${person.job_title}` : person.name}</option>
              ))}
            </select>
          </label>
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
            <input className="input" placeholder="Task title" value={title} onChange={(event) => setTitle(event.target.value)} />
            <input className="input" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
            <button type="button" className="btn-primary" onClick={assignTask}>Assign task</button>
          </div>
        </div>
      ) : null}
      {tasks.map((task) => (
        <div key={task.id} className="card grid gap-6 p-6 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-lg">{task.title}</p>
                <p className="text-sm text-muted-foreground">{task.description}</p>
              </div>
              <StatusBadge status={task.status} />
            </div>
          </div>
          <TaskDocuments taskId={task.id} canUpload={false} />
        </div>
      ))}
      {tasks.length > 0 ? (
        <div className="card space-y-3 p-6">
          <h2 className="font-display text-lg">Task review</h2>
          <select className="input" value={review.taskId || tasks[0].id} onChange={(event) => setReview({ ...review, taskId: Number(event.target.value) })}>
            {tasks.map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}
          </select>
          <div className="grid gap-3 md:grid-cols-2">
            <select className="input" value={review.status} onChange={(event) => setReview({ ...review, status: event.target.value })}>
              <option value="approved">Approved</option>
              <option value="needs_changes">Needs changes</option>
            </select>
            <select className="input" value={review.rating} onChange={(event) => setReview({ ...review, rating: event.target.value })}>
              {[1, 2, 3, 4, 5].map((score) => <option key={score} value={score}>{score}</option>)}
            </select>
          </div>
          <textarea className="input w-full" placeholder="Review comments" value={review.comments} onChange={(event) => setReview({ ...review, comments: event.target.value })} />
          <button type="button" className="btn-secondary" onClick={submitReview}>Save task review</button>
        </div>
      ) : null}
      {memberId ? (
        <div className="card space-y-3 p-6">
          <h2 className="font-display text-lg">Performance review</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <input className="input" type="date" value={evaluation.period_start} onChange={(event) => setEvaluation({ ...evaluation, period_start: event.target.value })} />
            <input className="input" type="date" value={evaluation.period_end} onChange={(event) => setEvaluation({ ...evaluation, period_end: event.target.value })} />
            <input className="input" type="number" min={0} max={100} value={evaluation.score} onChange={(event) => setEvaluation({ ...evaluation, score: event.target.value })} />
          </div>
          <textarea className="input w-full" placeholder="Comments" value={evaluation.comments} onChange={(event) => setEvaluation({ ...evaluation, comments: event.target.value })} />
          <button type="button" className="btn-primary" onClick={submitEvaluation}>Save performance review</button>
        </div>
      ) : null}
    </div>
  );
}
