"use client";

import { useState, useOptimistic, useTransition, useRef } from "react";
import type { Todo } from "@/lib/types";
import { createTodo, toggleTodo, deleteTodo } from "@/lib/actions";
import { cn, formatRelativeTime } from "@/lib/utils";

interface Props {
  projectId: string;
  todos: Todo[];
  currentUserId: string;
}

export default function TodoList({ projectId, todos, currentUserId }: Props) {
  const [isPending, startTransition] = useTransition();
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const [optimisticTodos, updateOptimistic] = useOptimistic(
    todos,
    (state: Todo[], action: { type: "toggle"; id: string; done: boolean } | { type: "delete"; id: string } | { type: "add"; todo: Todo }) => {
      if (action.type === "toggle") {
        return state.map((t) => t.id === action.id ? { ...t, done: action.done } : t);
      }
      if (action.type === "delete") {
        return state.filter((t) => t.id !== action.id);
      }
      if (action.type === "add") {
        return [...state, action.todo];
      }
      return state;
    }
  );

  const open = optimisticTodos.filter((t) => !t.done);
  const done = optimisticTodos.filter((t) => t.done);
  const total = optimisticTodos.length;
  const pct = total > 0 ? Math.round((done.length / total) * 100) : 0;

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    const newTodo: Todo = {
      id: `optimistic-${Date.now()}`,
      project_id: projectId,
      text: text.trim(),
      done: false,
      created_by: currentUserId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      creator: null,
    };
    const fd = new FormData();
    fd.set("text", text.trim());
    setText("");
    startTransition(async () => {
      updateOptimistic({ type: "add", todo: newTodo });
      await createTodo(projectId, fd);
    });
    inputRef.current?.focus();
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      {/* Header + progress */}
      <div className="mb-8">
        <p className="text-[11px] font-mono uppercase tracking-widest text-on-surface-variant/40 mb-2">// CHECKLIST</p>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-on-surface-variant">
            <span className="text-on-surface font-medium">{open.length}</span> remaining
            {done.length > 0 && <> · <span className="text-on-surface font-medium">{done.length}</span> done</>}
          </p>
          <span className="text-sm font-mono text-on-surface-variant/60">{pct}%</span>
        </div>
        {total > 0 && (
          <div className="h-1.5 bg-outline-variant/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-on-surface/70 rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </div>

      <form onSubmit={handleAdd} className="flex gap-3 mb-8">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a todo…"
          className="input-base flex-1 text-base py-2.5"
          disabled={isPending}
        />
        <button type="submit" disabled={!text.trim() || isPending} className="btn-primary shrink-0 px-5">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
          Add
        </button>
      </form>

      {optimisticTodos.length === 0 ? (
        <div className="glass-panel p-10 text-center">
          <span className="material-symbols-outlined text-on-surface-variant/30 mb-3 block" style={{ fontSize: 32 }}>checklist</span>
          <p className="text-sm text-on-surface-variant/50">
            No todos yet. Add one above to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {open.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              projectId={projectId}
              onToggle={(done) => {
                startTransition(async () => {
                  updateOptimistic({ type: "toggle", id: todo.id, done });
                  await toggleTodo(todo.id, projectId, done, todo.text);
                });
              }}
              onDelete={() => {
                startTransition(async () => {
                  updateOptimistic({ type: "delete", id: todo.id });
                  await deleteTodo(todo.id, projectId);
                });
              }}
            />
          ))}

          {done.length > 0 && (
            <>
              {open.length > 0 && (
                <div className="py-5">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-outline-variant/20" />
                    <span className="text-[11px] font-mono uppercase tracking-widest text-on-surface-variant/30">
                      Completed ({done.length})
                    </span>
                    <div className="flex-1 h-px bg-outline-variant/20" />
                  </div>
                </div>
              )}
              {done.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  projectId={projectId}
                  onToggle={(d) => {
                    startTransition(async () => {
                      updateOptimistic({ type: "toggle", id: todo.id, done: d });
                      await toggleTodo(todo.id, projectId, d, todo.text);
                    });
                  }}
                  onDelete={() => {
                    startTransition(async () => {
                      updateOptimistic({ type: "delete", id: todo.id });
                      await deleteTodo(todo.id, projectId);
                    });
                  }}
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function TodoItem({
  todo,
  projectId,
  onToggle,
  onDelete,
}: {
  todo: Todo;
  projectId: string;
  onToggle: (done: boolean) => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-4 px-4 py-3.5 rounded border border-outline-variant/15 bg-surface-container-low hover:border-outline-variant/30 transition-all group"
      )}
    >
      <button
        onClick={() => onToggle(!todo.done)}
        className={cn(
          "mt-0.5 w-5 h-5 shrink-0 rounded border-2 flex items-center justify-center transition-colors",
          todo.done
            ? "bg-on-surface/80 border-on-surface/80"
            : "border-outline-variant hover:border-outline"
        )}
      >
        {todo.done && (
          <span className="material-symbols-outlined text-background" style={{ fontSize: 12 }}>check</span>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p className={cn("text-base leading-snug", todo.done ? "line-through text-on-surface-variant/40" : "text-on-surface")}>
          {todo.text}
        </p>
        <p className="text-[11px] font-mono text-on-surface-variant/30 mt-0.5 uppercase tracking-widest">
          {formatRelativeTime(todo.created_at)}
        </p>
      </div>

      <button
        onClick={onDelete}
        className="shrink-0 opacity-0 group-hover:opacity-100 text-on-surface-variant/30 hover:text-error transition-all mt-0.5"
        title="Delete"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
      </button>
    </div>
  );
}
