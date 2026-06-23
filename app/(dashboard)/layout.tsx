import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions";
import { initials } from "@/lib/utils";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: projects } = await supabase
    .from("projects")
    .select("id, name")
    .in(
      "id",
      (
        await supabase
          .from("project_members")
          .select("project_id")
          .eq("user_id", user.id)
      ).data?.map((m) => m.project_id) ?? []
    )
    .order("name");

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-[200px] shrink-0 bg-surface-container-lowest border-r border-outline-variant/20 flex flex-col overflow-y-auto">
        {/* Brand */}
        <div className="px-4 py-4 border-b border-outline-variant/20">
          <Link href="/projects" className="flex items-center gap-3">
            <div className="w-7 h-7 rounded border border-outline-variant flex items-center justify-center shrink-0 bg-surface-container-low">
              <span className="material-symbols-outlined text-on-surface" style={{ fontSize: 14 }}>hub</span>
            </div>
            <div>
              <p className="text-on-surface text-xs font-mono-label font-mono tracking-widest uppercase">Synapse</p>
              <p className="text-on-surface-variant text-[9px] font-mono-label font-mono uppercase tracking-widest opacity-60">OS · v2.4.1</p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3">
          <div className="px-3 mb-1">
            <p className="text-[9px] font-mono-label font-mono uppercase tracking-widest text-on-surface-variant/40 px-3 mb-1">
              Navigation
            </p>
          </div>

          <NavItem href="/projects" icon="folder_open" label="Projects" />
          <NavItem href="/ai-usage" icon="analytics" label="AI Usage" />

          {projects && projects.length > 0 && (
            <div className="mt-4">
              <p className="px-6 mb-1 text-[9px] font-mono-label font-mono uppercase tracking-widest text-on-surface-variant/40">
                Missions
              </p>
              {projects.map((p) => (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}/tasks`}
                  className="flex items-center gap-3 px-6 py-2 text-xs font-mono-label font-mono text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors truncate"
                >
                  <span className="w-1 h-1 rounded-full bg-outline shrink-0" />
                  <span className="truncate">{p.name}</span>
                </Link>
              ))}
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="border-t border-outline-variant/20 p-4">
          <div className="flex items-center gap-3 mb-3">
            {profile?.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.display_name ?? "avatar"}
                width={28}
                height={28}
                className="rounded-full shrink-0 border border-outline-variant/30"
              />
            ) : (
              <div className="w-7 h-7 rounded-full border border-outline-variant flex items-center justify-center shrink-0 bg-surface-container text-on-surface-variant text-[10px] font-mono font-semibold">
                {initials(profile?.display_name, profile?.email)}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-on-surface text-xs font-mono-label font-mono truncate">
                {profile?.display_name ?? "You"}
              </p>
              <p className="text-on-surface-variant/50 text-[9px] font-mono truncate">{profile?.email}</p>
            </div>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="w-full text-left px-3 py-1.5 rounded text-[10px] font-mono-label font-mono uppercase tracking-widest text-on-surface-variant/50 hover:text-on-surface hover:bg-surface-container transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-background">
        {children}
      </main>
    </div>
  );
}

function NavItem({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-6 py-2 text-xs font-mono-label font-mono text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
    >
      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{icon}</span>
      {label}
    </Link>
  );
}
