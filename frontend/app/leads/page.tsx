"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FilterBar } from "@/components/FilterBar";
import { PageHeader } from "@/components/PageHeader";
import { api, Filters } from "@/lib/api";

export default function LeadsPage() {
  const [filters, setFilters] = useState<Filters>({ employee: "all", category: "all", search: "" });
  const [categories, setCategories] = useState<string[]>([]);
  const [leads, setLeads] = useState<any[]>([]);

  useEffect(() => {
    api.categories().then((r) => setCategories(r.categories));
  }, []);

  useEffect(() => {
    api.leads(filters).then(setLeads).catch(() => setLeads([]));
  }, [filters]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        description="Unified view across all connected Google Sheet sources."
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
