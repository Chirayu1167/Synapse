-- ============================================================
-- Synapse — Database Schema v1
-- Run this in the Supabase SQL Editor for your project.
-- ============================================================

-- Enable UUID extension (usually already enabled on Supabase)
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

-- Users (mirrors Supabase Auth, populated on first login)
create table public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null unique,
  display_name text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Projects
create table public.projects (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  description text,
  owner_id    uuid not null references public.users(id) on delete restrict,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Project Members (join table)
create table public.project_members (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  user_id     uuid not null references public.users(id) on delete cascade,
  role        text not null default 'member' check (role in ('owner', 'member')),
  joined_at   timestamptz not null default now(),
  unique (project_id, user_id)
);

-- Pending invites (for users not yet registered)
create table public.pending_invites (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  invited_email text not null,
  invited_by  uuid not null references public.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (project_id, invited_email)
);

-- AI Tool enum values (stored as a table so they can be extended later)
create table public.ai_tools (
  id    uuid primary key default uuid_generate_v4(),
  name  text not null unique,
  sort_order int not null default 0
);

-- Seed default AI tools
insert into public.ai_tools (name, sort_order) values
  ('Claude',   1),
  ('ChatGPT',  2),
  ('Cursor',   3),
  ('Gemini',   4),
  ('Manual',   5);

-- Tasks
create table public.tasks (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  title       text not null,
  description text,
  status      text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  owner_id    uuid references public.users(id) on delete set null,
  ai_tool     text,                   -- references ai_tools.name (loose FK, allows custom names)
  created_by  uuid not null references public.users(id) on delete restrict,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Todos (flat checklist per project)
create table public.todos (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  text        text not null,
  done        boolean not null default false,
  created_by  uuid not null references public.users(id) on delete restrict,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Activity Log
create table public.activity_log (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  actor_id    uuid not null references public.users(id) on delete restrict,
  action      text not null,          -- human-readable description, e.g. "changed status to Done"
  entity_type text,                   -- 'task' | 'todo' | 'project' | 'context'
  entity_id   uuid,                   -- id of the referenced task/todo/etc.
  entity_title text,                  -- snapshot of the name at time of action
  created_at  timestamptz not null default now()
);

-- Personal AI Usage entries (user-level, not project-specific)
create table public.ai_usage_entries (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.users(id) on delete cascade,
  tool_name   text not null,
  usage_text  text,                   -- e.g. "32/40 messages"
  reset_at    timestamptz,            -- when their quota resets
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Context / Session link entries (per project)
create table public.context_entries (
  id          uuid primary key default uuid_generate_v4(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  source_type text not null check (source_type in ('link', 'text')),
  content     text not null,          -- URL or raw pasted text
  title       text,                   -- optional label
  note        text,                   -- optional extra note
  added_by    uuid not null references public.users(id) on delete restrict,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

create index idx_project_members_user_id   on public.project_members(user_id);
create index idx_project_members_project_id on public.project_members(project_id);
create index idx_tasks_project_id          on public.tasks(project_id);
create index idx_tasks_owner_id            on public.tasks(owner_id);
create index idx_todos_project_id          on public.todos(project_id);
create index idx_activity_log_project_id   on public.activity_log(project_id);
create index idx_activity_log_created_at   on public.activity_log(created_at desc);
create index idx_ai_usage_entries_user_id  on public.ai_usage_entries(user_id);
create index idx_context_entries_project_id on public.context_entries(project_id);
create index idx_pending_invites_email     on public.pending_invites(invited_email);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

create trigger trg_projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

create trigger trg_tasks_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

create trigger trg_todos_updated_at
  before update on public.todos
  for each row execute function public.set_updated_at();

create trigger trg_ai_usage_updated_at
  before update on public.ai_usage_entries
  for each row execute function public.set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
alter table public.users             enable row level security;
alter table public.projects          enable row level security;
alter table public.project_members   enable row level security;
alter table public.pending_invites   enable row level security;
alter table public.ai_tools          enable row level security;
alter table public.tasks             enable row level security;
alter table public.todos             enable row level security;
alter table public.activity_log      enable row level security;
alter table public.ai_usage_entries  enable row level security;
alter table public.context_entries   enable row level security;

-- Helper function: is the current user a member of a given project?
create or replace function public.is_project_member(p_project_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.project_members
    where project_id = p_project_id
      and user_id    = auth.uid()
  );
$$;

-- Helper function: is the current user the owner of a given project?
create or replace function public.is_project_owner(p_project_id uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.project_members
    where project_id = p_project_id
      and user_id    = auth.uid()
      and role       = 'owner'
  );
$$;

-- ---- users ----
create policy "Users can view their own profile"
  on public.users for select
  using (id = auth.uid());

create policy "Users can view profiles of project co-members"
  on public.users for select
  using (
    exists (
      select 1 from public.project_members pm1
      join public.project_members pm2 on pm1.project_id = pm2.project_id
      where pm1.user_id = auth.uid()
        and pm2.user_id = users.id
    )
  );

create policy "Users can insert their own profile"
  on public.users for insert
  with check (id = auth.uid());

create policy "Users can update their own profile"
  on public.users for update
  using (id = auth.uid());

-- ---- projects ----
create policy "Members can view their projects"
  on public.projects for select
  using (public.is_project_member(id));

create policy "Authenticated users can create projects"
  on public.projects for insert
  with check (auth.uid() is not null and owner_id = auth.uid());

create policy "Owners can update their projects"
  on public.projects for update
  using (public.is_project_owner(id));

create policy "Owners can delete their projects"
  on public.projects for delete
  using (public.is_project_owner(id));

-- ---- project_members ----
create policy "Members can view membership of their projects"
  on public.project_members for select
  using (public.is_project_member(project_id));

create policy "Owners can add members"
  on public.project_members for insert
  with check (public.is_project_owner(project_id) or user_id = auth.uid());

create policy "Owners can remove members"
  on public.project_members for delete
  using (public.is_project_owner(project_id));

-- ---- pending_invites ----
create policy "Members can view pending invites for their projects"
  on public.pending_invites for select
  using (public.is_project_member(project_id));

create policy "Owners can create pending invites"
  on public.pending_invites for insert
  with check (public.is_project_owner(project_id));

create policy "Owners can delete pending invites"
  on public.pending_invites for delete
  using (public.is_project_owner(project_id));

-- ---- ai_tools ----
create policy "All authenticated users can view AI tools"
  on public.ai_tools for select
  using (auth.uid() is not null);

-- ---- tasks ----
create policy "Members can view tasks in their projects"
  on public.tasks for select
  using (public.is_project_member(project_id));

create policy "Members can create tasks in their projects"
  on public.tasks for insert
  with check (public.is_project_member(project_id) and created_by = auth.uid());

create policy "Members can update tasks in their projects"
  on public.tasks for update
  using (public.is_project_member(project_id));

create policy "Members can delete tasks in their projects"
  on public.tasks for delete
  using (public.is_project_member(project_id));

-- ---- todos ----
create policy "Members can view todos in their projects"
  on public.todos for select
  using (public.is_project_member(project_id));

create policy "Members can create todos in their projects"
  on public.todos for insert
  with check (public.is_project_member(project_id) and created_by = auth.uid());

create policy "Members can update todos in their projects"
  on public.todos for update
  using (public.is_project_member(project_id));

create policy "Members can delete todos in their projects"
  on public.todos for delete
  using (public.is_project_member(project_id));

-- ---- activity_log ----
create policy "Members can view activity in their projects"
  on public.activity_log for select
  using (public.is_project_member(project_id));

create policy "Members can insert activity in their projects"
  on public.activity_log for insert
  with check (public.is_project_member(project_id) and actor_id = auth.uid());

-- No update/delete on activity log (immutable audit trail)

-- ---- ai_usage_entries ----
create policy "Users can view their own AI usage"
  on public.ai_usage_entries for select
  using (user_id = auth.uid());

create policy "Users can create their own AI usage entries"
  on public.ai_usage_entries for insert
  with check (user_id = auth.uid());

create policy "Users can update their own AI usage entries"
  on public.ai_usage_entries for update
  using (user_id = auth.uid());

create policy "Users can delete their own AI usage entries"
  on public.ai_usage_entries for delete
  using (user_id = auth.uid());

-- ---- context_entries ----
create policy "Members can view context entries in their projects"
  on public.context_entries for select
  using (public.is_project_member(project_id));

create policy "Members can add context entries to their projects"
  on public.context_entries for insert
  with check (public.is_project_member(project_id) and added_by = auth.uid());

create policy "Entry author can delete their context entry"
  on public.context_entries for delete
  using (added_by = auth.uid() or public.is_project_owner(project_id));

-- ============================================================
-- SUPABASE AUTH HOOK: resolve pending invites on login
-- ============================================================
-- After a new user registers, automatically add them to any
-- projects they were invited to.

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  invite record;
begin
  -- Insert into public.users
  insert into public.users (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update set
    email        = excluded.email,
    display_name = coalesce(excluded.display_name, public.users.display_name),
    avatar_url   = coalesce(excluded.avatar_url, public.users.avatar_url),
    updated_at   = now();

  -- Resolve any pending invites for this email
  for invite in
    select * from public.pending_invites where invited_email = new.email
  loop
    insert into public.project_members (project_id, user_id, role)
    values (invite.project_id, new.id, 'member')
    on conflict (project_id, user_id) do nothing;

    delete from public.pending_invites where id = invite.id;
  end loop;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
