import Link from "next/link";
import { createProject } from "@/lib/actions";

export default function NewProjectPage() {
  return (
    <div className="px-4 py-4">
      <div className="mb-6">
        <Link
          href="/projects"
          className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-on-surface-variant/50 hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_back</span>
          Projects
        </Link>
      </div>

      <div className="mb-8">
        <p className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant/40 mb-1">// NEW PROJECT</p>
        <h1 className="text-headline-sm font-headline-sm text-on-surface">New Project</h1>
      </div>

      <div className="glass-panel p-6">
        <form action={createProject} className="space-y-5">
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
              Description <span className="text-on-surface-variant/30 normal-case tracking-normal">(optional)</span>
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              placeholder="What is this project about?"
              className="input-base resize-none"
            />
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-outline-variant/20">
            <button type="submit" className="btn-primary">
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>rocket_launch</span>
              Launch Project
            </button>
            <Link href="/projects" className="btn-ghost">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
