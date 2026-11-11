"use client";

import { NotificationsList } from "@/components/notifications-dynamic";
import { PageHeader } from "@/components/PageHeader";
import { api } from "@/lib/api";
import { useCachedQuery } from "@/lib/useApiQuery";

export default function AdminNotificationsPage() {
  const { data: items, loading, setData } = useCachedQuery(
    "/api/notifications?days=3",
    () => api.notifications(),
  );

  async function markRead(id: number) {
    await api.markNotificationRead(id);
    setData(await api.notifications());
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin"
        title="Notifications"
        description="Task approvals, team updates, and alerts from the last 3 days."
      />
      <NotificationsList items={items ?? []} onMarkRead={markRead} />
    </div>
  );
}
