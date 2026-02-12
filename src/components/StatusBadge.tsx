import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusStyles: Record<string, string> = {
  active: "bg-success/15 text-success border-success/30",
  inactive: "bg-muted text-muted-foreground border-border",
  reserved: "bg-warning/15 text-warning border-warning/30",
  gateway: "bg-info/15 text-info border-info/30",
  available: "bg-primary/15 text-primary border-primary/30",
  full: "bg-destructive/15 text-destructive border-destructive/30",
  deprecated: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border",
        statusStyles[status] || statusStyles.inactive,
        className
      )}
    >
      <span className={cn(
        "w-1.5 h-1.5 rounded-full",
        status === "active" && "bg-success",
        status === "inactive" && "bg-muted-foreground",
        status === "reserved" && "bg-warning",
        status === "gateway" && "bg-info",
        status === "available" && "bg-primary",
        status === "full" && "bg-destructive",
      )} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
