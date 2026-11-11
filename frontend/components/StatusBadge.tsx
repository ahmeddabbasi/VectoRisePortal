import { cn } from "@/lib/cn";

const STYLES: Record<string, string> = {
  on_time: "bg-emerald-100 text-emerald-800",
  late: "bg-amber-100 text-amber-800",
  incomplete: "bg-red-100 text-red-800",
  absent: "bg-red-100 text-red-800",
  open: "bg-amber-100 text-amber-800",
  under_review: "bg-blue-100 text-blue-800",
  resolved: "bg-emerald-100 text-emerald-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  not_started: "bg-slate-100 text-slate-700",
  pending_approval: "bg-violet-100 text-violet-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-emerald-100 text-emerald-800",
  overdue: "bg-red-100 text-red-800",
  blocked: "bg-orange-100 text-orange-800",
  active: "bg-emerald-100 text-emerald-800",
  inactive: "bg-slate-100 text-slate-600",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const key = status.toLowerCase().replace(/\s+/g, "_");
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize", STYLES[key] || "bg-slate-100 text-slate-700", className)}>
      {status.replace(/_/g, " ")}
    </span>
  );
}
