// ============================================================
// Synapse OS — Shared Types
// ============================================================

export type UserProfile = {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Project = {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
};

export type ProjectMember = {
  id: string;
  project_id: string;
  user_id: string;
  role: "owner" | "member";
  joined_at: string;
  user?: UserProfile;
};

export type PendingInvite = {
  id: string;
  project_id: string;
  invited_email: string;
  invited_by: string;
  created_at: string;
};

export type TaskStatus = "unassigned" | "todo" | "in_progress" | "testing" | "done";

export const AI_TOOLS = ["Claude", "ChatGPT", "Cursor", "Gemini", "Manual"] as const;
export type AiTool = (typeof AI_TOOLS)[number];

export type Task = {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  owner_id: string | null;
  ai_tool: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  owner?: UserProfile | null;
  creator?: UserProfile | null;
  due_date: string | null;
};

export type Todo = {
  id: string;
  project_id: string;
  text: string;
  done: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  creator?: UserProfile | null;
};

export type ActivityLog = {
  id: string;
  project_id: string;
  actor_id: string;
  action: string;
  entity_type: "task" | "todo" | "project" | "context" | null;
  entity_id: string | null;
  entity_title: string | null;
  created_at: string;
  actor?: UserProfile | null;
};

export type AiUsageEntry = {
  id: string;
  user_id: string;
  tool_name: string;
  usage_text: string | null;
  reset_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ContextEntry = {
  id: string;
  project_id: string;
  source_type: "link" | "text";
  content: string;
  title: string | null;
  note: string | null;
  added_by: string;
  created_at: string;
  adder?: UserProfile | null;
};

// ---- UI helpers ----

export const STATUS_LABELS: Record<TaskStatus, string> = {
  unassigned: "Unassigned",
  todo: "To Do",
  in_progress: "In Progress",
  testing: "Testing",
  done: "Done",
};

export const STATUS_COLORS: Record<TaskStatus, string> = {
  unassigned: "border border-outline-variant/20 text-on-surface-variant/40",
  todo: "border border-outline-variant/30 text-on-surface-variant",
  in_progress: "border border-outline/50 text-on-surface",
  testing: "border border-outline-variant/30 text-on-surface-variant/50",
  done: "border border-outline-variant/20 text-on-surface-variant/60",
};

export const TOOL_COLORS: Record<string, string> = {
  Claude:  "border border-outline-variant/30 text-on-surface-variant",
  ChatGPT: "border border-outline-variant/30 text-on-surface-variant",
  Cursor:  "border border-outline-variant/30 text-on-surface-variant",
  Gemini:  "border border-outline-variant/30 text-on-surface-variant",
  Manual:  "border border-outline-variant/20 text-on-surface-variant/50",
};

export const COLUMN_ACCENT: Record<TaskStatus, string> = {
  unassigned:    "text-on-surface-variant/30",
  todo:        "text-on-surface-variant/60",
  in_progress: "text-on-surface",
  testing:     "text-on-surface-variant/50",
  done:        "text-on-surface-variant/40",
};
