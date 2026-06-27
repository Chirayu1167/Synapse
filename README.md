# Synapse

A lightweight project tracker for solo developers and small teams using multiple AI tools (Claude, ChatGPT, Cursor, Gemini, etc.). Intentionally simpler than GitHub Projects — projects, a per-project dashboard, a 5-status task board, todos, team/membership management, activity log, AI usage tracking, and context/session links.

---

## Stack

- **Next.js 15** (App Router, TypeScript)
- **Supabase** — Postgres, Auth (Google OAuth), Row Level Security
- **Tailwind CSS** — clean, minimal utility styling

---

## Setup

### 1. Supabase project

1. Create a new project at [supabase.com](https://supabase.com).
2. In the **SQL Editor**, run the entire contents of [`schema.sql`](./schema.sql). This creates all tables, indexes, RLS policies, triggers, and seeds the default AI tools.
3. In **Authentication → Providers**, enable **Google** and configure your OAuth credentials (you'll need a Google Cloud OAuth 2.0 client ID and secret).
4. In **Authentication → URL Configuration**, add your site URL and redirect URLs:
   - Site URL: `http://localhost:3000` (dev) / your production URL
   - Redirect URL: `http://localhost:3000/auth/callback`

### 2. Environment variables

Copy `env.local.example` to `.env.local` and fill in your values:

```bash
cp env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Find these in your Supabase dashboard under **Settings → API**.

You may also want to set `NEXT_PUBLIC_SITE_URL` in production for the OAuth redirect:

```env
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

Two more variables are optional and dev-only (warm-route timing — see [Dev tooling](#dev-tooling)): `ROUTE_BENCH` and `BENCH_TRACK_SESSION`. Leave them unset in production.

### 3. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to `/login`.

> **⚠️ Schema is currently behind the code.** The membership flow described below (invite → accept → owner approval) reads/writes `project_members.status`, `requested_at`, and `approved_at`, and `lib/types.ts` declares them — but `schema.sql` does not create those columns. Running the app against a fresh `schema.sql` import will throw on any invite/accept/approve action. Add the missing columns (e.g. `status text not null default 'active' check (status in ('invited','pending_approval','active'))`, `requested_at timestamptz`, `approved_at timestamptz`) and adjust the RLS policies/`is_project_member()` helper to filter on `status = 'active'` before relying on this flow.

---

## Features

### Authentication
- Google Sign-In via Supabase Auth
- User profile auto-created on first login (name + avatar from Google)
- Pending project invites are automatically resolved when an invited user signs up

### Projects
- Create projects with name + optional description
- Invite collaborators by email — existing users get an `invited` membership row they must accept; the project owner then approves the request before it becomes active (`invited → pending_approval → active`); emails with no account yet get a `pending_invites` row resolved automatically on signup
- Project list shows task completion progress per project

### Project Dashboard
- Per-project overview tab (`/projects/[id]/dashboard`), separate from the task board
- Progress card, task-status breakdown, a personal "assigned to me" section, upcoming deadlines (from task due dates), a recent-activity sidebar feed, and a team overview card
- Respects the same `owner`/`tool` filters as the task board via query params

### Team
- Per-project team tab (`/projects/[id]/team`) listing active members with role and stats
- Member list + detail panel (detail panel is currently wired for selection but the page doesn't yet manage `selectedMemberId` state — see [Known gaps](#known-gaps))

### Task Board
- Five columns: **Unassigned**, **To Do**, **In Progress**, **Testing**, **Done**
- Tasks have: title, description, status, owner (project member), AI tool tag, optional due date
- AI tool tags: Claude, ChatGPT, Cursor, Gemini, Manual (or any custom value added to the `ai_tools` table)
- Filter board by owner and/or tool
- Inline status change via dropdown; full edit via click-to-open modal
- Delete with confirmation

### Todos
- Flat checklist per project — text + checkbox only
- No owner, no status workflow — quick capture
- Done items shown in a separate section with strikethrough

### Activity Log
- Reverse-chronological feed of all meaningful actions
- Logged: task created, status changed, task reassigned, todo added/completed, context added, project created
- Shows actor avatar, action description, entity title, and relative timestamp

### Context / Session Links
- Add AI chat session links (URLs) or paste raw transcripts
- Optional title and note per entry
- Links open in new tab; pasted text is expandable inline
- Newest first

### Personal AI Usage
- Per-user (not per-project) manual usage log
- Track: tool name, usage quota text (free-form, e.g. "32/40 messages"), reset date/time, notes
- Visual card per tool with reset-soon warning (amber when < 24h to reset)
- Full edit and delete

### Appearance
- Dark/light theme toggle in the dashboard sidebar, persisted to `localStorage`
- Theme is applied pre-paint by an inline script in `app/layout.tsx` to avoid a flash of the wrong theme

---

## Database Schema

| Table | Purpose |
|-------|---------|
| `users` | User profiles (mirrors `auth.users`) |
| `projects` | Projects |
| `project_members` | Project membership + roles (owner / member). **Code expects `status`, `requested_at`, `approved_at` columns that `schema.sql` does not yet create — see the warning above.** |
| `pending_invites` | Invites for users not yet registered (email has no account yet) |
| `ai_tools` | Canonical AI tool names (editable list) |
| `tasks` | Task board items (5-state status, optional due date) |
| `todos` | Flat checklist items per project |
| `activity_log` | Immutable audit trail (now includes `member_request` entity type) |
| `ai_usage_entries` | Personal AI usage records (per user) |
| `context_entries` | Session links / pasted transcripts per project |

All tables have RLS enabled. Users can only see data for projects they are members of. The `ai_usage_entries` table is scoped entirely to the owning user.

---

## Project Structure

```
synapse/
├── schema.sql                         # DB schema + RLS — run in Supabase SQL Editor (currently behind lib/types.ts, see warning above)
├── env.local.example                  # Copy to .env.local
├── scripts/
│   └── bench-routes.mjs               # Standalone warm-route benchmark (not wired into package.json)
├── app/
│   ├── layout.tsx                     # Root layout (fonts, global styles, pre-paint theme script)
│   ├── page.tsx                       # Redirects to /projects
│   ├── globals.css
│   ├── login/
│   │   └── page.tsx                   # Login / landing page
│   ├── auth/callback/route.ts         # Supabase OAuth callback
│   └── (dashboard)/
│       ├── layout.tsx                 # Sidebar + auth guard
│       ├── loading.tsx
│       ├── projects/
│       │   ├── page.tsx               # Project list
│       │   ├── new/page.tsx           # Create project form
│       │   └── [id]/
│       │       ├── layout.tsx         # Project header + tabs
│       │       ├── page.tsx           # Redirect to /tasks
│       │       ├── dashboard/page.tsx # Project overview dashboard
│       │       ├── tasks/page.tsx     # Kanban board
│       │       ├── todos/page.tsx     # Todo list
│       │       ├── team/page.tsx      # Team / members page
│       │       ├── activity/page.tsx  # Activity feed
│       │       ├── context/page.tsx   # Session links / pastes
│       │       └── settings/page.tsx  # Project settings (owner only)
│       └── ai-usage/
│           └── page.tsx               # Personal AI usage tracker
├── components/
│   ├── ui/
│   │   ├── TabLink.tsx                # Active-aware tab link (client)
│   │   └── Spinner.tsx
│   ├── tasks/
│   │   ├── TaskBoard.tsx              # Full kanban board (client)
│   │   └── TaskListDisplay.tsx
│   ├── todos/TodoList.tsx             # Todo list + add form (client)
│   ├── context/ContextEntries.tsx     # Context entries + add form (client)
│   ├── projects/ProjectSettings.tsx   # Settings + invite + approve/reject + danger zone (client)
│   ├── dashboard/                     # Project dashboard + team page components
│   │   ├── index.ts                   # Barrel export
│   │   ├── ProjectProgressCard.tsx
│   │   ├── TasksByStatus.tsx / TasksByStatusChart.tsx
│   │   ├── AssignedToMeSection.tsx
│   │   ├── UpcomingDeadlines.tsx
│   │   ├── RecentActivity.tsx / RecentActivityFeed.tsx
│   │   ├── TeamOverview.tsx / TeamHeader.tsx / TeamStats.tsx
│   │   ├── MemberList.tsx / MemberDetails.tsx
│   │   ├── RequestsSection.tsx        # Pending membership requests
│   │   ├── StatCard.tsx
│   │   └── ThemeToggle.tsx            # Dark/light toggle (sidebar)
│   └── AiUsageTracker.tsx             # AI usage cards + modal (client)
├── lib/
│   ├── types.ts                      # All shared TypeScript types + UI helpers
│   ├── utils.ts                      # cn(), formatRelativeTime(), initials()
│   ├── users.ts                      # User lookup helpers
│   ├── actions.ts                    # All Server Actions (auth, CRUD, membership workflow)
│   ├── data/dashboard-sidebar.ts     # Sidebar nav data
│   ├── dev/route-bench.ts            # Per-request timing (ROUTE_BENCH=1)
│   └── supabase/
│       ├── client.ts                 # Browser Supabase client
│       ├── server.ts                 # Server Supabase client
│       └── middleware.ts             # Session refresh + route guards
└── middleware.ts                     # Next.js middleware entry
```

---

## Known gaps

- **`schema.sql` is behind the membership code** (see the warning under Setup). The `invited` → `pending_approval` → `active` flow, `ai_tools`-style extensibility aside, will fail against a fresh import until `status`, `requested_at`, and `approved_at` are added to `project_members` and RLS/`is_project_member()` is updated to require `status = 'active'`.
- **`MemberDetails` on the Team page has no selection state.** `app/(dashboard)/projects/[id]/team/page.tsx` passes `selectedMemberId={null}` with a comment that it "would be managed by parent component state" — clicking a member in `MemberList` doesn't currently populate the detail panel.
- **`npm run lint` script exists but the repo hasn't been run through it as part of this README's audit** — worth running before deploying if you've made local changes.

## Dev tooling

- **Route timing**: set `ROUTE_BENCH=1` to log per-request render time for dashboard pages to the server console (`lib/dev/route-bench.ts`).
- **Warm-route benchmark script**: `node scripts/bench-routes.mjs [projectId]` hits the authenticated dashboard pages and reports timings. Needs `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` plus either `BENCH_COOKIE` or a `BENCH_EMAIL`/`BENCH_PASSWORD` pair. Not wired into `package.json` — invoke it directly.

## Phase 2 extension points

Two items from the original Phase 2 list have already landed in Phase 1 — the task board now has 5 statuses (`unassigned`/`todo`/`in_progress`/`testing`/`done`) and tasks carry a `due_date`. Remaining likely additions and where they'd land:

- **Custom board columns** — currently a fixed 5-value check constraint on `tasks.status`; making columns user-defined would mean a `columns` table with `tasks.status` becoming a FK
- **Task labels / tags** — add `task_labels` and `task_label_assignments` tables
- **Notifications** — add a `notifications` table; hook into `activity_log` inserts
- **AI-generated summaries** — new server action reading `activity_log` + calling an AI API
- **`MemberDetails` selection wiring** — lift `selectedMemberId` into client state on the Team page (see Known gaps)

No placeholder code for the remaining items exists yet — extend cleanly from the existing schema.

---

## Deployment

Deployable as a standard Next.js app. No special build configuration needed.

```bash
npm run build
npm start
```

For Vercel: connect the repo, set the two environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`), and deploy. Update the Supabase redirect URL to your production domain.
