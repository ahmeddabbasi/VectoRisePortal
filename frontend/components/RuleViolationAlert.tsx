"use client";

import Link from "next/link";
import { AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import type { ViolationDetail } from "@/lib/violations";
import { cn } from "@/lib/cn";

const STYLES = {
  error: {
    box: "border-red-200 bg-red-50 text-red-950",
    icon: "text-red-600",
    step: "text-red-900/80",
    link: "text-red-700 hover:text-red-900",
  },
  warning: {
    box: "border-amber-200 bg-amber-50 text-amber-950",
    icon: "text-amber-600",
    step: "text-amber-900/80",
    link: "text-amber-800 hover:text-amber-950",
  },
  info: {
    box: "border-blue-200 bg-blue-50 text-blue-950",
    icon: "text-blue-600",
    step: "text-blue-900/80",
    link: "text-blue-700 hover:text-blue-900",
  },
};

function Icon({ severity }: { severity: ViolationDetail["severity"] }) {
  const size = 18;
  if (severity === "warning") return <AlertTriangle size={size} />;
  if (severity === "info") return <Info size={size} />;
  return <AlertCircle size={size} />;
}

export function RuleViolationAlert({
  violation,
  onDismiss,
  className,
}: {
  violation: ViolationDetail;
  onDismiss?: () => void;
  className?: string;
}) {
  const severity = violation.severity || "error";
  const styles = STYLES[severity];

  return (
    <div className={cn("rounded-2xl border p-5", styles.box, className)} role="alert">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className={cn("mt-0.5 shrink-0", styles.icon)}>
            <Icon severity={severity} />
          </span>
          <div className="min-w-0">
            <p className="font-display text-lg">{violation.title}</p>
            <p className="mt-1 text-sm">{violation.message}</p>
            {violation.steps.length ? (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide opacity-70">What to do next</p>
                <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm">
                  {violation.steps.map((step) => (
                    <li key={step} className={styles.step}>{step}</li>
                  ))}
                </ol>
              </div>
            ) : null}
            {violation.link?.startsWith("/") && !violation.link.startsWith("//") ? (
              <Link href={violation.link} className={cn("mt-4 inline-block text-sm font-medium underline", styles.link)}>
                Go to {violation.link.split("/").pop()?.replace("-", " ")}
              </Link>
            ) : null}
          </div>
        </div>
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 rounded-full p-1 opacity-60 transition hover:opacity-100"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        ) : null}
      </div>
    </div>
  );
}
