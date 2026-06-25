import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getAuthUser } from "@/lib/supabase/server";
import { getDashboardSidebarData } from "@/lib/data/dashboard-sidebar";
import { signOut } from "@/lib/actions";
import { initials } from "@/lib/utils";
import RequestsSection from "@/components/dashboard/RequestsSection";
import ThemeToggle from "@/components/dashboard/ThemeToggle";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getAuthUser();
  if (!user) redirect("/login");

  const { profile, projects, requests } = await getDashboardSidebarData(user.id);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="w-[270px] shrink-0 bg-surface-container-lowest border-r border-outline-variant/20 flex flex-col overflow-y-auto">
        {/* Brand */}
        <div className="px-6 py-5 border-b border-outline-variant/20">
          <Link href="/projects" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded border border-outline-variant flex items-center justify-center shrink-0 bg-surface-container-low">
              <span className="material-symbols-outlined text-on-surface" style={{ fontSize: 20 }}>hub</span>
            </div>
            <div>
              <p className="text-on-surface text-sm font-mono tracking-widest uppercase font-semibold">Synapse</p>
              <p className="text-on-surface-variant text-[11px] font-mono uppercase tracking-widest opacity-50">OS · v2.4.1</p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-5">
          <p className="px-6 mb-2 text-[11px] font-mono uppercase tracking-widest text-on-surface-variant/40">
            Navigation
          </p>
          <NavItem href="/projects" icon="folder_open" label="Projects" />
          <NavItem href="/ai-usage" icon="analytics" label="AI Usage" />

          <RequestsSection requests={requests} />

          {projects && projects.length > 0 && (
            <div className="mt-7">
              <p className="px-6 mb-2 text-[11px] font-mono uppercase tracking-widest text-on-surface-variant/40">
                Projects
              </p>
              {projects.map((p) => (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}/tasks`}
                  className="flex items-center gap-3 px-6 py-2.5 text-sm font-mono text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors truncate"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-outline/60 shrink-0" />
                  <span className="truncate">{p.name}</span>
                </Link>
              ))}
            </div>
          )}
        </nav>

        {/* Footer */}
        <div className="border-t border-outline-variant/20 p-5">
          <div className="mb-2">
            <ThemeToggle />
          </div>
          <div className="flex items-center gap-3 mb-4">
            {profile?.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.display_name ?? "avatar"}
                width={36}
                height={36}
                className="rounded-full shrink-0 border border-outline-variant/30"
              />
            ) : (
              <div className="w-9 h-9 rounded-full border border-outline-variant flex items-center justify-center shrink-0 bg-surface-container text-on-surface-variant text-xs font-mono font-semibold">
                {initials(profile?.display_name, profile?.email)}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-on-surface text-sm font-mono truncate">
                {profile?.display_name ?? "You"}
              </p>
              <p className="text-on-surface-variant/50 text-xs font-mono truncate">{profile?.email}</p>
            </div>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="w-full text-left px-4 py-2 rounded text-[11px] font-mono uppercase tracking-widest text-on-surface-variant/50 hover:text-on-surface hover:bg-surface-container transition-colors"
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
      className="flex items-center gap-4 px-6 py-3 text-sm font-mono text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors"
    >
      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{icon}</span>
      {label}
    </Link>
  );
}
