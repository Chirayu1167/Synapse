import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase/server";
import ProjectSettings from "@/components/projects/ProjectSettings";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = await params;
  const { supabase, user } = await getAuthUser();
  if (!user) redirect("/login");

  const [{ data: project }, { data: members }, { data: pendingInvites }] = await Promise.all([
    supabase.from("projects").select("*").eq("id", projectId).single(),
    supabase
      .from("project_members")
      .select("*, user:users(id, display_name, email, avatar_url)")
      .eq("project_id", projectId),
    supabase.from("pending_invites").select("*").eq("project_id", projectId),
  ]);

  const currentMembership = members?.find((m: any) => m.user_id === user.id);
  const isOwner = currentMembership?.role === "owner";

  if (!isOwner) redirect(`/projects/${projectId}/tasks`);

  return (
    <ProjectSettings
      project={project!}
      members={members ?? []}
      pendingInvites={pendingInvites ?? []}
      currentUserId={user.id}
    />
  );
}
