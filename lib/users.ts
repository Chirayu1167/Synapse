import type { SupabaseClient, User } from "@supabase/supabase-js";

export function profileFromAuthUser(user: User) {
  const metadata = user.user_metadata ?? {};
  const email = user.email ?? "";
  const displayName =
    typeof metadata.full_name === "string"
      ? metadata.full_name
      : typeof metadata.name === "string"
        ? metadata.name
        : email
          ? email.split("@")[0]
          : null;
  const avatarUrl =
    typeof metadata.avatar_url === "string" ? metadata.avatar_url : null;

  return {
    id: user.id,
    email,
    display_name: displayName,
    avatar_url: avatarUrl,
  };
}

export async function ensureUserProfile(supabase: SupabaseClient, user: User) {
  const profile = profileFromAuthUser(user);
  if (!profile.email) throw new Error("Authenticated user is missing an email address");

  const { error } = await supabase.from("users").upsert(profile, {
    onConflict: "id",
  });

  if (error) throw error;
  return profile;
}
