import { cn, initials as initialsUtil } from "@/lib/utils";
import Image from "next/image";
import type { ActivityLog } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";

interface RecentActivityFeedProps {
  activity: ActivityLog[];
  limit?: number;
}

export function RecentActivityFeed({
  activity,
  limit = 5,
}: RecentActivityFeedProps) {
  if (!activity || activity.length === 0) {
    return (
      <div className="glass-panel p-6">
        <div className="mb-4">
          <p className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant/40 mb-1">
            // RECENT ACTIVITY
          </p>
          <h2 className="text-on-surface text-lg font-semibold">Activity Feed</h2>
        </div>
        <div className="text-center py-8">
          <p className="text-on-surface-variant/50 text-[12px] font-mono">
            No recent activity
          </p>
        </div>
      </div>
    );
  }

  const recentActivity = activity.slice(0, limit);

  return (
    <div className="glass-panel p-6">
      <div className="mb-4">
        <p className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant/40 mb-1">
          // RECENT ACTIVITY
        </p>
        <h2 className="text-on-surface text-lg font-semibold">Activity Feed</h2>
      </div>

      <div className="space-y-4">
        {recentActivity.map((activity) => (
          <div key={activity.id} className="flex items-start gap-4 p-4 bg-surface-container-low rounded border border-outline-variant/15">
            {/* Actor avatar */}
            <div className="flex-shrink-0 w-9 h-9 flex-shrink-0 flex items-center justify-center">
              {activity.actor?.avatar_url ? (
                <Image
                  src={activity.actor.avatar_url}
                  alt={activity.actor.display_name ?? ""}
                  width={20}
                  height={20}
                  className="rounded-full ring-2 ring-background"
                />
              ) : (
                <div className="w-[20px] h-[20px] rounded-full border border-outline-variant bg-surface-container flex items-center justify-center ring-2 ring-background">
                  <span className="text-on-surface-variant text-[8px] font-mono font-semibold">
                    {initialsUtil(activity.actor?.display_name, activity.actor?.email)}
                  </span>
                </div>
              )}
            </div>

            {/* Activity content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-on-surface leading-snug mb-1">
                <span className="font-medium">
                  {activity.actor?.display_name ?? activity.actor?.email ?? "Someone"}
                </span>{" "}
                <span className="text-on-surface-variant">{activity.action}</span>
                {activity.entity_title && (
                  <>
                    {" "}
                    <span className="font-medium text-on-surface">
                      {activity.entity_title.length > 50
                        ? `${activity.entity_title.slice(0, 50)}…`
                        : activity.entity_title}
                    </span>
                  </>
                )}
              </p>
              <p className="text-[10px] font-mono text-on-surface-variant/40 mt-0.5 uppercase tracking-widest">
                {formatRelativeTime(activity.created_at)}
              </p>
            </div>

            {/* Entity type icon */}
            {activity.entity_type && (
              <div className="shrink-0 mt-2 flex items-center">
                <span className="material-symbols-outlined text-on-surface-variant/20" style={{ fontSize: 14 }}>
                  {{
                    task: "task_alt",
                    todo: "checklist",
                    project: "hub",
                    context: "link",
                  }[activity.entity_type] ?? "circle"}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

