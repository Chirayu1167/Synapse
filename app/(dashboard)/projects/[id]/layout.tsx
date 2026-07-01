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

  // Run all 3 queries in parallel — previously sequential due to debug_whoami waterfall
  const [
    { data: project },
    { data: membership },
    { count: assignedTodoCount },
  ] = await Promise.all([
    supabase.from("projects").select("id, name, description").eq("id", id).single(),
    supabase
      .from("project_members")
      .select("role")
      .eq("project_id", id)
      .eq("user_id", user.id)
      .eq("status", "active")
      .single(),
    supabase
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("project_id", id)
      .eq("owner_id", user.id)
      .eq("status", "todo"),
  ]);

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
          {/* Notification bell → links to Activity tab */}
          <Link
            href={`/projects/${id}/activity`}
            className="relative flex items-center justify-center w-8 h-8 rounded hover:bg-surface-container transition-colors"
            title={assignedTodoCount ? `${assignedTodoCount} task${assignedTodoCount > 1 ? "s" : ""} assigned to you` : "Activity"}
          >
            <span className="material-symbols-outlined text-on-surface-variant" style={{ fontSize: 20 }}>
              notifications
            </span>
            {!!assignedTodoCount && assignedTodoCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-on-primary text-[9px] font-mono font-bold">
                {assignedTodoCount > 9 ? "9+" : assignedTodoCount}
              </span>
            )}
          </Link>
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
