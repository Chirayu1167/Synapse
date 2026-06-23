import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TaskBoard from "@/components/tasks/TaskBoard";

export default async function TasksPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ owner?: string; tool?: string; status?: string }>;
}) {
  const { id: projectId } = await params;
  const filters = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch tasks with owner info
  const { data: tasks } = await supabase
    .from("tasks")
    .select("*, owner:users!tasks_owner_id_fkey(id, display_name, email, avatar_url)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  // Fetch members for owner assignment dropdown
  const { data: members } = await supabase
    .from("project_members")
    .select("user_id, role, user:users(id, display_name, email, avatar_url)")
    .eq("project_id", projectId);

  return (
    <TaskBoard
      projectId={projectId}
      tasks={tasks ?? []}
      members={members ?? []}
      currentUserId={user.id}
      filters={filters}
    />
  );
}
