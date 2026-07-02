"use client";

import { useState, useTransition, Fragment, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Task, TaskStatus, TaskPriority, ProjectMember } from "@/lib/types";
import { AI_TOOLS, STATUS_LABELS, STATUS_COLORS, STATUS_COLORS_ACTIVE, TOOL_COLORS, COLUMN_ACCENT, getMaxStatus, PRIORITY_LABELS, PRIORITY_COLORS, PRIORITY_ORDER } from "@/lib/types";
import { createTask, updateTask, updateTaskStatus, deleteTask } from "@/lib/actions";
import { cn, initials } from "@/lib/utils";
import TaskComments from "./TaskComments";

interface Props {
  projectId: string;
  tasks: Task[];
  members: ProjectMember[];
  currentUserId: string;
  filters: { owner?: string; tool?: string; status?: string; priority?: string; q?: string };
}

const COLUMNS: TaskStatus[] = ["unassigned", "todo", "in_progress", "testing", "done"];

const COLUMN_ICONS: Record<TaskStatus, string> = {
  unassigned: "person_outline",
  todo: "radio_button_unchecked",
  in_progress: "pending",
  testing: "science",
  done: "check_circle",
};

export default function TaskBoard({ projectId, tasks, members, currentUserId, filters }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [showCreate, setShowCreate] = useState<TaskStatus | null>(null);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [ownerFilter, setOwnerFilter] = useState(filters.owner ?? "");
  const [toolFilter, setToolFilter] = useState(filters.tool ?? "");
  const [priorityFilter, setPriorityFilter] = useState(filters.priority ?? "");
  const [search, setSearch] = useState(filters.q ?? "");

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (ownerFilter) params.set('owner', ownerFilter);
    else params.delete('owner');
    if (toolFilter) params.set('tool', toolFilter);
    else params.delete('tool');
    if (priorityFilter) params.set('priority', priorityFilter);
    else params.delete('priority');
    if (search) params.set('q', search);
    else params.delete('q');
    // Preserve other existing query params (like status, page, etc.)
    router.push(`?${params.toString()}`, { scroll: false });
  }, [ownerFilter, toolFilter, priorityFilter, search, searchParams, router]);

  const filtered = tasks.filter((t) => {
    if (ownerFilter && t.owner_id !== ownerFilter) return false;
    if (toolFilter && t.ai_tool !== toolFilter) return false;
    if (priorityFilter && t.priority !== priorityFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const inTitle = t.title.toLowerCase().includes(q);
      const inDescription = t.description?.toLowerCase().includes(q) ?? false;
      if (!inTitle && !inDescription) return false;
    }
    return true;
  });

  const byStatus = (status: TaskStatus) => filtered.filter((t) => t.status === status);
  const memberUsers = members.map((m: any) => m.user).filter(Boolean);
  const isOwner = members.some((m: any) => m.user_id === currentUserId && m.role === "owner");

  // Assigned tasks awaiting acceptance (owner = current user, status = todo)
  const assignedTasks = tasks.filter(
    (t) => t.owner_id === currentUserId && t.status === "todo"
  );

  function handleStatusChange(task: Task, status: TaskStatus) {
    startTransition(() => updateTaskStatus(task.id, projectId, status));
  }

  function acceptTask(taskId: string) {
    startTransition(() => updateTaskStatus(taskId, projectId, "in_progress"));
  }

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
  const maxStatus = getMaxStatus(statusCounts, COLUMNS);

  return (
    <div className="p-8 min-h-full">
      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <p className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant/40">Filter</p>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tasks…"
          className="text-[12px] font-mono border border-outline-variant/30 rounded px-2 py-1 bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-1 focus:ring-outline w-48"
        />

        <select
          value={ownerFilter}
          onChange={(e) => setOwnerFilter(e.target.value)}
          className="text-[10px] font-mono uppercase tracking-widest border border-outline-variant/30 rounded px-2 py-1 bg-surface-container-low text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-outline"
        >
          <option value="">All owners</option>
          {memberUsers.map((u: any) => (
            <option key={u.id} value={u.id}>{u.display_name ?? u.email}</option>
          ))}
        </select>

        <select
          value={toolFilter}
          onChange={(e) => setToolFilter(e.target.value)}
          className="text-[10px] font-mono uppercase tracking-widest border border-outline-variant/30 rounded px-2 py-1 bg-surface-container-low text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-outline"
        >
          <option value="">All tools</option>
          {AI_TOOLS.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="text-[10px] font-mono uppercase tracking-widest border border-outline-variant/30 rounded px-2 py-1 bg-surface-container-low text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-outline"
        >
          <option value="">All priorities</option>
          {PRIORITY_ORDER.map((p) => (
            <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
          ))}
        </select>

        {(ownerFilter || toolFilter || priorityFilter || search) && (
          <button
            onClick={() => { setOwnerFilter(""); setToolFilter(""); setPriorityFilter(""); setSearch(""); }}
            className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant/40 hover:text-error transition-colors"
          >
            Clear
          </button>
        )}

        <div className="ml-auto">
          <span className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant/40">
            {filtered.length} task{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Pipeline visualization */}
      <div className="mb-6 flex items-center space-x-4">
        {COLUMNS.map((status, index) => (
          <Fragment key={status}>
            <div className="flex flex-col items-center">
              <div className={cn(
                "relative w-10 h-10 rounded-full transition-colors",
                status === maxStatus ? STATUS_COLORS_ACTIVE[status] : STATUS_COLORS[status]
              )}>
                <div className="flex items-center justify-center w-full h-full">
                  <span className="text-on-surface font-medium">{statusCounts[status] ?? 0}</span>
                </div>
              </div>
              <span className="text-xs text-on-surface-variant/60 mt-1">{STATUS_LABELS[status]}</span>
            </div>
            {index < COLUMNS.length - 1 && (
              <div className="w-4 flex items-center">
                <div className="h-0.5 w-full bg-outline-variant/20 relative">
                  <div className="absolute left-0 top-0 h-full w-[8px] bg-outline-variant/40 animate-pulse" />
                </div>
              </div>
            )}
          </Fragment>
        ))}
      </div>

      {/* Board columns */}
      <div className="grid gap-y-6 gap-x-8 items-start sm:grid-cols-2 lg:grid-cols-3">
        {COLUMNS.map((status) => (
          <Column
            key={status}
            status={status}
            tasks={byStatus(status)}
            projectId={projectId}
            members={memberUsers}
            currentUserId={currentUserId}
            isOwner={isOwner}
            onStatusChange={handleStatusChange}
            onEdit={setEditTask}
            onAddClick={() => setShowCreate(status)}
          />
        ))}
      </div>

      {/* Assigned tasks (to accept) */}
      {assignedTasks.length > 0 && (
        <div className="mt-8">
          <h2 className="text-on-surface text-lg font-semibold mb-4">Assigned tasks (awaiting acceptance)</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-outline-variant/20">
              <thead>
                <tr className="bg-surface-container-lowest">
                  <th className="text-left text-[10px] font-mono uppercase tracking-widest text-on-surface-variant/40 py-3 px-4">Task</th>
                  <th className="text-left text-[10px] font-mono uppercase tracking-widest text-on-surface-variant/40 py-3 px-4">Assignee</th>
                  <th className="text-left text-[10px] font-mono uppercase tracking-widest text-on-surface-variant/40 py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {assignedTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-surface-container-low/50">
                    <td className="text-base text-on-surface py-4 px-4">{task.title}</td>
                    <td className="text-base text-on-surface py-4 px-4">
                      {task.owner ? (
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full border border-outline-variant/30 flex items-center justify-center bg-surface-container-low">
                            <span className="text-[10px] font-mono">
                              {initials((task.owner as any).display_name, (task.owner as any).email)}
                            </span>
                          </div>
                          <span className="text-[12px] font-mono">
                            {(task.owner as any).display_name ?? (task.owner as any).email}
                          </span>
                        </div>
                      ) : (
                        <span className="text-on-surface-variant/40">Unassigned</span>
                      )}
                    </td>
                    <td className="text-base text-on-surface py-4 px-4">
                      <button
                        onClick={() => acceptTask(task.id)}
                        className="btn-primary px-4 py-2"
                        disabled={isPending}
                      >
                        Accept
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showCreate && (
        <TaskModal
          mode="create"
          projectId={projectId}
          defaultStatus={showCreate}
          members={memberUsers}
          currentUserId={currentUserId}
          isOwner={isOwner}
          onClose={() => setShowCreate(null)}
        />
      )}

      {editTask && (
        <TaskModal
          mode="edit"
          projectId={projectId}
          task={editTask}
          members={memberUsers}
          currentUserId={currentUserId}
          isOwner={isOwner}
          onClose={() => setEditTask(null)}
        />
      )}
    </div>
  );
}

function Column({
  status, tasks, projectId, members, currentUserId, isOwner, onStatusChange, onEdit, onAddClick,
}: {
  status: TaskStatus;
  tasks: Task[];
  projectId: string;
  members: any[];
  currentUserId: string;
  isOwner: boolean;
  onStatusChange: (task: Task, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onAddClick: () => void;
}) {
  return (
    <div className="glass-panel p-8 min-h-60">
      {/* Column header */}
      <div className="flex items-center justify-between mb-6 px-1">
        <div className="flex items-center gap-3">
          <span className={cn("material-symbols-outlined", COLUMN_ACCENT[status])} style={{ fontSize: 16 }}>
            {COLUMN_ICONS[status]}
          </span>
          <div>
            <span className="text-[12px] font-mono uppercase tracking-widest text-on-surface-variant font-medium">
              {STATUS_LABELS[status]}
            </span>
            <span className="text-[13px] font-mono text-on-surface-variant/40 font-medium ml-2">{tasks.length}</span>
          </div>
        </div>
        <button
          onClick={onAddClick}
          className="w-6 h-6 rounded flex items-center justify-center text-on-surface-variant/40 hover:text-on-surface hover:bg-surface-container transition-colors"
          title="Add task"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
        </button>
      </div>

      <div className="space-y-4">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            projectId={projectId}
            members={members}
            currentUserId={currentUserId}
            isOwner={isOwner}
            onStatusChange={onStatusChange}
            onEdit={onEdit}
          />
        ))}
      </div>
    </div>
  );
}

function TaskCard({
  task, projectId, members, currentUserId, isOwner, onStatusChange, onEdit,
}: {
  task: Task;
  projectId: string;
  members: any[];
  currentUserId: string;
  isOwner: boolean;
  onStatusChange: (task: Task, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const canChangeStatus = isOwner || task.owner_id === currentUserId;

  return (
    <div
      className={cn(
        "bg-surface-container-low rounded border border-outline-variant/20 p-6 hover:border-outline-variant/30 transition-all cursor-pointer group hover:shadow-[0_0_0_1px_rgb(var(--color-on-surface)/0.1)]",
        isPending && "opacity-50"
      )}
      onClick={() => onEdit(task)}
    >
      <p className="text-lg text-on-surface mb-4 leading-snug font-semibold">{task.title}</p>

      {task.description && (
        <p className="text-[13px] text-on-surface-variant mb-4 line-clamp-2 font-mono-label font-mono">{task.description}</p>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn("badge text-[12px]", PRIORITY_COLORS[task.priority])}>
            {PRIORITY_LABELS[task.priority]}
          </span>
          {task.ai_tool && (
            <span className={cn("badge text-[12px]", TOOL_COLORS[task.ai_tool] ?? "border border-outline-variant/30 text-on-surface-variant")}>
              {task.ai_tool}
            </span>
          )}
        </div>
        {task.owner && (
          <div
            className="w-7 h-7 rounded-full border border-outline-variant flex items-center justify-center shrink-0 bg-surface-container text-on-surface-variant/70"
            title={(task.owner as any).display_name ?? (task.owner as any).email}
          >
            <span className="text-[10px] font-mono font-semibold">
              {initials((task.owner as any).display_name, (task.owner as any).email)}
            </span>
          </div>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-outline-variant/15" onClick={(e) => e.stopPropagation()}>
        <select
          value={task.status}
          disabled={!canChangeStatus}
          onChange={(e) => startTransition(() => onStatusChange(task, e.target.value as TaskStatus))}
          className="w-full text-[12px] font-mono uppercase tracking-widest border border-outline-variant/20 rounded px-2 py-0.5 bg-transparent text-on-surface-variant focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
          title={canChangeStatus ? undefined : "Only the project owner or assignee can change status"}
        >
          {Object.entries(STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

function TaskModal({
  mode, projectId, task, defaultStatus, members, currentUserId, isOwner, onClose,
}: {
  mode: "create" | "edit";
  projectId: string;
  task?: Task;
  defaultStatus?: TaskStatus;
  members: any[];
  currentUserId: string;
  isOwner: boolean;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const canChangeStatus = mode === "create" || isOwner || task?.owner_id === currentUserId;

  const dueDateParts = (() => {
    if (!task?.due_date) return { date: "", time: "" };
    const d = new Date(task.due_date);
    const pad = (n: number) => String(n).padStart(2, "0");
    const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const hasTime = d.getHours() !== 0 || d.getMinutes() !== 0;
    const time = hasTime ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : "";
    return { date, time };
  })();

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      if (mode === "create") {
        await createTask(projectId, formData);
      } else if (task) {
        await updateTask(task.id, projectId, formData);
      }
      onClose();
    });
  }

  async function handleDelete() {
    if (!task) return;
    startTransition(async () => {
      await deleteTask(task.id, projectId);
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-lg border-outline-variant/30 max-h-[90vh] overflow-y-auto">
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-5 border-b border-outline-variant/20">
          <div>
            <p className="text-[9px] font-mono uppercase tracking-widest text-on-surface-variant/40 mb-0.5">
              // {mode === "create" ? "NEW TASK" : "EDIT TASK"}
            </p>
            <h2 className="text-on-surface text-sm font-medium">
              {mode === "create" ? "Create task" : task?.title}
            </h2>
          </div>
          <button onClick={onClose} className="text-on-surface-variant/40 hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
          </button>
        </div>

        <form action={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest text-on-surface-variant/60 mb-1.5">Title *</label>
            <input
              name="title"
              required
              defaultValue={task?.title}
              placeholder="Task title"
              className="input-base"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest text-on-surface-variant/60 mb-1.5">Description</label>
            <textarea
              name="description"
              rows={3}
              defaultValue={task?.description ?? ""}
              placeholder="Optional details..."
              className="input-base resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-on-surface-variant/60 mb-1.5">Due date *</label>
              <input
                type="date"
                name="due_date"
                required
                defaultValue={dueDateParts.date}
                className="input-base"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-on-surface-variant/60 mb-1.5">Due time</label>
              <input
                type="time"
                name="due_time"
                defaultValue={dueDateParts.time}
                placeholder="Optional"
                className="input-base"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-on-surface-variant/60 mb-1.5">Status</label>
              {canChangeStatus ? (
                <select
                  name="status"
                  defaultValue={task?.status ?? defaultStatus ?? "todo"}
                  className="input-base"
                >
                  {Object.entries(STATUS_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              ) : (
                <>
                  <input type="hidden" name="status" value={task?.status ?? "todo"} />
                  <div
                    className="input-base opacity-50 cursor-not-allowed"
                    title="Only the project owner or assignee can change status"
                  >
                    {STATUS_LABELS[task?.status ?? "todo"]}
                  </div>
                </>
              )}
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-on-surface-variant/60 mb-1.5">Priority</label>
              <select
                name="priority"
                defaultValue={task?.priority ?? "medium"}
                className="input-base"
              >
                {PRIORITY_ORDER.map((p) => (
                  <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-widest text-on-surface-variant/60 mb-1.5">AI Tool</label>
              <select
                name="ai_tool"
                defaultValue={task?.ai_tool ?? ""}
                className="input-base"
              >
                <option value="">None</option>
                {AI_TOOLS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-widest text-on-surface-variant/60 mb-1.5">Assigned to</label>
            {isOwner ? (
              <select name="owner_id" defaultValue={task?.owner_id ?? ""} className="input-base">
                <option value="">Unassigned</option>
                {members.map((m: any) => (
                  <option key={m.id} value={m.id}>
                    {m.display_name ?? m.email}{m.id === currentUserId ? " (you)" : ""}
                  </option>
                ))}
              </select>
            ) : (
              <>
                <input type="hidden" name="owner_id" value={task?.owner_id ?? ""} />
                <div
                  className="input-base opacity-50 cursor-not-allowed"
                  title="Only the project owner can assign tasks"
                >
                  {task?.owner
                    ? (task.owner as any).display_name ?? (task.owner as any).email
                    : "Unassigned"}
                </div>
              </>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-outline-variant/20">
            {mode === "edit" && task ? (
              confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-on-surface-variant/40">Delete?</span>
                  <button type="button" onClick={handleDelete} className="text-[10px] font-mono text-error hover:underline">Yes</button>
                  <button type="button" onClick={() => setConfirmDelete(false)} className="text-[10px] font-mono text-on-surface-variant/40 hover:underline">No</button>
                </div>
              ) : (
                <button type="button" onClick={() => setConfirmDelete(true)} className="btn-danger text-xs py-1">
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>delete</span>
                  Delete
                </button>
              )
            ) : <div />}

            <div className="flex items-center gap-2">
              <button type="button" onClick={onClose} className="btn-ghost text-xs py-1">Cancel</button>
              <button type="submit" disabled={isPending} className="btn-primary text-xs py-1">
                {isPending ? "Saving…" : mode === "create" ? "Create" : "Save changes"}
              </button>
            </div>
          </div>
        </form>

        {/* Rendered outside the form above — it has its own <form>, and
            nested <form> elements are invalid HTML. */}
        {mode === "edit" && task && (
          <div className="px-6 pb-6">
            <TaskComments
              taskId={task.id}
              projectId={projectId}
              currentUserId={currentUserId}
              isProjectOwner={isOwner}
            />
          </div>
        )}
      </div>
    </div>
  );
}