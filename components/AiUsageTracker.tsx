"use client";

import { useState, useTransition } from "react";
import type { AiUsageEntry } from "@/lib/types";
import { AI_TOOLS, TOOL_COLORS } from "@/lib/types";
import { createAiUsageEntry, updateAiUsageEntry, deleteAiUsageEntry } from "@/lib/actions";
import { cn, formatDateTime, formatRelativeTime } from "@/lib/utils";

interface Props {
  entries: AiUsageEntry[];
}

export default function AiUsageTracker({ entries }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editEntry, setEditEntry] = useState<AiUsageEntry | null>(null);

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[13px] font-mono uppercase tracking-widest text-on-surface-variant/40 mb-1">
            // AI ALLOCATION
          </p>
          <h1 className="text-headline-md font-headline-md tracking-tight text-on-surface" style={{ fontSize: '24px' }}>AI Usage</h1>
          <p className="text-[13px] font-mono-label text-on-surface-variant mt-1">
            Track your quotas across AI tools
          </p>
        </div>
        <button
          onClick={() => { setEditEntry(null); setShowForm(true); }}
          className="btn-primary"
          style={{ fontSize: '1.125rem' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          Add Tool
        </button>
      </div>

      {!entries.length && !showForm ? (
        <div className="glass-panel p-8 text-center">
          <div className="w-14 h-14 rounded border border-outline-variant flex items-center justify-center mx-auto mb-6 bg-surface-container-low">
            <span className="material-symbols-outlined text-on-surface-variant ai-pulse" style={{ fontSize: 36 }}>
              analytics
            </span>
          </div>
          <h2 className="text-on-surface text-lg font-medium mb-2">No tools tracked yet</h2>
          <p className="text-[13px] font-mono-label text-on-surface-variant mb-6">
            Add your AI tools and log your usage, quotas, and reset dates.
          </p>
          <button onClick={() => setShowForm(true)} className="btn-primary" style={{ fontSize: '1.125rem' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
            Add first tool
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {entries.map((entry) => (
            <UsageCard
              key={entry.id}
              entry={entry}
              onEdit={() => { setEditEntry(entry); setShowForm(true); }}
            />
          ))}
        </div>
      )}

      {showForm && (
        <UsageFormModal
          entry={editEntry}
          onClose={() => { setShowForm(false); setEditEntry(null); }}
        />
      )}
    </div>
  );
}

function UsageCard({ entry, onEdit }: { entry: AiUsageEntry; onEdit: () => void }) {
  const resetSoon = entry.reset_at
    ? new Date(entry.reset_at).getTime() - Date.now() < 24 * 60 * 60 * 1000
    : false;

  return (
    <div className="glass-panel p-8 hover:border-outline-variant/30 transition-all card-interactive hover-lift">
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-[13px] font-mono uppercase tracking-widest text-on-surface-variant/40 mb-2">AI TOOL</p>
          <span className="badge">{entry.tool_name}</span>
        </div>
        <button
          onClick={onEdit}
          className="text-on-surface-variant/30 hover:text-on-surface transition-colors p-2"
          title="Edit"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>edit</span>
        </button>
      </div>

      {entry.usage_text ? (
        <div className="mb-5">
          <p className="text-[13px] font-mono uppercase tracking-widest text-on-surface-variant/40 mb-2">USAGE</p>
          <p className="text-3xl font-mono text-on-surface tracking-tight">{entry.usage_text}</p>
        </div>
      ) : (
        <p className="text-[13px] font-mono-label text-on-surface-variant/40 mb-6 italic">No usage recorded</p>
      )}

      {entry.reset_at && (
        <div className={cn(
          "flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest px-3 py-2 rounded border",
          resetSoon
            ? "border-error/20 bg-error/5 text-error"
            : "border-outline-variant/20 bg-surface-container-low text-on-surface-variant/50"
        )}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>schedule</span>
          <span>Resets {formatRelativeTime(entry.reset_at)}</span>
        </div>
      )}

      {entry.notes && (
        <p className="text-[14px] font-mono text-on-surface-variant/40 mt-6 pt-4 border-t border-outline-variant/15">
          {entry.notes}
        </p>
      )}
    </div>
  );
}

function UsageFormModal({ entry, onClose }: { entry: AiUsageEntry | null; onClose: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [customTool, setCustomTool] = useState(!entry || AI_TOOLS.includes(entry.tool_name as any) ? false : true);
  const [toolName, setToolName] = useState(entry?.tool_name ?? "Claude");

  function handleSubmit(formData: FormData) {
    formData.set("tool_name", toolName);
    startTransition(async () => {
      if (entry) {
        await updateAiUsageEntry(entry.id, formData);
      } else {
        await createAiUsageEntry(formData);
      }
      onClose();
    });
  }

  function handleDelete() {
    if (!entry) return;
    startTransition(async () => {
      await deleteAiUsageEntry(entry.id);
      onClose();
    });
  }

  const resetAtValue = entry?.reset_at
    ? new Date(entry.reset_at).toISOString().slice(0, 16)
    : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-lg border-outline-variant/30">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-outline-variant/20">
          <div>
            <p className="text-[12px] font-mono uppercase tracking-widest text-on-surface-variant/40 mb-0.5">
              // {entry ? "EDIT ENTRY" : "NEW TOOL"}
            </p>
            <h2 className="text-on-surface text-lg font-medium">
              {entry ? "Edit usage entry" : "Add AI tool"}
            </h2>
          </div>
          <button onClick={onClose} className="text-on-surface-variant/40 hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>close</span>
          </button>
        </div>

        <form action={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-[13px] font-mono uppercase tracking-widest text-on-surface-variant/60 mb-1.5">Tool *</label>
            <div className="flex gap-3">
              {!customTool ? (
                <select
                  value={toolName}
                  onChange={(e) => setToolName(e.target.value)}
                  className="input-base flex-1"
                >
                  {AI_TOOLS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              ) : (
                <input
                  type="text"
                  value={toolName}
                  onChange={(e) => setToolName(e.target.value)}
                  placeholder="Tool name"
                  className="input-base flex-1"
                  required
                />
              )}
              <button
                type="button"
                onClick={() => { setCustomTool(!customTool); setToolName(""); }}
                className="btn-ghost"
              >
                {customTool ? "Preset" : "Custom"}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-mono uppercase tracking-widest text-on-surface-variant/60 mb-1.5">
              Usage <span className="text-on-surface-variant/30 normal-case tracking-normal">(free text)</span>
            </label>
            <input
              name="usage_text"
              defaultValue={entry?.usage_text ?? ""}
              placeholder="e.g. 32/40 messages, 1.2M / 2M tokens"
              className="input-base font-mono"
            />
          </div>

          <div>
            <label className="block text-[13px] font-mono uppercase tracking-widest text-on-surface-variant/60 mb-1.5">
              Reset date/time <span className="text-on-surface-variant/30 normal-case tracking-normal">(optional)</span>
            </label>
            <input
              name="reset_at"
              type="datetime-local"
              defaultValue={resetAtValue}
              className="input-base"
            />
          </div>

          <div>
            <label className="block text-[13px] font-mono uppercase tracking-widest text-on-surface-variant/60 mb-1.5">
              Notes <span className="text-on-surface-variant/30 normal-case tracking-normal">(optional)</span>
            </label>
            <input
              name="notes"
              defaultValue={entry?.notes ?? ""}
              placeholder="Any extra notes..."
              className="input-base"
            />
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-outline-variant/20">
            {entry ? (
              confirmDelete ? (
                <div className="flex items-center gap-3 text-[13px] font-mono">
                  <span className="text-on-surface-variant/40">Delete?</span>
                  <button type="button" onClick={handleDelete} className="text-error hover:underline" style={{ fontSize: '1.125rem' }}>
                    Yes
                  </button>
                  <button type="button" onClick={() => setConfirmDelete(false)} className="text-on-surface-variant/40 hover:underline" style={{ fontSize: '1.125rem' }}>
                    No
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => setConfirmDelete(true)} className="btn-danger" style={{ fontSize: '1.125rem' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>delete</span>
                  Delete
                </button>
              )
            ) : <div />}

            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="btn-ghost" style={{ fontSize: '1.125rem' }}>
                Cancel
              </button>
              <button type="submit" disabled={isPending || !toolName.trim()} className="btn-primary" style={{ fontSize: '1.125rem' }}>
                {isPending ? "Saving…" : entry ? "Save changes" : "Add tool"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
