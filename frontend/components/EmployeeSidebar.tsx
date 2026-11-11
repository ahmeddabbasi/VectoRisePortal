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



const links = [

  { href: "/employee/dashboard", label: "Dashboard", index: "01" },

  { href: "/employee/attendance", label: "Attendance", index: "02" },

  { href: "/employee/schedule", label: "Schedule", index: "03" },

  { href: "/employee/tasks", label: "Tasks", index: "04" },

  { href: "/employee/performance", label: "Performance", index: "05" },

  { href: "/employee/exceptions", label: "Exceptions", index: "06" },

  { href: "/employee/profile", label: "Profile", index: "07" },

];

function navLinks(user: { sales_access?: boolean; can_review_tasks?: boolean } | null) {
  const items = [...links];
  if (user?.can_review_tasks) items.push({ href: "/employee/reviews", label: "Reviews", index: "08" });
  if (user?.sales_access) {
    items.push(
      { href: "/employee/sales", label: "Sales", index: "S1" },
      { href: "/employee/sales/leads", label: "Leads", index: "S2" },
      { href: "/employee/sales/pipeline", label: "Pipeline", index: "S3" },
      { href: "/employee/sales/activity", label: "Activity", index: "S4" },
      { href: "/employee/sales/analytics", label: "Analytics", index: "S5" },
    );
  }
  return items;
}



export function EmployeeSidebar() {

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

            <NotificationAccessButton href="/employee/notifications" variant="header" />

            <ChatAccessButton href="/employee/chat" variant="header" />

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

          <nav className="mt-3 max-h-[min(70vh,calc(100dvh-7rem))] overflow-y-auto overscroll-contain rounded-3xl bg-[#0a0e1a]/95 p-4 text-white shadow-nav-dark sm:p-5">

            {navLinks(user).map((link) => (

              <Link

                key={link.href}

                href={link.href}

                onClick={closeMenu}

                onMouseEnter={() => prefetch(link.href)}

                className="flex min-h-11 items-center justify-between rounded-xl px-3 py-2.5 text-base font-display text-white/90 hover:bg-white/5"

              >

                {link.label}

                <ArrowUpRight size={16} className="text-lime" />

              </Link>

            ))}

            <button

              type="button"

              onClick={() => { closeMenu(); logout(); }}

              className="mt-2 flex min-h-11 w-full items-center gap-2 rounded-xl px-3 py-2 text-base text-white/80 hover:bg-white/5 hover:text-white"

            >

              <LogOut size={16} /> Sign out

            </button>

          </nav>

        ) : null}

      </div>



      <aside className="fixed inset-y-0 left-0 z-30 hidden h-screen w-64 flex-col overflow-hidden bg-navy-deep text-paper lg:flex">

        <div className="shrink-0 border-b border-paper/15 px-6 py-7">

          <BrandMark light />

          <p className="mt-4 font-mono-custom text-[9px] uppercase tracking-[0.22em] text-paper/45">Employee Portal</p>

          <p className="mt-2 text-sm text-paper/65">{user?.name || user?.email}</p>

        </div>

        <nav className="scrollbar-hidden min-h-0 flex-1 space-y-0.5 overflow-y-auto overscroll-contain p-4">

          {navLinks(user).map((link) => {

            const active = link.href === "/employee/sales"
              ? pathname === link.href
              : pathname === link.href || pathname.startsWith(`${link.href}/`);

            return (

              <Link

                key={link.href}

                href={link.href}

                onMouseEnter={() => prefetch(link.href)}

                className={cn(

                  "flex min-h-11 items-center justify-between rounded-xl px-3 py-2 font-mono-custom text-[10px] uppercase tracking-[0.12em]",

                  active ? "bg-white/10 font-semibold text-white" : "text-white/75 hover:bg-white/5 hover:text-white"

                )}

              >

                <span><span className="mr-2 text-white/40">{link.index}</span>{link.label}</span>

                {active ? <ArrowUpRight size={13} className="text-lime" /> : null}

              </Link>

            );

          })}

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


