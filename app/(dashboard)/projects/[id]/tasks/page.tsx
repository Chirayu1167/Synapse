import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase/server";
import { routeBenchTimer } from "@/lib/dev/route-bench";
import TaskBoard from "@/components/tasks/TaskBoard";
import type { ProjectMember } from "@/lib/types";

export default async function TasksPage({
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

  const [{ data: tasks }, { data: members }] = await Promise.all([
    supabase
      .from("tasks")
      .select("*, owner:users!tasks_owner_id_fkey(id, display_name, email, avatar_url)")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true }),
    supabase
      .from("project_members")
      .select("user_id, role, user:users(id, display_name, email, avatar_url)")
      .eq("project_id", projectId)
      .eq("status", "active"),
  ]);

  routeBenchTimer().log(`/projects/${projectId}/tasks`);

  return (
    <TaskBoard
      projectId={projectId}
      tasks={tasks ?? []}
      members={(members ?? []) as unknown as ProjectMember[]}
      currentUserId={user.id}
      filters={filters}
    />
  );
}
