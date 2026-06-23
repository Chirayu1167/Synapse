import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TodoList from "@/components/todos/TodoList";

export default async function TodosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: todos } = await supabase
    .from("todos")
    .select("*, creator:users!todos_created_by_fkey(id, display_name, email)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  return (
    <TodoList
      projectId={projectId}
      todos={todos ?? []}
      currentUserId={user.id}
    />
  );
}
