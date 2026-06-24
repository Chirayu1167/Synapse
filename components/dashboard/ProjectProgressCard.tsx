import { cn } from "@/lib/utils";
import type { Project } from "@/lib/types";

interface ProjectProgressCardProps {
  project: Project | null;
  tasks: any[]; // Task[]
}

export function ProjectProgressCard({
  project,
  tasks,
}: ProjectProgressCardProps) {
  if (!project) return null;

  const totalTasks = tasks?.length ?? 0;
  const completedTasks = tasks?.filter(t => t.status === "done").length ?? 0;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="glass-panel p-6">
      <div className="mb-4">
        <p className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant/40 mb-1">
          // PROJECT PROGRESS
        </p>
        <h2 className="text-on-surface text-lg font-semibold">{project.name}</h2>
        {project.description && (
          <p className="text-on-surface-variant/70 text-[13px] font-mono mt-1">
            {project.description}
          </p>
        )}
      </div>

      <div className="mb-4">
        <p className="text-[11px] font-mono uppercase tracking-widest text-on-surface-variant/40 mb-2">
          Completion Progress
        </p>
        <div className="space-y-2">
          <div className="flex justify-between text-[12px] font-mono">
            <span>Completed</span>
            <span>{completedTasks}/{totalTasks} tasks</span>
          </div>
          <div className="h-1.5 bg-outline-variant/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-on-surface/70 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-[10px] font-mono text-on-surface-variant/60">
            {progress}%
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-[12px] font-mono">
          <span>Status:</span>
          <span className={cn(
            "px-2 py-0.5 rounded text-[10px] font-mono",
            "border border-outline-variant/30 text-on-surface-variant"
          )}>
            {project.name}
          </span>
        </div>

        <div className="flex items-center justify-between text-[12px] font-mono">
          <span>Last Updated:</span>
          <span className="text-on-surface-variant/60">
            {new Date(project.updated_at).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}