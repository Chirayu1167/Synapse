import Link from "next/link";
import NewProjectForm from "@/components/projects/NewProjectForm";

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

      <NewProjectForm />
    </div>
  );
}
