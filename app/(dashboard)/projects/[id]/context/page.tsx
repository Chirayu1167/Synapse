import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ContextEntries from "@/components/context/ContextEntries";

export default async function ContextPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: entries } = await supabase
    .from("context_entries")
    .select("*, adder:users!context_entries_added_by_fkey(id, display_name, email)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  return (
    <ContextEntries
      projectId={projectId}
      entries={entries ?? []}
      currentUserId={user.id}
    />
  );
}
