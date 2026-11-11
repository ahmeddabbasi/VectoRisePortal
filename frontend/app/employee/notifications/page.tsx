"use client";

import { NotificationsList } from "@/components/notifications-dynamic";
import { PageHeader } from "@/components/PageHeader";
import { api } from "@/lib/api";
import { useCachedQuery } from "@/lib/useApiQuery";

export default function EmployeeNotificationsPage() {
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
        eyebrow="Employee"
        title="Notifications"
        description="Alerts from the last 3 days — tasks, attendance, and updates."
      />
      <NotificationsList items={items ?? []} onMarkRead={markRead} />
    </div>
  );
}
