"use client";

import { useState, useTransition } from "react";
import type { ContextEntry } from "@/lib/types";
import { createContextEntry, deleteContextEntry } from "@/lib/actions";
import { cn, formatRelativeTime } from "@/lib/utils";

interface Props {
  projectId: string;
  entries: ContextEntry[];
  currentUserId: string;
}

export default function ContextEntries({ projectId, entries, currentUserId }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-widest text-on-surface-variant/40 mb-1">// CONTEXT STORE</p>
          <p className="text-mono-label font-mono-label text-on-surface-variant">
            Session links and transcripts for this project
          </p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>add</span>
          Add context
        </button>
      </div>

      {showForm && <AddContextForm projectId={projectId} onClose={() => setShowForm(false)} />}

      {!entries.length && !showForm ? (
        <div className="glass-panel p-8 text-center">
          <span className="material-symbols-outlined text-on-surface-variant/30 block mb-4" style={{ fontSize: 36 }}>link</span>
          <p className="text-base text-on-surface mb-2">No context yet</p>
          <p className="text-mono-label font-mono-label text-on-surface-variant/50 mb-6">
            Paste AI session links or transcript text to keep them alongside your project.
          </p>
          <button onClick={() => setShowForm(true)} className="btn-primary">Add first entry</button>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <ContextCard
              key={entry.id}
              entry={entry}
              projectId={projectId}
              currentUserId={currentUserId}
              expanded={expandedId === entry.id}
              onToggleExpand={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AddContextForm({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [sourceType, setSourceType] = useState<"link" | "text">("link");

  function handleSubmit(formData: FormData) {
    formData.set("source_type", sourceType);
    startTransition(async () => { await createContextEntry(projectId, formData); onClose(); });
  }

  return (
    <div className="glass-panel p-6 mb-6 border-outline/20">
      <p className="text-[11px] font-mono uppercase tracking-widest text-on-surface-variant/40 mb-3">// ADD CONTEXT</p>

      <div className="flex gap-2 mb-4 border border-outline-variant/20 rounded p-1 w-fit bg-surface-container-lowest">
        {(["link", "text"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setSourceType(t)}
            className={cn(
              "px-4 py-1.5 rounded text-[11px] font-mono uppercase tracking-widest transition-all",
              sourceType === t
                ? "bg-surface-container text-on-surface"
                : "text-on-surface-variant/40 hover:text-on-surface-variant"
            )}
          >
            {t === "link" ? "Link" : "Paste text"}
          </button>
        ))}
      </div>

      <form action={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[11px] font-mono uppercase tracking-widest text-on-surface-variant/60 mb-1.5">
            {sourceType === "link" ? "URL *" : "Pasted text *"}
          </label>
          {sourceType === "link" ? (
            <input name="content" type="url" required placeholder="https://claude.ai/chat/..." className="input-base" autoFocus />
          ) : (
            <textarea name="content" required rows={8} placeholder="Paste your AI session transcript here…" className="input-base resize-y font-mono text-sm" autoFocus />
          )}
        </div>
        <div>
          <label className="block text-[11px] font-mono uppercase tracking-widest text-on-surface-variant/60 mb-1.5">
            Title <span className="text-on-surface-variant/30 normal-case tracking-normal">(optional)</span>
          </label>
          <input name="title" type="text" placeholder="e.g. Auth flow discussion..." className="input-base" />
        </div>
        <div>
          <label className="block text-[11px] font-mono uppercase tracking-widest text-on-surface-variant/60 mb-1.5">
            Note <span className="text-on-surface-variant/30 normal-case tracking-normal">(optional)</span>
          </label>
          <input name="note" type="text" placeholder="Any extra context..." className="input-base" />
        </div>
        <div className="flex gap-3 pt-1">
          <button type="submit" disabled={isPending} className="btn-primary">
            {isPending ? "Saving…" : "Save entry"}
          </button>
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
        </div>
      </form>
    </div>
  );
}

function ContextCard({ entry, projectId, currentUserId, expanded, onToggleExpand }: {
  entry: ContextEntry; projectId: string; currentUserId: string; expanded: boolean; onToggleExpand: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isOwn = entry.added_by === currentUserId;
  const adder = entry.adder as any;

  function handleDelete() {
    startTransition(() => deleteContextEntry(entry.id, projectId));
  }

  return (
    <div className={cn("glass-panel overflow-hidden", isPending && "opacity-50")}>
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className={cn(
            "shrink-0 mt-0.5 w-8 h-8 rounded border flex items-center justify-center",
            entry.source_type === "link"
              ? "border-outline-variant/30 bg-surface-container-low"
              : "border-outline-variant/30 bg-surface-container-low"
          )}>
            <span className="material-symbols-outlined text-on-surface-variant/60" style={{ fontSize: 16 }}>
              {entry.source_type === "link" ? "link" : "article"}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            {entry.title && (
              <p className="text-base text-on-surface mb-2">{entry.title}</p>
            )}

            {entry.source_type === "link" ? (
              <a href={entry.content} target="_blank" rel="noopener noreferrer"
                className="text-[12px] font-mono text-on-surface-variant hover:text-on-surface transition-colors truncate block">
                {entry.content}
              </a>
            ) : (
              <button onClick={onToggleExpand} className="text-[12px] font-mono text-on-surface-variant/50 hover:text-on-surface transition-colors text-left">
                {expanded ? "Collapse" : `View pasted text (${entry.content.length} chars)`}
              </button>
            )}

            {entry.note && (
              <p className="text-[12px] font-mono text-on-surface-variant/40 mt-1.5 italic">{entry.note}</p>
            )}

            <div className="flex items-center gap-2 mt-3 text-[11px] font-mono text-on-surface-variant/30 uppercase tracking-widest">
              <span>{adder?.display_name ?? adder?.email ?? "someone"}</span>
              <span>·</span>
              <span>{formatRelativeTime(entry.created_at)}</span>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            {entry.source_type === "text" && (
              <button onClick={onToggleExpand}
                className="p-2 rounded text-on-surface-variant/30 hover:text-on-surface hover:bg-surface-container transition-colors"
                title={expanded ? "Collapse" : "Expand"}>
                <span className={cn("material-symbols-outlined transition-transform", expanded ? "rotate-180" : "")} style={{ fontSize: 16 }}>
                  expand_more
                </span>
              </button>
            )}
            {isOwn && (
              confirmDelete ? (
                <div className="flex items-center gap-2 text-[11px] font-mono">
                  <button onClick={handleDelete} className="text-error hover:underline">Delete</button>
                  <button onClick={() => setConfirmDelete(false)} className="text-on-surface-variant/40 hover:underline">No</button>
                </div>
              ) : (
                <button onClick={() => setConfirmDelete(true)}
                  className="p-2 rounded text-on-surface-variant/30 hover:text-error hover:bg-error/10 transition-colors"
                  title="Delete">
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {expanded && entry.source_type === "text" && (
        <div className="border-t border-outline-variant/15 p-5 bg-surface-container-lowest mt-4">
          <pre className="text-[12px] font-mono text-on-surface-variant whitespace-pre-wrap break-words max-h-96 overflow-y-auto leading-relaxed">
            {entry.content}
          </pre>
        </div>
      )}
    </div>
  );
}
