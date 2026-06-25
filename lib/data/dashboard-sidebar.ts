import { createClient } from "@/lib/supabase/server";
import { cache } from "react";

type SidebarProject = { id: string; name: string };

function normalizeJoinedProject(
  project: SidebarProject | SidebarProject[] | null | undefined
): SidebarProject[] {
  if (!project) return [];
  return Array.isArray(project) ? project : [project];
}

/**
 * NOTE: unstable_cache cannot be used here because the inner function reads
 * cookies (via createClient()), and Next.js disallows request-scoped APIs
 * inside unstable_cache — it throws a server error at runtime. React's
 * cache() is used instead: it dedupes calls with the same arguments WITHIN
 * a single request/render, but does not persist across separate
 * navigations. That's the correct trade-off here since this data is
 * per-user and depends on the user's own cookies anyway.
 */
export const getDashboardSidebarData = cache(async (userId: string) => {
  const supabase = await createClient();

  const [{ data: profile }, { data: memberships }, { data: ownRequests }] = await Promise.all([
    supabase.from("users").select("*").eq("id", userId).single(),
    supabase
      .from("project_members")
      .select("projects(id, name)")
      .eq("user_id", userId)
      .eq("status", "active"),
    // Invites this user has received (status='invited') or already accepted
    // and is waiting on the owner to approve (status='pending_approval').
    // They are NOT a project member yet — this is only ever the user's own
    // row, never something that grants them access to the project itself.
    supabase
      .from("project_members")
      .select("id, status, project_id, projects(id, name)")
      .eq("user_id", userId)
      .in("status", ["invited", "pending_approval"]),
  ]);

  const projects = (memberships ?? [])
    .flatMap((m) =>
      normalizeJoinedProject(
        m.projects as SidebarProject | SidebarProject[] | null | undefined
      )
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  const requests = (ownRequests ?? []).map((r: any) => ({
    id: r.id,
    status: r.status as "invited" | "pending_approval",
    project: normalizeJoinedProject(r.projects)[0] ?? null,
  }));

  return { profile, projects, requests };
});
