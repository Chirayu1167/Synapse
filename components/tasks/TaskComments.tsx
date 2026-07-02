"use client";

import { useEffect, useState, useTransition } from "react";
import { getTaskComments, addTaskComment, deleteTaskComment } from "@/lib/actions";
import { initials } from "@/lib/utils";
import type { TaskComment } from "@/lib/types";

interface TaskCommentsProps {
  taskId: string;
  projectId: string;
  currentUserId: string;
  isProjectOwner: boolean;
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function TaskComments({
  taskId,
  projectId,
  currentUserId,
  isProjectOwner,
}: TaskCommentsProps) {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getTaskComments(taskId)
      .then((data) => {
        if (!cancelled) setComments(data as TaskComment[]);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load comments");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [taskId]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    const formData = new FormData();
    formData.set("body", body);
    setError("");
    startTransition(async () => {
      try {
        const comment = await addTaskComment(taskId, projectId, formData);
        setComments((prev) => [...prev, comment as TaskComment]);
        setBody("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to post comment");
      }
    });
  }

  function handleDelete(commentId: string) {
    startTransition(async () => {
      try {
        await deleteTaskComment(commentId, taskId, projectId);
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete comment");
      }
    });
  }

  return (
    <div className="pt-3 border-t border-outline-variant/20">
      <label className="block text-[10px] font-mono uppercase tracking-widest text-on-surface-variant/60 mb-2">
        Comments {comments.length > 0 && `(${comments.length})`}
      </label>

      {loading ? (
        <p className="text-[12px] font-mono text-on-surface-variant/40">Loading…</p>
      ) : comments.length === 0 ? (
        <p className="text-[12px] font-mono text-on-surface-variant/40">No comments yet.</p>
      ) : (
        <div className="space-y-3 max-h-56 overflow-y-auto mb-3 pr-1">
          {comments.map((comment) => {
            const author = (comment as any).author;
            const canDelete = comment.author_id === currentUserId || isProjectOwner;
            return (
              <div key={comment.id} className="flex gap-2 group">
                <div className="w-6 h-6 rounded-full border border-outline-variant/30 flex items-center justify-center bg-surface-container-low shrink-0 mt-0.5">
                  <span className="text-[9px] font-mono">
                    {initials(author?.display_name, author?.email)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-on-surface-variant">
                      {author?.display_name ?? author?.email ?? "Unknown"}
                    </span>
                    <span className="text-[10px] font-mono text-on-surface-variant/40">
                      {timeAgo(comment.created_at)}
                    </span>
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDelete(comment.id)}
                        disabled={isPending}
                        className="ml-auto text-[10px] font-mono text-on-surface-variant/30 hover:text-error opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  <p className="text-[13px] text-on-surface whitespace-pre-wrap break-words">{comment.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {error && <p className="text-[11px] font-mono text-error mb-2">{error}</p>}

      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
          placeholder="Add a comment…"
          className="input-base resize-none flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e as unknown as React.FormEvent);
            }
          }}
        />
        <button
          type="submit"
          disabled={isPending || !body.trim()}
          className="btn-primary text-xs py-2 disabled:opacity-50"
        >
          {isPending ? "…" : "Post"}
        </button>
      </form>
    </div>
  );
}
