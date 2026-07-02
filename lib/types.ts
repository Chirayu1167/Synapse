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

export type MembershipStatus = "invited" | "pending_approval" | "active";

export type ProjectMember = {
  id: string;
  project_id: string;
  user_id: string;
  role: "owner" | "member";
  joined_at: string;
  status: MembershipStatus;
  requested_at: string | null;
  approved_at: string | null;
  user?: UserProfile;
  project?: { id: string; name: string };
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
  priority: TaskPriority;
};

export type TaskPriority = "low" | "medium" | "high" | "urgent";

export type TaskComment = {
  id: string;
  task_id: string;
  project_id: string;
  author_id: string;
  body: string;
  created_at: string;
  updated_at: string;
  author?: UserProfile | null;
};

export type NotificationType =
  | "task_assigned"
  | "task_status_changed"
  | "task_comment"
  | "member_removed";

export type AppNotification = {
  id: string;
  user_id: string;
  project_id: string;
  task_id: string | null;
  type: NotificationType;
  message: string;
  link: string;
  read: boolean;
  created_at: string;
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
  entity_type: "task" | "todo" | "project" | "context" | "member_request" | null;
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

// Filled style applied to whichever status currently has the most tasks,
// so the pipeline visualization highlights where work is concentrated
// instead of every circle rendering as the same flat/hollow outline.
export const STATUS_COLORS_ACTIVE: Record<TaskStatus, string> = {
  unassigned: "bg-primary text-on-primary border border-primary",
  todo: "bg-primary text-on-primary border border-primary",
  in_progress: "bg-primary text-on-primary border border-primary",
  testing: "bg-primary text-on-primary border border-primary",
  done: "bg-primary text-on-primary border border-primary",
};

/** Returns the TaskStatus with the highest count, or null if all counts are 0 (ties keep the first/leftmost column order). */
export function getMaxStatus(
  counts: Record<TaskStatus, number>,
  order: TaskStatus[]
): TaskStatus | null {
  let max: TaskStatus | null = null;
  for (const status of order) {
    const count = counts[status] ?? 0;
    if (count > 0 && (max === null || count > (counts[max] ?? 0))) {
      max = status;
    }
  }
  return max;
}

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

export const PRIORITY_ORDER: TaskPriority[] = ["urgent", "high", "medium", "low"];

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
};

// Deliberately uses semantic color roles (not the neutral outline palette
// the rest of the app favors) since priority needs to be scannable at a
// glance across a crowded board.
export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  urgent: "border border-error/40 text-error bg-error/10",
  high: "border border-tertiary/40 text-tertiary bg-tertiary/10",
  medium: "border border-outline-variant/30 text-on-surface-variant",
  low: "border border-outline-variant/20 text-on-surface-variant/50",
};
