"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { api } from "@/lib/api";

export default function LeadDetailPage() {
  const params = useParams<{ id: string }>();
  const [lead, setLead] = useState<any>(null);

  useEffect(() => {
    if (!params?.id) return;
    api.lead(Number(params.id)).then(setLead).catch(() => setLead(null));
  }, [params?.id]);

  if (!lead) return <div className="card p-6">Loading lead...</div>;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={lead.external_id}
        title={lead.company_name || lead.contact_name}
        description={`${lead.category} · ${lead.employee_name}`}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card space-y-2 p-4 text-sm">
          <Row label="Contact" value={lead.contact_name} />
          <Row label="Email" value={lead.email} />
          <Row label="LinkedIn" value={lead.linkedin_url} />
          <Row label="Industry" value={lead.industry} />
          <Row label="Current Stage" value={lead.current_stage} />
          <Row label="Reply Status" value={lead.reply_status} />
          <Row label="Meeting Status" value={lead.meeting_status} />
          <Row label="Opportunity Status" value={lead.opportunity_status} />
          <Row label="Source Sheet" value={`${lead.source_sheet} (row ${lead.source_row})`} />
        </div>
        <div className="card p-4">
          <h3 className="chart-title mb-3">Activity Timeline</h3>
          <div className="space-y-3">
            {(lead.activities || []).length === 0 ? (
              <p className="text-sm text-[var(--muted)]">No dated activities yet.</p>
            ) : (
              lead.activities.map((act: any) => (
                <div key={act.id} className="border-l-2 border-[var(--blue)] pl-3">
                  <p className="text-xs text-[var(--muted)]">{act.activity_date || "No date"}</p>
                  <p className="text-sm">{act.activity_type.replaceAll("_", " ")}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between gap-4 border-b border-[var(--border)] py-2">
      <span className="text-[var(--muted)]">{label}</span>
      <span className="text-right">{value || "—"}</span>
    </div>
  );
}
