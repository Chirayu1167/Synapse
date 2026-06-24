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

  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabase.from("users").select("*").eq("id", userId).single(),
    supabase
      .from("project_members")
      .select("projects(id, name)")
      .eq("user_id", userId),
  ]);

  const projects = (memberships ?? [])
    .flatMap((m) =>
      normalizeJoinedProject(
        m.projects as SidebarProject | SidebarProject[] | null | undefined
      )
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  return { profile, projects };
});
