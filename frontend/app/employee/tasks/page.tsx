"use client";



import { useState } from "react";

import { PageHeader } from "@/components/PageHeader";
import { TableSkeleton } from "@/components/InlineSkeleton";

import { RuleViolationAlert } from "@/components/RuleViolationAlert";
import { TaskDocuments } from "@/components/TaskDocuments";
import { StatusBadge } from "@/components/StatusBadge";

import { api } from "@/lib/api";
import { EXCEPTION_GUIDES, getApiError, type ViolationDetail } from "@/lib/violations";
import { useCachedQuery } from "@/lib/useApiQuery";



export default function EmployeeTasksPage() {

  const { data: tasks, loading, setData: setTasks } = useCachedQuery("/api/employee/tasks", () => api.employeeTasks());

  const [activeTimer, setActiveTimer] = useState<number | null>(null);

  const [form, setForm] = useState({ title: "", description: "", priority: "medium", due_date: "" });

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [alert, setAlert] = useState<ViolationDetail | null>(null);



  async function reload() {
    setTasks(await api.employeeTasks());
  }

  async function submitTask(e: React.FormEvent) {

    e.preventDefault();

    setSubmitting(true);

    setError(null);

    try {

      await api.createEmployeeTask({

        title: form.title,

        description: form.description || null,

        priority: form.priority,

        due_date: form.due_date || null,

        task_type: "general",

      });

      setForm({ title: "", description: "", priority: "medium", due_date: "" });

      await reload();

    } catch (err: any) {

      setError(err.message || "Failed to submit task");

    } finally {

      setSubmitting(false);

    }

  }



  async function runTaskAction(action: () => Promise<void>) {
    setAlert(null);
    try {
      await action();
      await reload();
    } catch (err) {
      const { message, violation } = getApiError(err);
      if (violation) setAlert(violation);
      else setError(message);
    }
  }

  async function toggleItem(taskId: number, itemId: number, completed: boolean) {
    await runTaskAction(() => api.toggleChecklist(taskId, itemId, !completed));
  }

  async function updateStatus(taskId: number, status: string) {
    await runTaskAction(() => api.updateEmployeeTask(taskId, { status }));
  }

  async function startTimer(taskId: number) {
    setAlert(null);
    try {
      const res = await api.startTimer(taskId);
      setActiveTimer(res.id);
    } catch (err) {
      const { message, violation } = getApiError(err);
      if (violation) setAlert(violation);
      else setError(message);
    }
  }

  async function stopTimer() {
    if (!activeTimer) return;
    await runTaskAction(async () => {
      await api.stopTimer(activeTimer);
      setActiveTimer(null);
    });
  }




  const rows = tasks ?? [];
  const pending = rows.filter((t) => t.status === "pending_approval");
  const rejected = rows.filter((t) => t.status === "rejected");
  const active = rows.filter((t) => t.status !== "pending_approval" && t.status !== "rejected");

  return (

    <div className="space-y-8">

      <PageHeader

        eyebrow="Employee"

        title="My Tasks"

        description="Submit daily tasks for approval and manage assigned work."

      />

      {alert ? <RuleViolationAlert violation={alert} onDismiss={() => setAlert(null)} /> : null}

      <form onSubmit={submitTask} className="card grid gap-4 p-6 md:grid-cols-2">

        <h2 className="font-display text-lg md:col-span-2">Submit today&apos;s task</h2>

        <input

          className="input md:col-span-2"

          placeholder="What will you work on today?"

          value={form.title}

          onChange={(e) => setForm({ ...form, title: e.target.value })}

          required

        />

        <textarea

          className="input md:col-span-2 min-h-20"

          placeholder="Details (optional)"

          value={form.description}

          onChange={(e) => setForm({ ...form, description: e.target.value })}

        />

        <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>

          {["low", "medium", "high", "urgent"].map((p) => <option key={p} value={p}>{p}</option>)}

        </select>

        <input className="input" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />

        {error ? <p className="text-sm text-red-600 md:col-span-2">{error}</p> : null}

        <button type="submit" className="btn-primary md:col-span-2" disabled={submitting}>

          {submitting ? "Submitting..." : "Submit for approval"}

        </button>

      </form>



      {activeTimer ? (

        <div className="card flex items-center justify-between p-4">

          <span className="text-sm">Timer running...</span>

          <button type="button" className="btn-secondary" onClick={stopTimer}>Stop Timer</button>

        </div>

      ) : null}



      {!tasks && loading ? <TableSkeleton rows={5} /> : null}

      {pending.length ? (

        <div className="space-y-4">

          <h2 className="font-display text-lg">Awaiting approval</h2>

          {pending.map((task) => (

            <div key={task.id} className="card border-l-4 border-l-violet-400 p-6">

              <div className="flex flex-wrap items-start justify-between gap-3">

                <div>

                  <p className="font-display text-lg">{task.title}</p>

                  <p className="text-sm text-muted-foreground">{task.description}</p>

                </div>

                <StatusBadge status={task.status} />

              </div>

              {task.due_date ? <p className="mt-2 text-sm text-muted-foreground">Due: {task.due_date}</p> : null}

            </div>

          ))}

        </div>

      ) : null}

      {rejected.length ? (
        <div className="space-y-4">
          <h2 className="font-display text-lg">Rejected tasks</h2>
          {rejected.map((task) => (
            <div key={task.id} className="card border-l-4 border-l-red-400 p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg">{task.title}</p>
                  <p className="text-sm text-muted-foreground">{task.description}</p>
                  {task.notes ? <p className="mt-2 text-sm text-red-700">Reason: {task.notes}</p> : null}
                </div>
                <StatusBadge status={task.status} />
              </div>
              <RuleViolationAlert
                className="mt-4"
                violation={{
                  code: "task_rejected",
                  title: "This task was not approved",
                  message: task.notes || "Admin did not approve this task submission.",
                  severity: "error",
                  link: "/employee/tasks",
                  steps: [
                    "Review the rejection reason above.",
                    "Submit a new task with clearer details if you still need the work logged.",
                    "Contact your manager if you disagree with the decision.",
                  ],
                }}
              />
            </div>
          ))}
        </div>
      ) : null}

      <div className="space-y-4">

        <h2 className="font-display text-lg">Assigned & approved tasks</h2>

        {active.length === 0 ? <p className="text-sm text-muted-foreground">No active tasks yet.</p> : null}

        {active.map((task) => (

          <div key={task.id} className="card p-6">

            <div className="flex flex-wrap items-start justify-between gap-3">

              <div>

                <p className="font-display text-lg">{task.title}</p>

                <p className="text-sm text-muted-foreground">{task.description}</p>

              </div>

              <StatusBadge status={task.status} />

            </div>

            {task.status === "overdue" ? (
              <RuleViolationAlert className="mt-4" violation={EXCEPTION_GUIDES.overdue_task} />
            ) : null}

            <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted-foreground">

              <span>Progress: {task.progress}%</span>

              <span>Est: {task.estimated_minutes ?? "—"} min</span>

              <span>Actual: {task.actual_minutes ?? "—"} min</span>

              {task.due_date ? <span>Due: {task.due_date}</span> : null}

            </div>

            <div className="mt-4 flex flex-wrap gap-2">

              {task.status === "not_started" ? (

                <button type="button" className="btn-secondary text-xs" onClick={() => updateStatus(task.id, "in_progress")}>Start</button>

              ) : null}

              {task.status === "in_progress" ? (

                <>

                  <button type="button" className="btn-secondary text-xs" onClick={() => startTimer(task.id)}>Start Timer</button>

                  <button type="button" className="btn-primary text-xs" onClick={() => updateStatus(task.id, "completed")}>Complete</button>

                </>

              ) : null}

            </div>

            {task.checklist_items?.length ? (

              <ul className="mt-4 space-y-2">

                {task.checklist_items.map((item: any) => (

                  <li key={item.id} className="flex items-center gap-2 text-sm">

                    <input

                      type="checkbox"

                      checked={item.is_completed}

                      onChange={() => toggleItem(task.id, item.id, item.is_completed)}

                    />

                    {item.label}

                  </li>

                ))}

              </ul>

            ) : null}

            <TaskDocuments taskId={task.id} />

          </div>

        ))}

      </div>

    </div>

  );

}


