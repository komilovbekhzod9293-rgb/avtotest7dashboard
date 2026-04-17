import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: string;
  delta?: number;
  hint?: string;
  icon?: React.ReactNode;
}

export function StatCard({ label, value, delta, hint, icon }: Props) {
  const positive = (delta ?? 0) >= 0;
  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-soft">
      <div className="flex items-start justify-between">
        <div className="text-sm text-muted-foreground font-medium">{label}</div>
        {icon && <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground">{icon}</div>}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <div className="text-3xl font-semibold tracking-tight num text-foreground">{value}</div>
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs">
        {delta !== undefined && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-medium px-1.5 py-0.5 rounded-md num",
              positive ? "bg-success-soft text-success" : "bg-danger-soft text-danger"
            )}
          >
            {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
        {hint && <span className="text-muted-foreground">{hint}</span>}
      </div>
    </div>
  );
}
