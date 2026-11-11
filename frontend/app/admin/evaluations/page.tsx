"use client";

import { useState } from "react";
import { DataTable } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { PageSkeleton } from "@/components/PageSkeleton";
import { api } from "@/lib/api";
import { useApiQuery } from "@/lib/useApiQuery";

export default function AdminEvaluationsPage() {
  const { data, loading, setData } = useApiQuery(
    () => Promise.all([api.listEvaluations(), api.adminEmployees()]).then(([evaluations, employees]) => ({ evaluations, employees })),
    () => {
      const evaluations = api.getCached<any[]>("/api/admin/evaluations");
      const employees = api.getCached<any[]>("/api/admin/employees");
      return evaluations && employees ? { evaluations, employees } : null;
    },
  );
  const evaluations = data?.evaluations ?? [];
  const employees = data?.employees ?? [];
  const [form, setForm] = useState({
    employee_id: 0,
    period_start: "",
    period_end: "",
    score: 80,
    comments: "",
    evidence: "",
  });
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const [evals, emps] = await Promise.all([api.listEvaluations(), api.adminEmployees()]);
    setData({ evaluations: evals, employees: emps });
    if (emps[0] && !form.employee_id) setForm((f) => ({ ...f, employee_id: emps[0].id }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    try {
      await api.createEvaluation(form);
      await load();
      setMessage("Evaluation saved.");
    } catch (err: any) {
      setMessage(err.message);
    }
  }

  if (!data && loading) return <PageSkeleton />;

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Admin" title="HR Evaluations" description="Record qualitative performance reviews alongside automated scores." />
      {message ? <p className="text-sm text-brand">{message}</p> : null}
      <form onSubmit={submit} className="card grid gap-4 p-6 md:grid-cols-2">
        <select className="input" value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: Number(e.target.value) })} required>
          {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <input className="input" type="number" min={0} max={100} placeholder="Score" value={form.score} onChange={(e) => setForm({ ...form, score: Number(e.target.value) })} required />
        <input className="input" type="date" value={form.period_start} onChange={(e) => setForm({ ...form, period_start: e.target.value })} required />
        <input className="input" type="date" value={form.period_end} onChange={(e) => setForm({ ...form, period_end: e.target.value })} required />
        <textarea className="input md:col-span-2 min-h-20" placeholder="Comments" value={form.comments} onChange={(e) => setForm({ ...form, comments: e.target.value })} />
        <textarea className="input md:col-span-2 min-h-16" placeholder="Evidence (optional)" value={form.evidence} onChange={(e) => setForm({ ...form, evidence: e.target.value })} />
        <button type="submit" className="btn-primary md:col-span-2">Save Evaluation</button>
      </form>
      <DataTable>
          <thead className="table-head">
            <tr>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Period</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Comments</th>
            </tr>
          </thead>
          <tbody>
            {evaluations.map((ev) => (
              <tr key={ev.id} className="table-row">
                <td className="px-4 py-3">{ev.employee_name}</td>
                <td className="px-4 py-3">{ev.period_start} – {ev.period_end}</td>
                <td className="px-4 py-3 font-semibold">{ev.score}%</td>
                <td className="px-4 py-3 text-sm">{ev.comments || "—"}</td>
              </tr>
            ))}
          </tbody>
        </DataTable>
    </div>
  );
}
