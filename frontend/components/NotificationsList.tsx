"use client";

import Link from "next/link";
import { EmptyState } from "@/components/EmptyState";

type NotificationItem = {
  id: number;
  title: string;
  message: string;
  link?: string | null;
  is_read: boolean;
  created_at: string;
  notification_type?: string;
};

type Props = {
  items: NotificationItem[];
  onMarkRead: (id: number) => void;
};

export function NotificationsList({ items, onMarkRead }: Props) {
  if (items.length === 0) {
    return <EmptyState title="No notifications" description="You're all caught up for the last 3 days." />;
  }

  return (
    <div className="space-y-3">
      {items.map((n) => (
        <div key={n.id} className={`card p-4 ${n.is_read ? "opacity-70" : "border-l-4 border-l-[#1c7fd4]"}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              {n.notification_type === "announcement" ? (
                <span className="mb-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-900">
                  Announcement
                </span>
              ) : null}
              {n.notification_type === "exception" ? (
                <span className="mb-1 inline-block rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-orange-900">
                  Exception
                </span>
              ) : null}
              <p className="font-medium">{n.title}</p>
              <p className="text-sm text-muted-foreground">{n.message}</p>
              <p className="mt-1 font-mono-custom text-[10px] text-muted-foreground">
                {new Date(n.created_at).toLocaleString()}
              </p>
              {n.link && n.link.startsWith("/") && !n.link.startsWith("//") ? (
                <Link href={n.link} className="mt-2 inline-block text-sm text-[#1c7fd4] hover:underline">
                  View details
                </Link>
              ) : null}
            </div>
            {!n.is_read ? (
              <button type="button" className="btn-secondary shrink-0 text-xs" onClick={() => onMarkRead(n.id)}>
                Mark read
              </button>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
