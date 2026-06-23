import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AiUsageTracker from "@/components/AiUsageTracker";

export default async function AiUsagePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: entries } = await supabase
    .from("ai_usage_entries")
    .select("*")
    .eq("user_id", user.id)
    .order("tool_name");

  return <AiUsageTracker entries={entries ?? []} />;
}
