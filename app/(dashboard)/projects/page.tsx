import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: memberships } = await supabase
    .from("project_members")
    .select("project_id, role")
    .eq("user_id", user.id);

  const projectIds = memberships?.map((m) => m.project_id) ?? [];

  const { data: projects } = projectIds.length
    ? await supabase
        .from("projects")
        .select("*, owner:users!projects_owner_id_fkey(display_name, email)")
        .in("id", projectIds)
        .order("updated_at", { ascending: false })
    : { data: [] };

  const { data: taskCounts } = projectIds.length
    ? await supabase
        .from("tasks")
        .select("project_id, status")
        .in("project_id", projectIds)
    : { data: [] };

  const countMap: Record<string, { total: number; done: number }> = {};
  for (const t of taskCounts ?? []) {
    if (!countMap[t.project_id]) countMap[t.project_id] = { total: 0, done: 0 };
    countMap[t.project_id].total++;
    if (t.status === "done") countMap[t.project_id].done++;
  }

  const roleMap: Record<string, string> = {};
  for (const m of memberships ?? []) roleMap[m.project_id] = m.role;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[11px] font-mono-label font-mono uppercase tracking-widest text-on-surface-variant/50 mb-1">
            // MISSION CONTROL
          </p>
          <h1 className="text-headline-md font-headline-md tracking-tight text-on-surface">Projects</h1>
          <p className="text-mono-label font-mono-label text-on-surface-variant mt-1">
            {projects?.length ?? 0} active mission{(projects?.length ?? 0) !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/projects/new" className="btn-primary">
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>add</span>
          New Mission
        </Link>
      </div>

      {!projects?.length ? (
        <div className="glass-panel p-8 text-center">
          <div className="w-14 h-14 rounded border border-outline-variant flex items-center justify-center mx-auto mb-6 bg-surface-container-low">
            <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 28 }}>rocket_launch</span>
          </div>
          <h2 className="text-on-surface text-base font-medium mb-2">No missions yet</h2>
          <p className="text-mono-label font-mono-label text-on-surface-variant mb-6">
            Create your first project to start tracking tasks and AI usage.
          </p>
          <Link href="/projects/new" className="btn-primary inline-flex">
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>add</span>
            Launch first mission
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {projects?.map((project: any) => {
            const counts = countMap[project.id] ?? { total: 0, done: 0 };
            const pct = counts.total ? Math.round((counts.done / counts.total) * 100) : 0;
            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}/tasks`}
                className="glass-panel p-8 hover:border-outline/25 hover:bg-surface-container-low/90 transition-all group block card-interactive hover-lift"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded border border-outline-variant flex items-center justify-center shrink-0 bg-surface-container-low">
                    <span className="text-on-surface-variant text-[12px] font-mono font-bold">
                      {project.name.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  {roleMap[project.id] === "owner" && (
                    <span className="badge text-on-surface-variant/50">OWNER</span>
                  )}
                </div>

                <h3 className="text-on-surface text-lg font-medium mb-2 group-hover:text-primary transition-colors">
                  {project.name}
                </h3>
                {project.description && (
                  <p className="text-mono-label font-mono-label text-on-surface-variant line-clamp-2 mb-4">
                    {project.description}
                  </p>
                )}

                <div className="mt-auto pt-5 border-t border-outline-variant/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] font-mono uppercase tracking-widest text-on-surface-variant/50">
                      {counts.done}/{counts.total} tasks
                    </span>
                    <span className="text-[12px] font-mono text-on-surface-variant/50 font-medium">{pct}%</span>
                  </div>
                  <div className="h-px bg-outline-variant/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-on-surface/60 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
