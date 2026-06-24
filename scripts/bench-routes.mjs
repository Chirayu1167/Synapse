/**
 * Warm-route benchmark for authenticated dashboard pages.
 *
 * Usage:
 *   node scripts/bench-routes.mjs [projectId]
 *
 * Auth (pick one):
 *   BENCH_COOKIE="sb-...=..." node scripts/bench-routes.mjs <projectId>
 *   BENCH_EMAIL=... BENCH_PASSWORD=... node scripts/bench-routes.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

const BASE = process.env.BENCH_BASE_URL ?? "http://localhost:3000";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const PROJECT_ID = process.argv[2];
const BENCH_COOKIE = process.env.BENCH_COOKIE;
const BENCH_EMAIL = process.env.BENCH_EMAIL;
const BENCH_PASSWORD = process.env.BENCH_PASSWORD;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

function createCookieJarClient() {
  const jar = new Map();
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return [...jar.entries()].map(([name, value]) => ({ name, value }));
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          if (value) jar.set(name, value);
          else jar.delete(name);
        }
      },
    },
  });
  return {
    supabase,
    cookieHeader: () =>
      [...jar.entries()].map(([name, value]) => `${name}=${value}`).join("; "),
  };
}

async function resolveAuth() {
  if (BENCH_COOKIE) {
    if (!PROJECT_ID) {
      throw new Error("BENCH_COOKIE mode requires projectId argument");
    }
    return { cookie: BENCH_COOKIE, projectId: PROJECT_ID, userId: "(cookie)" };
  }

  if (BENCH_EMAIL && BENCH_PASSWORD) {
    const { supabase, cookieHeader } = createCookieJarClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: BENCH_EMAIL,
      password: BENCH_PASSWORD,
    });
    if (error || !data.session) {
      throw new Error(`Sign-in failed: ${error?.message ?? "no session"}`);
    }

    let projectId = PROJECT_ID;
    if (!projectId) {
      const authed = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: `Bearer ${data.session.access_token}` } },
      });
      const { data: memberships } = await authed
        .from("project_members")
        .select("project_id")
        .eq("user_id", data.session.user.id)
        .limit(1);
      projectId = memberships?.[0]?.project_id;
      if (!projectId) throw new Error("No project found for user; pass projectId argument");
    }

    return {
      cookie: cookieHeader(),
      projectId,
      userId: data.session.user.id,
    };
  }

  throw new Error(
    "Set BENCH_COOKIE with projectId, or BENCH_EMAIL + BENCH_PASSWORD (+ optional projectId)"
  );
}

async function timeRoute(path, cookie) {
  const start = performance.now();
  const res = await fetch(`${BASE}${path}`, {
    headers: { Cookie: cookie, Accept: "text/html" },
    redirect: "manual",
  });
  const ms = performance.now() - start;
  return { path, ms, status: res.status };
}

async function warmAndBench(label, path, cookie, warmup = 3, samples = 5) {
  for (let i = 0; i < warmup; i++) {
    await fetch(`${BASE}${path}`, { headers: { Cookie: cookie, Accept: "text/html" } });
  }
  const times = [];
  for (let i = 0; i < samples; i++) {
    const { ms, status } = await timeRoute(path, cookie);
    if (status >= 400) throw new Error(`${path} returned ${status}`);
    times.push(ms);
  }
  times.sort((a, b) => a - b);
  const median = times[Math.floor(times.length / 2)];
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  return { label, path, median, avg, min: times[0], max: times[times.length - 1], samples: times };
}

async function main() {
  console.log(`Benchmark base: ${BASE}`);
  const { cookie, projectId, userId } = await resolveAuth();
  console.log(`Authenticated as ${userId}`);
  console.log(`Project id: ${projectId}\n`);

  await fetch(`${BASE}/projects`, { headers: { Cookie: cookie, Accept: "text/html" } });

  const routes = [
    { label: "projects list", path: "/projects" },
    { label: "tasks board", path: `/projects/${projectId}/tasks` },
    { label: "todos", path: `/projects/${projectId}/todos` },
  ];

  for (const route of routes) {
    const result = await warmAndBench(route.label, route.path, cookie);
    console.log(
      `${result.label} (${result.path})\n` +
        `  median: ${result.median.toFixed(0)}ms  avg: ${result.avg.toFixed(0)}ms  ` +
        `min: ${result.min.toFixed(0)}ms  max: ${result.max.toFixed(0)}ms\n` +
        `  samples: ${result.samples.map((t) => t.toFixed(0)).join(", ")}ms\n`
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
