import { cn } from "@/lib/utils";
import Image from "next/image";
import type { ProjectMember, UserProfile } from "@/lib/types";

interface TeamOverviewProps {
  members: (ProjectMember & { user: UserProfile })[];
  currentUserId: string;
}

export function TeamOverview({
  members,
  currentUserId,
}: TeamOverviewProps) {
  if (!members || members.length === 0) {
    return (
      <div className="glass-panel p-6">
        <div className="mb-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant/40 mb-1">
            // TEAM OVERVIEW
          </p>
          <h2 className="text-on-surface text-lg font-semibold">Team</h2>
        </div>
        <div className="text-center py-8">
          <p className="text-on-surface-variant/50 text-[12px] font-mono">
            No team members
          </p>
        </div>
      </div>
    );
  }

  const activeMembers = members.filter(m => m.user.id !== currentUserId).length;
  const isCurrentUserInTeam = members.some(m => m.user.id === currentUserId);
  const totalMembers = isCurrentUserInTeam ? members.length : members.length + 1;

  return (
    <div className="glass-panel p-6">
      <div className="mb-4">
        <p className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant/40 mb-1">
          // TEAM OVERVIEW
        </p>
        <h2 className="text-on-surface text-lg font-semibold">Team</h2>
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between text-[12px] font-mono">
          <span>Team Members</span>
          <span className="text-on-surface font-medium">{totalMembers}</span>
        </div>
        <div className="flex items-center justify-between text-[11px] font-mono text-on-surface-variant/60">
          <span>Active</span>
          <span className="font-medium">{activeMembers}</span>
        </div>
      </div>

      <div className="space-y-3">
        {/* Current user first if in team */}
        {isCurrentUserInTeam && (
          <>
            <div className="flex items-start gap-3 p-3 bg-surface-container-low rounded border border-outline-variant/15 mb-3">
              <div className="flex-shrink-0">
                <Image
                  src={members.find(m => m.user.id === currentUserId)?.user.avatar_url ?? "/default-avatar.png"}
                  alt="Current User"
                  width={36}
                  height={36}
                  className="rounded-full border border-outline-variant/30"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-on-surface font-medium">
                  {members.find(m => m.user.id === currentUserId)?.user.display_name ?? "You"}
                </h4>
                <p className="text-on-surface-variant/60 text-[11px] font-mono">
                  {members.find(m => m.user.id === currentUserId)?.role === "owner" ? "Owner" : "Member"} • You
                </p>
              </div>
            </div>
          </>
        )}

        {/* Other team members */}
        <div className="space-y-2">
          {members
            .filter(m => m.user.id !== currentUserId)
            .map((member) => (
              <div key={member.user.id} className="flex items-start gap-3 p-3 bg-surface-container-low rounded border border-outline-variant/15">
                <div className="flex-shrink-0">
                  <Image
                    src={member.user.avatar_url ?? "/default-avatar.png"}
                    alt={member.user.display_name ?? member.user.email}
                    width={32}
                    height={32}
                    className="rounded-full border border-outline-variant/30"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-on-surface font-medium">{member.user.display_name ?? member.user.email}</h4>
                  <p className="text-on-surface-variant/60 text-[11px] font-mono">
                    {member.role === "owner" ? "Owner" : "Member"}
                  </p>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}