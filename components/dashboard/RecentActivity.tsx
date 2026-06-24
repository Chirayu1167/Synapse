import { cn } from "@/lib/utils";
import type { ActivityLog } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";

interface RecentActivityProps {
  activities: ActivityLog[];
  limit?: number;
}

export function RecentActivity({
  activities,
  limit = 5,
}: RecentActivityProps) {
  // Sort by date descending and limit
  const recentActivities = [...activities]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);

  return (
    <div className="glass-panel p-6">
      <div className="mb-4">
        <p className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant/40 mb-1">
          // RECENT ACTIVITY
        </p>
        <h2 className="text-on-surface text-lg font-semibold">Latest Updates</h2>
      </div>

      {recentActivities.length > 0 ? (
        <div className="space-y-3">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 p-3 bg-surface-container-low rounded border border-outline-variant/15">
              {/* Activity indicator dot */}
              <div className="flex-shrink-0 w-2 h-2 rounded bg-on-surface/70 mt-2.5" />

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-1">
                  <h4 className="text-on-surface font-medium">{activity.actor?.display_name ?? activity.actor?.email ?? "Someone"}</h4>
                  <p className="text-on-surface-variant/40 text-[10px] font-mono uppercase tracking-widest">
                    {formatRelativeTime(activity.created_at)}
                  </p>
                </div>

                <p className="text-on-surface leading-snug mb-1">
                  <span className="font-medium">{activity.actor?.display_name ?? activity.actor?.email ?? "Someone"}</span>{" "}
                  <span className="text-on-surface-variant">{activity.action}</span>
                  {activity.entity_title && (
                    <>
                      {" "}
                      <span className="font-medium text-on-surface">
                        {activity.entity_title.length > 50
                          ? `${activity.entity_title.slice(0, 50)}...`
                          : activity.entity_title}
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-on-surface-variant/50 text-[12px] font-mono">
            No recent activity
          </p>
        </div>
      )}
    </div>
  );
}