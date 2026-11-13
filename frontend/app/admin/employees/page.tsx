"use client";

import { useState } from "react";
import { DataTable } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { TableSkeleton } from "@/components/InlineSkeleton";
import { StatusBadge } from "@/components/StatusBadge";
import { api } from "@/lib/api";
import { useApiQuery } from "@/lib/useApiQuery";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";

export default function AdminEmployeesPage() {
  const { data, loading, setData } = useApiQuery(
    () => Promise.all([api.adminEmployees(), api.adminDepartments()]).then(([employees, departments]) => ({ employees, departments })),
    () => {
      const employees = api.getCached<any[]>("/api/admin/employees");
      const departments = api.getCached<any[]>("/api/admin/departments");
      return employees && departments ? { employees, departments } : null;
    },
  );
  const employees = data?.employees ?? [];
  const departments = data?.departments ?? [];
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "", job_title: "", department_id: 0, sales_access: false, can_review_tasks: false });
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageError, setMessageError] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
  const [deleting, setDeleting] = useState(false);
  useBodyScrollLock(Boolean(deleteTarget));

  async function load() {
    const [emps, depts] = await Promise.all([api.adminEmployees(), api.adminDepartments()]);
    setData({ employees: emps, departments: depts });
  }

  async function createEmployee(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setMessageError(false);
    if (form.password !== form.confirmPassword) {
      setMessageError(true);
      setMessage("Passwords do not match. Type the same password in both fields.");
      return;
    }
    try {
      await api.createEmployee({
        name: form.name,
        email: form.email,
        password: form.password,
        job_title: form.job_title,
        department_id: form.department_id || null,
        sales_access: form.sales_access,
        can_review_tasks: form.can_review_tasks,
        role: "employee",
      });
      await load();
      setForm({ name: "", email: "", password: "", confirmPassword: "", job_title: "", department_id: 0, sales_access: false, can_review_tasks: false });
      setShowPassword(false);
      setMessage("Employee created.");
    } catch (err: any) {
      setMessageError(true);
      setMessage(err.message);
    }
  }

  function askDelete(employee: any) {
    setDeleteTarget(employee);
    setDeleteStep(1);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    if (deleteStep === 1) {
      setDeleteStep(2);
      return;
    }
    setDeleting(true);
    setMessage(null);
    setMessageError(false);
    try {
      await api.deleteEmployee(deleteTarget.id);
      if (editing?.id === deleteTarget.id) setEditing(null);
      setMessage(`${deleteTarget.name} was deleted.`);
      setDeleteTarget(null);
      await load();
    } catch (err: any) {
      setMessageError(true);
      setMessage(err.message || "Could not delete that employee");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  async function saveEdit() {
    if (!editing) return;
    await api.updateEmployee(editing.id, {
      name: editing.name,
      job_title: editing.job_title,
      status: editing.status,
      department_id: editing.department_id,
      sales_access: Boolean(editing.sales_access),
      can_review_tasks: Boolean(editing.can_review_tasks),
    });
    setEditing(null);
    await load();
  }

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Admin" title="Employee Management" description="Add, edit, and manage workforce members." />
      {message ? <p className={messageError ? "text-sm text-red-600" : "text-sm text-brand"}>{message}</p> : null}
      <form onSubmit={createEmployee} className="card grid gap-4 p-6 md:grid-cols-2">
        <input className="input" placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className="input" placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input className="input" placeholder="Job title" value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} />
        <select className="input" value={form.department_id} onChange={(e) => {
          const departmentId = Number(e.target.value);
          const department = departments.find((item) => item.id === departmentId);
          setForm({ ...form, department_id: departmentId, sales_access: /sales/i.test(department?.name || "") });
        }}>
          <option value={0}>No department</option>
          {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <div className="relative">
          <input
            className="input pr-16"
            placeholder="Password (8+ chars, letter and number)"
            type={showPassword ? "text" : "password"}
            minLength={8}
            autoComplete="new-password"
            autoCapitalize="off"
            spellCheck={false}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <button
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-brand"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-pressed={showPassword}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        <input
          className="input"
          placeholder="Repeat password"
          type={showPassword ? "text" : "password"}
          minLength={8}
          autoComplete="new-password"
          autoCapitalize="off"
          spellCheck={false}
          value={form.confirmPassword}
          onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
          required
        />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.sales_access} onChange={(e) => setForm({ ...form, sales_access: e.target.checked })} /> Can view sales data and leads</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.can_review_tasks} onChange={(e) => setForm({ ...form, can_review_tasks: e.target.checked })} /> Can review task documents</label>
        <button type="submit" className="btn-primary md:col-span-2">Add Employee</button>
      </form>
      {!data && loading ? <TableSkeleton rows={8} /> : <DataTable minWidth="40rem">
          <thead className="table-head">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Access</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id} className="table-row">
                <td className="px-4 py-3 font-mono-custom text-xs">{emp.employee_code}</td>
                <td className="px-4 py-3">{emp.name}</td>
                <td className="px-4 py-3">{emp.email}</td>
                <td className="px-4 py-3">{emp.department_name || "—"}</td>
                <td className="px-4 py-3"><StatusBadge status={emp.status} /></td>
                <td className="px-4 py-3 text-xs">{[emp.sales_access ? "Sales" : null, emp.can_review_tasks ? "Review" : null].filter(Boolean).join(", ") || "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-3">
                    <button type="button" className="tap-target text-xs text-brand" onClick={() => setEditing({ ...emp })}>Edit</button>
                    <button type="button" className="tap-target text-xs text-red-700" onClick={() => askDelete(emp)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
      </DataTable>}
      {editing ? (
        <div className="card space-y-4 p-6">
          <h2 className="font-display text-lg">Edit {editing.name}</h2>
          <input className="input" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
          <input className="input" value={editing.job_title || ""} onChange={(e) => setEditing({ ...editing, job_title: e.target.value })} />
          <select className="input" value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select className="input" value={editing.department_id || 0} onChange={(e) => setEditing({ ...editing, department_id: Number(e.target.value) })}>
            <option value={0}>No department</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(editing.sales_access)} onChange={(e) => setEditing({ ...editing, sales_access: e.target.checked })} /> Can view sales data and leads</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(editing.can_review_tasks)} onChange={(e) => setEditing({ ...editing, can_review_tasks: e.target.checked })} /> Can review task documents</label>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-primary" onClick={saveEdit}>Save</button>
            <button type="button" className="btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
            <button type="button" className="btn-secondary text-red-700" onClick={() => askDelete(editing)}>Delete</button>
          </div>
        </div>
      ) : null}
      {deleteTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0e1a]/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-employee-title"
          onKeyDown={(event) => {
            if (event.key === "Escape" && !deleting) {
              if (deleteStep === 2) setDeleteStep(1);
              else setDeleteTarget(null);
            }
          }}
        >
          <div className="card w-full max-w-md space-y-4 p-6">
            <h2 id="delete-employee-title" className="font-display text-lg">
              {deleteStep === 1 ? `Delete ${deleteTarget.name}?` : `Confirm deletion of ${deleteTarget.name}`}
            </h2>
            <p className="text-sm text-muted-foreground">
              {deleteStep === 1
                ? "Their sign-in will be removed. Nothing is deleted until you confirm a second time."
                : "This permanently removes their account, tasks, attendance, and any leads assigned to them. This cannot be undone."}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="btn-secondary"
                disabled={deleting}
                onClick={() => (deleteStep === 2 ? setDeleteStep(1) : setDeleteTarget(null))}
              >
                {deleteStep === 2 ? "Go back" : "Cancel"}
              </button>
              <button type="button" className="btn-primary" disabled={deleting} onClick={confirmDelete}>
                {deleteStep === 1 ? "Continue" : deleting ? "Deleting..." : "Delete employee"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
