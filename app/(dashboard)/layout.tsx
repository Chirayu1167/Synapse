import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getAuthUser } from "@/lib/supabase/server";
import { getDashboardSidebarData } from "@/lib/data/dashboard-sidebar";
import { signOut } from "@/lib/actions";
import { initials } from "@/lib/utils";
import { ensureUserProfile, profileFromAuthUser } from "@/lib/users";
import SidebarClient from "../dashboard-sidebar-client";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await getAuthUser();
  if (!user) redirect("/login");

  await ensureUserProfile(supabase, user).catch((error) => {
    console.error("Failed to ensure user profile", error);
  });
  const { profile, projects, requests } = await getDashboardSidebarData(user.id);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-[270px] shrink-0 bg-surface-container-lowest border-r border-outline-variant/20 flex flex-col overflow-y-auto">
        <SidebarClient
          initialProfile={profile}
          initialProjects={projects}
          initialRequests={requests}
          initialUser={user}
        />
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-background">
        {children}
      </main>
    </div>
  );
}