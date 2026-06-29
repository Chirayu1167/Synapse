"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { createProject } from "@/lib/actions";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Project creation failed. Check your Supabase migrations and try again.";
}

function isRedirectSignal(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

export default function NewProjectForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleSubmit(formData: FormData) {
    setError("");
    startTransition(async () => {
      try {
        await createProject(formData);
        formRef.current?.reset();
      } catch (err) {
        if (isRedirectSignal(err)) throw err;
        setError(getErrorMessage(err));
      }
    });
  }

  return (
    <div className="glass-panel p-6">
      <form ref={formRef} action={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-on-surface-variant/60 mb-1.5">
            Project name <span className="text-error">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="e.g. API Refactor, Q4 Launch..."
            className="input-base"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-on-surface-variant/60 mb-1.5">
            Description{" "}
            <span className="text-on-surface-variant/30 normal-case tracking-normal">
              (optional)
            </span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            placeholder="What is this project about?"
            className="input-base resize-none"
          />
        </div>

        {error && (
          <div className="rounded border border-error/30 bg-error/10 px-3 py-2 text-xs text-error font-mono">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3 pt-2 border-t border-outline-variant/20">
          <button type="submit" disabled={isPending} className="btn-primary">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              {isPending ? "progress_activity" : "rocket_launch"}
            </span>
            {isPending ? "Launching..." : "Launch Project"}
          </button>
          <Link href="/projects" className="btn-ghost">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
