import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase/server";
import { routeBenchTimer } from "@/lib/dev/route-bench";
import TaskListDisplay from "@/components/tasks/TaskListDisplay";

export default async function TodosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = await params;
  const { supabase, user } = await getAuthUser();
  if (!user) redirect("/login");

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*, owner:users!tasks_owner_id_fkey(id, display_name, email, avatar_url), due_date")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  routeBenchTimer().log(`/projects/${projectId}/todos`);

  return (
    <TaskListDisplay
      projectId={projectId}
      tasks={tasks ?? []}
    />
  );
}