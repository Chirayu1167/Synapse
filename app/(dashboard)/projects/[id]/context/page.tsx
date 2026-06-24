import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase/server";
import { formatDate, initials } from "@/lib/utils";

export default async function ContextPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = await params;
  const { supabase, user } = await getAuthUser();
  if (!user) redirect("/login");

  const { data: contexts } = await supabase
    .from("contexts")
    .select("*, creator:users!contexts_created_by_fkey(id, display_name, email, avatar_url)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      {contexts?.map((context) => (
        <div key={context.id} className="border rounded-lg border-outline-variant/20 p-6">
          <div className="flex items-start gap-4">
            <div className="h-9 w-9 flex-shrink-0 rounded border border-outline-variant/30 flex items-center justify-center">
              {context.creator?.avatar_url ? (
                <img
                  src={context.creator.avatar_url}
                  alt={context.creator.display_name ?? ""}
                  width={36}
                  height={36}
                  className="rounded-full"
                />
              ) : (
                <span className="text-on-surface-variant text-xs font-mono font-semibold">
                  {initials(context.creator?.display_name, context.creator?.email)}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-on-surface/80 font-semibold">{context.title}</p>
              <p className="text-on-surface-variant text-sm">
                {context.description ?? ""}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3 text-xs">
            <span className="text-on-surface-variant/40">
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                person
              </span>
              {" "}
              {context.creator?.display_name ?? "Unknown"}
            </span>
            <span className="text-on-surface-variant/40">
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                update
              </span>
              {" "}
              {formatDate(context.created_at)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
