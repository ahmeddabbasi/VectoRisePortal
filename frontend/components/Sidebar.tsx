"use client";

import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BRAND } from "@/lib/brand";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/leads", label: "Leads" },
  { href: "/employees", label: "Employees" },
  { href: "/pipeline", label: "Pipeline" },
  { href: "/activity", label: "Activity" },
  { href: "/analytics", label: "Analytics" },
  { href: "/settings", label: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      <div className="lg:hidden">
        <header className="flex items-center gap-3 border-b border-[var(--border)] bg-[var(--navy)] px-4 py-3">
          <Image src="/vectorise-logo.jpg" alt={BRAND.name} width={32} height={32} className="rounded-sm" />
          <div>
            <p className="text-sm font-semibold text-[var(--text)]">VectoRise</p>
            <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">Operations</p>
          </div>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b border-[var(--border)] bg-[var(--navy)] px-3 py-2">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  active ? "bg-[var(--blue)] text-white" : "text-[var(--muted)] hover:text-[var(--text)]"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <aside className="hidden w-60 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--navy)] lg:flex">
        <div className="border-b border-[var(--border)] px-5 py-6">
          <div className="flex items-center gap-3">
            <Image src="/vectorise-logo.jpg" alt={BRAND.name} width={36} height={36} className="rounded-sm" priority />
            <div>
              <p className="text-sm font-semibold tracking-tight text-[var(--text)]">VectoRise</p>
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">LLC</p>
            </div>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-[var(--muted)]">{BRAND.tagline}</p>
          <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--blue)]">Operations Dashboard</p>
        </div>

        <nav className="flex-1 space-y-0.5 p-3">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "block rounded-md border-l-2 px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "border-[var(--blue)] bg-[rgba(28,138,242,0.08)] text-[var(--text)]"
                    : "border-transparent text-[var(--muted)] hover:bg-[rgba(28,138,242,0.04)] hover:text-[var(--text)]"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[var(--border)] px-5 py-4 text-xs text-[var(--muted)]">
          <a href={BRAND.site} target="_blank" rel="noopener noreferrer" className="text-link">
            vectorise.dev
          </a>
        </div>
      </aside>
    </>
  );
}
