"use client";

import { KpiGrid } from "@/components/KpiGrid";
import { KpiSkeleton } from "@/components/InlineSkeleton";
import { PageHeader } from "@/components/PageHeader";
import { api } from "@/lib/api";
import { useApiQuery } from "@/lib/useApiQuery";

export default function AdminDashboardPage() {
  const { data, error } = useApiQuery(
    () => api.adminDashboard(),
    () => api.getCached("/api/admin/dashboard"),
  );

  const workforce = data?.workforce || {};
  const tasks = data?.tasks || {};
  const sales = data?.sales || {};

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin"
        title="Workforce & Sales Overview"
        description="HRM workforce metrics alongside sales operations — side by side."
      />
      {error ? <p className="text-red-600">{error}</p> : null}
      <section>
        <h2 className="mb-4 font-display text-xl text-ink">Workforce Today</h2>
        {!data ? (
          <KpiSkeleton count={8} />
        ) : (
          <KpiGrid
            items={[
              { label: "Present", value: workforce.present ?? 0 },
              { label: "Absent", value: workforce.absent ?? 0 },
              { label: "Late", value: workforce.late ?? 0 },
              { label: "Currently Working", value: workforce.currently_working ?? 0 },
              { label: "Missing Checkout", value: workforce.missing_checkout ?? 0 },
              { label: "Tasks Overdue", value: tasks.overdue ?? 0 },
              { label: "Tasks Completed Today", value: tasks.completed_today ?? 0 },
              { label: "Active Tasks", value: tasks.total_active ?? 0 },
            ]}
          />
        )}
      </section>
      <section>
        <h2 className="mb-4 font-display text-xl text-ink">Sales Today</h2>
        {!data ? (
          <KpiSkeleton count={4} />
        ) : (
          <KpiGrid
            items={[
              { label: "Total Leads", value: sales.total_leads ?? 0 },
              { label: "Emails Sent", value: sales.emails_sent ?? sales.initial_emails ?? 0 },
              { label: "Replies", value: sales.replies ?? 0 },
              { label: "Meetings", value: sales.meetings ?? 0 },
            ]}
          />
        )}
      </section>
    </div>
  );
}
