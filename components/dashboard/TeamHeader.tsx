import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/lib/types";

interface TeamHeaderProps {
  project: Project;
  userId: string;
  members: Array<{ user_id: string; role: string; user: any }>;
}

export function TeamHeader({
  project,
  userId,
  members,
}: TeamHeaderProps) {
  const isOwner = members.some(m => m.user_id === project.owner_id && m.role === "owner");
  const currentUserRole = members.find(m => m.user_id === userId)?.role;
  const isCurrentUserOwner = currentUserRole === "owner";

  return (
    <div className="glass-panel p-6 mb-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-on-surface">
          {project.name} Team
        </h1>
        {project.description && (
          <p className="text-on-surface-variant/70 text-[14px] font-mono mt-1">
            {project.description}
          </p>
        )}
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1 md:flex-none">
          <div className="flex items-center gap-4">
            {/* Team avatar - using first letters of project name */}
            <div className="w-12 h-12 rounded-full bg-outline-variant/30 flex items-center justify-center">
              <span className="text-on-surface-variant/60 font-mono font-bold text-[18px]">
                {project.name.charAt(0)}
              </span>
            </div>
            <div>
              <h2 className="text-on-surface text-xl font-semibold">{project.name}</h2>
              <p className="text-on-surface-variant/60 text-[13px] font-mono">
                {members?.length ?? 0} team member{members?.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isCurrentUserOwner && (
            <Link
              href={`/projects/${project.id}/settings`}
              className="btn-ghost px-4 py-2"
            >
              Manage Team
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}