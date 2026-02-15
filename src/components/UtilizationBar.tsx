import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface UtilizationBarProps {
  used: number;
  total: number;
  label?: string;
  showPercent?: boolean;
  className?: string;
}

export function UtilizationBar({ used, total, label, showPercent = true, className }: UtilizationBarProps) {
  const percent = total > 0 ? Math.round((used / total) * 100) : 0;

  const getColor = (p: number) => {
    if (p >= 90) return "text-destructive";
    if (p >= 70) return "text-warning";
    return "text-success";
  };

  return (
    <div className={cn("space-y-1.5", className)}>
      {(label || showPercent) && (
        <div className="flex items-center justify-between text-xs">
          {label && <span className="text-muted-foreground">{label}</span>}
          {showPercent && (
            <span className={cn("font-mono font-medium", getColor(percent))}>
              {percent}%
            </span>
          )}
        </div>
      )}
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            percent >= 90 ? "bg-destructive" : percent >= 70 ? "bg-warning" : "bg-success"
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground font-mono">
        <span>{used.toLocaleString()} used</span>
        <span>{total.toLocaleString()} total</span>
      </div>
    </div>
  );
}
