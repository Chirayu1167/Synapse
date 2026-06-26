import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase/server";
import ContextEntries from "@/components/context/ContextEntries";

export default async function ContextPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = await params;
  const { supabase, user } = await getAuthUser();
  if (!user) redirect("/login");

  const { data: entries } = await supabase
    .from("context_entries")
    .select("*, adder:users!context_entries_added_by_fkey(id, display_name, email, avatar_url, created_at, updated_at)")
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
