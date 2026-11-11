"use client";

import { PageHeader } from "@/components/PageHeader";
import { DocumentList } from "@/components/TaskDocuments";
import { api } from "@/lib/api";
import { useApiQuery } from "@/lib/useApiQuery";

export default function ReviewDocumentsPage() {
  const { data, loading } = useApiQuery(
    () => api.reviewDocuments(),
    () => api.getCached<any[]>("/api/employee/reviews/documents"),
  );
  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Reviews" title="Task documents" description="Files employees uploaded on their tasks. Open a file to review it." />
      {loading && !data ? <p className="text-sm text-muted-foreground">Loading documents...</p> : <DocumentList rows={data ?? []} />}
    </div>
  );
}
