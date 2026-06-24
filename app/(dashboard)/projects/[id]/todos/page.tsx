import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase/server";
import { routeBenchTimer } from "@/lib/dev/route-bench";
import TodoList from "@/components/todos/TodoList";

export default async function TodosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = await params;
  const { supabase, user } = await getAuthUser();
  if (!user) redirect("/login");

  const { data: todos } = await supabase
    .from("todos")
    .select("*, creator:users!todos_created_by_fkey(id, display_name, email, avatar_url)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  routeBenchTimer().log(`/projects/${projectId}/todos`);

  return (
    <TodoList
      projectId={projectId}
      todos={todos ?? []}
      currentUserId={user.id}
    />
  );
}
