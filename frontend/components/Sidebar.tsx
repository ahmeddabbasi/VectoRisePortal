"use client";

import { ArrowUpRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { cn } from "@/lib/cn";
import { api } from "@/lib/api";
import { BRAND } from "@/lib/brand";

const links = [
  { href: "/", label: "Dashboard", index: "01" },
  { href: "/leads", label: "Leads", index: "02" },
  { href: "/employees", label: "Employees", index: "03" },
  { href: "/pipeline", label: "Pipeline", index: "04" },
  { href: "/activity", label: "Activity", index: "05" },
  { href: "/analytics", label: "Analytics", index: "06" },
  { href: "/settings", label: "Settings", index: "07" },
];

function warm(href: string, router: ReturnType<typeof useRouter>) {
  router.prefetch(href);
  api.prefetchRoute(href);
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    links.forEach((link) => warm(link.href, router));
  }, [router]);

  return (
    <>
      <div className="sticky top-0 z-40 px-4 pt-4 lg:hidden">
        <header className="flex items-center justify-between rounded-full border border-[#0f1c2e]/12 bg-white/85 px-4 py-2 shadow-nav backdrop-blur-2xl">
          <BrandMark />
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0f1c2e] text-white"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={17} /> : <Menu size={17} />}
          </button>
        </header>
        {open ? (
          <nav className="mt-3 rounded-3xl bg-[#0a0e1a]/95 p-5 text-white shadow-nav-dark backdrop-blur-2xl">
            <div className="space-y-1">
              {links.map((link) => {
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    prefetch
                    onMouseEnter={() => warm(link.href, router)}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex min-h-11 items-center justify-between gap-3 rounded-xl px-3 py-2 text-2xl font-display",
                      active ? "text-white" : "text-white/80"
                    )}
                  >
                    <span>
                      <span className="mr-3 font-mono-custom text-[10px] uppercase tracking-[0.16em] text-white/45">
                        {link.index}
                      </span>
                      {link.label}
                    </span>
                    <ArrowUpRight size={16} className="text-lime" />
                  </Link>
                );
              })}
            </div>
            <p className="mt-6 font-mono-custom text-[9px] uppercase tracking-widest text-white/50">{BRAND.location}</p>
          </nav>
        ) : null}
      </div>

      <aside className="relative hidden w-64 shrink-0 overflow-hidden bg-navy-deep text-paper lg:flex lg:flex-col">
        <div className="pointer-events-none absolute -right-16 -top-10 h-56 w-56 rounded-full border border-lavender/25" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 h-64 w-64 rounded-full bg-lavender/10 blur-3xl" />

        <div className="relative border-b border-paper/15 px-6 py-7">
          <BrandMark light />
          <p className="mt-5 font-mono-custom text-[9px] uppercase tracking-[0.22em] text-paper/45">01 / Operations</p>
          <p className="mt-3 max-w-[12rem] text-sm leading-relaxed text-paper/65">{BRAND.tagline}</p>
        </div>

        <nav className="relative flex-1 space-y-0.5 p-4">
          {links.map((link) => {
            const active = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                prefetch
                onMouseEnter={() => warm(link.href, router)}
                className={cn(
                  "group flex min-h-11 items-center justify-between rounded-xl px-3 py-2 font-mono-custom text-[10px] uppercase tracking-[0.12em] transition-colors duration-200",
                  active ? "bg-white/10 font-semibold text-white" : "text-white/75 hover:bg-white/5 hover:text-white"
                )}
              >
                <span>
                  <span className="mr-2 text-white/40">{link.index}</span>
                  {link.label}
                </span>
                {active ? <ArrowUpRight size={13} className="text-lime" /> : null}
              </Link>
            );
          })}
        </nav>

        <div className="relative border-t border-paper/15 px-6 py-5">
          <a
            href={BRAND.site}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex min-h-11 items-center gap-2 font-mono-custom text-[10px] uppercase tracking-[0.15em] text-lime"
          >
            vectorise.dev
            <ArrowUpRight size={13} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </div>
      </aside>
    </>
  );
}
