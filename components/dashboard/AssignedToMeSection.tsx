import { cn } from "@/lib/utils";
import type { Task, ProjectMember } from "@/lib/types";
import { initials } from "@/lib/utils";

interface AssignedToMeSectionProps {
  projectId: string;
  userId: string;
  tasks: Task[];
  members: ProjectMember[];
}

export function AssignedToMeSection({
  projectId,
  userId,
  tasks,
  members,
}: AssignedToMeSectionProps) {
  // Filter tasks assigned to current user
  const myTasks = tasks.filter(task => task.owner_id === userId);

  // Group by status
  const activeTasks = myTasks.filter(t => t.status === "in_progress");
  const pendingTasks = myTasks.filter(t => t.status === "todo");
  const overdueTasks = myTasks.filter(t => {
    if (!t.due_date) return false;
    const dueDate = new Date(t.due_date);
    const now = new Date();
    return dueDate < now && t.status !== "done";
  });

  return (
    <div className="glass-panel p-6">
      <div className="mb-4">
        <p className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant/40 mb-1">
          // ASSIGNED TO ME
        </p>
        <h2 className="text-on-surface text-lg font-semibold">My Tasks</h2>
      </div>

      <div className="space-y-4">
        {/* Active Tasks */}
        <div className="border-b border-outline-variant/10 pb-4">
          <p className="text-[11px] font-mono uppercase tracking-widest text-on-surface-variant/40 mb-2">
            Active ({activeTasks.length})
          </p>
          {activeTasks.length > 0 ? (
            <div className="space-y-2">
              {activeTasks.map((task) => (
                <div key={task.id} className="flex items-start gap-3 p-3 bg-surface-container-low rounded border border-outline-variant/15">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border border-outline-variant/30">
                    <span className="text-[10px] font-mono">{initials(task.owner?.display_name ?? "", task.owner?.email ?? "")}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-on-surface font-medium mb-1">{task.title}</h4>
                    <p className="text-on-surface-variant/70 text-[12px] font-mono line-clamp-2">
                      {task.description || ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-on-surface-variant/50 text-[12px] font-mono text-center py-4">
              No active tasks
            </p>
          )}
        </div>

        {/* Pending Tasks */}
        <div className="border-b border-outline-variant/10 pb-4">
          <p className="text-[11px] font-mono uppercase tracking-widest text-on-surface-variant/40 mb-2">
            Pending ({pendingTasks.length})
          </p>
          {pendingTasks.length > 0 ? (
            <div className="space-y-2">
              {pendingTasks.map((task) => (
                <div key={task.id} className="flex items-start gap-3 p-3 bg-surface-container-low rounded border border-outline-variant/15">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border border-outline-variant/30">
                    <span className="text-[10px] font-mono">{initials(task.owner?.display_name ?? "", task.owner?.email ?? "")}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-on-surface font-medium mb-1">{task.title}</h4>
                    <p className="text-on-surface-variant/70 text-[12px] font-mono line-clamp-2">
                      {task.description || ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-on-surface-variant/50 text-[12px] font-mono text-center py-4">
              No pending tasks
            </p>
          )}
        </div>

        {/* Overdue Tasks */}
        <div>
          <p className="text-[11px] font-mono uppercase tracking-widest text-on-surface-variant/40 mb-2">
            Overdue ({overdueTasks.length})
          </p>
          {overdueTasks.length > 0 ? (
            <div className="space-y-2">
              {overdueTasks.map((task) => (
                <div key={task.id} className="flex items-start gap-3 p-3 bg-surface-container-low rounded border border-outline-variant/15 border-border-error/30">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border border-outline-variant/30">
                    <span className="text-[10px] font-mono">{initials(task.owner?.display_name ?? "", task.owner?.email ?? "")}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-on-surface font-medium mb-1">{task.title}</h4>
                    <p className="text-on-surface-variant/70 text-[12px] font-mono line-clamp-2">
                      {task.description || ""}
                    </p>
                    {task.due_date && (
                      <p className="text-on-error text-[11px] font-mono mt-1">
                        Due: {new Date(task.due_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-on-surface-variant/50 text-[12px] font-mono text-center py-4">
              No overdue tasks
            </p>
          )}
        </div>
      </div>
    </div>
  );
}