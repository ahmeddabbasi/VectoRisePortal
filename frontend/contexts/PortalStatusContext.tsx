"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getToken } from "@/lib/auth";
import { api } from "@/lib/api";

type PortalStatus = {
  notificationUnread: number;
  chatUnread: number;
  setNotificationUnread: (count: number) => void;
  setChatUnread: (count: number) => void;
  refresh: () => void;
};

const PortalStatusContext = createContext<PortalStatus>({
  notificationUnread: 0,
  chatUnread: 0,
  setNotificationUnread: () => undefined,
  setChatUnread: () => undefined,
  refresh: () => undefined,
});

export function usePortalStatus() {
  return useContext(PortalStatusContext);
}

/** Single shared poll for notification + chat badges (avoids duplicate requests on every navigation). */
export function PortalStatusProvider({ children }: { children: React.ReactNode }) {
  const [notificationUnread, setNotificationUnread] = useState(0);
  const [chatUnread, setChatUnread] = useState(0);

  const refresh = useCallback(() => {
    if (!getToken()) {
      setNotificationUnread(0);
      setChatUnread(0);
      return;
    }
    Promise.all([
      api.notificationUnreadCount().catch(() => ({ count: 0 })),
      api.chatUnreadCount().catch(() => ({ count: 0 })),
    ]).then(([notifications, chat]) => {
      setNotificationUnread(notifications.count);
      setChatUnread(chat.count);
    });
  }, []);

  useEffect(() => {
    refresh();
    const interval = window.setInterval(() => {
      if (!document.hidden) refresh();
    }, 15000);
    const onVisible = () => {
      if (!document.hidden) refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  const value = useMemo(
    () => ({ notificationUnread, chatUnread, setNotificationUnread, setChatUnread, refresh }),
    [notificationUnread, chatUnread, refresh],
  );
  return <PortalStatusContext.Provider value={value}>{children}</PortalStatusContext.Provider>;
}
