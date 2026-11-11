import { cn } from "@/lib/cn";

type Props = {
  children: React.ReactNode;
  className?: string;
  minWidth?: string;
};

export function DataTable({ children, className, minWidth = "36rem" }: Props) {
  return (
    <div className={cn("table-card", className)}>
      <p className="table-card-hint">Swipe sideways to view all columns</p>
      <div className="table-card-scroll">
        <table className="table-card-table" style={{ minWidth }}>
          {children}
        </table>
      </div>
    </div>
  );
}
