'use client';

import { useState } from "react";
import { MemberList } from "./MemberList";
import { MemberDetails } from "./MemberDetails";

interface TeamMembersPanelProps {
  projectId: string;
  members: Array<{ user_id: string; role: string; user: any }>;
  tasks: Array<{
    id: string;
    title: string;
    status: "unassigned" | "todo" | "in_progress" | "testing" | "done";
    owner_id: string | null;
    created_at: string;
    updated_at: string;
  }>;
  currentUserId: string;
}

export default function TeamMembersPanel({
  projectId,
  members,
  tasks,
  currentUserId,
}: TeamMembersPanelProps) {
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <MemberList
        projectId={projectId}
        members={members}
        tasks={tasks}
        currentUserId={currentUserId}
        onMemberSelect={setSelectedMemberId}
      />

      <MemberDetails
        selectedMemberId={selectedMemberId}
        members={members}
        tasks={tasks}
        currentUserId={currentUserId}
      />
    </div>
  );
}
