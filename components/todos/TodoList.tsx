"use client";

import { useState, useTransition, useRef } from "react";
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

  const open = todos.filter((t) => !t.done);
  const done = todos.filter((t) => t.done);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    const fd = new FormData();
    fd.set("text", text.trim());
    startTransition(async () => { await createTodo(projectId, fd); });
    setText("");
    inputRef.current?.focus();
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant/40 mb-1">// CHECKLIST</p>
          <p className="text-mono-label font-mono-label text-on-surface-variant">
            {open.length} remaining · {done.length} done
          </p>
        </div>
      </div>

      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a todo…"
          className="input-base flex-1"
          disabled={isPending}
        />
        <button type="submit" disabled={!text.trim() || isPending} className="btn-primary shrink-0">
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>add</span>
          Add
        </button>
      </form>

      {todos.length === 0 ? (
        <div className="glass-panel p-10 text-center">
          <p className="text-mono-label font-mono-label text-on-surface-variant/50">
            No todos yet. Add one above to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {open.map((todo) => (
            <TodoItem key={todo.id} todo={todo} projectId={projectId} />
          ))}

          {done.length > 0 && (
            <>
              {open.length > 0 && (
                <div className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-outline-variant/20" />
                    <span className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant/30">
                      Done ({done.length})
                    </span>
                    <div className="flex-1 h-px bg-outline-variant/20" />
                  </div>
                </div>
              )}
              {done.map((todo) => (
                <TodoItem key={todo.id} todo={todo} projectId={projectId} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function TodoItem({ todo, projectId }: { todo: Todo; projectId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(() => toggleTodo(todo.id, projectId, !todo.done));
  }

  function handleDelete() {
    startTransition(() => deleteTodo(todo.id, projectId));
  }

  return (
    <div
      className={cn(
        "flex items-start gap-3 px-3 py-2.5 rounded border border-outline-variant/15 bg-surface-container-low hover:border-outline-variant/30 transition-all group",
        isPending && "opacity-50"
      )}
    >
      <button
        onClick={handleToggle}
        disabled={isPending}
        className={cn(
          "mt-0.5 w-4 h-4 shrink-0 rounded border flex items-center justify-center transition-colors",
          todo.done
            ? "bg-on-surface/80 border-on-surface/80"
            : "border-outline-variant hover:border-outline"
        )}
      >
        {todo.done && (
          <span className="material-symbols-outlined text-background" style={{ fontSize: 10 }}>check</span>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p className={cn("text-sm leading-snug", todo.done ? "line-through text-on-surface-variant/40" : "text-on-surface")}>
          {todo.text}
        </p>
        <p className="text-[10px] font-mono text-on-surface-variant/30 mt-0.5 uppercase tracking-widest">
          {formatRelativeTime(todo.created_at)}
        </p>
      </div>

      <button
        onClick={handleDelete}
        disabled={isPending}
        className="shrink-0 opacity-0 group-hover:opacity-100 text-on-surface-variant/30 hover:text-error transition-all"
        title="Delete"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
      </button>
    </div>
  );
}
