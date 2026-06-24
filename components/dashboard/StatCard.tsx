import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: number | string;
  trend?: { value: string; isPositive: boolean };
  icon: string;
  variant?: "default" | "success" | "warning" | "info" | "error";
}

export function StatCard({
  title,
  value,
  trend,
  icon,
  variant = "default",
}: StatCardProps) {
  const variantClasses = {
    default: "border-border-variant/30 text-on-surface-variant",
    success: "border-border-success/30 text-on-success",
    warning: "border-border-warning/30 text-on-warning",
    info: "border-border-info/30 text-on-info",
    error: "border-border-error/30 text-on-error",
  };

  return (
    <div
      className={cn(
        "glass-panel p-6 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.1)] transition-shadow",
        variantClasses[variant]
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className={`material-symbols-outlined ${variantClasses[variant].split(" ")[1]} `} style={{ fontSize: 20 }}>
            {icon}
          </span>
          <h3 className="text-[12px] font-mono uppercase tracking-widest text-on-surface-variant/60">
            {title}
          </h3>
        </div>
        {trend && (
          <div className="flex items-center gap-2 text-[10px] font-mono">
            <span className={cn(
              "text-on-surface-variant/60",
              trend.isPositive ? "text-on-success" : "text-on-error"
            )}>
              {trend.value}
            </span>
            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>
              {trend.isPositive ? "trending_up" : "trending_down"}
            </span>
          </div>
        )}
      </div>

      <div className="text-3xl font-bold text-on-surface">
        {value}
      </div>
    </div>
  );
}