"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/supabase/server";
import type { TaskStatus } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/types";

// ============================================================
// AUTH
// ============================================================

export async function signInWithGoogle() {
  const { supabase } = await getAuthUser();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`,
    },
  });
  if (error) throw error;
  if (data.url) redirect(data.url);
}

export async function signOut() {
  const { supabase } = await getAuthUser();
  await supabase.auth.signOut();
  redirect("/login");
}

// ============================================================
// PROJECTS
// ============================================================

export async function createProject(formData: FormData) {
  const { supabase, user } = await getAuthUser();
  if (!user) throw new Error("Not authenticated");

  const name = formData.get("name") as string;
  const description = formData.get("description") as string | null;

  if (!name?.trim()) throw new Error("Project name is required");

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({ name: name.trim(), description: description?.trim() || null, owner_id: user.id })
    .select("id, name")
    .single();

  if (projectError) throw projectError;

  const { error: memberError } = await supabase.from("project_members").insert({
    project_id: project.id,
    user_id: user.id,
    role: "owner",
    status: "active",
  });
  if (memberError) throw memberError;

  const { error: activityError } = await supabase.from("activity_log").insert({
    project_id: project.id,
    actor_id: user.id,
    action: "created this project",
    entity_type: "project",
    entity_id: project.id,
    entity_title: project.name,
  });
  if (activityError) throw activityError;

  revalidatePath("/projects");
  redirect(`/projects/${project.id}/tasks`);
}

export async function updateProject(projectId: string, formData: FormData) {
  const { supabase, user } = await getAuthUser();
  if (!user) throw new Error("Not authenticated");

  const name = formData.get("name") as string;
  const description = formData.get("description") as string | null;

  const { error } = await supabase
    .from("projects")
    .update({ name: name.trim(), description: description?.trim() || null })
    .eq("id", projectId);

  if (error) throw error;
  revalidatePath(`/projects/${projectId}`);
}

export async function deleteProject(projectId: string) {
  const { supabase } = await getAuthUser();
  const { error } = await supabase.from("projects").delete().eq("id", projectId);
  if (error) throw error;
  revalidatePath("/projects");
  redirect("/projects");
}

export async function inviteMember(projectId: string, formData: FormData) {
  const { supabase, user } = await getAuthUser();
  if (!user) throw new Error("Not authenticated");

  const email = (formData.get("email") as string)?.toLowerCase().trim();
  if (!email) throw new Error("Email is required");

  // Only the project owner can invite — enforced here and by RLS.
  const { data: ownerRow } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();
  if (ownerRow?.role !== "owner") throw new Error("Only the project owner can invite members");

  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  if (existingUser) {
    // Existing user: create a request that they must accept, and that the
    // owner must then approve, before it becomes an active membership.
    const { data: member, error } = await supabase
      .from("project_members")
      .insert({
        project_id: projectId,
        user_id: existingUser.id,
        role: "member",
        status: "invited",
        requested_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error && error.code !== "23505") throw error;

    if (member) {
      void supabase.from("activity_log").insert({
        project_id: projectId,
        actor_id: user.id,
        action: "invited to project",
        entity_type: "member_request",
        entity_id: member.id,
        entity_title: email,
      });
    }
  } else {
    const { error } = await supabase.from("pending_invites").insert({
      project_id: projectId,
      invited_email: email,
      invited_by: user.id,
    });
    if (error && error.code !== "23505") throw error;
  }

  revalidatePath(`/projects/${projectId}/settings`);
}

/** Invited user accepts an invite — moves it to pending_approval, awaiting the owner's sign-off. */
export async function acceptMembershipRequest(memberRowId: string) {
  const { supabase, user } = await getAuthUser();
  if (!user) throw new Error("Not authenticated");

  const { data: row, error } = await supabase
    .from("project_members")
    .update({ status: "pending_approval" })
    .eq("id", memberRowId)
    .eq("user_id", user.id)
    .eq("status", "invited")
    .select("project_id")
    .single();
  if (error) throw error;

  if (row) {
    void supabase.from("activity_log").insert({
      project_id: row.project_id,
      actor_id: user.id,
      action: "accepted invite, awaiting approval",
      entity_type: "member_request",
      entity_id: memberRowId,
      entity_title: null,
    });
  }

  revalidatePath("/projects", "layout");
}

/** Invited (or pending) user declines/withdraws — deletes the request entirely. */
export async function declineMembershipRequest(memberRowId: string) {
  const { supabase, user } = await getAuthUser();
  if (!user) throw new Error("Not authenticated");

  await supabase
    .from("project_members")
    .delete()
    .eq("id", memberRowId)
    .eq("user_id", user.id)
    .in("status", ["invited", "pending_approval"]);

  revalidatePath("/projects", "layout");
}

/** Owner approves a pending_approval request — becomes an active member. */
export async function approveMembershipRequest(memberRowId: string, projectId: string) {
  const { supabase, user } = await getAuthUser();
  if (!user) throw new Error("Not authenticated");

  const { data: row, error } = await supabase
    .from("project_members")
    .update({ status: "active", approved_at: new Date().toISOString() })
    .eq("id", memberRowId)
    .eq("project_id", projectId)
    .eq("status", "pending_approval")
    .select("user_id")
    .single();
  if (error) throw error;

  if (row) {
    void supabase.from("activity_log").insert({
      project_id: projectId,
      actor_id: user.id,
      action: "approved member",
      entity_type: "member_request",
      entity_id: memberRowId,
      entity_title: null,
    });
  }

  revalidatePath(`/projects/${projectId}/settings`);
}

/** Owner rejects a pending_approval (or still-invited) request — deletes it. */
export async function rejectMembershipRequest(memberRowId: string, projectId: string) {
  const { supabase, user } = await getAuthUser();
  if (!user) throw new Error("Not authenticated");

  await supabase
    .from("project_members")
    .delete()
    .eq("id", memberRowId)
    .eq("project_id", projectId);

  revalidatePath(`/projects/${projectId}/settings`);
}

export async function removeMember(projectId: string, userId: string) {
  const { supabase } = await getAuthUser();
  await supabase
    .from("project_members")
    .delete()
    .eq("project_id", projectId)
    .eq("user_id", userId);
  revalidatePath(`/projects/${projectId}/settings`);
}

export async function cancelInvite(inviteId: string, projectId: string) {
  const { supabase } = await getAuthUser();
  await supabase.from("pending_invites").delete().eq("id", inviteId);
  revalidatePath(`/projects/${projectId}/settings`);
}

// ============================================================
// TASKS
// ============================================================

export async function createTask(projectId: string, formData: FormData) {
  const { supabase, user } = await getAuthUser();
  if (!user) throw new Error("Not authenticated");

  const title = formData.get("title") as string;
  const description = formData.get("description") as string | null;
  const owner_id = (formData.get("owner_id") as string) || null;
  const ai_tool = (formData.get("ai_tool") as string) || null;
  const status = (formData.get("status") as TaskStatus) || "todo";
  const due_date_raw = formData.get("due_date") as string | null;
  const due_time_raw = (formData.get("due_time") as string | null) || "";

  if (!title?.trim()) throw new Error("Title is required");
  if (!due_date_raw?.trim()) throw new Error("Due date is required");

  // Time is optional — default to midnight local time if not provided.
  const due_date = new Date(`${due_date_raw}T${due_time_raw || "00:00"}`).toISOString();

  const { data: task, error } = await supabase
    .from("tasks")
    .insert({
      project_id: projectId,
      title: title.trim(),
      description: description?.trim() || null,
      owner_id: owner_id || null,
      ai_tool: ai_tool || null,
      status,
      due_date,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;

  // Fire activity log without blocking revalidation
  supabase.from("activity_log").insert({
    project_id: projectId,
    actor_id: user.id,
    action: "created task",
    entity_type: "task",
    entity_id: task.id,
    entity_title: task.title,
  });

  revalidatePath(`/projects/${projectId}/tasks`);
}

export async function updateTask(
  taskId: string,
  projectId: string,
  formData: FormData
) {
  const { supabase, user } = await getAuthUser();
  if (!user) throw new Error("Not authenticated");

  const title = formData.get("title") as string;
  const description = formData.get("description") as string | null;
  const owner_id = (formData.get("owner_id") as string) || null;
  const ai_tool = (formData.get("ai_tool") as string) || null;
  const status = formData.get("status") as TaskStatus;
  const due_date_raw = formData.get("due_date") as string | null;
  const due_time_raw = (formData.get("due_time") as string | null) || "";

  if (!due_date_raw?.trim()) throw new Error("Due date is required");
  const due_date = new Date(`${due_date_raw}T${due_time_raw || "00:00"}`).toISOString();

  // Get previous state and do update in parallel
  const [{ data: prev }, { error }] = await Promise.all([
    supabase.from("tasks").select("status, owner_id, title").eq("id", taskId).single(),
    supabase.from("tasks").update({
      title: title.trim(),
      description: description?.trim() || null,
      owner_id: owner_id || null,
      ai_tool: ai_tool || null,
      status,
      due_date,
    }).eq("id", taskId),
  ]);

  if (error) throw error;

  if (prev?.status !== status) {
    const label = STATUS_LABELS[status];
    void supabase.from("activity_log").insert({
      project_id: projectId,
      actor_id: user.id,
      action: `changed status to ${label}`,
      entity_type: "task",
      entity_id: taskId,
      entity_title: title.trim(),
    });
  }
  if (prev?.owner_id !== owner_id) {
    void supabase.from("activity_log").insert({
      project_id: projectId,
      actor_id: user.id,
      action: "reassigned task",
      entity_type: "task",
      entity_id: taskId,
      entity_title: title.trim(),
    });
  }

  revalidatePath(`/projects/${projectId}/tasks`);
}

export async function updateTaskStatus(
  taskId: string,
  projectId: string,
  status: TaskStatus
) {
  const { supabase, user } = await getAuthUser();
  if (!user) throw new Error("Not authenticated");

  // Run update and fetch title in parallel
  const [, { data: task }] = await Promise.all([
    supabase.from("tasks").update({ status }).eq("id", taskId),
    supabase.from("tasks").select("title").eq("id", taskId).single(),
  ]);

  // Use STATUS_LABELS from types for consistency
  const label = STATUS_LABELS[status];
  // Fire activity log without blocking
  supabase.from("activity_log").insert({
    project_id: projectId,
    actor_id: user.id,
    action: `changed status to ${label}`,
    entity_type: "task",
    entity_id: taskId,
    entity_title: task?.title ?? null,
  });

  revalidatePath(`/projects/${projectId}/tasks`);
}

export async function deleteTask(taskId: string, projectId: string) {
  const { supabase, user } = await getAuthUser();
  if (!user) throw new Error("Not authenticated");

  const [{ data: task }] = await Promise.all([
    supabase.from("tasks").select("title").eq("id", taskId).single(),
    supabase.from("tasks").delete().eq("id", taskId),
  ]);

  // Fire activity log without blocking
  supabase.from("activity_log").insert({
    project_id: projectId,
    actor_id: user.id,
    action: "deleted task",
    entity_type: "task",
    entity_id: taskId,
    entity_title: task?.title ?? null,
  });

  revalidatePath(`/projects/${projectId}/tasks`);
}

// ============================================================
// TODOS
// ============================================================

export async function createTodo(projectId: string, formData: FormData) {
  const { supabase, user } = await getAuthUser();
  if (!user) throw new Error("Not authenticated");

  const text = formData.get("text") as string;
  if (!text?.trim()) throw new Error("Todo text is required");

  const { data: todo, error } = await supabase
    .from("todos")
    .insert({ project_id: projectId, text: text.trim(), created_by: user.id })
    .select()
    .single();

  if (error) throw error;

  // Fire activity log without blocking
  supabase.from("activity_log").insert({
    project_id: projectId,
    actor_id: user.id,
    action: "added todo",
    entity_type: "todo",
    entity_id: todo.id,
    entity_title: todo.text,
  });

  revalidatePath(`/projects/${projectId}/todos`);
}

// Accept todoText from client so we don't need an extra SELECT
export async function toggleTodo(todoId: string, projectId: string, done: boolean, todoText?: string) {
  const { supabase, user } = await getAuthUser();
  if (!user) throw new Error("Not authenticated");

  await supabase.from("todos").update({ done }).eq("id", todoId);

  // Fire activity log without blocking
  supabase.from("activity_log").insert({
    project_id: projectId,
    actor_id: user.id,
    action: done ? "completed todo" : "unchecked todo",
    entity_type: "todo",
    entity_id: todoId,
    entity_title: todoText ?? null,
  });

  revalidatePath(`/projects/${projectId}/todos`);
}

export async function deleteTodo(todoId: string, projectId: string) {
  const { supabase, user } = await getAuthUser();
  if (!user) throw new Error("Not authenticated");

  await supabase.from("todos").delete().eq("id", todoId);
  revalidatePath(`/projects/${projectId}/todos`);
}

// ============================================================
// AI USAGE
// ============================================================

export async function createAiUsageEntry(formData: FormData) {
  const { supabase, user } = await getAuthUser();
  if (!user) throw new Error("Not authenticated");

  const tool_name = formData.get("tool_name") as string;
  const usage_text = formData.get("usage_text") as string | null;
  const reset_at = formData.get("reset_at") as string | null;
  const notes = formData.get("notes") as string | null;

  if (!tool_name?.trim()) throw new Error("Tool name is required");

  const { error } = await supabase.from("ai_usage_entries").insert({
    user_id: user.id,
    tool_name: tool_name.trim(),
    usage_text: usage_text?.trim() || null,
    reset_at: reset_at || null,
    notes: notes?.trim() || null,
  });

  if (error) throw error;
  revalidatePath("/ai-usage");
}

export async function updateAiUsageEntry(entryId: string, formData: FormData) {
  const { supabase, user } = await getAuthUser();
  if (!user) throw new Error("Not authenticated");

  const tool_name = formData.get("tool_name") as string;
  const usage_text = formData.get("usage_text") as string | null;
  const reset_at = formData.get("reset_at") as string | null;
  const notes = formData.get("notes") as string | null;

  const { error } = await supabase
    .from("ai_usage_entries")
    .update({
      tool_name: tool_name.trim(),
      usage_text: usage_text?.trim() || null,
      reset_at: reset_at || null,
      notes: notes?.trim() || null,
    })
    .eq("id", entryId)
    .eq("user_id", user.id);

  if (error) throw error;
  revalidatePath("/ai-usage");
}

export async function deleteAiUsageEntry(entryId: string) {
  const { supabase, user } = await getAuthUser();
  if (!user) throw new Error("Not authenticated");

  await supabase
    .from("ai_usage_entries")
    .delete()
    .eq("id", entryId)
    .eq("user_id", user.id);

  revalidatePath("/ai-usage");
}

// ============================================================
// CONTEXT ENTRIES
// ============================================================

export async function createContextEntry(projectId: string, formData: FormData) {
  const { supabase, user } = await getAuthUser();
  if (!user) throw new Error("Not authenticated");

  const source_type = formData.get("source_type") as "link" | "text";
  const content = formData.get("content") as string;
  const title = formData.get("title") as string | null;
  const note = formData.get("note") as string | null;

  if (!content?.trim()) throw new Error("Content is required");

  const { data: entry, error } = await supabase
    .from("context_entries")
    .insert({
      project_id: projectId,
      source_type,
      content: content.trim(),
      title: title?.trim() || null,
      note: note?.trim() || null,
      added_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;

  supabase.from("activity_log").insert({
    project_id: projectId,
    actor_id: user.id,
    action: `added context ${source_type === "link" ? "link" : "paste"}`,
    entity_type: "context",
    entity_id: entry.id,
    entity_title: title?.trim() || (source_type === "link" ? content.trim() : "pasted text"),
  });

  revalidatePath(`/projects/${projectId}/context`);
}

export async function deleteContextEntry(entryId: string, projectId: string) {
  const { supabase } = await getAuthUser();
  await supabase.from("context_entries").delete().eq("id", entryId);
  revalidatePath(`/projects/${projectId}/context`);
}
