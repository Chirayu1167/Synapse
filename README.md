# Synapse

A lightweight project tracker for solo developers and small teams using multiple AI tools (Claude, ChatGPT, Cursor, Gemini, etc.). Intentionally simpler than GitHub Projects — projects, tasks, todos, activity log, AI usage tracking, and context/session links.

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

Copy `.env.local.example` to `.env.local` and fill in your values:

```bash
cp .env.local.example .env.local
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

### 3. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to `/login`.

---

## Features

### Authentication
- Google Sign-In via Supabase Auth
- User profile auto-created on first login (name + avatar from Google)
- Pending project invites are automatically resolved when an invited user signs up

### Projects
- Create projects with name + optional description
- Invite collaborators by email — existing users are added immediately, others get a pending invite resolved on signup
- Project list shows task completion progress per project

### Task Board
- Three fixed columns: **To Do**, **In Progress**, **Done**
- Tasks have: title, description, status, owner (project member), AI tool tag
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

---

## Database Schema

| Table | Purpose |
|-------|---------|
| `users` | User profiles (mirrors `auth.users`) |
| `projects` | Projects |
| `project_members` | Project membership + roles (owner / member) |
| `pending_invites` | Invites for users not yet registered |
| `ai_tools` | Canonical AI tool names (editable list) |
| `tasks` | Task board items |
| `todos` | Flat checklist items per project |
| `activity_log` | Immutable audit trail |
| `ai_usage_entries` | Personal AI usage records (per user) |
| `context_entries` | Session links / pasted transcripts per project |

All tables have RLS enabled. Users can only see data for projects they are members of. The `ai_usage_entries` table is scoped entirely to the owning user.

---

## Project Structure

```
synapse/
├── schema.sql                        # Full DB schema + RLS — run in Supabase SQL Editor
├── app/
│   ├── layout.tsx                    # Root layout (fonts, global styles)
│   ├── page.tsx                      # Redirects to /projects
│   ├── globals.css
│   ├── login/
│   │   └── page.tsx                  # Login / landing page
│   ├── auth/callback/route.ts        # Supabase OAuth callback
│   └── (dashboard)/
│       ├── layout.tsx                # Sidebar + auth guard
│       ├── projects/
│       │   ├── page.tsx              # Project list
│       │   ├── new/page.tsx          # Create project form
│       │   └── [id]/
│       │       ├── layout.tsx        # Project header + tabs
│       │       ├── page.tsx          # Redirect to /tasks
│       │       ├── tasks/page.tsx    # Kanban board
│       │       ├── todos/page.tsx    # Todo list
│       │       ├── activity/page.tsx # Activity feed
│       │       ├── context/page.tsx  # Session links / pastes
│       │       └── settings/page.tsx # Project settings (owner only)
│       └── ai-usage/
│           └── page.tsx              # Personal AI usage tracker
├── components/
│   ├── ui/TabLink.tsx                # Active-aware tab link (client)
│   ├── tasks/TaskBoard.tsx           # Full kanban board (client)
│   ├── todos/TodoList.tsx            # Todo list + add form (client)
│   ├── context/ContextEntries.tsx    # Context entries + add form (client)
│   ├── projects/ProjectSettings.tsx  # Settings + invite + danger zone (client)
│   └── AiUsageTracker.tsx            # AI usage cards + modal (client)
├── lib/
│   ├── types.ts                      # All shared TypeScript types + UI helpers
│   ├── utils.ts                      # cn(), formatRelativeTime(), initials()
│   ├── actions.ts                    # All Server Actions (auth, CRUD)
│   └── supabase/
│       ├── client.ts                 # Browser Supabase client
│       ├── server.ts                 # Server Supabase client
│       └── middleware.ts             # Session refresh + route guards
└── middleware.ts                     # Next.js middleware entry
```

---

## Phase 2 extension points

The schema is forward-compatible. Likely Phase 2 additions and where they'd land:

- **Custom board columns** — add a `columns` table; `tasks.status` becomes a FK instead of an enum check
- **Task labels / tags** — add `task_labels` and `task_label_assignments` tables
- **Notifications** — add a `notifications` table; hook into `activity_log` inserts
- **AI-generated summaries** — new server action reading `activity_log` + calling an AI API
- **Review status on tasks** — add `review_status` column to `tasks`

No placeholder code for these exists in Phase 1 — extend cleanly from the existing schema.

---

## Deployment

Deployable as a standard Next.js app. No special build configuration needed.

```bash
npm run build
npm start
```

For Vercel: connect the repo, set the two environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`), and deploy. Update the Supabase redirect URL to your production domain.
