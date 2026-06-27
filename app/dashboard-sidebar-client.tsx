"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { profileFromAuthUser } from "@/lib/users";
import RequestsSection from "@/components/dashboard/RequestsSection";
import ThemeToggle from "@/components/dashboard/ThemeToggle";
import { initials } from "@/lib/utils";

interface SidebarProps {
  initialProfile: any;
  initialProjects: any[];
  initialRequests: any[];
  initialUser: any; // For fallback display
}

export default function SidebarClient({
  initialProfile,
  initialProjects,
  initialRequests,
  initialUser
}: SidebarProps) {
  const [profile, setProfile] = useState<any>(initialProfile ?? null);
  const [projects, setProjects] = useState<any[]>(initialProjects ?? []);
  const [requests, setRequests] = useState<any[]>(initialRequests ?? []);

  // Fetch initial data and set up periodic refresh
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/sidebar");
        if (!res.ok) {
          // If we can't fetch fresh data, we'll keep existing data
          return;
        }

        const data = await res.json();
        setProfile(data.profile ?? null);
        setProjects(data.projects ?? []);
        setRequests(data.requests ?? []);
      } catch (error) {
        console.error("Error fetching sidebar data:", error);
        // On error, we keep the existing data
      }
    };

    // Fetch initial data
    fetchData();

    // Set up interval to refresh every 10 seconds
    const intervalId = setInterval(fetchData, 10000);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, []);

  const displayProfile = profile ?? (initialUser ? profileFromAuthUser(initialUser) : null);

  // Fallback if we still don't have a profile
  const fallbackProfile = displayProfile ?? {
    display_name: "User",
    email: "user@example.com",
    avatar_url: null,
  };

  return (
    <>
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
        <Link href="/projects" className="flex items-center gap-4 px-6 py-3 text-sm font-mono text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors">
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>folder_open</span>
          Projects
        </Link>
        <Link href="/ai-usage" className="flex items-center gap-4 px-6 py-3 text-sm font-mono text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors">
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>analytics</span>
          AI Usage
        </Link>

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
          {fallbackProfile.avatar_url ? (
            <Image
              src={fallbackProfile.avatar_url}
              alt={fallbackProfile.display_name ?? "avatar"}
              width={36}
              height={36}
              className="rounded-full shrink-0 border border-outline-variant/30"
            />
          ) : (
            <div className="w-9 h-9 rounded-full border border-outline-variant flex items-center justify-center shrink-0 bg-surface-container text-on-surface-variant text-xs font-mono font-semibold">
              {initials(fallbackProfile.display_name, fallbackProfile.email)}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-on-surface text-sm font-mono truncate">
              {fallbackProfile.display_name ?? "You"}
            </p>
            <p className="text-on-surface-variant/50 text-xs font-mono truncate">{fallbackProfile.email}</p>
          </div>
        </div>
        <form method="POST" action="/api/signout">
          <button
            type="submit"
            className="w-full text-left px-4 py-2 rounded text-[11px] font-mono uppercase tracking-widest text-on-surface-variant/50 hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            Sign out
          </button>
        </form>
      </div>
    </>
  );
}