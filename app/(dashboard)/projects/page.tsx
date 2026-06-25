import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase/server";

export default async function ProjectsPage() {
  const { supabase, user } = await getAuthUser();
  if (!user) redirect("/login");

  const { data: memberships } = await supabase
    .from("project_members")
    .select("project_id, role, projects(*, owner:users!projects_owner_id_fkey(display_name, email))")
    .eq("user_id", user.id)
    .eq("status", "active");

  type ProjectRow = {
    id: string;
    updated_at: string;
    name: string;
    description: string | null;
    owner?: { display_name: string | null; email: string | null };
  };

  const projects = (memberships ?? [])
    .flatMap((m) => {
      const p = m.projects as ProjectRow | ProjectRow[] | null | undefined;
      if (!p) return [];
      return Array.isArray(p) ? p : [p];
    })
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );

  const projectIds = projects.map((p) => p.id);

  const [{ data: taskCounts }, { data: todoCounts }] = await Promise.all([
    projectIds.length
      ? supabase.from("tasks").select("project_id, status").in("project_id", projectIds)
      : Promise.resolve({ data: [] }),
    projectIds.length
      ? supabase.from("todos").select("project_id, done").in("project_id", projectIds)
      : Promise.resolve({ data: [] }),
  ]);

  const taskCountMap: Record<string, { total: number; done: number }> = {};
  for (const t of taskCounts ?? []) {
    if (!taskCountMap[t.project_id]) taskCountMap[t.project_id] = { total: 0, done: 0 };
    taskCountMap[t.project_id].total++;
    if (t.status === "done") taskCountMap[t.project_id].done++;
  }

  const todoCountMap: Record<string, { total: number; done: number }> = {};
  for (const t of todoCounts ?? []) {
    if (!todoCountMap[t.project_id]) todoCountMap[t.project_id] = { total: 0, done: 0 };
    todoCountMap[t.project_id].total++;
    if (t.done) todoCountMap[t.project_id].done++;
  }

  const roleMap: Record<string, string> = {};
  for (const m of memberships ?? []) roleMap[m.project_id] = m.role;

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-widest text-on-surface-variant/40 mb-1">
            // PROJECT CONTROL
          </p>
          <h1 className="text-2xl font-semibold text-on-surface">Projects</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            {projects?.length ?? 0} active project{(projects?.length ?? 0) !== 1 ? "s" : ""}
          </p>
        </div>
        <Link href="/projects/new" className="btn-primary">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
          New Project
        </Link>
      </div>

      {!projects?.length ? (
        <div className="glass-panel p-12 text-center">
          <div className="w-16 h-16 rounded border border-outline-variant flex items-center justify-center mx-auto mb-6 bg-surface-container-low">
            <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 32 }}>rocket_launch</span>
          </div>
          <h2 className="text-on-surface text-lg font-medium mb-2">No projects yet</h2>
          <p className="text-sm text-on-surface-variant mb-6">
            Create your first project to start tracking tasks and AI usage.
          </p>
          <Link href="/projects/new" className="btn-primary inline-flex">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
            Launch first project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects?.map((project: any) => {
            const tasks = taskCountMap[project.id] ?? { total: 0, done: 0 };
            const todos = todoCountMap[project.id] ?? { total: 0, done: 0 };
            const taskPct = tasks.total ? Math.round((tasks.done / tasks.total) * 100) : 0;
            const todoPct = todos.total ? Math.round((todos.done / todos.total) * 100) : 0;

            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}/tasks`}
                className="glass-panel p-7 hover:border-outline/25 hover:bg-surface-container-low/90 transition-all group block"
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="w-12 h-12 rounded border border-outline-variant flex items-center justify-center shrink-0 bg-surface-container-low">
                    <span className="text-on-surface-variant text-sm font-mono font-bold">
                      {project.name.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  {roleMap[project.id] === "owner" && (
                    <span className="badge text-on-surface-variant/50 text-[11px]">OWNER</span>
                  )}
                </div>

                <h3 className="text-on-surface text-base font-semibold mb-1.5 group-hover:text-on-surface/80 transition-colors">
                  {project.name}
                </h3>
                {project.description && (
                  <p className="text-sm text-on-surface-variant line-clamp-2 mb-5 leading-relaxed">
                    {project.description}
                  </p>
                )}

                <div className="mt-auto pt-5 border-t border-outline-variant/20 space-y-4">
                  {/* Tasks progress */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-mono uppercase tracking-widest text-on-surface-variant/50">
                        Tasks · {tasks.done}/{tasks.total}
                      </span>
                      <span className="text-[11px] font-mono text-on-surface-variant/50">{taskPct}%</span>
                    </div>
                    <div className="h-1 bg-outline-variant/25 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-on-surface/60 rounded-full transition-all"
                        style={{ width: `${taskPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Todos progress */}
                  {todos.total > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-mono uppercase tracking-widest text-on-surface-variant/50">
                          Todos · {todos.done}/{todos.total}
                        </span>
                        <span className="text-[11px] font-mono text-on-surface-variant/50">{todoPct}%</span>
                      </div>
                      <div className="h-1 bg-outline-variant/25 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-on-surface/40 rounded-full transition-all"
                          style={{ width: `${todoPct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
