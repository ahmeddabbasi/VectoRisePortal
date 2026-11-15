"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useBodyScrollLock } from "@/lib/useBodyScrollLock";

type Person = {
  id: number;
  name: string;
  job_title?: string | null;
  department_name?: string | null;
};

type Assignment = {
  id: number;
  team_lead_id: number;
  team_lead_name: string;
  employee_id: number;
  employee_name: string;
};

type Toast = { tone: "ok" | "error"; text: string };

function reportsOf(assignments: Assignment[], leadId: number) {
  return assignments.filter((row) => row.team_lead_id === leadId).map((row) => row.employee_id);
}

function wouldCycle(assignments: Assignment[], teamLeadId: number, employeeId: number) {
  const stack = [employeeId];
  const seen = new Set<number>();
  while (stack.length) {
    const current = stack.pop() as number;
    if (seen.has(current)) continue;
    seen.add(current);
    for (const reportId of reportsOf(assignments, current)) {
      if (reportId === teamLeadId) return true;
      stack.push(reportId);
    }
  }
  return false;
}

function initials(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || "?";
}

function PersonMark({ name }: { name: string }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0f1c2e]/10 text-xs font-semibold" aria-hidden>
      {initials(name)}
    </span>
  );
}

export function TeamAssignmentEditor({ employee, employees }: { employee: Person; employees: Person[] }) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [leadPending, setLeadPending] = useState<number[]>([]);
  const [memberPending, setMemberPending] = useState<number[]>([]);
  const [leadQuery, setLeadQuery] = useState("");
  const [memberQuery, setMemberQuery] = useState("");
  const [saving, setSaving] = useState<"leads" | "members" | "remove" | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [removeTarget, setRemoveTarget] = useState<{ team_lead_id: number; employee_id: number; label: string } | null>(null);
  useBodyScrollLock(Boolean(removeTarget));

  useEffect(() => {
    setLeadPending([]);
    setMemberPending([]);
    setLeadQuery("");
    setMemberQuery("");
  }, [employee.id]);

  useEffect(() => {
    api.teamAssignments().then(setAssignments).catch(() => setAssignments([]));
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const leads = assignments.filter((row) => row.employee_id === employee.id);
  const members = assignments.filter((row) => row.team_lead_id === employee.id);
  const leadIds = new Set(leads.map((row) => row.team_lead_id));
  const memberIds = new Set(members.map((row) => row.employee_id));

  const directory = useMemo(() => new Map(employees.map((person) => [person.id, person])), [employees]);
  const pendingAssignments: Assignment[] = [
    ...leadPending.map((id, index) => ({ id: -index - 1, team_lead_id: id, team_lead_name: "", employee_id: employee.id, employee_name: "" })),
    ...memberPending.map((id, index) => ({ id: -index - 100, team_lead_id: employee.id, team_lead_name: "", employee_id: id, employee_name: "" })),
  ];

  function reason(teamLeadId: number, employeeId: number) {
    if (teamLeadId === employeeId) return "A person cannot lead themselves";
    if (wouldCycle([...assignments, ...pendingAssignments], teamLeadId, employeeId)) return "Would create a circular team";
    return "";
  }

  async function refresh() {
    setAssignments(await api.teamAssignments());
  }

  async function savePairs(pairs: { team_lead_id: number; employee_id: number }[], kind: "leads" | "members") {
    setSaving(kind);
    setToast(null);
    const saved: typeof pairs = [];
    try {
      for (const pair of pairs) {
        await api.createTeamAssignment(pair);
        saved.push(pair);
      }
      await refresh();
      if (kind === "leads") setLeadPending([]);
      else setMemberPending([]);
      setToast({ tone: "ok", text: saved.length === 1 ? "Assignment saved." : `${saved.length} assignments saved.` });
    } catch (err: any) {
      await refresh().catch(() => undefined);
      if (kind === "leads") setLeadPending((ids) => ids.filter((id) => !saved.some((pair) => pair.team_lead_id === id)));
      else setMemberPending((ids) => ids.filter((id) => !saved.some((pair) => pair.employee_id === id)));
      setToast({ tone: "error", text: err.message || "Could not save that assignment." });
    } finally {
      setSaving(null);
    }
  }

  async function confirmRemove() {
    if (!removeTarget) return;
    setSaving("remove");
    setToast(null);
    try {
      await api.removeTeamAssignment(removeTarget.team_lead_id, removeTarget.employee_id);
      await refresh();
      setRemoveTarget(null);
      setToast({ tone: "ok", text: "Assignment removed." });
    } catch (err: any) {
      setToast({ tone: "error", text: err.message || "Could not remove that assignment." });
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-6 border-t border-[#0f1c2e]/10 pt-6">
      <div>
        <h3 className="font-display text-lg">Team</h3>
        <p className="mt-1 text-sm text-muted-foreground">Choices stay unsaved until you press Save. A person only appears here after the server confirms the assignment.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Picker
          title="Team leads"
          hint={`Who leads ${employee.name}`}
          empty="No team lead assigned yet. Assign one."
          query={leadQuery}
          onQuery={setLeadQuery}
          saved={leads.map((row) => ({
            key: row.id,
            person: directory.get(row.team_lead_id),
            name: row.team_lead_name,
            onRemove: () => setRemoveTarget({ team_lead_id: row.team_lead_id, employee_id: row.employee_id, label: `${row.team_lead_name} leading ${employee.name}` }),
          }))}
          options={employees.filter((person) => person.id !== employee.id && !leadIds.has(person.id)).map((person) => ({
            person,
            checked: leadPending.includes(person.id),
            disabledReason: leadPending.includes(person.id) ? "" : reason(person.id, employee.id),
          }))}
          onToggle={(id) => setLeadPending((ids) => ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id])}
          pendingCount={leadPending.length}
          saving={saving === "leads"}
          onSave={() => savePairs(leadPending.map((id) => ({ team_lead_id: id, employee_id: employee.id })), "leads")}
          onCancel={() => setLeadPending([])}
        />
        <Picker
          title="Team members"
          hint={`People ${employee.name} leads`}
          empty="No team members yet. Assign the people this person leads."
          query={memberQuery}
          onQuery={setMemberQuery}
          saved={members.map((row) => ({
            key: row.id,
            person: directory.get(row.employee_id),
            name: row.employee_name,
            onRemove: () => setRemoveTarget({ team_lead_id: row.team_lead_id, employee_id: row.employee_id, label: `${employee.name} leading ${row.employee_name}` }),
          }))}
          options={employees.filter((person) => person.id !== employee.id && !memberIds.has(person.id)).map((person) => ({
            person,
            checked: memberPending.includes(person.id),
            disabledReason: memberPending.includes(person.id) ? "" : reason(employee.id, person.id),
          }))}
          onToggle={(id) => setMemberPending((ids) => ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id])}
          pendingCount={memberPending.length}
          saving={saving === "members"}
          onSave={() => savePairs(memberPending.map((id) => ({ team_lead_id: employee.id, employee_id: id })), "members")}
          onCancel={() => setMemberPending([])}
        />
      </div>
      {toast ? (
        <p role="status" className={`fixed bottom-4 right-4 z-50 max-w-sm rounded-xl px-4 py-3 text-sm shadow-lg ${toast.tone === "ok" ? "bg-[#0f1c2e] text-white" : "bg-red-700 text-white"}`}>
          {toast.text}
        </p>
      ) : null}
      {removeTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0e1a]/60 p-4" role="dialog" aria-modal="true" aria-labelledby="remove-assignment-title">
          <div className="card w-full max-w-md space-y-4 p-6">
            <h2 id="remove-assignment-title" className="font-display text-lg">Remove this team assignment?</h2>
            <p className="text-sm text-muted-foreground">{removeTarget.label} will lose that access immediately.</p>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary" disabled={saving === "remove"} onClick={() => setRemoveTarget(null)}>Cancel</button>
              <button type="button" className="btn-primary" disabled={saving === "remove"} onClick={confirmRemove}>{saving === "remove" ? "Removing..." : "Remove"}</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Picker({
  title,
  hint,
  empty,
  query,
  onQuery,
  saved,
  options,
  onToggle,
  pendingCount,
  saving,
  onSave,
  onCancel,
}: {
  title: string;
  hint: string;
  empty: string;
  query: string;
  onQuery: (value: string) => void;
  saved: { key: number; person?: Person; name: string; onRemove: () => void }[];
  options: { person: Person; checked: boolean; disabledReason: string }[];
  onToggle: (id: number) => void;
  pendingCount: number;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  const needle = query.trim().toLowerCase();
  const visible = options.filter((option) => {
    if (!needle) return true;
    const haystack = `${option.person.name} ${option.person.job_title || ""} ${option.person.department_name || ""}`.toLowerCase();
    return haystack.includes(needle);
  });

  return (
    <section className="space-y-3 rounded-2xl border border-[#0f1c2e]/10 p-4">
      <div>
        <h4 className="font-display text-base">{title}</h4>
        <p className="text-sm text-muted-foreground">{hint}</p>
      </div>
      {saved.length === 0 ? <p className="text-sm text-muted-foreground">{empty}</p> : null}
      <ul className="space-y-2">
        {saved.map((row) => (
          <li key={row.key} className="flex items-center gap-3 rounded-xl bg-[#0f1c2e]/5 px-3 py-2">
            <PersonMark name={row.name} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{row.name}</span>
              <span className="block truncate text-xs text-muted-foreground">{[row.person?.job_title, row.person?.department_name].filter(Boolean).join(" · ") || "Employee"}</span>
            </span>
            <button type="button" className="tap-target text-xs text-red-700" onClick={row.onRemove}>Remove</button>
          </li>
        ))}
      </ul>
      <label className="block text-sm">
        Search
        <input className="input mt-1 w-full" value={query} onChange={(event) => onQuery(event.target.value)} placeholder="Name, job title, or department" />
      </label>
      <ul className="max-h-52 space-y-1 overflow-y-auto" role="group" aria-label={title}>
        {visible.length === 0 ? <li className="px-1 py-2 text-sm text-muted-foreground">No matches.</li> : null}
        {visible.map((option) => {
          const blocked = Boolean(option.disabledReason);
          return (
            <li key={option.person.id}>
              <label className={`flex items-center gap-3 rounded-xl px-2 py-2 ${blocked ? "opacity-50" : "hover:bg-[#0f1c2e]/5"}`}>
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={option.checked}
                  disabled={blocked || saving}
                  onChange={() => onToggle(option.person.id)}
                />
                <PersonMark name={option.person.name} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{option.person.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {option.disabledReason || [option.person.job_title, option.person.department_name].filter(Boolean).join(" · ") || "Employee"}
                  </span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-primary" disabled={!pendingCount || saving} onClick={onSave}>
          {saving ? "Saving..." : `Save${pendingCount ? ` (${pendingCount})` : ""}`}
        </button>
        <button type="button" className="btn-secondary" disabled={!pendingCount || saving} onClick={onCancel}>Cancel</button>
      </div>
    </section>
  );
}
