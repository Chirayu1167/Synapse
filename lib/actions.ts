"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { TaskStatus } from "@/lib/types";

// ============================================================
// AUTH
// ============================================================

export async function signInWithGoogle() {
  const supabase = await createClient();
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
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// ============================================================
// PROJECTS
// ============================================================

export async function createProject(formData: FormData) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  console.log("[createProject] user:", user?.id, "userError:", userError);

  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  console.log("[createProject] access_token present:", !!token);
  if (token) {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
    console.log("[createProject] JWT role:", payload.role, "JWT sub:", payload.sub, "JWT aud:", payload.aud);
    console.log("[createProject] FULL TOKEN:", token);
  }

  if (!user) throw new Error("Not authenticated");

  const name = formData.get("name") as string;
  const description = formData.get("description") as string | null;

  if (!name?.trim()) throw new Error("Project name is required");

  console.log("[createProject] inserting with owner_id:", user.id);
  const { data: project, error } = await supabase
    .from("projects")
    .insert({ name: name.trim(), description: description?.trim() || null, owner_id: user.id })
    .select()
    .single();

  console.log("[createProject] insert error:", JSON.stringify(error));
  if (error) throw error;

  // Add owner as member
  await supabase.from("project_members").insert({
    project_id: project.id,
    user_id: user.id,
    role: "owner",
  });

  // Log activity
  await supabase.from("activity_log").insert({
    project_id: project.id,
    actor_id: user.id,
    action: "created this project",
    entity_type: "project",
    entity_id: project.id,
    entity_title: project.name,
  });

  revalidatePath("/projects");
  redirect(`/projects/${project.id}/tasks`);
}

export async function updateProject(projectId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
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
  const supabase = await createClient();
  const { error } = await supabase.from("projects").delete().eq("id", projectId);
  if (error) throw error;
  revalidatePath("/projects");
  redirect("/projects");
}

export async function inviteMember(projectId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const email = (formData.get("email") as string)?.toLowerCase().trim();
  if (!email) throw new Error("Email is required");

  // Check if user already exists
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  if (existingUser) {
    // Add directly as member
    const { error } = await supabase.from("project_members").insert({
      project_id: projectId,
      user_id: existingUser.id,
      role: "member",
    });
    if (error && error.code !== "23505") throw error; // ignore duplicate
  } else {
    // Store as pending invite
    const { error } = await supabase.from("pending_invites").insert({
      project_id: projectId,
      invited_email: email,
      invited_by: user.id,
    });
    if (error && error.code !== "23505") throw error;
  }

  revalidatePath(`/projects/${projectId}/settings`);
}

export async function removeMember(projectId: string, userId: string) {
  const supabase = await createClient();
  await supabase
    .from("project_members")
    .delete()
    .eq("project_id", projectId)
    .eq("user_id", userId);
  revalidatePath(`/projects/${projectId}/settings`);
}

export async function cancelInvite(inviteId: string, projectId: string) {
  const supabase = await createClient();
  await supabase.from("pending_invites").delete().eq("id", inviteId);
  revalidatePath(`/projects/${projectId}/settings`);
}

// ============================================================
// TASKS
// ============================================================

export async function createTask(projectId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const title = formData.get("title") as string;
  const description = formData.get("description") as string | null;
  const owner_id = (formData.get("owner_id") as string) || null;
  const ai_tool = (formData.get("ai_tool") as string) || null;
  const status = (formData.get("status") as TaskStatus) || "todo";

  if (!title?.trim()) throw new Error("Title is required");

  const { data: task, error } = await supabase
    .from("tasks")
    .insert({
      project_id: projectId,
      title: title.trim(),
      description: description?.trim() || null,
      owner_id: owner_id || null,
      ai_tool: ai_tool || null,
      status,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;

  await supabase.from("activity_log").insert({
    project_id: projectId,
    actor_id: user.id,
    action: "created task",
    entity_type: "task",
    entity_id: task.id,
    entity_title: task.title,
  });

  revalidatePath(`/projects/${projectId}/tasks`);
  revalidatePath(`/projects/${projectId}/activity`);
}

export async function updateTask(
  taskId: string,
  projectId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const title = formData.get("title") as string;
  const description = formData.get("description") as string | null;
  const owner_id = (formData.get("owner_id") as string) || null;
  const ai_tool = (formData.get("ai_tool") as string) || null;
  const status = formData.get("status") as TaskStatus;

  // Get previous state for activity log
  const { data: prev } = await supabase
    .from("tasks")
    .select("status, owner_id, title")
    .eq("id", taskId)
    .single();

  const { error } = await supabase
    .from("tasks")
    .update({
      title: title.trim(),
      description: description?.trim() || null,
      owner_id: owner_id || null,
      ai_tool: ai_tool || null,
      status,
    })
    .eq("id", taskId);

  if (error) throw error;

  // Log meaningful changes
  const logs: Promise<unknown>[] = [];
  if (prev?.status !== status) {
    const labels: Record<string, string> = { todo: "To Do", in_progress: "In Progress", done: "Done" };
    logs.push(
      supabase.from("activity_log").insert({
        project_id: projectId,
        actor_id: user.id,
        action: `changed status to ${labels[status]}`,
        entity_type: "task",
        entity_id: taskId,
        entity_title: title.trim(),
      })
    );
  }
  if (prev?.owner_id !== owner_id) {
    logs.push(
      supabase.from("activity_log").insert({
        project_id: projectId,
        actor_id: user.id,
        action: "reassigned task",
        entity_type: "task",
        entity_id: taskId,
        entity_title: title.trim(),
      })
    );
  }
  await Promise.all(logs);

  revalidatePath(`/projects/${projectId}/tasks`);
  revalidatePath(`/projects/${projectId}/activity`);
}

export async function updateTaskStatus(
  taskId: string,
  projectId: string,
  status: TaskStatus
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: task } = await supabase
    .from("tasks")
    .select("title")
    .eq("id", taskId)
    .single();

  await supabase.from("tasks").update({ status }).eq("id", taskId);

  const labels: Record<string, string> = { todo: "To Do", in_progress: "In Progress", done: "Done" };
  await supabase.from("activity_log").insert({
    project_id: projectId,
    actor_id: user.id,
    action: `changed status to ${labels[status]}`,
    entity_type: "task",
    entity_id: taskId,
    entity_title: task?.title ?? null,
  });

  revalidatePath(`/projects/${projectId}/tasks`);
  revalidatePath(`/projects/${projectId}/activity`);
}

export async function deleteTask(taskId: string, projectId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: task } = await supabase
    .from("tasks")
    .select("title")
    .eq("id", taskId)
    .single();

  await supabase.from("tasks").delete().eq("id", taskId);

  await supabase.from("activity_log").insert({
    project_id: projectId,
    actor_id: user.id,
    action: "deleted task",
    entity_type: "task",
    entity_id: taskId,
    entity_title: task?.title ?? null,
  });

  revalidatePath(`/projects/${projectId}/tasks`);
  revalidatePath(`/projects/${projectId}/activity`);
}

// ============================================================
// TODOS
// ============================================================

export async function createTodo(projectId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const text = formData.get("text") as string;
  if (!text?.trim()) throw new Error("Todo text is required");

  const { data: todo, error } = await supabase
    .from("todos")
    .insert({ project_id: projectId, text: text.trim(), created_by: user.id })
    .select()
    .single();

  if (error) throw error;

  await supabase.from("activity_log").insert({
    project_id: projectId,
    actor_id: user.id,
    action: "added todo",
    entity_type: "todo",
    entity_id: todo.id,
    entity_title: todo.text,
  });

  revalidatePath(`/projects/${projectId}/todos`);
}

export async function toggleTodo(todoId: string, projectId: string, done: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: todo } = await supabase
    .from("todos")
    .select("text")
    .eq("id", todoId)
    .single();

  await supabase.from("todos").update({ done }).eq("id", todoId);

  await supabase.from("activity_log").insert({
    project_id: projectId,
    actor_id: user.id,
    action: done ? "completed todo" : "unchecked todo",
    entity_type: "todo",
    entity_id: todoId,
    entity_title: todo?.text ?? null,
  });

  revalidatePath(`/projects/${projectId}/todos`);
  revalidatePath(`/projects/${projectId}/activity`);
}

export async function deleteTodo(todoId: string, projectId: string) {
  const supabase = await createClient();
  await supabase.from("todos").delete().eq("id", todoId);
  revalidatePath(`/projects/${projectId}/todos`);
}

// ============================================================
// AI USAGE
// ============================================================

export async function createAiUsageEntry(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
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

  await supabase.from("activity_log").insert({
    project_id: projectId,
    actor_id: user.id,
    action: `added context ${source_type === "link" ? "link" : "paste"}`,
    entity_type: "context",
    entity_id: entry.id,
    entity_title: title?.trim() || (source_type === "link" ? content.trim() : "pasted text"),
  });

  revalidatePath(`/projects/${projectId}/context`);
  revalidatePath(`/projects/${projectId}/activity`);
}

export async function deleteContextEntry(entryId: string, projectId: string) {
  const supabase = await createClient();
  await supabase.from("context_entries").delete().eq("id", entryId);
  revalidatePath(`/projects/${projectId}/context`);
}
