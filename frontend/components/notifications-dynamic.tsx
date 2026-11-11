"use client";

import dynamic from "next/dynamic";

function ListPlaceholder() {
  return <div className="card h-48 animate-pulse rounded-2xl bg-black/[0.03]" />;
}

export const NotificationsList = dynamic(
  () => import("@/components/NotificationsList").then((m) => m.NotificationsList),
  { ssr: false, loading: () => <ListPlaceholder /> },
);
