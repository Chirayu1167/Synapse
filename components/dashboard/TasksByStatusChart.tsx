import { cn } from "@/lib/utils";
import type { Task, TaskStatus } from "@/lib/types";
import { STATUS_LABELS, STATUS_COLORS, STATUS_COLORS_ACTIVE, getMaxStatus } from "@/lib/types";
import { Fragment } from "react";

interface TasksByStatusChartProps {
  tasks: Task[] | null;
}

export function TasksByStatusChart({ tasks }: TasksByStatusChartProps) {
  if (!tasks) return null;

  const statusCounts: Record<TaskStatus, number> = {
    unassigned: 0,
    todo: 0,
    in_progress: 0,
    testing: 0,
    done: 0,
  };

  tasks.forEach((task) => {
    statusCounts[task.status] = (statusCounts[task.status] ?? 0) + 1;
  });

  const COLUMNS: TaskStatus[] = ["unassigned", "todo", "in_progress", "testing", "done"];
  const maxStatus = getMaxStatus(statusCounts, COLUMNS);

  return (
    <div className="glass-panel p-6">
      <div className="mb-4">
        <p className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant/40 mb-1">
          // TASKS BY STATUS
        </p>
        <h2 className="text-on-surface text-lg font-semibold">Task Distribution</h2>
      </div>

      <div className="space-y-4">
        {COLUMNS.map((status) => (
          <div key={status} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors",
                status === maxStatus ? STATUS_COLORS_ACTIVE[status] : STATUS_COLORS[status]
              )}>
                <span className="text-on-surface font-medium">{statusCounts[status]}</span>
              </div>
              <div>
                <span className="text-[12px] font-mono uppercase tracking-widest text-on-surface-variant font-medium">
                  {STATUS_LABELS[status]}
                </span>
              </div>
            </div>
            <span className="text-[12px] font-mono text-on-surface-variant/60 font-medium">
              {statusCounts[status]}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-outline-variant/10">
        <p className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant/40 mb-2">
          Workflow Progress
        </p>
        <div className="flex items-center space-x-4">
          {COLUMNS.map((status, index) => (
            <Fragment key={status}>
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center transition-colors",
                status === maxStatus ? STATUS_COLORS_ACTIVE[status] : STATUS_COLORS[status]
              )}>
                <span className="text-on-surface font-medium">{statusCounts[status] > 0 ? "●" : "○"}</span>
              </div>
              {index < COLUMNS.length - 1 && (
                <div className="h-0.5 w-4 bg-outline-variant/20 relative">
                  <div className="absolute left-0 top-0 h-full w-[4px] bg-outline-variant/40" />
                </div>
              )}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}