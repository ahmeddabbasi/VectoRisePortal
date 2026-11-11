"use client";

import { ChatAccessButton } from "@/components/ChatAccessButton";
import { NotificationAccessButton } from "@/components/NotificationAccessButton";
import { cn } from "@/lib/cn";

type Props = {
  chatHref: string;
  notificationsHref: string;
  className?: string;
};

export function PortalHeaderActions({ chatHref, notificationsHref, className }: Props) {
  return (
    <div className={cn("fixed right-4 top-4 z-50 flex items-center gap-2 lg:absolute lg:right-10 lg:top-8", className)}>
      <NotificationAccessButton href={notificationsHref} />
      <ChatAccessButton href={chatHref} variant="grouped" />
    </div>
  );
}
