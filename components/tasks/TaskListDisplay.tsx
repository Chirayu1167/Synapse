'use client';

import { useState, useTransition, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { deleteTask } from '@/lib/actions';
import type { Task } from '@/lib/types';

interface Props {
  tasks: Task[];
  projectId: string;
}

export default function TaskListDisplay({ tasks, projectId }: Props) {
  const [optimisticTasks, setOptimisticTasks] = useState<Task[]>(tasks);
  const [isPending, startTransition] = useTransition();

  const handleComplete = useCallback(
    (taskId: string) => {
      startTransition(async () => {
        // Optimistically remove the task
        setOptimisticTasks(prev => prev.filter(t => t.id !== taskId));
        try {
          await deleteTask(taskId, projectId);
        } catch (err) {
          // Rollback on error
          setOptimisticTasks(prev => [...prev, tasks.find(t => t.id === taskId)!].filter(Boolean));
          console.error('Failed to delete task:', err);
        }
      });
    },
    [projectId, tasks]
  );

  const completedCount = optimisticTasks.filter(t => t.status === 'done').length;
  const totalCount = optimisticTasks.length;
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (totalCount === 0) {
    return (
      <div className="glass-panel p-10 text-center">
        <span className="material-symbols-outlined text-on-surface-variant/30 mb-3 block" style={{ fontSize: 32 }}>
          checklist
        </span>
        <p className="text-sm text-on-surface-variant/50">
          No tasks yet. Add tasks from the board to see them here.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Header + progress */}
      <div className="mb-8">
        <p className="text-[11px] font-mono uppercase tracking-widest text-on-surface-variant/40 mb-2">
          // TASK LIST
        </p>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-on-surface-variant">
            <span className="text-on-surface font-medium">{totalCount - completedCount}</span> remaining
            {completedCount > 0 && (
              <>
                · <span className="text-on-surface font-medium">{completedCount}</span> done
              </>
            )}
          </p>
          <span className="text-sm font-mono text-on-surface-variant/60">{percent}%</span>
        </div>
        {totalCount > 0 && (
          <div className="h-1.5 bg-outline-variant/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-on-surface/70 rounded-full transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
        )}
      </div>

      {optimisticTasks.map((task) => (
        <div
          key={task.id}
          className="flex items-start gap-4 px-4 py-3.5 rounded border border-outline-variant/15 bg-surface-container-low hover:border-outline-variant/30 transition-all group"
        >
          <button
            onClick={() => handleComplete(task.id)}
            disabled={isPending}
            className={cn(
              'mt-0.5 w-5 h-5 shrink-0 rounded border-2 flex items-center justify-center transition-colors',
              task.status === 'done'
                ? 'bg-on-surface/80 border-on-surface/80'
                : 'border-outline-variant hover:border-outline'
            )}
          >
            {task.status === 'done' && (
              <span className="material-symbols-outlined text-background" style={{ fontSize: 12 }}>
                check
              </span>
            )}
          </button>

          <div className="flex-1 min-w-0">
            <p
              className={cn(
                'text-base leading-snug',
                task.status === 'done'
                  ? 'line-through text-on-surface-variant/40'
                  : 'text-on-surface'
              )}
            >
              {task.title}
            </p>
            <p className="text-[11px] font-mono text-on-surface-variant/30 mt-0.5 uppercase tracking-widest">
              {task.status === 'done' ? 'Completed' : 'Pending'}
            </p>
          </div>

          {/* Optional delete button for completed tasks */}
          {task.status === 'done' && (
            <button
              onClick={() => handleComplete(task.id)}
              className="shrink-0 opacity-0 group-hover:opacity-100 text-error hover:text-error transition-all mt-0.5"
              title="Remove completed task"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                delete
              </span>
            </button>
          )}
        </div>
      ))}
    </div>
  );
}