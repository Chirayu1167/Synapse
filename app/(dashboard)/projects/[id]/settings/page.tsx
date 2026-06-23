import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProjectSettings from "@/components/projects/ProjectSettings";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  const { data: members } = await supabase
    .from("project_members")
    .select("*, user:users(id, display_name, email, avatar_url)")
    .eq("project_id", projectId);

  const { data: pendingInvites } = await supabase
    .from("pending_invites")
    .select("*")
    .eq("project_id", projectId);

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
