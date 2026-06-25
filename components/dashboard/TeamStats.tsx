import { cn } from "@/lib/utils";
import type { Project } from "@/lib/types";

interface TeamStatsProps {
  project: Project;
  members: Array<{ user_id: string; role: string; user: any }>;
  tasks: any[]; // Task type
}

export function TeamStats({
  project,
  members,
  tasks,
}: TeamStatsProps) {
  // Calculate stats
  const totalMembers = members.length;
  const owners = members.filter(m => m.role === "owner").length;
  const regularMembers = totalMembers - owners;

  // Task stats by member (simplified)
  const memberTaskCounts = members.map(member => {
    const assignedTasks = tasks.filter(t => t.owner_id === member.user_id).length;
    const completedTasks = tasks.filter(t => t.owner_id === member.user_id && t.status === "done").length;
    return {
      ...member,
      assignedTasks,
      completedTasks,
      completionRate: assignedTasks > 0 ? Math.round((completedTasks / assignedTasks) * 100) : 0
    };
  });

  // Overall team stats
  const totalAssignedTasks = tasks.filter(t => t.owner_id !== null).length;
  const totalCompletedTasks = tasks.filter(t => t.status === "done").length;
  const teamCompletionRate = totalAssignedTasks > 0 ? Math.round((totalCompletedTasks / totalAssignedTasks) * 100) : 0;

  return (
    <div className="glass-panel p-6">
      <div className="mb-4">
        <h2 className="text-on-surface text-lg font-semibold mb-2">
          Team Statistics
        </h2>
        <p className="text-on-surface-variant/50 text-[12px] font-mono">
          Overview of team performance and composition
        </p>
      </div>

      <div className="space-y-5">
        {/* Team Composition */}
        <div className="space-y-3">
          <h3 className="text-on-surface text-lg font-semibold mb-2">
            Team Composition
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="glass-panel p-4">
              <div className="text-3xl font-bold text-on-surface">{totalMembers}</div>
              <p className="text-on-surface-variant/60 text-[12px] font-mono">Total Members</p>
            </div>
            <div className="glass-panel p-4">
              <div className="text-3xl font-bold text-on-success">{owners}</div>
              <p className="text-on-surface-variant/60 text-[12px] font-mono">Owners</p>
            </div>
            <div className="glass-panel p-4">
              <div className="text-3xl font-bold text-on-surface">{regularMembers}</div>
              <p className="text-on-surface-variant/60 text-[12px] font-mono">Members</p>
            </div>
          </div>
        </div>

        {/* Task Performance */}
        <div className="space-y-3">
          <h3 className="text-on-surface text-lg font-semibold mb-2">
            Task Performance
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-panel p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[12px] font-mono mb-2">
                  <span>Total Assigned Tasks</span>
                  <span className="text-on-surface font-medium">{totalAssignedTasks}</span>
                </div>
                <div className="flex items-center justify-between text-[12px] font-mono mb-2">
                  <span>Completed Tasks</span>
                  <span className="text-on-surface font-medium">{totalCompletedTasks}</span>
                </div>
                <div className="flex items-center justify-between text-[12px] font-mono">
                  <span>Team Completion Rate</span>
                  <span className={cn(
                    "text-on-surface font-medium",
                    teamCompletionRate >= 80 ? "text-on-success" :
                    teamCompletionRate >= 60 ? "text-on-warning" : "text-on-error"
                  )}>
                    {teamCompletionRate}%
                  </span>
                </div>
                <div className="h-1.5 bg-outline-variant/20 rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full bg-on-surface/70 rounded-full transition-all duration-300"
                    style={{ width: `${teamCompletionRate}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="glass-panel p-4">
              <h3 className="text-on-surface text-lg font-semibold mb-3">
                Member Contribution
              </h3>
              {memberTaskCounts.length > 0 ? (
                <div className="space-y-2">
                  {memberTaskCounts.map((member) => (
                    <div key={member.user_id} className="flex items-center justify-between px-3 py-2 bg-surface-container-low rounded border border-outline-variant/15">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center border border-outline-variant/20">
                          <span className="text-[10px] font-mono">
                            {member.user?.display_name?.charAt(0) ?? member.user?.email?.charAt(0) ?? "?"}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-on-surface font-medium">{member.user?.display_name ?? member.user?.email ?? ''}</h4>
                          <p className="text-on-surface-variant/60 text-[11px] font-mono">
                            {member.assignedTasks} assigned tasks
                          </p>
                        </div>
                        <span className={cn(
                          "text-on-surface font-medium",
                          member.completionRate >= 80 ? "text-on-success" :
                          member.completionRate >= 60 ? "text-on-warning" : "text-on-error"
                        )}>
                          {member.completionRate}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-on-surface-variant/50 text-[12px] font-mono">
                    No task data available
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Team Activity */}
        <div className="space-y-3">
          <h3 className="text-on-surface text-lg font-semibold mb-2">
            Recent Team Activity
          </h3>
          <div className="text-center py-6">
            <p className="text-on-surface-variant/50 text-[12px] font-mono">
              Team activity feed would be displayed here
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}