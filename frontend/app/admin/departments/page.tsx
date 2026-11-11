"use client";

import { useState } from "react";
import { DataTable } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { PageSkeleton } from "@/components/PageSkeleton";
import { api } from "@/lib/api";
import { useApiQuery } from "@/lib/useApiQuery";

export default function AdminDepartmentsPage() {
  const { data: departments, loading, setData } = useApiQuery(
    () => api.adminDepartments(),
    () => api.getCached("/api/admin/departments"),
  );
  const [form, setForm] = useState({ name: "", description: "" });
  const [editing, setEditing] = useState<any | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    setData(await api.adminDepartments());
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    try {
      await api.createDepartment(form);
      setForm({ name: "", description: "" });
      await load();
      setMessage("Department created.");
    } catch (err: any) {
      setMessage(err.message);
    }
  }

  async function saveEdit() {
    if (!editing) return;
    await api.updateDepartment(editing.id, { name: editing.name, description: editing.description });
    setEditing(null);
    await load();
  }

  async function remove(id: number) {
    if (!confirm("Delete this department?")) return;
    try {
      await api.deleteDepartment(id);
      await load();
    } catch (err: any) {
      setMessage(err.message);
    }
  }

  if (!departments && loading) return <PageSkeleton />;

  const rows = departments ?? [];

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Admin" title="Departments" description="Organize employees into departments." />
      {message ? <p className="text-sm text-brand">{message}</p> : null}
      <form onSubmit={create} className="card grid gap-4 p-6 md:grid-cols-2">
        <input className="input" placeholder="Department name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className="input" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <button type="submit" className="btn-primary md:col-span-2">Add Department</button>
      </form>
      <DataTable>
          <thead className="table-head">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => (
              <tr key={d.id} className="table-row">
                <td className="px-4 py-3">{d.name}</td>
                <td className="px-4 py-3">{d.description || "—"}</td>
                <td className="px-4 py-3 text-right">
                  <button type="button" className="mr-3 text-xs text-brand" onClick={() => setEditing({ ...d })}>Edit</button>
                  <button type="button" className="text-xs text-red-600" onClick={() => remove(d.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </DataTable>
      {editing ? (
        <div className="card space-y-4 p-6">
          <h2 className="font-display text-lg">Edit {editing.name}</h2>
          <input className="input" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
          <input className="input" value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
          <div className="flex gap-2">
            <button type="button" className="btn-primary" onClick={saveEdit}>Save</button>
            <button type="button" className="btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
