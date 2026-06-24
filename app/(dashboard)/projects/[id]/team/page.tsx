import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase/server";
import { routeBenchTimer } from "@/lib/dev/route-bench";
import {
  TeamHeader,
  TeamStats,
  MemberList,
  MemberDetails,
} from "@/components/dashboard";

export default async function TeamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = await params;
  const { supabase, user } = await getAuthUser();
  if (!user) redirect("/login");

  const [{ data: project }, { data: members }, { data: tasks }] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name, description, owner_id, created_at, updated_at")
      .eq("id", projectId)
      .single(),
    supabase
      .from("project_members")
      .select(`
        id,
        project_id,
        user_id,
        role,
        joined_at,
        user:users (
          id,
          email,
          display_name,
          avatar_url,
          created_at,
          updated_at
        )
      `)
      .eq("project_id", projectId),
    supabase
      .from("tasks")
      .select("*, owner:users!tasks_owner_id_fkey(id, display_name, email, avatar_url)")
      .eq("project_id", projectId),
  ]);

  if (!project) redirect("/projects");

  // Check if user is member of this project
  const isMember = members?.some(m => m.user_id === user.id);
  if (!isMember) redirect("/projects");

  // Process members to include user data directly
  const processedMembers = members?.map(m => ({
    user_id: m.user_id,
    role: m.role,
    user: m.user[0]
  })) ?? [];

  routeBenchTimer().log(`/projects/${projectId}/team`);

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <TeamHeader project={project} userId={user.id} members={processedMembers} />

      {/* Stats */}
      <TeamStats project={project} members={processedMembers} tasks={tasks ?? []} />

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Member List */}
        <MemberList
          projectId={projectId}
          members={processedMembers}
          currentUserId={user.id}
          onMemberSelect={(memberId) => {
            // This would update state in a real implementation
            console.log("Selected member:", memberId);
          }}
        />

        {/* Member Details */}
        <MemberDetails
          selectedMemberId={null} // Would be managed by parent component state
          members={processedMembers}
        />
      </div>
    </div>
  );
}