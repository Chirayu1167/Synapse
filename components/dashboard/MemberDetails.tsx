'use client';

import { cn } from "@/lib/utils";
import Image from "next/image";
import { useState } from "react";
import type { ProjectMember } from "@/lib/types";

interface MemberDetailsProps {
  selectedMemberId: string | null;
  members: Array<{ user_id: string; role: string; user: any }>;
}

export function MemberDetails({
  selectedMemberId,
  members,
}: MemberDetailsProps) {
  if (!selectedMemberId || !members) {
    return (
      <div className="glass-panel p-6">
        <div className="mb-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant/40 mb-1">
            // MEMBER DETAILS
          </p>
          <h2 className="text-on-surface text-lg font-semibold">Member Details</h2>
        </div>
        <div className="text-center py-8">
          <p className="text-on-surface-variant/50 text-[12px] font-mono">
            Select a team member to view details
          </p>
        </div>
      </div>
    );
  }

  const member = members.find(m => m.user_id === selectedMemberId);
  if (!member) {
    return (
      <div className="glass-panel p-6">
        <div className="mb-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant/40 mb-1">
            // MEMBER DETAILS
          </p>
          <h2 className="text-on-surface text-lg font-semibold">Member Details</h2>
        </div>
        <div className="text-center py-8">
          <p className="text-on-surface-variant/50 text-[12px] font-mono">
            Member not found
          </p>
        </div>
      </div>
    );
  }

  const isCurrentUser = member.user?.id === member.user_id;

  return (
    <div className="glass-panel p-6">
      <div className="mb-4">
        <p className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant/40 mb-1">
          // MEMBER DETAILS
        </p>
        <h2 className="text-on-surface text-lg font-semibold">
          {member.user?.display_name ?? member.user?.email ?? "Unnamed Member"}
        </h2>
      </div>

      <div className="space-y-4">
        {/* Member info */}
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0 w-16 h-16 rounded-full border border-outline-variant/30">
            {member.user.avatar_url ? (
              <Image
                src={member.user.avatar_url}
                alt={`${member.user?.display_name ?? member.user?.email ?? ''} avatar`}
                width={48}
                height={48}
                className="rounded-full"
              />
            ) : (
              <div className="flex items-center justify-center text-on-surface-variant/60 font-mono text-[18px] font-bold">
                {((member.user?.display_name ?? member.user?.email ?? '')?.charAt(0) ?? '?').toUpperCase()}
              </div>
            )}
          </div>
          <div className="ml-4">
            <h3 className="text-on-surface font-medium">
              {member.user?.display_name ?? member.user?.email ?? "Unnamed Member"}
            </h3>
            <p className="text-on-surface-variant/60 text-[12px] font-mono">
              {member.role === "owner" ? "Owner" : "Member"}
            </p>
            {member.user_id === member.user?.id && (
              <p className="text-on-success text-[11px] font-mono mt-1">
                (You)
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-3">
          <div className="border-t border-outline-variant/10 pt-4">
            <p className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant/40 mb-2">
              Activity Summary
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-[12px] font-mono">
                <span>Tasks Assigned</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between text-[12px] font-mono">
                <span>Completed Tasks</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between text-[12px] font-mono">
                <span>Last Active</span>
                <span className="text-on-surface-variant/60">Today</span>
              </div>
            </div>
          </div>
        </div>

        {/* Role management (for owners) */}
        {/* Would be implemented based on current user permissions */}
      </div>
    </div>
  );
}