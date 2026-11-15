"use client";

import { NotificationsList } from "@/components/notifications-dynamic";
import { PageHeader } from "@/components/PageHeader";
import { usePortalStatus } from "@/contexts/PortalStatusContext";
import { api } from "@/lib/api";
import { useCachedQuery } from "@/lib/useApiQuery";

export default function AdminNotificationsPage() {
  const { data: items, setData } = useCachedQuery(
    "/api/notifications?days=3",
    () => api.notifications(),
  );
  const { setNotificationUnread, refresh } = usePortalStatus();
  const unread = (items ?? []).some((item) => !item.is_read);

  async function markRead(id: number) {
    const next = (items ?? []).map((item) => (item.id === id ? { ...item, is_read: true } : item));
    setData(next);
    setNotificationUnread(next.filter((item) => !item.is_read).length);
    await api.markNotificationRead(id);
  }

  async function markAll() {
    const previous = items ?? [];
    setData(previous.map((item) => ({ ...item, is_read: true })));
    setNotificationUnread(0);
    try {
      await api.markAllNotificationsRead();
    } catch (err) {
      setData(previous);
      refresh();
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin"
        title="Notifications"
        description="Task approvals, team updates, and alerts from the last 3 days."
        action={unread ? <button type="button" className="btn-secondary" onClick={markAll}>Mark all as read</button> : null}
      />
      <NotificationsList items={items ?? []} onMarkRead={markRead} />
    </div>
  );
}
