import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getAuthUser } from "@/lib/supabase/server";
import TabLink from "@/components/ui/TabLink";

interface ProjectLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

const TABS = [
  { href: "dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "tasks",     label: "Tasks",     icon: "list_alt" },
  { href: "team",      label: "Team",      icon: "people" },
  { href: "activity",  label: "Activity",  icon: "timeline" },
  { href: "settings",  label: "Settings",  icon: "settings" },
];

export default async function ProjectLayout({ children, params }: ProjectLayoutProps) {
  const { id } = await params;
  const { supabase, user } = await getAuthUser();
  if (!user) redirect("/login");

  const [{ data: project }, { data: membership }] = await Promise.all([
    supabase.from("projects").select("id, name, description").eq("id", id).single(),
    supabase
      .from("project_members")
      .select("role")
      .eq("project_id", id)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single(),
  ]);

  // Count of tasks assigned to current user that are in 'todo' (accepted but not accepted)
  const { count: rawCount, error: assignedTodosError } = await supabase
    .from('tasks')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', id)
    .eq('owner_id', user.id)
    .eq('status', 'todo');

  let assignedTodoCount = 0;
  if (rawCount !== null && rawCount !== undefined) {
    assignedTodoCount = rawCount;
  }

  if (!project) notFound();

  if (!membership) redirect("/projects");

  return (
    <div className="flex flex-col h-full">
      {/* Project header */}
      <div className="border-b border-outline-variant/20 bg-surface-container-lowest px-4 pt-4 pb-0">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-on-surface-variant/40 mb-3">
          <Link href="/projects" className="hover:text-on-surface-variant transition-colors">Projects</Link>
          <span>/</span>
          <span className="text-on-surface-variant">{project.name}</span>
        </div>

        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-on-surface text-xl font-semibold">{project.name}</h1>
            {project.description && (
              <p className="text-sm text-on-surface-variant mt-1">{project.description}</p>
            )}
          </div>
          {/* Notification bell */}
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              notifications
            </span>
            {assignedTodoCount > 0 && (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-outline text-on-surface text-xs font-mono">
                {assignedTodoCount}
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 -mb-px">
          {TABS.map((tab) => (
            <TabLink key={tab.href} projectId={id} href={tab.href} label={tab.label} icon={tab.icon} />
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
