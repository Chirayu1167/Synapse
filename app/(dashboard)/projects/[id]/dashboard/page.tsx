import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase/server";
import { routeBenchTimer } from "@/lib/dev/route-bench";
import type { ProjectMember } from "@/lib/types";
import {
  ProjectProgressCard,
  TasksByStatus,
  AssignedToMeSection,
  UpcomingDeadlines,
  RecentActivityFeed,
  TeamOverview,
} from "@/components/dashboard";

export default async function DashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ owner?: string; tool?: string; status?: string }>;
}) {
  const { id: projectId } = await params;
  const filters = await searchParams;
  const { supabase, user } = await getAuthUser();
  if (!user) redirect("/login");

  // Fetch data for dashboard components
  const [
    { data: tasks },
    { data: members },
    { data: project },
    { data: activity },
  ] = await Promise.all([
    supabase
      .from("tasks")
      .select("*, owner:users!tasks_owner_id_fkey(id, display_name, email, avatar_url)")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true }),
    supabase
      .from("project_members")
      .select("id, project_id, user_id, role, joined_at, status, requested_at, approved_at, user:users(id, email, display_name, avatar_url, created_at, updated_at)")
      .eq("project_id", projectId)
      .eq("status", "active"),
    supabase
      .from("projects")
      .select("id, name, description, owner_id, created_at, updated_at")
      .eq("id", projectId)
      .single(),
    supabase
      .from("activity_log")
      .select("*, actor:users!activity_log_actor_id_fkey(id, display_name, email, avatar_url)")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  if (!project) redirect("/projects");

  const processedMembers = members?.map(m => ({
    ...m,
    user: Array.isArray(m.user) ? m.user[0] : m.user, // Ensure user is an object, not an array
  })) ?? [];

  // Apply filters (owner and tool) similar to TaskBoard
  const filteredTasks = (tasks ?? []).filter((task) => {
    if (filters.owner && filters.owner !== '' && task.owner_id !== filters.owner) return false;
    if (filters.tool && filters.tool !== '' && task.ai_tool !== filters.tool) return false;
    return true;
  });

  routeBenchTimer().log(`/projects/${projectId}/dashboard`);

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-on-surface">Dashboard</h1>
        <div className="flex items-center gap-3">
          {/* Quick actions could go here */}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column - 2/3 width on lg+ */}
        <div className="lg:col-span-2">
          <ProjectProgressCard project={project} tasks={filteredTasks} />
          <TasksByStatus tasks={filteredTasks} />
          <AssignedToMeSection
            projectId={projectId}
            userId={user.id}
            tasks={filteredTasks}
            members={processedMembers}
          />
          <UpcomingDeadlines tasks={filteredTasks} />
        </div>

        {/* Sidebar - 1/3 width on lg+ */}
        <div className="lg:col-span-1">
          <RecentActivityFeed activity={activity ?? []} />
          <TeamOverview members={processedMembers} currentUserId={user.id} />
        </div>
      </div>
    </div>
  );
}