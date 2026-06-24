import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase/server";
import { formatRelativeTime, formatDateTime, initials } from "@/lib/utils";
import Image from "next/image";

export default async function ActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;
  const { supabase, user } = await getAuthUser();
  if (!user) redirect("/login");

  const { data: entries } = await supabase
    .from("activity_log")
    .select("*, actor:users!activity_log_actor_id_fkey(id, display_name, email, avatar_url)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(200);

  const entityIcon: Record<string, string> = {
    task: "task_alt",
    todo: "checklist",
    project: "hub",
    context: "link",
  };

  return (
    <div className="p-4">
      <div className="mb-6">
        <p className="text-[10px] font-mono uppercase tracking-widest text-on-surface-variant/40 mb-1">// ACTIVITY LOG</p>
        <p className="text-mono-label font-mono-label text-on-surface-variant">
          {entries?.length ?? 0} events, newest first
        </p>
      </div>

      {!entries?.length ? (
        <div className="glass-panel p-10 text-center">
          <span className="material-symbols-outlined text-on-surface-variant/30 block mb-3" style={{ fontSize: 32 }}>
            timeline
          </span>
          <p className="text-mono-label font-mono-label text-on-surface-variant/50">
            No activity yet. Actions on tasks, todos, and context will appear here.
          </p>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute left-[17px] top-0 bottom-0 w-px bg-outline-variant/20" />
          <div className="space-y-0">
            {entries.map((entry: any) => (
              <div key={entry.id} className="relative flex gap-4 pb-4">
                <div className="relative z-10 shrink-0 w-9 flex justify-center pt-0.5">
                  {entry.actor?.avatar_url ? (
                    <Image
                      src={entry.actor.avatar_url}
                      alt={entry.actor.display_name ?? ""}
                      width={20}
                      height={20}
                      className="rounded-full ring-2 ring-background"
                    />
                  ) : (
                    <div className="w-[20px] h-[20px] rounded-full border border-outline-variant bg-surface-container flex items-center justify-center ring-2 ring-background">
                      <span className="text-on-surface-variant text-[8px] font-mono font-semibold">
                        {initials(entry.actor?.display_name, entry.actor?.email)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-sm text-on-surface leading-snug">
                    <span className="font-medium">
                      {entry.actor?.display_name ?? entry.actor?.email ?? "Someone"}
                    </span>{" "}
                    <span className="text-on-surface-variant">{entry.action}</span>
                    {entry.entity_title && (
                      <>
                        {" "}
                        <span className="font-medium text-on-surface">
                          {entry.entity_title.length > 60
                            ? entry.entity_title.slice(0, 60) + "…"
                            : entry.entity_title}
                        </span>
                      </>
                    )}
                  </p>
                  <p
                    className="text-[10px] font-mono text-on-surface-variant/40 mt-0.5 uppercase tracking-widest"
                    title={formatDateTime(entry.created_at)}
                  >
                    {formatRelativeTime(entry.created_at)}
                  </p>
                </div>

                {entry.entity_type && (
                  <div className="shrink-0 mt-1">
                    <span className="material-symbols-outlined text-on-surface-variant/20" style={{ fontSize: 14 }}>
                      {entityIcon[entry.entity_type] ?? "circle"}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
