"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCategories } from "@/components/CategoriesProvider";
import { FilterBar } from "@/components/FilterBar";
import { PageHeader } from "@/components/PageHeader";
import { api, Filters } from "@/lib/api";

const DEFAULT_FILTERS: Filters = { employee: "all", category: "all", search: "" };

export default function LeadsPage() {
  const categories = useCategories();
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [leads, setLeads] = useState<any[]>(() => api.getCached(api.paths.leads(DEFAULT_FILTERS)) ?? []);

  useEffect(() => {
    api.leads(filters).then(setLeads).catch(() => setLeads([]));
  }, [filters]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="02 / Pipeline"
        title="Unified"
        accent="leads."
        description="One operational picture across all connected Google Sheet sources."
      />
      <FilterBar filters={filters} onChange={setFilters} categories={categories} showSearch />
      <div className="card overflow-x-auto">
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
                  <Link href={`/leads/${lead.id}`} className="text-link">
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
    </div>
  );
}
