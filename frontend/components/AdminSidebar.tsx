"use client";



import { ArrowUpRight, LogOut, Menu, X } from "lucide-react";

import Link from "next/link";

import { usePathname, useRouter } from "next/navigation";

import { useEffect, useState } from "react";

import { BrandMark } from "@/components/BrandMark";

import { ChatAccessButton } from "@/components/ChatAccessButton";

import { NotificationAccessButton } from "@/components/NotificationAccessButton";

import { useAuth } from "@/contexts/AuthContext";

import { cn } from "@/lib/cn";

import { api } from "@/lib/api";

import { useBodyScrollLock } from "@/lib/useBodyScrollLock";



const workforceLinks = [

  { href: "/admin/dashboard", label: "Overview", index: "01" },

  { href: "/admin/employees", label: "Employees", index: "02" },

  { href: "/admin/departments", label: "Departments", index: "02b" },

  { href: "/admin/attendance", label: "Attendance", index: "03" },

  { href: "/admin/schedules", label: "Schedules", index: "04" },

  { href: "/admin/tasks", label: "Tasks", index: "05" },

  { href: "/admin/exceptions", label: "Exceptions", index: "06" },

  { href: "/admin/reports", label: "Reports", index: "07" },

  { href: "/admin/evaluations", label: "Evaluations", index: "08" },

  { href: "/admin/announcements", label: "Announcements", index: "09" },

  { href: "/admin/settings", label: "Settings", index: "10" },

  { href: "/admin/audit", label: "Audit Log", index: "11" },

  { href: "/admin/errors", label: "Error Reports", index: "12" },

];



const salesLinks = [

  { href: "/admin/sales", label: "Sales Dashboard", index: "S1" },

  { href: "/admin/sales/leads", label: "Leads", index: "S2" },

  { href: "/admin/sales/pipeline", label: "Pipeline", index: "S3" },

  { href: "/admin/sales/activity", label: "Activity", index: "S4" },

  { href: "/admin/sales/analytics", label: "Analytics", index: "S5" },

  { href: "/admin/sales/settings", label: "Sync Settings", index: "S6" },

];



function NavSection({

  title,

  links,

  pathname,

  prefetch,

  onNavigate,

  mobile = false,

}: {

  title: string;

  links: typeof workforceLinks;

  pathname: string;

  prefetch: (href: string) => void;

  onNavigate?: () => void;

  mobile?: boolean;

}) {

  return (

    <div className="space-y-1">

      <p className={cn("px-3 pb-2 font-mono-custom uppercase tracking-[0.2em] text-white/40", mobile ? "text-[10px]" : "text-[9px]")}>{title}</p>

      {links.map((link) => {

        const active = link.href === "/admin/sales"
          ? pathname === link.href
          : pathname === link.href || (link.href !== "/admin/dashboard" && pathname.startsWith(link.href));

        return (

          <Link

            key={link.href}

            href={link.href}

            onClick={onNavigate}

            onMouseEnter={() => prefetch(link.href)}

            className={cn(

              "flex items-center justify-between rounded-xl px-3 transition-colors",

              mobile

                ? "min-h-11 py-2.5 text-base font-display text-white/90"

                : "min-h-10 py-2 font-mono-custom text-[10px] uppercase tracking-[0.12em]",

              active ? "bg-white/10 font-semibold text-white" : "text-white/75 hover:bg-white/5 hover:text-white"

            )}

          >

            <span>

              {!mobile ? <span className="mr-2 text-white/40">{link.index}</span> : null}

              {link.label}

            </span>

            {active ? <ArrowUpRight size={mobile ? 16 : 13} className="text-lime" /> : null}

          </Link>

        );

      })}

    </div>

  );

}



export function AdminSidebar() {

  const pathname = usePathname();

  const router = useRouter();

  const { logout, user } = useAuth();

  const [open, setOpen] = useState(false);



  useBodyScrollLock(open);



  useEffect(() => {

    setOpen(false);

  }, [pathname]);



  const prefetch = (href: string) => {

    router.prefetch(href);

    api.prefetchRoute(href);

  };



  const closeMenu = () => setOpen(false);



  return (

    <>

      {open ? (

        <button type="button" className="mobile-nav-backdrop lg:hidden" aria-label="Close menu" onClick={closeMenu} />

      ) : null}



      <div className="safe-top sticky top-0 z-40 px-3 lg:hidden">

        <header className="flex items-center justify-between gap-2 rounded-full border border-[#0f1c2e]/12 bg-white/90 px-3 py-2 shadow-nav backdrop-blur-2xl">

          <BrandMark compact />

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">

            <NotificationAccessButton href="/admin/notifications" variant="header" />

            <ChatAccessButton href="/admin/chat" variant="header" />

            <button

              type="button"

              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0f1c2e] text-white"

              aria-label={open ? "Close menu" : "Open menu"}

              onClick={() => setOpen((v) => !v)}

            >

              {open ? <X size={17} /> : <Menu size={17} />}

            </button>

          </div>

        </header>

        {open ? (

          <nav className="mt-3 max-h-[min(70vh,calc(100dvh-7rem))] space-y-4 overflow-y-auto overscroll-contain rounded-3xl bg-[#0a0e1a]/95 p-4 text-white shadow-nav-dark sm:p-5">

            <NavSection title="Workforce" links={workforceLinks} pathname={pathname} prefetch={prefetch} onNavigate={closeMenu} mobile />

            <NavSection title="Sales" links={salesLinks} pathname={pathname} prefetch={prefetch} onNavigate={closeMenu} mobile />

            <button

              type="button"

              onClick={() => { closeMenu(); logout(); }}

              className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 py-2 text-base text-white/80 hover:bg-white/5 hover:text-white"

            >

              <LogOut size={16} /> Sign out

            </button>

          </nav>

        ) : null}

      </div>



      <aside className="fixed inset-y-0 left-0 z-30 hidden h-screen w-72 flex-col overflow-hidden bg-navy-deep text-paper lg:flex">

        <div className="shrink-0 border-b border-paper/15 px-6 py-7">

          <BrandMark light />

          <p className="mt-4 font-mono-custom text-[9px] uppercase tracking-[0.22em] text-paper/45">Admin Portal</p>

          <p className="mt-2 text-sm text-paper/65">{user?.email}</p>

        </div>

        <nav className="scrollbar-hidden min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain p-4">

          <NavSection title="Workforce" links={workforceLinks} pathname={pathname} prefetch={prefetch} />

          <NavSection title="Sales" links={salesLinks} pathname={pathname} prefetch={prefetch} />

        </nav>

        <div className="shrink-0 border-t border-paper/15 p-4">

          <button type="button" onClick={logout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-paper/75 hover:bg-white/5 hover:text-white">

            <LogOut size={16} /> Sign out

          </button>

        </div>

      </aside>

    </>

  );

}


