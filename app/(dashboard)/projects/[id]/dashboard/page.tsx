import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase/server";
import { routeBenchTimer } from "@/lib/dev/route-bench";
import {
  StatCard,
  ProjectProgressCard,
  TasksByStatus,
  AssignedToMeSection,
  UpcomingDeadlines,
  RecentActivityFeed,
  TeamOverview,
} from "@/components/dashboard";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = await params;
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
      .select("*, owner:users!tasks_owner_id_fkey(id, display_name, email, avatar_url), due_date")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true }),
    supabase
      .from("project_members")
      .select("id, project_id, user_id, role, joined_at, user:users(id, email, display_name, avatar_url, created_at, updated_at)")
      .eq("project_id", projectId),
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
    user: m.user[0]
  })) ?? [];

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

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Tasks"
          value={tasks?.length ?? 0}
          trend={calculateTrend(tasks ?? [], "total")}
          icon="list_alt"
        />
        <StatCard
          title="Completed"
          value={tasks?.filter(t => t.status === "done").length ?? 0}
          trend={calculateTrend(tasks ?? [], "done")}
          icon="check_circle"
          variant="success"
        />
        <StatCard
          title="In Progress"
          value={tasks?.filter(t => t.status === "in_progress").length ?? 0}
          trend={calculateTrend(tasks ?? [], "in_progress")}
          icon="pending"
          variant="warning"
        />
        <StatCard
          title="To Do"
          value={tasks?.filter(t => t.status === "todo").length ?? 0}
          trend={calculateTrend(tasks ?? [], "todo")}
          icon="radio_button_unchecked"
          variant="info"
        />
        <StatCard
          title="Testing"
          value={tasks?.filter(t => t.status === "testing").length ?? 0}
          trend={calculateTrend(tasks ?? [], "testing")}
          icon="science"
          variant="info"
        />
        <StatCard
          title="Overdue"
          value={calculateOverdue(tasks ?? [])}
          trend={calculateOverdueTrend(tasks ?? [])}
          icon="warning"
          variant="error"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column - 2/3 width on lg+ */}
        <div className="lg:col-span-2">
          <ProjectProgressCard project={project} tasks={tasks ?? []} />
          <TasksByStatus tasks={tasks ?? []} />
          <AssignedToMeSection
            projectId={projectId}
            userId={user.id}
            tasks={tasks ?? []}
            members={processedMembers}
          />
          <UpcomingDeadlines tasks={tasks ?? []} />
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

// Helper functions
function calculateTrend(tasks: any[], status: string): { value: string; isPositive: boolean } {
  if (!tasks || tasks.length === 0) return { value: "0%", isPositive: false };

  const statusCount = tasks.filter(t => t.status === status).length;
  const total = tasks.length;
  const percentage = Math.round((statusCount / total) * 100);

  // For simplicity, we'll consider it positive if > 0
  // In a real app, you'd compare to previous period
  return { value: `${percentage}%`, isPositive: percentage > 0 };
}

function calculateOverdue(tasks: any[]): number {
  if (!tasks) return 0;
  const now = new Date();
  return tasks.filter(task => {
    if (!task.due_date) return false;
    const dueDate = new Date(task.due_date);
    return dueDate < now && task.status !== "done";
  }).length;
}

function calculateOverdueTrend(tasks: any[]): { value: string; isPositive: boolean } {
  if (!tasks || tasks.length === 0) return { value: "0%", isPositive: false };

  const overdueCount = calculateOverdue(tasks);
  const total = tasks.length;
  const percentage = Math.round((overdueCount / total) * 100);

  // Lower is better for overdue, so invert the logic
  return { value: `${percentage}%`, isPositive: percentage === 0 };
}