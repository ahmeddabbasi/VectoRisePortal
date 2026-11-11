"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePortalStatus } from "@/contexts/PortalStatusContext";
import { cn } from "@/lib/cn";
import { api } from "@/lib/api";

type Props = {
  href: string;
  className?: string;
  variant?: "corner" | "header";
};

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-lime px-1 text-[10px] font-bold text-[#0f1c2e]">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function NotificationAccessButton({ href, className, variant = "corner" }: Props) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  const { notificationUnread: unread } = usePortalStatus();

  const baseStyles = cn(
    "relative flex items-center justify-center rounded-full border shadow-nav backdrop-blur-2xl transition-colors",
    active
      ? "border-[#1c7fd4] bg-[#1c7fd4] text-white"
      : "border-[#0f1c2e]/12 bg-[#0f1c2e] text-white hover:border-[#1c7fd4] hover:bg-[#1c7fd4]"
  );

  if (variant === "header") {
    return (
      <Link
        href={href}
        onMouseEnter={() => api.prefetchRoute(href)}
        aria-label="Notifications"
        className={cn(baseStyles, "h-11 w-11", className)}
      >
        <Bell size={18} strokeWidth={2} />
        <CountBadge count={unread} />
      </Link>
    );
  }

  return (
    <Link
      href={href}
      onMouseEnter={() => api.prefetchRoute(href)}
      aria-label="Notifications"
      title="Notifications"
      className={cn(baseStyles, "h-11 w-11", className)}
    >
      <Bell size={18} strokeWidth={2} />
      <CountBadge count={unread} />
    </Link>
  );
}
