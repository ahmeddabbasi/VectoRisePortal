"use client";

import { useEffect, useState } from "react";
import { api, DEFAULT_PERIOD, Filters } from "@/lib/api";

const PERIODS = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last_7_days", label: "Last 7 days" },
  { value: "this_week", label: "This week" },
  { value: "last_week", label: "Last week" },
  { value: "this_month", label: "This month" },
  { value: "last_month", label: "Last month" },
  { value: "last_30_days", label: "Last 30 days" },
  { value: "all", label: "All time" },
];

type Props = {
  filters: Filters;
  onChange: (next: Filters) => void;
  categories?: string[];
  showSearch?: boolean;
};

export function FilterBar({ filters, onChange, categories = [], showSearch }: Props) {
  const [employees, setEmployees] = useState<string[]>([]);
  useEffect(() => {
    api.employees().then((rows) => setEmployees(rows.map((row) => row.name).filter(Boolean))).catch(() => setEmployees([]));
  }, []);
  return (
    <div className="card flex flex-wrap items-end gap-3 p-4 sm:gap-4 sm:p-5">
      <Field label="Period">
        <select
          className="input"
          value={filters.period || DEFAULT_PERIOD}
          onChange={(e) => onChange({ ...filters, period: e.target.value })}
        >
          {PERIODS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Employee">
        <select
          className="input"
          value={filters.employee || "all"}
          onChange={(e) => onChange({ ...filters, employee: e.target.value })}
        >
          <option value="all">All Employees</option>
          {employees.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </Field>
      <Field label="Category">
        <select
          className="input"
          value={filters.category || "all"}
          onChange={(e) => onChange({ ...filters, category: e.target.value })}
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Field>
      {showSearch && (
        <Field label="Search">
          <input
            className="input min-w-0 w-full sm:min-w-[220px]"
            placeholder="Company, contact, email..."
            value={filters.search || ""}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
          />
        </Field>
      )}
      <button
        className="btn-secondary"
        onClick={() => onChange({ period: DEFAULT_PERIOD, employee: "all", category: "all", search: "" })}
      >
        Reset
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex w-full min-w-0 flex-1 flex-col gap-2 font-mono-custom text-[9px] uppercase tracking-widest text-muted-foreground sm:min-w-[10rem]">
      {label}
      {children}
    </label>
  );
}
