'use client';

import { cn } from "@/lib/utils";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ProjectMember } from "@/lib/types";

interface MemberListProps {
  projectId: string;
  members: Array<{ user_id: string; role: string; user: any }>;
  currentUserId: string;
  onMemberSelect?: (memberId: string) => void;
}

export function MemberList({
  projectId,
  members,
  currentUserId,
  onMemberSelect,
}: MemberListProps) {
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  // Handle member selection
  const handleSelect = (memberId: string) => {
    setSelectedMemberId(memberId);
    onMemberSelect?.(memberId);
  };

  // Sort members: owners first, then alphabetically by name
  const sortedMembers = [...(members || [])].sort((a, b) => {
    if (a.role === "owner" && b.role !== "owner") return -1;
    if (a.role !== "owner" && b.role === "owner") return 1;
    const nameA = a.user.display_name?.toLowerCase() || a.user.email?.toLowerCase() || "";
    const nameB = b.user.display_name?.toLowerCase() || b.user.email?.toLowerCase() || "";
    return nameA.localeCompare(nameB);
  });

  return (
    <div className="glass-panel p-6">
      <div className="mb-4">
        <p className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant/40 mb-1">
          // TEAM MEMBERS
        </p>
        <h2 className="text-on-surface text-lg font-semibold">Team Members</h2>
      </div>

      <div className="space-y-3">
        {/* Current user first if in team */}
        {members && members.some(m => m.user_id === currentUserId) && (
          <>
            <div
              key={currentUserId}
              className={cn(
                "flex items-start gap-3 p-3 bg-surface-container-low rounded border border-outline-variant/15",
                selectedMemberId === currentUserId ? "border-border-success/30 bg-border-success/10" : ""
              )}
              onClick={() => handleSelect(currentUserId)}
            >
              <div className="flex-shrink-0">
                <Image
                  src={(members.find(m => m.user_id === currentUserId)?.user.avatar_url ?? "/default-avatar.png")}
                  alt="Current User"
                  width={36}
                  height={36}
                  className="rounded-full border border-outline-variant/30"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-on-surface font-medium">
                  {(members.find(m => m.user_id === currentUserId)?.user.display_name ?? "You")}
                </h4>
                <p className="text-on-surface-variant/60 text-[11px] font-mono">
                  {(members.find(m => m.user_id === currentUserId)?.role === "owner" ? "Owner" : "Member")} • You
                </p>
              </div>
            </div>
          </>
        )}

        {/* Other team members */}
        <div className="space-y-2">
          {members
            .filter(m => m.user_id !== currentUserId)
            .map((member) => (
              <div
                key={member.user_id}
                className={cn(
                  "flex items-start gap-3 p-3 bg-surface-container-low rounded border border-outline-variant/15",
                  selectedMemberId === member.user_id ? "border-border-success/30 bg-border-success/10" : ""
                )}
                onClick={() => handleSelect(member.user_id)}
              >
                <div className="flex-shrink-0">
                  <Image
                    src={member.user.avatar_url ?? "/default-avatar.png"}
                    alt={member.user.display_name ?? member.user.email ?? ''}
                    width={32}
                    height={32}
                    className="rounded-full border border-outline-variant/30"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-on-surface font-medium">{member.user.display_name ?? member.user.email ?? ''}</h4>
                  <p className="text-on-surface-variant/60 text-[11px] font-mono">
                    {member.role === "owner" ? "Owner" : "Member"}
                  </p>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Action buttons for selected member */}
      {selectedMemberId && members && (
        <div className="mt-4 pt-3 border-t border-outline-variant/10">
          <p className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant/40 mb-2">
            Actions
          </p>
          <div className="space-y-2">
            {/* View details would be handled by navigation or modal */}
            <button
              onClick={() => {
                // Navigate to member details or show modal
                console.log("View details for:", selectedMemberId);
              }}
              className="w-full text-left px-3 py-2 btn-ghost text-xs"
            >
              View Details
            </button>

            {/* Remove member (only for owners) */}
            {members.some(m => m.user_id === currentUserId && m.role === "owner") && (
              <button
                onClick={() => {
                  // Handle remove member logic
                  console.log("Remove member:", selectedMemberId);
                }}
                className="w-full text-left px-3 py-2 btn-destructive text-xs"
                disabled={
                  // Prevent removing self or last owner
                  selectedMemberId === currentUserId ||
                  (members.filter(m => m.role === "owner").length === 1 &&
                   members.find(m => m.user_id === selectedMemberId)?.role === "owner")
                }
              >
                Remove from Team
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}