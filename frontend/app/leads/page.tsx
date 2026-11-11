"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useCategories } from "@/components/CategoriesProvider";
import { EmptyState } from "@/components/EmptyState";
import { FilterBar } from "@/components/FilterBar";
import { PageHeader } from "@/components/PageHeader";
import { TableSkeleton } from "@/components/InlineSkeleton";
import { api, Filters, paths } from "@/lib/api";

const DEFAULT_FILTERS: Filters = { employee: "all", category: "all", search: "" };

function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function LeadsPage() {
  const categories = useCategories();
  const pathname = usePathname();
  const leadDetailBase = pathname.startsWith("/employee/") ? "/employee/sales/leads" : "/admin/sales/leads";
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const debouncedSearch = useDebouncedValue(filters.search || "", 300);
  const queryFilters = { ...filters, search: debouncedSearch };
  const cacheKey = paths.leads(queryFilters);
  const [leads, setLeads] = useState<any[]>(() => api.getCached<any[]>(cacheKey) ?? []);
  const [loading, setLoading] = useState(() => !api.getCached(cacheKey));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const cached = api.getCached<any[]>(cacheKey);
    if (!cached) setLoading(true);
    setError(null);
    api.leads(queryFilters)
      .then((rows) => {
        if (!active) return;
        setLeads(rows);
      })
      .catch((err) => {
        if (!active) return;
        if (!cached) setLeads([]);
        setError(err.message || "Failed to load leads");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [cacheKey, queryFilters.employee, queryFilters.category, queryFilters.search, queryFilters.stage]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="02 / Pipeline"
        title="Unified"
        accent="leads."
        description="Live data from connected Google Sheets — synced every 15 minutes or on demand from Sync Settings."
      />
      <FilterBar filters={filters} onChange={setFilters} categories={categories} showSearch />
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {loading && leads.length === 0 ? <TableSkeleton rows={10} /> : null}
      {!loading && !error && leads.length === 0 ? (
        <EmptyState
          title="No leads found"
          description="Go to Admin → Sales → Sync Settings and run a sync. If sync succeeds but this stays empty, check employee/category filters above."
        />
      ) : null}
      {!loading && leads.length > 0 ? (
        <div className="card overflow-x-auto">
          <p className="border-b border-ink/10 px-4 py-2 text-xs text-muted-foreground">{leads.length} leads shown</p>
          <table className="min-w-full text-left text-sm">
            <thead className="table-head">
              <tr>
                {["Lead ID", "Company", "Contact", "Employee", "Category", "Stage", "Last Activity", "Duplicate"].map((h) => (
                  <th key={h} className="px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="table-row">
                  <td className="px-4 py-3">
                    <Link href={`${leadDetailBase}/${lead.id}`} className="text-link">
                      {lead.external_id}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{lead.company_name || "—"}</td>
                  <td className="px-4 py-3">{lead.contact_name || "—"}</td>
                  <td className="px-4 py-3">{lead.employee_name || "—"}</td>
                  <td className="px-4 py-3">{lead.category}</td>
                  <td className="px-4 py-3">{lead.current_stage || "—"}</td>
                  <td className="px-4 py-3">{lead.last_activity_date || "—"}</td>
                  <td className="px-4 py-3">{lead.is_duplicate ? "Yes" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
