"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getToken } from "@/lib/auth";
import { api } from "@/lib/api";

type PortalStatus = {
  notificationUnread: number;
  chatUnread: number;
};

const PortalStatusContext = createContext<PortalStatus>({ notificationUnread: 0, chatUnread: 0 });

export function usePortalStatus() {
  return useContext(PortalStatusContext);
}

/** Single shared poll for notification + chat badges (avoids duplicate requests on every navigation). */
export function PortalStatusProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<PortalStatus>({ notificationUnread: 0, chatUnread: 0 });

  useEffect(() => {
    if (!getToken()) return;

    const poll = () => {
      Promise.all([
        api.notificationUnreadCount().catch(() => ({ count: 0 })),
        api.chatUnreadCount().catch(() => ({ count: 0 })),
      ]).then(([notifications, chat]) => {
        setStatus({ notificationUnread: notifications.count, chatUnread: chat.count });
      });
    };

    poll();
    const interval = window.setInterval(poll, 15000);
    const onVisible = () => {
      if (!document.hidden) poll();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const value = useMemo(() => status, [status.notificationUnread, status.chatUnread]);
  return <PortalStatusContext.Provider value={value}>{children}</PortalStatusContext.Provider>;
}
