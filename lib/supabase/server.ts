import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";

export const createClient = cache(async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component — cookies will be set in middleware
          }
        },
      },
    }
  );
});

/** Read session from cookies — JWT is validated in middleware via getUser(). */
export const getAuthUser = cache(async () => {
  const supabase = await createClient();
  if (process.env.BENCH_TRACK_SESSION === "1") {
    console.warn("[getAuthUser] getSession() read");
  }
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return { supabase, user: session?.user ?? null };
});
