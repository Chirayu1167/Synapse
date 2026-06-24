import { cn } from "@/lib/utils";
import type { Task } from "@/lib/types";

interface UpcomingDeadlinesProps {
  tasks: Task[];
  limit?: number;
}

export function UpcomingDeadlines({
  tasks,
  limit = 5,
}: UpcomingDeadlinesProps) {
  // Filter tasks with due dates that are not completed
  const upcomingTasks = tasks
    .filter(task => task.due_date && task.status !== "done")
    .map(task => ({
      ...task,
      daysUntil: Math.ceil(
        (new Date(task.due_date!).getTime() - Date.now()) / (1000 * 3600 * 24)
      )
    }))
    .sort((a, b) => (a.daysUntil ?? Infinity) - (b.daysUntil ?? Infinity))
    .slice(0, limit);

  return (
    <div className="glass-panel p-6">
      <div className="mb-4">
        <p className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant/40 mb-1">
          // UPCOMING DEADLINES
        </p>
        <h2 className="text-on-surface text-lg font-semibold">Deadlines Ahead</h2>
      </div>

      {upcomingTasks.length > 0 ? (
        <div className="space-y-3">
          {upcomingTasks.map((task) => (
            <div key={task.id} className="flex items-start gap-4 p-4 bg-surface-container-low rounded border border-outline-variant/15">
              {/* Status indicator */}
              <div className="flex-shrink-0 w-2 h-2 rounded bg-on-surface/70 mt-2.5" />

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="text-on-surface font-medium">{task.title}</h3>
                  <span className={cn(
                    "px-1.5 py-0.5 rounded text-[9px] font-mono",
                    task.daysUntil! < 0 ? "bg-border-error/20 text-on-error" :
                    task.daysUntil! === 0 ? "bg-border-warning/20 text-on-warning" :
                    task.daysUntil! <= 2 ? "bg-border-warning/20 text-on-warning" :
                    "bg-border-success/20 text-on-success"
                  )}>
                    {task.daysUntil! < 0 ? "Overdue" :
                     task.daysUntil! === 0 ? "Due Today" :
                     `In ${task.daysUntil!} days`}
                  </span>
                </div>

                {task.description && (
                  <p className="text-on-surface-variant/70 text-[12px] font-mono line-clamp-2 mb-2">
                    {task.description}
                  </p>
                )}

                <div className="flex items-center gap-3 text-[11px] font-mono">
                  <span className="text-on-surface-variant/60">
                    {task.owner?.display_name ?? task.owner?.email ?? "Unassigned"}
                  </span>
                  {task.ai_tool && (
                    <span className={cn(
                      "badge text-[10px]",
                      // @ts-ignore
                      TOOL_COLORS[task.ai_tool] || "border border-outline-variant/30 text-on-surface-variant"
                    )}>
                      {task.ai_tool}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-on-surface-variant/50 text-[12px] font-mono">
            No upcoming deadlines
          </p>
        </div>
      )}
    </div>
  );
}

// Mock TOOL_COLORS since we're in a different file - in reality we'd import this
const TOOL_COLORS = {
  Claude: "border border-outline-variant/30 text-on-surface-variant",
  ChatGPT: "border border-outline-variant/30 text-on-surface-variant",
  Cursor: "border border-outline-variant/30 text-on-surface-variant",
  Gemini: "border border-outline-variant/30 text-on-surface-variant",
  Manual: "border border-outline-variant/20 text-on-surface-variant/50",
};