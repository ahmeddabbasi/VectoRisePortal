"use client";

import { KpiGrid } from "@/components/KpiGrid";
import { PageHeader } from "@/components/PageHeader";
import { PageSkeleton } from "@/components/PageSkeleton";
import { api, DEFAULT_PERIOD, paths } from "@/lib/api";
import { useCachedQuery } from "@/lib/useApiQuery";

export default function AdminSalesDashboardPage() {
  const { data: overview, loading } = useCachedQuery(
    paths.overview({ period: DEFAULT_PERIOD }),
    () => api.overview({ period: DEFAULT_PERIOD }),
  );

  if (!overview && loading) return <PageSkeleton />;

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Sales" title="Sales Operations Dashboard" description="Lead pipeline, outreach activity, and conversion metrics." />
      {overview ? (
        <KpiGrid
          items={[
            { label: "Total Leads", value: overview.total_leads ?? 0 },
            { label: "Emails Sent", value: overview.emails_sent ?? overview.initial_emails ?? 0 },
            { label: "Replies", value: overview.replies ?? 0 },
            { label: "Meetings", value: overview.meetings ?? 0 },
          ]}
        />
      ) : null}
      {overview && overview.total_leads === 0 ? (
        <p className="text-sm text-muted-foreground">No leads yet. Go to Sync Settings to import from Google Sheets.</p>
      ) : null}
    </div>
  );
}
